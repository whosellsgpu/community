/**
 * Shares the forum's GitHub sign-in with the host site (whosellsgpu.com).
 *
 * After sign-in, the GitHub token is sent once to the host's session endpoint
 * (`auth.siteSessionUrl`), which checks it with GitHub, records the member,
 * and sets the site-wide session cookie. The host never stores the token.
 * Signing out here ends that session too. With no URL configured, every
 * function here is a no-op, so a plain Discussion Kit deploy is unaffected.
 *
 * The host's "Sign in" button links to `?signin=1&return=<path>`: the forum
 * runs its GitHub sign-in and then sends the visitor back to `<path>`.
 */
import { forumConfig } from '$lib/config';

const SYNC_KEY = 'dk:site-session';
const RETURN_KEY = 'dk:return';

export type SignInSource = 'site' | 'forum';

function sessionUrl(): string {
	return forumConfig.auth.siteSessionUrl ?? '';
}

/** Whether this browser session has already shared its sign-in with the site. */
export function siteSessionSynced(): boolean {
	try {
		return sessionStorage.getItem(SYNC_KEY) === '1';
	} catch {
		return false;
	}
}

/** Tell the host site who signed in. Never throws: sign-in here still works. */
export async function syncSiteSession(token: string, source: SignInSource): Promise<boolean> {
	const url = sessionUrl();
	if (!url) return false;
	try {
		const res = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token, source })
		});
		if (!res.ok) return false;
		sessionStorage.setItem(SYNC_KEY, '1');
		return true;
	} catch {
		return false;
	}
}

/** End the host site's session (on sign-out). Never throws. */
export function endSiteSession(): void {
	try {
		sessionStorage.removeItem(SYNC_KEY);
	} catch {
		// storage unavailable
	}
	const url = sessionUrl();
	if (!url) return;
	fetch(url, { method: 'DELETE', credentials: 'include', keepalive: true }).catch(() => undefined);
}

/**
 * A same-site path to return to after sign-in, or null. Rejects anything that
 * could leave the site: absolute URLs, `//host`, backslash tricks, control
 * characters.
 */
export function safeReturnPath(raw: string | null | undefined): string | null {
	if (typeof raw !== 'string' || raw.length === 0 || raw.length > 500) return null;
	if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
	// eslint-disable-next-line no-control-regex
	if (/[\u0000-\u001f\u007f\\]/.test(raw)) return null;
	// Normalise (resolve ../, encode spaces); the checks above keep it on site.
	try {
		const url = new URL(raw, 'https://site.invalid');
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return null;
	}
}

/** Remember where to send the visitor once sign-in completes. */
export function rememberReturn(path: string): void {
	try {
		sessionStorage.setItem(RETURN_KEY, path);
	} catch {
		// storage unavailable: they land on the forum home instead
	}
}

/** Whether a sign-in started from the host site is in progress. */
export function hasPendingReturn(): boolean {
	try {
		return sessionStorage.getItem(RETURN_KEY) !== null;
	} catch {
		return false;
	}
}

/** The remembered return path (validated again), consumed once. */
export function takeReturn(): string | null {
	try {
		const raw = sessionStorage.getItem(RETURN_KEY);
		sessionStorage.removeItem(RETURN_KEY);
		return safeReturnPath(raw);
	} catch {
		return null;
	}
}
