import { defineForumConfig } from './src/lib/config/schema';

/**
 * Who Sells GPU community forum, built on Discussion Kit
 * (https://github.com/NotReeceHarris/discussion-kit, GPL-3.0).
 *
 * Served at https://whosellsgpu.com/forum: GitHub Pages hosts the build
 * (BASE_PATH=/forum, see .github/workflows/deploy.yml) and the main site's
 * Cloudflare Pages Function proxies /forum/* to it.
 *
 * Topics are this repository's Discussion categories. The marketplace ones
 * (GPU requests, GPU supply, Pricing & market) have structured forms in
 * .github/DISCUSSION_TEMPLATE/.
 */
export default defineForumConfig({
	site: {
		name: 'Who Sells GPU · Community',
		description:
			'Where teams looking for GPUs meet the people who have them. Post a request, list supply, or talk pricing.',
		footer: 'Who Sells GPU community · Powered by GitHub Discussions'
	},

	repo: {
		owner: 'whosellsgpu',
		name: 'community'
	},

	// Links back to the main site.
	nav: [
		{ label: 'Prices', href: 'https://whosellsgpu.com/' },
		{ label: 'GPUs', href: 'https://whosellsgpu.com/gpus' },
		{ label: 'Providers', href: 'https://whosellsgpu.com/#directory' }
	],

	auth: {
		// Pasting personal access tokens is off: it confuses buyers, and the
		// token would live on the whosellsgpu.com origin.
		allowToken: false,
		// "Continue with GitHub" stays off until an OAuth app and the token
		// exchange (whosellsgpu.com/api/forum-oauth) are configured.
		oauth: { clientId: '', proxyUrl: '' }
	},

	admins: {
		logins: ['rudrakshkarpe'],
		badgeLabel: 'Who Sells GPU'
	},

	badges: {},

	content: {
		pageSize: 25,
		sort: 'CREATED_AT',
		articles: { enabled: true },
		topics: {
			include: [],
			exclude: ['polls', 'show-and-tell', 'ideas'],
			restricted: ['announcements']
		}
	},

	features: {
		search: true,
		reactions: true,
		upvotes: true
	},

	// Signed-out visitors read a snapshot kept fresh by the data-sync
	// workflow, so buyers don't need a GitHub account to browse.
	archive: { enabled: true },

	// Who Sells GPU palette: green-black dark mode, warm cream light mode,
	// lime primary buttons with near-black text.
	theme: {
		light: {
			background: '#f3eee3',
			foreground: '#1e1b15',
			muted: '#e7dfcf',
			mutedForeground: '#5b5446',
			card: '#faf7ef',
			cardForeground: '#1e1b15',
			border: '#e0d7c6',
			primary: '#7fee64',
			primaryForeground: '#040804',
			accent: '#efe8da',
			accentForeground: '#1e1b15',
			ring: '#2d6b1f',
			link: '#2d6b1f'
		},
		dark: {
			background: '#040804',
			foreground: '#f1f2f0',
			muted: '#1a2018',
			mutedForeground: '#a1a89c',
			card: '#10120f',
			cardForeground: '#f1f2f0',
			border: '#20271d',
			primary: '#7fee64',
			primaryForeground: '#040804',
			accent: '#141812',
			accentForeground: '#f1f2f0',
			ring: '#7fee64',
			link: '#7fee64'
		}
	}
});
