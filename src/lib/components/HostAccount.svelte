<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { forumConfig } from '$lib/config';
	import { auth } from '$lib/github/auth.svelte';
	import { rememberReturn } from '$lib/github/site-session';
	import { isAdmin, ui } from '$lib/ui.svelte';

	// The account control from whosellsgpu.com's header (AccountMenu.tsx):
	// "Sign in" for visitors, the member's avatar and menu once signed in.
	let open = $state(false);
	let menu = $state<HTMLDivElement | null>(null);
	let trigger = $state<HTMLButtonElement | null>(null);

	const exportUrl = forumConfig.host.membersExportUrl;

	function signIn() {
		if (!auth.oauthAvailable) {
			ui.signInOpen = true;
			return;
		}
		// come back to this same forum page afterwards
		rememberReturn(`${page.url.pathname}${page.url.search}${page.url.hash}`, 'forum');
		auth.beginOAuth(`${location.origin}${resolve('/auth/callback')}`);
	}

	function avatar(url: string) {
		try {
			const parsed = new URL(url);
			if (parsed.hostname === 'avatars.githubusercontent.com') parsed.searchParams.set('s', '64');
			return parsed.toString();
		} catch {
			return url;
		}
	}

	$effect(() => {
		if (!open) return;
		const onPointer = (event: PointerEvent) => {
			if (!menu?.contains(event.target as Node)) open = false;
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			open = false;
			trigger?.focus();
		};
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

{#if auth.viewer}
	{@const viewer = auth.viewer}
	<div class="account-menu" bind:this={menu}>
		<button
			bind:this={trigger}
			type="button"
			class="account-trigger"
			aria-haspopup="menu"
			aria-expanded={open}
			aria-controls="account-menu-list"
			onclick={() => (open = !open)}
		>
			<img src={avatar(viewer.avatarUrl)} alt="" width="28" height="28" />
			<span class="sr-only">Account menu for {viewer.login}</span>
		</button>
		{#if open}
			<div class="account-dropdown" id="account-menu-list" role="menu">
				<div class="account-identity">
					<strong>{viewer.name ?? viewer.login}</strong>
					<span>@{viewer.login}</span>
				</div>
				<a
					role="menuitem"
					href={resolve('/u/[login]', { login: viewer.login })}
					onclick={() => (open = false)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg
					>
					Your forum profile
				</a>
				<a role="menuitem" href={resolve('/new')} onclick={() => (open = false)}>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M5 12h14" /><path d="M12 5v14" /></svg
					>
					New post
				</a>
				<a role="menuitem" href={viewer.url} target="_blank" rel="noopener noreferrer">
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path
							d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
						/><path d="M9 18c-4.51 2-5-2-7-2" /></svg
					>
					GitHub profile
				</a>
				{#if exportUrl && isAdmin(viewer.login)}
					<a role="menuitem" href={exportUrl} download>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
								points="7 10 12 15 17 10"
							/><line x1="12" x2="12" y1="15" y2="3" /></svg
						>
						Download sign-ups (CSV)
					</a>
				{/if}
				<button
					role="menuitem"
					type="button"
					onclick={() => {
						open = false;
						auth.signOut();
					}}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
							points="16 17 21 12 16 7"
						/><line x1="21" x2="9" y1="12" y2="12" /></svg
					>
					Sign out
				</button>
			</div>
		{/if}
	</div>
{:else}
	<button
		type="button"
		class="wsg-button wsg-small wsg-cta account-signin"
		class:pending={auth.loading}
		onclick={signIn}
		aria-label="Sign in with GitHub"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path
				d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
			/><path d="M9 18c-4.51 2-5-2-7-2" /></svg
		>
		<span class="wsg-label">Sign in</span>
	</button>
{/if}

<style>
	.pending {
		visibility: hidden;
	}
	.account-menu {
		position: relative;
		flex-shrink: 0;
	}
	.account-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 35px;
		height: 35px;
		border: 1px solid var(--line);
		border-radius: 50%;
		color: var(--muted);
		overflow: hidden;
	}
	.account-trigger:hover,
	.account-trigger[aria-expanded='true'] {
		border-color: var(--accent);
		color: var(--text);
	}
	.account-trigger img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.account-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		min-width: 220px;
		max-width: calc(100vw - 32px);
		padding: 6px;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: var(--panel);
		box-shadow: var(--shadow);
	}
	.account-identity {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px 10px;
		margin-bottom: 4px;
		border-bottom: 1px solid var(--line);
		font-size: 13px;
		overflow-wrap: anywhere;
	}
	.account-identity span {
		color: var(--muted);
		font-size: 12px;
	}
	.account-dropdown [role='menuitem'] {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 9px 10px;
		border-radius: 5px;
		color: var(--text);
		font-size: 13px;
		text-align: left;
	}
	.account-dropdown [role='menuitem']:hover,
	.account-dropdown [role='menuitem']:focus-visible {
		background: var(--surface);
	}
</style>
