import { describe, expect, it } from 'vitest';
import {
	configIncomplete,
	forumConfig,
	githubUrlFor,
	signInEnabled,
	themeCss
} from '$lib/config';

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

	it('is not incomplete when a repo is configured', () => {
		expect(configIncomplete).toBe(false);
	});

	it('reads anonymously from the archive, with token sign-in off', () => {
		expect(forumConfig.archive.enabled).toBe(true);
		expect(forumConfig.auth.allowToken).toBe(false);
	});

	it('sends actions to the matching GitHub page while sign-in is off', () => {
		expect(signInEnabled).toBe(false);
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
