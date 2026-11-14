<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { forumConfig, githubUrlFor, signInEnabled } from '$lib/config';
	import { auth } from '$lib/github/auth.svelte';
	import { rememberReturn } from '$lib/github/site-session';
	import { archiveMode, ui } from '$lib/ui.svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';

	// The forum's own controls, under the host site's header: where you are,
	// search, and "New post".
	let query = $state('');

	function search(e: SubmitEvent) {
		e.preventDefault();
		if (query.trim()) goto(`${resolve('/search')}?q=${encodeURIComponent(query.trim())}`);
	}

	// Signed-out visitors sign in first, then land on the new-post page.
	function newPostSignedOut() {
		if (!auth.oauthAvailable) {
			ui.signInOpen = true;
			return;
		}
		rememberReturn(resolve('/new'), 'forum');
		auth.beginOAuth(`${location.origin}${resolve('/auth/callback')}`);
	}
</script>

<div class="border-b border-fd-border">
	<div class="host-width flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
		<a href={resolve('/')} class="mr-auto flex items-baseline gap-2">
			<span class="text-xl leading-none font-normal tracking-tight">Community forum</span>
		</a>
		{#if forumConfig.features.search && !archiveMode()}
			<form onsubmit={search} class="order-last w-full sm:order-none sm:w-64">
				<label class="relative block">
					<span class="sr-only">Search the forum</span>
					<svg
						class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fd-muted-foreground"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
					</svg>
					<input
						type="search"
						bind:value={query}
						placeholder="Search forum…"
						class="h-9 w-full rounded-md border border-fd-border bg-transparent pr-3 pl-8 text-sm outline-none transition-colors placeholder:text-fd-muted-foreground focus:border-fd-primary"
					/>
				</label>
			</form>
		{/if}
		{#if auth.viewer}
			<a
				href={resolve('/new')}
				class="inline-flex h-9 items-center gap-1.5 rounded-md bg-fd-primary px-3.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
			>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
				New post
			</a>
		{:else if !auth.loading && signInEnabled}
			<button
				type="button"
				onclick={newPostSignedOut}
				class="inline-flex h-9 items-center gap-1.5 rounded-md bg-fd-primary px-3.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
			>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
				New post
			</button>
		{:else if !auth.loading}
			<a
				href={githubUrlFor(page.url.pathname, base)}
				target="_blank"
				rel="noreferrer"
				class="inline-flex h-9 items-center rounded-md bg-fd-primary px-3.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
			>
				Post on GitHub
			</a>
		{/if}
	</div>
</div>
