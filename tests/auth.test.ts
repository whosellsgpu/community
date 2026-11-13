import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const { mockConfig, setCacheScope, clearCache } = vi.hoisted(() => ({
	mockConfig: {
		repo: { owner: 'o', name: 'r' },
		auth: { allowToken: true, oauth: { clientId: '', proxyUrl: '' } }
	},
	setCacheScope: vi.fn(),
	clearCache: vi.fn()
}));
const site = vi.hoisted(() => ({
	synced: false,
	pendingReturn: false,
	syncSiteSession: vi.fn(async () => true),
	endSiteSession: vi.fn()
}));

vi.mock('$lib/config', () => ({ forumConfig: mockConfig }));
vi.mock('$lib/cache', () => ({ setCacheScope, clearCache }));
vi.mock('$lib/github/site-session', () => ({
	siteSessionSynced: () => site.synced,
	hasPendingReturn: () => site.pendingReturn,
	syncSiteSession: site.syncSiteSession,
	endSiteSession: site.endSiteSession
}));

let auth: (typeof import('$lib/github/auth.svelte'))['auth'];
let fetchMock: Mock;

const viewer = { login: 'alice', name: 'Alice', avatarUrl: 'http://a', url: 'http://u' };
const viewerOk = {
	ok: true,
	status: 200,
	json: async () => ({ data: { viewer } })
};

beforeEach(async () => {
	vi.resetModules();
	localStorage.clear();
	sessionStorage.clear();
	mockConfig.auth.oauth = { clientId: '', proxyUrl: '' };
	setCacheScope.mockClear();
	clearCache.mockClear();
	site.synced = false;
	site.pendingReturn = false;
	site.syncSiteSession.mockClear();
	site.endSiteSession.mockClear();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	({ auth } = await import('$lib/github/auth.svelte'));
});

describe('init', () => {
	it('finishes signed out with no stored token', async () => {
		await auth.init();
		expect(auth.loading).toBe(false);
		expect(auth.token).toBeNull();
		expect(auth.signedIn).toBe(false);
	});

	it('restores a valid stored token', async () => {
		localStorage.setItem('dk:token', 'stored');
		fetchMock.mockResolvedValue(viewerOk);
		await auth.init();
		expect(auth.token).toBe('stored');
		expect(auth.viewer).toEqual(viewer);
		expect(auth.signedIn).toBe(true);
		// the host site is told once per browser session
		expect(site.syncSiteSession).toHaveBeenCalledWith('stored', 'forum');
	});

	it('does not re-share a sign-in already shared this session', async () => {
		localStorage.setItem('dk:token', 'stored');
		site.synced = true;
		fetchMock.mockResolvedValue(viewerOk);
		await auth.init();
		expect(site.syncSiteSession).not.toHaveBeenCalled();
	});

	it('drops a revoked stored token silently', async () => {
		localStorage.setItem('dk:token', 'revoked');
		fetchMock.mockResolvedValue({ ok: false, status: 401 });
		await auth.init();
		expect(auth.token).toBeNull();
		expect(localStorage.getItem('dk:token')).toBeNull();
		expect(auth.loading).toBe(false);
	});
});

describe('signInWithToken', () => {
	it('trims, validates and persists the token', async () => {
		fetchMock.mockResolvedValue(viewerOk);
		await auth.signInWithToken('  tok  ');
		expect(auth.token).toBe('tok');
		expect(auth.viewer).toEqual(viewer);
		expect(localStorage.getItem('dk:token')).toBe('tok');
		// cache entries become scoped to this user
		expect(setCacheScope).toHaveBeenCalledWith('alice');
		const init = fetchMock.mock.calls[0][1];
		expect(init.headers.Authorization).toBe('Bearer tok');
	});

	it('rejects on GraphQL errors without persisting', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ errors: [{ message: 'Bad credentials' }] })
		});
		await expect(auth.signInWithToken('bad')).rejects.toThrow('Bad credentials');
		expect(localStorage.getItem('dk:token')).toBeNull();
	});
});

