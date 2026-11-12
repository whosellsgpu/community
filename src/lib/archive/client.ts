/**
 * Read access to the cold-store archive the data-sync workflow maintains on
 * the data branch. Served raw off GitHub's CDN with `Access-Control-Allow-
 * Origin: *`, so signed-out visitors can browse the forum read-only without
 * touching the (auth-only) GitHub API. Public repositories only; ~5 min CDN
 * cache lag is the accepted freshness trade.
 *
 * Every fetcher returns null on any failure — the caller decides whether that
 * means "show sign-in" or "not yet archived".
 */
import { forumConfig } from '$lib/config';
import type { Category, Discussion, DiscussionListItem } from '$lib/github/types';

export interface ArchiveMeta {
	archivedAt: string;
	categories: Category[];
	pinned: DiscussionListItem[];
}

export interface ArchiveIndex {
	archivedAt: string;
	discussions: DiscussionListItem[];
}

/** Per-user rep file (`profiles/<login>/rep.json`) */
export interface ProfileRep {
	rep: number;
	updatedAt: string;
	/** Raw action counts (uncapped) — doubles as post/comment counters */
	breakdown: { post: number; comment: number; answerAccepted: number };
}

/** How long a resolved snapshot commit is reused before asking again */
const REF_TTL_MS = 60_000;
let ref: { at: number; value: Promise<string> } | null = null;

/**
 * The data branch's latest commit. Raw files at a branch name sit behind a
 * ~5 min CDN cache that ignores query strings, so the post index and a post's
 * own file could come from different snapshots (a just-deleted post still
 * listed, its file already gone). Raw files at a commit hash never change,
 * so every read pins to one snapshot. Falls back to the branch name when the
 * GitHub API is unavailable or rate-limited (60/h per anonymous IP).
 */
function snapshotRef(): Promise<string> {
	const now = Date.now();
	if (ref && now - ref.at < REF_TTL_MS) return ref.value;
	const { owner, name } = forumConfig.repo;
	const branch = forumConfig.archive.dataBranch;
	const value = fetch(`https://api.github.com/repos/${owner}/${name}/git/ref/heads/${branch}`)
		.then(async (res) => {
			if (!res.ok) return branch;
			const sha = ((await res.json()) as { object?: { sha?: unknown } }).object?.sha;
			return typeof sha === 'string' && /^[0-9a-f]{40}$/.test(sha) ? sha : branch;
		})
		.catch(() => branch);
	ref = { at: now, value };
	return value;
}

async function rawUrl(path: string): Promise<string> {
	const { owner, name } = forumConfig.repo;
	return `https://raw.githubusercontent.com/${owner}/${name}/${await snapshotRef()}/${path}`;
}

async function fetchJson<T>(path: string): Promise<T | null> {
	try {
		const res = await fetch(await rawUrl(path), { cache: 'no-cache' });
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

export function fetchArchiveMeta(): Promise<ArchiveMeta | null> {
	return fetchJson<ArchiveMeta>('meta.json');
}

export function fetchArchiveIndex(): Promise<ArchiveIndex | null> {
	return fetchJson<ArchiveIndex>('posts/index.json');
}

export function fetchArchivedDiscussion(number: number): Promise<Discussion | null> {
	return fetchJson<Discussion>(`posts/${number}/content.json`);
}

export function fetchProfileRep(login: string): Promise<ProfileRep | null> {
	return fetchJson<ProfileRep>(`profiles/${login.toLowerCase()}/rep.json`);
}
