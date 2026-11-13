<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { swr } from '$lib/cache';
	import DiscussionFeed from '$lib/components/DiscussionFeed.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import PinnedList from '$lib/components/PinnedList.svelte';
	import SignInPrompt from '$lib/components/SignInPrompt.svelte';
	import { forumConfig } from '$lib/config';
	import { listDiscussions } from '$lib/github/api';
	import { auth } from '$lib/github/auth.svelte';
	import type { DiscussionPage } from '$lib/github/types';
	import { archiveMode, canPostIn, repRequirement, ui } from '$lib/ui.svelte';

	const category = $derived(ui.categories.find((c) => c.slug === page.params.slug));

	let discussionPage = $state<DiscussionPage | null>(null);
	let error = $state<string | null>(null);
	const pinned = $derived(ui.pinned.filter((p) => p.category.slug === page.params.slug));

	let loadedFor: string | null = null;
	$effect(() => {
		const key = `${category?.id}:${auth.viewer?.login ?? 'guest'}`;
		if (!auth.loading && category && loadedFor !== key) {
			loadedFor = key;
			load(category.id);
		}
	});

	async function load(categoryId: string) {
		const key = loadedFor;
		error = null;
		discussionPage = null;
		// read-only archive mode: the whole feed is already in the archived
		// home index — filter it locally instead of calling the API
		if (archiveMode()) {
			const nodes = (ui.home?.nodes ?? []).filter((d) => d.category.id === categoryId);
			discussionPage = { nodes, totalCount: nodes.length, pageInfo: { endCursor: null, hasNextPage: false } };
			return;
		}
		try {
			await swr(`discussions:cat:${categoryId}`, () => listDiscussions({ categoryId }), (result) => {
				if (loadedFor === key) discussionPage = result;
			});
		} catch (err) {
			if (loadedFor === key) error = err instanceof Error ? err.message : 'Failed to load topic.';
		}
	}

</script>

<svelte:head>
	<title>{category ? `${category.name} — ${forumConfig.site.name}` : forumConfig.site.name}</title>
</svelte:head>

{#if auth.loading}
	<Loading />
{:else if !auth.signedIn && !(archiveMode() && ui.bootedFromArchive)}
	<SignInPrompt />
{:else if !ui.categoriesLoaded}
	<Loading />
{:else if !category}
	<div class="rounded-2xl border border-dashed border-fd-border py-16 text-center">
		<p class="font-medium">Topic not found</p>
		<a href={resolve('/')} class="mt-2 inline-block text-sm text-fd-link hover:underline">
			Back to all discussions
		</a>
	</div>
{:else}
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
				<span class="leading-none">{@html category.emojiHTML}</span>
				{category.name}
			</h1>
			{#if category.description}
				<p class="mt-1 text-sm text-fd-muted-foreground">{category.description}</p>
			{/if}
		</div>
		{#if canPostIn(category)}
			<a
				href="{resolve('/new')}?topic={category.slug}"
				class="inline-flex items-center gap-1.5 rounded-lg bg-fd-primary px-3 py-1.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
			>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
				New post
			</a>
		{:else}
			{@const restricted = forumConfig.content.topics.restricted.includes(category.slug)}
			<span
				class="inline-flex items-center gap-1.5 rounded-lg border border-fd-border px-3 py-1.5 text-sm text-fd-muted-foreground"
				title={restricted
					? 'Only repository maintainers can post in this topic'
					: `Posting here requires ${repRequirement(category.slug)} reputation`}
			>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
				{restricted ? 'Maintainers only' : `Requires ${repRequirement(category.slug)} rep`}
			</span>
		{/if}
	</div>

	<PinnedList discussions={pinned} showCategory={false} />

	{#if error}
		<p class="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">{error}</p>
	{:else}
		{#key `${category.id}:${auth.viewer?.login ?? 'guest'}`}
			<DiscussionFeed page={discussionPage} categoryId={category.id} {pinned} showCategory={false} />
		{/key}
	{/if}
{/if}
