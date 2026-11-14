<script lang="ts">
	import { base } from '$app/paths';
	import { forumConfig } from '$lib/config';
	import { toggleTheme } from '$lib/ui.svelte';
	import HostAccount from './HostAccount.svelte';

	// The host site's own header (whosellsgpu.com's SiteHeader), so the forum
	// reads as one more page of the site. Sizes, colours and breakpoints match
	// the site's styles.css; keep them in step.
	const host = forumConfig.host;
	const logo = host.logoUrl || `${base}/mark.png`;
</script>

<header class="wsg-header">
	<div class="wsg-inner">
		<a class="wsg-brand" href={host.homeUrl} aria-label="{host.name} home">
			<span class="wsg-brand-icon"><img src={logo} alt="" /></span>
			<span>
				{host.name}
				{#if host.tagline}<span class="wsg-tagline">{host.tagline}</span>{/if}
			</span>
		</a>
		<nav class="wsg-nav" aria-label="Main navigation">
			{#each host.nav as link (link.href)}
				<a
					href={link.href}
					class:active={link.current}
					class:keep={link.keepOnMobile}
					aria-current={link.current ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>
		<div class="wsg-actions">
			{#if host.communityUrl}
				<a
					class="wsg-button wsg-small wsg-cta wsg-community"
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
					class="wsg-button wsg-small wsg-primary wsg-cta"
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
		</div>
	</div>
</header>

<style>
	/* whosellsgpu.com tokens: light (cream) by default, dark under html.dark */
	.wsg-header {
		--bg: #f3eee3;
		--panel: #faf7ef;
		--surface: #e7dfcf;
		--text: #1e1b15;
		--muted: #5b5446;
		--line: #e0d7c6;
		--line-strong: #c6baa3;
		--accent: #2d6b1f;
		--cta-bg: #7fee64;
		--cta-hover: #9efb87;
		--cta-text: #040804;
		--shadow: 0 24px 80px #3a2e1a1f;
		position: sticky;
		top: 0;
		z-index: 30;
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg) 95%, transparent);
		backdrop-filter: blur(16px);
		color: var(--text);
		font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
	}
	:global(html.dark) .wsg-header {
		--bg: #040804;
		--panel: #10120f;
		--surface: #1a2018;
		--text: #f1f2f0;
		--muted: #a1a89c;
		--line: #20271d;
		--line-strong: #2d4327;
		--accent: #7fee64;
		--shadow: 0 24px 80px #000a;
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
			400 9px/1.6 'Geist Mono',
			ui-monospace,
			monospace;
		letter-spacing: 1.02px;
		color: var(--muted);
		margin-top: 5px;
	}
	.wsg-nav {
		display: flex;
		align-items: center;
		gap: 24px;
		margin-left: auto;
		font-size: 11px;
		color: var(--muted);
	}
	.wsg-nav a:hover,
	.wsg-nav a.active {
		color: var(--text);
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
		.wsg-nav a:not(.keep):not(.active) {
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
			font-size: 9px;
		}
		.wsg-actions {
			margin-left: 0;
			gap: 9px;
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
	@media (max-width: 700px) {
		.wsg-nav {
			gap: 10px;
			font-size: 9px;
		}
		.wsg-tagline {
			display: none;
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
	}
	@media (max-width: 480px) {
		.wsg-community {
			display: none;
		}
		.wsg-nav a:not(.keep) {
			display: none;
		}
	}
</style>
