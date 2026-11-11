import { describe, expect, it } from 'vitest';
import { configIncomplete, forumConfig, themeCss } from '$lib/config';

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

	it('compiles the Who Sells GPU theme for both schemes', () => {
		expect(themeCss).toContain('--fd-background:#f3eee3');
		expect(themeCss).toContain('--fd-background:#040804');
		expect(themeCss).toContain('--fd-primary:#7fee64');
	});
});
