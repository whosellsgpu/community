import { describe, expect, it } from 'vitest';
import { configIncomplete, forumConfig, githubUrlFor, signInEnabled, themeCss } from '$lib/config';

// Exercises the real resolution pipeline: root forum.config.ts merged over
// defaults, repo fallback applied, theme compiled.
describe('resolved config', () => {
	it('merges the root forum.config.ts over defaults', () => {
		expect(forumConfig.repo.owner).toBe('whosellsgpu');
		expect(forumConfig.repo.name).toBe('community');
		expect(forumConfig.site.name).toBe('Who Sells GPU · Community');
		// default that forum.config.ts does not override
		expect(forumConfig.content.articles.marker).toBe('<!-- dk:article -->');
	});

	it('wears the whosellsgpu.com header, with the forum as the current section', () => {
		const { host } = forumConfig;
		expect(host.enabled).toBe(true);
		expect(host.name).toBe('Who Sells GPU');
		expect(host.logoUrl).toBe('/logos/mark.svg');
		expect(host.nav.map((link) => link.label)).toEqual([
			'Prices',
			'GPUs',
			'Providers',
			'Buyers',
			'Forum'
		]);
		expect(host.nav.filter((link) => link.current).map((link) => link.href)).toEqual(['/forum/']);
		expect(host.membersExportUrl).toBe('/api/admin/members');
		expect(forumConfig.auth.siteSessionUrl).toBe('https://whosellsgpu.com/api/session');
	});

	it('is not incomplete when a repo is configured', () => {
		expect(configIncomplete).toBe(false);
	});

	it('reads anonymously from the archive, with token sign-in off', () => {
		expect(forumConfig.archive.enabled).toBe(true);
		expect(forumConfig.auth.allowToken).toBe(false);
	});

	it('turns on GitHub sign-in through the whosellsgpu.com token exchange', () => {
		expect(signInEnabled).toBe(true);
		expect(forumConfig.auth.oauth.clientId).toBe('Iv23liFDwOZqIEc6NAdc');
		expect(forumConfig.auth.oauth.proxyUrl).toBe('https://whosellsgpu.com/api/forum-oauth');
	});

	it('maps forum pages to their GitHub counterparts', () => {
		const repo = 'https://github.com/whosellsgpu/community/discussions';
		expect(githubUrlFor('/forum/d/42', '/forum')).toBe(`${repo}/42`);
		expect(githubUrlFor('/forum/t/gpu-requests', '/forum')).toBe(
			`${repo}/new?category=gpu-requests`
		);
		expect(githubUrlFor('/forum/', '/forum')).toBe(`${repo}/new/choose`);
		expect(githubUrlFor('/d/7', '')).toBe(`${repo}/7`);
	});

	it('compiles the Who Sells GPU theme for both schemes', () => {
		expect(themeCss).toContain('--fd-background:#f3eee3');
		expect(themeCss).toContain('--fd-background:#040804');
		expect(themeCss).toContain('--fd-primary:#7fee64');
	});
});
