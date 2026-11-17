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
	// The forum lives at whosellsgpu.com/forum, so it wears the site's own
	// header: same brand, navigation, actions and account menu as every other
	// page (keep in step with SiteHeader in whosellsgpu.com's SiteChrome.tsx).
	nav: [],
	host: {
		enabled: true,
		name: 'Who Sells GPU',
		// No tagline: the site's header shows the wordmark alone.
		tagline: '',
		homeUrl: '/',
		logoUrl: '/logos/mark.svg',
		// Same items, order and links as the site's SiteHeader.
		nav: [
			{ label: 'Prices', href: '/#compare' },
			{ label: 'Providers', href: '/#directory' },
			{ label: 'GPUs', href: '/gpus' },
			{ label: 'Buyers', href: '/buyers' },
			{ label: 'Forum', href: '/forum/', current: true },
			{ label: 'Handbook', href: '/handbook' }
		],
		communityUrl:
			'https://join.slack.com/t/whosellsgpu/shared_invite/zt-4fukajr7r-~2GylbGumYFr~dYz6jk~qA',
		communityLabel: 'Join our Slack',
		bookingUrl: 'https://cal.com/whosellgpu/30min',
		bookingLabel: 'Schedule a call',
		membersExportUrl: '/api/admin/members'
	},

	auth: {
		// Pasting personal access tokens is off: it confuses buyers, and the
		// token would live on the whosellsgpu.com origin.
		allowToken: false,
		// "Continue with GitHub": a GitHub App (Discussions read & write only,
		// installed on whosellsgpu/community only). Paste its public Client ID
		// here; its secret lives only in whosellsgpu.com's Cloudflare settings,
		// used by the token exchange at /api/forum-oauth. Empty = sign-in off,
		// and posting links to github.com instead.
		oauth: { clientId: 'Iv23liFDwOZqIEc6NAdc', proxyUrl: 'https://whosellsgpu.com/api/forum-oauth' },
		// One sign-in for the whole site: after GitHub sign-in the forum hands
		// the token to whosellsgpu.com once, which records the member and shows
		// them signed in on every page. The token is never stored there.
		siteSessionUrl: 'https://whosellsgpu.com/api/session'
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
	// signed-out visitors read freely for 45 seconds, then are asked to sign in
	archive: { enabled: true, previewMinutes: 0.75 },

	// Who Sells GPU palette: green-black dark mode with lime primary buttons;
	// green-tinted light mode with near-black primary buttons and deep-green links.
	theme: {
		light: {
			background: '#f1f6ea',
			foreground: '#171917',
			muted: '#e5eed9',
			mutedForeground: '#555a53',
			card: '#f9fbf5',
			cardForeground: '#171917',
			border: '#dfe7d4',
			primary: '#171917',
			primaryForeground: '#ffffff',
			accent: '#e5eed9',
			accentForeground: '#171917',
			ring: '#3f6b0d',
			link: '#3f6b0d'
		},
		dark: {
			background: '#040804',
			foreground: '#f1f2f0',
			muted: '#1a2018',
			mutedForeground: '#a1a89c',
			card: '#10120f',
			cardForeground: '#f1f2f0',
			border: '#20271d',
			primary: '#7fc86e',
			primaryForeground: '#040804',
			accent: '#141812',
			accentForeground: '#f1f2f0',
			ring: '#7fc86e',
			link: '#7fc86e'
		}
	}
});
