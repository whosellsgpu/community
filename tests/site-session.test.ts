import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const { mockConfig } = vi.hoisted(() => ({
	mockConfig: {
		auth: { siteSessionUrl: 'https://site.test/api/session' as string | undefined }
	}
}));
vi.mock('$lib/config', () => ({ forumConfig: mockConfig }));

let s: typeof import('$lib/github/site-session');
let fetchMock: Mock;

beforeEach(async () => {
	vi.resetModules();
	sessionStorage.clear();
	mockConfig.auth.siteSessionUrl = 'https://site.test/api/session';
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	s = await import('$lib/github/site-session');
});
afterEach(() => vi.restoreAllMocks());

const blockStorage = () => {
	for (const method of ['getItem', 'setItem', 'removeItem'] as const)
		vi.spyOn(Storage.prototype, method).mockImplementation(() => {
			throw new Error('blocked');
		});
};

describe('syncSiteSession', () => {
	it('sends the token and source once, and remembers it for this session', async () => {
		fetchMock.mockResolvedValue({ ok: true });
		expect(s.siteSessionSynced()).toBe(false);
		expect(await s.syncSiteSession('tok', 'site')).toBe(true);
		expect(fetchMock).toHaveBeenCalledWith('https://site.test/api/session', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: 'tok', source: 'site' })
		});
		expect(s.siteSessionSynced()).toBe(true);
	});

	it('shares one request between calls made while it is in flight', async () => {
		let finish: (value: unknown) => void = () => undefined;
		fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
		const first = s.syncSiteSession('tok', 'forum');
		const second = s.syncSiteSession('tok', 'site');
		finish({ ok: true });
		expect(await first).toBe(true);
		expect(await second).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		// a later call sends again
		fetchMock.mockResolvedValue({ ok: true });
		await s.syncSiteSession('tok', 'site');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('reports failure without throwing when the site refuses or is down', async () => {
		fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
		expect(await s.syncSiteSession('tok', 'forum')).toBe(false);
		fetchMock.mockRejectedValueOnce(new TypeError('offline'));
		expect(await s.syncSiteSession('tok', 'forum')).toBe(false);
		expect(s.siteSessionSynced()).toBe(false);
	});

	it('does nothing when no session URL is configured', async () => {
		for (const url of ['', undefined]) {
			mockConfig.auth.siteSessionUrl = url;
			expect(await s.syncSiteSession('tok', 'forum')).toBe(false);
			s.endSiteSession();
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('endSiteSession', () => {
	it('clears the sync flag and asks the site to sign out', async () => {
		fetchMock.mockResolvedValue({ ok: true });
		await s.syncSiteSession('tok', 'forum');
		fetchMock.mockClear();
		fetchMock.mockRejectedValue(new TypeError('offline'));
		s.endSiteSession();
		expect(s.siteSessionSynced()).toBe(false);
		expect(fetchMock).toHaveBeenCalledWith('https://site.test/api/session', {
			method: 'DELETE',
			credentials: 'include',
			keepalive: true
		});
		// the rejected request is swallowed
		await new Promise((resolve) => setTimeout(resolve, 0));
	});

	it('survives blocked storage', () => {
		fetchMock.mockResolvedValue({ ok: true });
		blockStorage();
		expect(() => s.endSiteSession()).not.toThrow();
		expect(s.siteSessionSynced()).toBe(false);
	});
});

describe('safeReturnPath', () => {
	it.each([
		['/', '/'],
		['/gpus/h100', '/gpus/h100'],
		['/gpus?vendor=nvidia#compare', '/gpus?vendor=nvidia#compare'],
		['/a/../b', '/b']
	])('keeps same-site path %s', (raw, expected) => {
		expect(s.safeReturnPath(raw)).toBe(expected);
	});

	it.each([
		[null],
		[undefined],
		[''],
		['gpus'],
		['https://evil.example/'],
		['//evil.example/'],
		['/\\evil.example'],
		['/x\\y'],
		['/x\ny'],
		['/' + 'a'.repeat(500)]
	])('rejects %s', (raw) => {
		expect(s.safeReturnPath(raw)).toBeNull();
	});

	it('rejects paths the URL parser refuses', () => {
		vi.stubGlobal(
			'URL',
			class {
				constructor() {
					throw new TypeError('bad');
				}
			}
		);
		expect(s.safeReturnPath('/fine')).toBeNull();
		vi.unstubAllGlobals();
	});
});

describe('return path', () => {
	it('is remembered, validated again and consumed once', () => {
		expect(s.hasPendingReturn()).toBe(false);
		s.rememberReturn('/gpus');
		expect(s.hasPendingReturn()).toBe(true);
		expect(s.takeReturn()).toBe('/gpus');
		expect(s.hasPendingReturn()).toBe(false);
		expect(s.takeReturn()).toBeNull();
		// a value planted in storage is still checked
		sessionStorage.setItem('dk:return', '//evil.example');
		expect(s.takeReturn()).toBeNull();
	});

	it('is skipped when storage is blocked', () => {
		blockStorage();
		expect(() => s.rememberReturn('/gpus')).not.toThrow();
		expect(s.hasPendingReturn()).toBe(false);
		expect(s.takeReturn()).toBeNull();
	});
});
