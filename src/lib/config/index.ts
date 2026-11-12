import userConfig from '../../../forum.config';
import { applyRepoFallback, buildThemeCss, mergeConfig, type ForumConfig } from './schema';

const resolved = mergeConfig(userConfig);

// Auto-detect the repository from the GitHub Actions build environment
// (GITHUB_REPOSITORY="owner/name", injected at build time via vite `define`)
// so forks can deploy without editing forum.config.ts.
applyRepoFallback(resolved, __GF_REPOSITORY__);

/** True when no repository is configured or detectable — the UI shows setup help. */
export const configIncomplete = !resolved.repo.owner || !resolved.repo.name;

export const forumConfig: ForumConfig = resolved;

/** True when visitors can sign in on the site (token or OAuth). */
export const signInEnabled = resolved.auth.allowToken || Boolean(resolved.auth.oauth.clientId);

/**
 * The github.com page for an action on the current forum page, used while
 * sign-in is off: a thread opens its discussion, a topic opens a new post in
 * that category, anything else opens the category picker.
 */
export function githubUrlFor(pathname: string, basePath: string): string {
	const discussions = `https://github.com/${resolved.repo.owner}/${resolved.repo.name}/discussions`;
	const rest = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
	const thread = /^\/d\/(\d+)/.exec(rest);
	if (thread) return `${discussions}/${thread[1]}`;
	const topic = /^\/t\/([^/]+)/.exec(rest);
	if (topic) return `${discussions}/new?category=${encodeURIComponent(topic[1])}`;
	return `${discussions}/new/choose`;
}

/** Precompiled CSS for theme overrides ('' if none) */
export const themeCss = buildThemeCss(resolved.theme);

export type { ForumConfig } from './schema';
