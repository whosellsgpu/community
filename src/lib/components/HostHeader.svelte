<script lang="ts">
	import { base } from '$app/paths';
	import { forumConfig } from '$lib/config';
	import { shortcutLabel } from '$lib/command-search';
	import { toggleTheme, ui } from '$lib/ui.svelte';
	import HostAccount from './HostAccount.svelte';

	// The host site's own header (whosellsgpu.com's SiteHeader), so the forum
	// reads as one more page of the site. Sizes, colours and breakpoints match
	// the site's styles.css; keep them in step.
	const host = forumConfig.host;
	const logo = host.logoUrl || `${base}/logos/mark.svg`;
	// "Ctrl K" until the platform is known, like the site's SearchButton.
	let shortcut = $state('Ctrl K');
	$effect(() => {
		shortcut = shortcutLabel(navigator.platform);
	});

	// The site's phone and tablet menu (below 1100px).
	let menuOpen = $state(false);
	const close = () => (menuOpen = false);
	$effect(() => {
		if (!menuOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};
		document.body.classList.add('menu-open');
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.classList.remove('menu-open');
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<header class="wsg-header wsg-tokens">
	<div class="wsg-inner">
		<a class="wsg-brand" href={host.homeUrl} aria-label="{host.name} home">
			<span class="wsg-brand-icon"><img src={logo} alt="" /></span>
			<span>
				{host.name}
				{#if host.tagline}<span class="wsg-tagline">{host.tagline}</span>{/if}
			</span>
		</a>
		<nav
			id="wsg-main-navigation"
			class="wsg-nav"
			class:open={menuOpen}
			aria-label="Main navigation"
		>
			{#each host.nav as link (link.href)}
				<a
					href={link.href}
					class:active={link.current}
					aria-current={link.current ? 'page' : undefined}
					onclick={close}
				>
					{link.label}
					{#if link.current}<span class="wsg-marker" aria-hidden="true"></span>{/if}
				</a>
			{/each}
			{#if host.bookingUrl}
				<a
					class="wsg-nav-contact wsg-nav-booking"
					href={host.bookingUrl}
					target="_blank"
					rel="noopener noreferrer"
					onclick={close}>Schedule a call with us</a
				>
			{/if}
			{#if host.communityUrl}
				<a
					class="wsg-nav-contact"
					href={host.communityUrl}
					target="_blank"
					rel="noopener noreferrer"
					onclick={close}>Join our Slack community</a
				>
			{/if}
		</nav>
		<div class="wsg-actions">
			{#if host.communityUrl}
				<a
					class="wsg-button wsg-small wsg-cta wsg-home-cta wsg-community"
					href={host.communityUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="{host.communityLabel} (opens in a new tab)"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><rect width="3" height="8" x="13" y="2" rx="1.5" /><path
							d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5"
						/><rect width="3" height="8" x="8" y="14" rx="1.5" /><path
							d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5"
						/><rect width="8" height="3" x="14" y="13" rx="1.5" /><path
							d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5"
						/><rect width="8" height="3" x="2" y="8" rx="1.5" /><path
							d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5"
						/></svg
					>
					<span class="wsg-label">{host.communityLabel}</span>
				</a>
			{/if}
			{#if host.bookingUrl}
				<a
					class="wsg-button wsg-small wsg-primary wsg-cta wsg-home-cta"
					href={host.bookingUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="{host.bookingLabel} (opens in a new tab)"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M8 2v4" /><path d="M16 2v4" /><rect
							width="18"
							height="18"
							x="3"
							y="4"
							rx="2"
						/><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path
							d="M16 14h.01"
						/><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg
					>
					<span class="wsg-label">{host.bookingLabel}</span>
				</a>
			{/if}
			<button
				type="button"
				class="wsg-search"
				onclick={() => (ui.searchOpen = true)}
				aria-label="Search the forum"
				aria-keyshortcuts="Meta+K Control+K"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
				<span class="wsg-search-label">Search</span>
				<kbd>{shortcut}</kbd>
			</button>
			<button type="button" class="wsg-theme" onclick={toggleTheme} aria-label="Toggle theme">
				<!-- sun in dark mode (switch to light), moon in light mode -->
				<svg class="wsg-sun" viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path
						d="m4.93 4.93 1.41 1.41"
					/><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path
						d="m6.34 17.66-1.41 1.41"
					/><path d="m19.07 4.93-1.41 1.41" /></svg
				>
				<svg class="wsg-moon" viewBox="0 0 24 24" aria-hidden="true"
					><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg
				>
			</button>
			<HostAccount />
			<button
				type="button"
				class="wsg-menu"
				aria-controls="wsg-main-navigation"
				aria-expanded={menuOpen}
				aria-label="Toggle navigation"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<svg class="wsg-menu-open" viewBox="0 0 24 24" aria-hidden="true"
					><path d="M4 12h16" /><path d="M4 18h16" /><path d="M4 6h16" /></svg
				>
				<svg class="wsg-menu-close" viewBox="0 0 24 24" aria-hidden="true"
					><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
				>
			</button>
		</div>
	</div>
</header>

<style>
	.wsg-header {
		view-transition-name: site-header;
		position: sticky;
		top: 0;
		z-index: 30;
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg) 95%, transparent);
		backdrop-filter: blur(16px);
		color: var(--text);
		font-family: Inter, ui-sans-serif, system-ui, sans-serif;
	}
	/* Shared with the layout so sticky asides and overlays sit under it. */
	:global(:root) {
		--forum-header-h: 80px;
	}
	.wsg-inner {
		height: 80px;
		width: min(1416px, calc(100% - 64px));
		margin: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}
	.wsg-brand {
		display: inline-flex;
		align-items: center;
		gap: 11px;
		font-size: 17px;
		font-weight: 600;
		letter-spacing: -0.6px;
		line-height: normal;
	}
	.wsg-brand-icon {
		height: 35px;
		width: 35px;
		display: grid;
		place-items: center;
		border: 1px solid var(--line-strong);
		border-radius: 5px;
		background: #08090b;
		overflow: hidden;
		flex-shrink: 0;
	}
	.wsg-brand-icon img {
		width: 31px;
		height: 26px;
		object-fit: contain;
	}
	.wsg-tagline {
		display: block;
		font:
			400 7px/1.6 'JetBrains Mono',
			monospace;
		letter-spacing: 1.02px;
		color: var(--muted);
		margin-top: 5px;
	}
	.wsg-nav {
		display: flex;
		align-items: center;
		gap: 30px;
		margin-left: auto;
	}
	.wsg-nav a {
		position: relative;
		padding: 12px 0;
		font-size: 13px;
		color: var(--muted);
		transition: color 0.18s ease;
	}
	.wsg-nav a:hover,
	.wsg-nav a.active {
		color: var(--text);
	}
	/* The active dot; it slides between pages with the site's view transition. */
	.wsg-marker {
		view-transition-name: nav-marker;
		position: absolute;
		bottom: 0;
		left: calc(50% - 2px);
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--accent);
	}
	.wsg-nav .wsg-nav-contact {
		display: none;
	}
	.wsg-menu {
		display: none;
		position: relative;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 4px;
		color: var(--muted);
		overflow: hidden;
		flex-shrink: 0;
	}
	.wsg-menu svg {
		position: absolute;
		width: 21px;
		height: 21px;
		transition:
			transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.wsg-menu-close {
		opacity: 0;
		transform: rotate(-90deg) scale(0.65);
	}
	.wsg-menu[aria-expanded='true'] .wsg-menu-open {
		opacity: 0;
		transform: rotate(90deg) scale(0.65);
	}
	.wsg-menu[aria-expanded='true'] .wsg-menu-close {
		opacity: 1;
		transform: none;
	}
	@keyframes wsg-nav-enter {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
	}
	/* Slack and booking collapse to icons, then move into the menu, like
	   the site's .home-booking; Sign in keeps its label down to 720px. */
	@media (max-width: 1360px) {
		.wsg-home-cta .wsg-label {
			display: none;
		}
		.wsg-home-cta {
			width: 35px;
			padding: 0;
		}
	}
	@media (max-width: 1200px) {
		.wsg-nav {
			gap: 20px;
		}
	}
	@media (max-width: 1100px) {
		:global(body.menu-open) {
			overflow: hidden;
		}
		.wsg-menu {
			display: inline-flex;
		}
		.wsg-nav {
			display: none;
		}
		.wsg-nav.open {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			position: absolute;
			top: 72px;
			left: 0;
			right: 0;
			z-index: 19;
			height: calc(100dvh - 72px);
			overflow-y: auto;
			padding: 20px 32px calc(24px + env(safe-area-inset-bottom));
			background: var(--bg);
		}
		.wsg-nav a {
			width: 100%;
			padding: 18px 0;
			border-bottom: 1px solid var(--line);
			font-size: 19px;
			text-align: left;
		}
		.wsg-nav .wsg-nav-contact {
			display: block;
			border-bottom: 0;
			color: var(--accent);
		}
		.wsg-nav .wsg-nav-booking {
			margin-top: auto;
		}
		.wsg-marker {
			display: none;
		}
	}
	@media (max-width: 900px) {
		.wsg-home-cta {
			display: none;
		}
		.wsg-nav {
			gap: 15px;
		}
	}
	@media (max-width: 720px) {
		:global(.wsg-header .wsg-label) {
			display: none;
		}
		:global(.wsg-header .wsg-cta) {
			width: 35px;
			padding: 0;
		}
	}
	@media (max-width: 640px) {
		.wsg-nav.open {
			top: 68px;
			height: calc(100dvh - 68px);
			padding: 28px 24px calc(24px + env(safe-area-inset-bottom));
		}
		.wsg-nav a {
			padding: 21px 0;
			font-size: 24px;
			font-weight: 500;
			line-height: 1.2;
		}
		.wsg-nav a.active {
			color: var(--accent);
		}
		.wsg-nav .wsg-nav-contact {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 17px;
		}
		.wsg-nav.open > * {
			animation: wsg-nav-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
		}
		.wsg-nav.open > :nth-child(2) {
			animation-delay: 60ms;
		}
		.wsg-nav.open > :nth-child(3) {
			animation-delay: 0.12s;
		}
		.wsg-nav.open > :nth-child(4) {
			animation-delay: 0.18s;
		}
		.wsg-nav.open > :nth-child(5) {
			animation-delay: 0.24s;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.wsg-nav.open > *,
		.wsg-menu svg {
			animation: none;
			transition: none;
		}
	}
	.wsg-actions {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-left: 20px;
	}
	:global(.wsg-button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--line-strong);
		border-radius: 5px;
		font-weight: 500;
		line-height: 1.4;
		white-space: nowrap;
		color: var(--text);
		transition:
			background-color 0.3s,
			border-color 0.3s;
	}
	:global(.wsg-button:hover) {
		background: var(--surface);
		border-color: var(--muted);
	}
	:global(.wsg-small) {
		font-size: 11px;
		padding: 0 13px;
	}
	:global(.wsg-cta) {
		height: 35px;
		gap: 8px;
	}
	:global(.wsg-primary) {
		background: var(--cta-bg);
		color: var(--cta-text);
		border-color: var(--cta-bg);
	}
	:global(.wsg-primary:hover) {
		background: var(--cta-hover);
		border-color: var(--cta-hover);
	}
	:global(.wsg-header svg) {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}
	/* the site's .site-search-button */
	.wsg-search {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		height: 35px;
		padding: 0 8px 0 11px;
		border: 1px solid var(--line);
		border-radius: 4px;
		color: var(--muted);
		font-size: 11px;
		transition:
			border-color 0.15s,
			color 0.15s;
	}
	.wsg-search:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}
	.wsg-search svg {
		width: 15px;
		height: 15px;
	}
	.wsg-theme {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 35px;
		height: 35px;
		border: 1px solid var(--line);
		border-radius: 4px;
		color: var(--muted);
		flex-shrink: 0;
	}
	.wsg-theme:hover {
		background: var(--surface);
		color: var(--text);
	}
	.wsg-theme svg {
		width: 17px;
		height: 17px;
	}
	.wsg-sun {
		display: none;
	}
	:global(html.dark) .wsg-sun {
		display: block;
	}
	:global(html.dark) .wsg-moon {
		display: none;
	}
	@media (max-width: 1100px) {
		.wsg-search-label {
			display: none;
		}
	}
	@media (max-width: 900px) {
		:global(:root) {
			--forum-header-h: 72px;
		}
		.wsg-inner {
			height: 72px;
			gap: 15px;
			width: calc(100% - 40px);
		}
		.wsg-brand {
			font-size: 15px;
		}
		.wsg-tagline {
			font-size: 6px;
		}
		.wsg-actions {
			margin-left: 0;
			gap: 9px;
		}
	}
	@media (max-width: 720px) {
		.wsg-search kbd {
			display: none;
		}
		.wsg-search {
			width: 35px;
			padding: 0;
			justify-content: center;
		}
	}
	@media (max-width: 640px) {
		:global(:root) {
			--forum-header-h: 68px;
		}
		.wsg-inner {
			width: calc(100% - 36px);
			height: 68px;
		}
		.wsg-brand {
			font-size: 15px;
			gap: 8px;
		}
		.wsg-brand-icon {
			width: 31px;
			height: 31px;
		}
		.wsg-tagline {
			font-size: 5.5px;
			letter-spacing: 0.7px;
		}
	}
	@media (max-width: 480px) {
		.wsg-community {
			display: none;
		}
	}
</style>