describe('oauth', () => {
	it('reports availability only when fully configured', () => {
		expect(auth.oauthAvailable).toBe(false);
		mockConfig.auth.oauth = { clientId: 'cid', proxyUrl: 'http://proxy' };
		expect(auth.oauthAvailable).toBe(true);
	});

	it('beginOAuth stores a state nonce', () => {
		mockConfig.auth.oauth = { clientId: 'cid', proxyUrl: 'http://proxy' };
		auth.beginOAuth('http://site/auth/callback');
		expect(sessionStorage.getItem('dk:oauth-state')).toBeTruthy();
	});

	it('completeOAuth rejects on a state mismatch', async () => {
		await expect(auth.completeOAuth('code', 'wrong')).rejects.toThrow(/state mismatch/i);
	});

	it('completeOAuth rejects when the proxy fails', async () => {
		mockConfig.auth.oauth = { clientId: 'cid', proxyUrl: 'http://proxy' };
		sessionStorage.setItem('dk:oauth-state', 'S');
		fetchMock.mockResolvedValue({ ok: false, status: 500 });
		await expect(auth.completeOAuth('code', 'S')).rejects.toThrow(/exchange failed/i);
	});

	it('completeOAuth rejects when no token is returned', async () => {
		mockConfig.auth.oauth = { clientId: 'cid', proxyUrl: 'http://proxy' };
		sessionStorage.setItem('dk:oauth-state', 'S');
		fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
		await expect(auth.completeOAuth('code', 'S')).rejects.toThrow(/no token/i);
	});

	it('completeOAuth exchanges the code and signs in', async () => {
		mockConfig.auth.oauth = { clientId: 'cid', proxyUrl: 'http://proxy' };
		sessionStorage.setItem('dk:oauth-state', 'S');
		fetchMock
			.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ access_token: 'oat' }) })
			.mockResolvedValueOnce(viewerOk);
		await auth.completeOAuth('code', 'S');
		expect(auth.token).toBe('oat');
		expect(auth.viewer).toEqual(viewer);
		// proxy call carried the code
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: 'code' });
		// nonce is single-use
		expect(sessionStorage.getItem('dk:oauth-state')).toBeNull();
		// the host site learns about the forum sign-in
		expect(site.syncSiteSession).toHaveBeenCalledWith('oat', 'forum');
	});

	it('completeOAuth marks sign-ins started on the host site', async () => {
		mockConfig.auth.oauth = { clientId: 'cid', proxyUrl: 'http://proxy' };
		sessionStorage.setItem('dk:oauth-state', 'S');
		site.pendingReturn = true;
		fetchMock
			.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ access_token: 'oat' }) })
			.mockResolvedValueOnce(viewerOk);
		await auth.completeOAuth('code', 'S');
		expect(site.syncSiteSession).toHaveBeenCalledWith('oat', 'site');
	});
});

describe('shareWithSite', () => {
	it('shares the current sign-in, and does nothing when signed out', async () => {
		await auth.shareWithSite('site');
		expect(site.syncSiteSession).not.toHaveBeenCalled();
		fetchMock.mockResolvedValue(viewerOk);
		await auth.signInWithToken('tok');
		await auth.shareWithSite('site');
		expect(site.syncSiteSession).toHaveBeenCalledWith('tok', 'site');
	});
});

describe('signOut', () => {
	it('clears all auth state', async () => {
		fetchMock.mockResolvedValue(viewerOk);
		await auth.signInWithToken('tok');
		auth.signOut();
		expect(auth.token).toBeNull();
		expect(auth.viewer).toBeNull();
		expect(localStorage.getItem('dk:token')).toBeNull();
		// cached GraphQL data is wiped and the scope reset
		expect(clearCache).toHaveBeenCalled();
		expect(setCacheScope).toHaveBeenCalledWith(null);
		// and the host site's session ends with it
		expect(site.endSiteSession).toHaveBeenCalled();
	});
});
