<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SignInDialog from '$lib/components/SignInDialog.svelte';
	import { auth } from '$lib/github/auth.svelte';
	import { configIncomplete, forumConfig, themeCss } from '$lib/config';
	import { signInEnabled } from '$lib/config';
	import { archiveMode, loadOverview, loadRep, ui } from '$lib/ui.svelte';
	import { previewRemainingMs, previewStartedAt } from '$lib/preview';

	let { children } = $props();

	$effect(() => {
		if (configIncomplete) return;
		auth.init();
	});

	// forum data needs an authenticated GraphQL call; one combined query
	// bootstraps categories, permission, and the home feed. Signed-out
	// visitors boot from the read-only archive instead (when enabled), and a
	// later sign-in re-boots against the live API.
	$effect(() => {
		if (auth.signedIn && (!ui.categoriesLoaded || ui.bootedFromArchive)) {
			loadOverview();
		} else if (!auth.loading && archiveMode() && !ui.categoriesLoaded) {
			loadOverview();
		}
	});

	// Signed-out visitors read freely for archive.previewMinutes, then the page
	// blurs behind a sign-in card. The header stays usable, and the OAuth
	// callback page is never covered.
	let previewOver = $state(false);
	$effect(() => {
		previewOver = false;
		if (!signInEnabled || auth.loading || auth.signedIn || !archiveMode()) return;
		const left = previewRemainingMs(forumConfig.archive.previewMinutes, previewStartedAt());
		if (left === Infinity) return;
		if (left === 0) {
			previewOver = true;
			return;
		}
		const timer = setTimeout(() => (previewOver = true), left);
		return () => clearTimeout(timer);
	});
	const gated = $derived(previewOver && !page.url.pathname.includes('/auth/callback'));

	// rep ledger is public raw content — load as soon as the app boots
	$effect(() => {
		loadRep();
	});
</script>

<svelte:head>
	<!-- Who Sells GPU favicons, the same as whosellsgpu.com -->
	<link rel="icon" type="image/png" sizes="32x32" href="{base}/favicon-32.png" />
	<link rel="icon" type="image/png" sizes="64x64" href="{base}/favicon-64.png" />
	<link rel="apple-touch-icon" href="{base}/favicon-180.png" />
	<title>{forumConfig.site.name}</title>
	{#if themeCss}
		{@html `<style>${themeCss}</style>`}
	{/if}
</svelte:head>

{#if configIncomplete}
	<main class="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
		<h1 class="text-2xl font-bold tracking-tight">Almost there…</h1>
		<p class="text-fd-muted-foreground">
			No repository is configured. Set <code class="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-sm">repo.owner</code>
			and <code class="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-sm">repo.name</code> in
			<code class="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-sm">forum.config.ts</code>,
			or deploy with the included GitHub Actions workflow to auto-detect them.
		</p>
	</main>
{:else}
	<Header />
	<SignInDialog />

	{#if archiveMode() && ui.bootedFromArchive}
		<div class="border-b border-fd-border bg-fd-muted/50">
			<div class="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-xs text-fd-muted-foreground">
				<span>
					{signInEnabled
						? 'Read-only snapshot — sign in to post, comment, and react.'
						: 'Read-only view — post, reply, and react on GitHub.'}
				</span>
				<button
					type="button"
					onclick={() => (ui.signInOpen = true)}
					class="font-medium text-fd-link hover:underline"
				>
					{signInEnabled ? 'Sign in' : 'Open on GitHub'}
				</button>
			</div>
		</div>
	{/if}

	<div
		class="mx-auto flex w-full max-w-[1400px] gap-8 px-4 {gated ? 'pointer-events-none select-none blur-md' : ''}"
		inert={gated}
		aria-hidden={gated || undefined}
	>
		{#if auth.signedIn && ui.categories.length > 0}
			<aside class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-6 md:block">
				<Sidebar categories={ui.categories} />
			</aside>
		{/if}
		<main class="min-w-0 flex-1 py-6">
			{@render children()}
		</main>
	</div>

	{#if gated}
		<div class="fixed inset-x-0 bottom-0 top-14 z-40 flex items-center justify-center bg-fd-background/40 p-4">
			<div
				class="w-full max-w-md rounded-2xl border border-fd-border bg-fd-card p-6 text-center shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="preview-gate-title"
			>
				<img src="{base}/mark.png" alt="" class="mx-auto mb-3 size-10 rounded-lg" />
				<h2 id="preview-gate-title" class="text-lg font-semibold">Join the Who Sells GPU community</h2>
				<p class="mt-2 text-sm text-fd-muted-foreground">
					Sign in with GitHub to keep reading GPU requests, supply listings and pricing threads,
					and to post your own. It's free and takes a few seconds.
				</p>
				<button
					type="button"
					onclick={() => (ui.signInOpen = true)}
					class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
				>
					Sign in with GitHub
				</button>
			</div>
		</div>
	{/if}

	{#if forumConfig.site.footer}
		<footer
			inert={gated}
			class="border-t border-fd-border py-6 text-center text-sm text-fd-muted-foreground {gated ? 'select-none blur-md' : ''}"
		>
			{forumConfig.site.footer}
		</footer>
	{/if}
{/if}
