<script lang="ts">
	import { resolve } from '$app/paths';
	import DiscussionFeed from '$lib/components/DiscussionFeed.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import PinnedList from '$lib/components/PinnedList.svelte';
	import SignInPrompt from '$lib/components/SignInPrompt.svelte';
	import { forumConfig } from '$lib/config';
	import { auth } from '$lib/github/auth.svelte';
	import { archiveMode, loadOverview, ui } from '$lib/ui.svelte';

	let error = $state<string | null>(null);

	let started = false;
	$effect(() => {
		if ((auth.signedIn || (!auth.loading && archiveMode())) && !started) {
			started = true;
			// revalidates the shared feed when revisiting the home page
			loadOverview().catch((err) => {
				error = err instanceof Error ? err.message : 'Failed to load discussions.';
			});
		}
	});

</script>

<svelte:head>
	<title>{forumConfig.site.name} — Home</title>
</svelte:head>

{#if auth.loading}
	<Loading />
{:else if !auth.signedIn && !(archiveMode() && ui.bootedFromArchive)}
	<div class="mx-auto max-w-2xl pt-10">
		<h1 class="mb-2 text-center text-3xl font-bold tracking-tight">{forumConfig.site.name}</h1>
		<p class="mb-8 text-center text-fd-muted-foreground">{forumConfig.site.description}</p>
		<SignInPrompt />
	</div>
{:else}
	<div class="mb-6">
		<h1 class="text-2xl font-bold tracking-tight">Latest discussions</h1>
		<p class="mt-1 text-sm text-fd-muted-foreground">{forumConfig.site.description}</p>
	</div>

	{#if ui.categories.length > 0}
		<div class="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each ui.categories as category (category.id)}
				<a
					href={resolve('/t/[slug]', { slug: category.slug })}
					class="rounded-xl border border-fd-border bg-fd-card p-4 transition-colors hover:border-fd-ring/50 hover:bg-fd-accent/40"
				>
					<div class="flex items-center gap-2">
						<span class="text-lg leading-none">{@html category.emojiHTML}</span>
						<h2 class="font-medium">{category.name}</h2>
					</div>
					{#if category.description}
						<p class="mt-1.5 line-clamp-2 text-sm text-fd-muted-foreground">
							{category.description}
						</p>
					{/if}
				</a>
			{/each}
		</div>
	{/if}

	<PinnedList discussions={ui.pinned} />

	{#if error}
		<p class="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">{error}</p>
	{:else}
		{#key auth.viewer?.login}
			<DiscussionFeed page={ui.home} pinned={ui.pinned} />
		{/key}
	{/if}
{/if}
