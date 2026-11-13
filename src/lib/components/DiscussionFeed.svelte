<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { forumConfig } from '$lib/config';
	import { conversationTabs, filterConversations, type ConversationFilter } from '$lib/conversations';
	import { conversationHistory } from '$lib/conversation-history.svelte';
	import { completeDiscussionPage, getParticipatedDiscussions, isArticle, listDiscussions } from '$lib/github/api';
	import { auth } from '$lib/github/auth.svelte';
	import type { DiscussionListItem, DiscussionPage } from '$lib/github/types';
	import DiscussionRow from './DiscussionRow.svelte';
	import Loading from './Loading.svelte';

	let { page, categoryId, pinned = [], showCategory = true }: {
		page: DiscussionPage | null;
		categoryId?: string;
		pinned?: DiscussionListItem[];
		showCategory?: boolean;
	} = $props();
	let filter = $state<ConversationFilter>('all');
	let expanded = $state<DiscussionPage | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let participated = $state<Set<number> | null>(null);
	let request = 0;
	const current = $derived(expanded ?? page);
	const tabs = $derived([
		{ id: 'all' as const, label: 'All', description: 'All discussions.' },
		...(forumConfig.content.articles.enabled ? [
			{ id: 'posts' as const, label: 'Posts', description: 'Regular discussion threads.' },
			{ id: 'articles' as const, label: 'Articles', description: 'Long-form articles.' }
		] : []),
		...conversationTabs
	]);
	const filtered = $derived(filterConversations(
		(current?.nodes ?? []).filter((d) => {
			const { include, exclude } = forumConfig.content.topics;
			return !pinned.some((p) => p.id === d.id) && !exclude.includes(d.category.slug) &&
				(include.length === 0 || include.includes(d.category.slug));
		}), filter, {
			read: conversationHistory.read, previousVisit: conversationHistory.previousVisit,
			login: auth.viewer?.login, participated: participated ?? new Set(), isArticle
		}
	));

	// A fresh bootstrap invalidates the pages collected from the previous snapshot.
	$effect(() => {
		const seed = page;
		request += 1;
		expanded = null;
		busy = false;
		if (seed) untrack(() => { if (filter !== 'all') void select(filter); });
	});

	async function select(next: ConversationFilter) {
		filter = next;
		if (!page || busy) return;
		busy = true;
		error = null;
		const seed = page;
		const activeRequest = ++request;
		try {
			// Filtering only the first 25 posts would hide matching older threads.
			const all = next === 'all' ? current! : await completeDiscussionPage(current!, categoryId);
			const numbers = next === 'participated' && auth.viewer && !participated
				? await getParticipatedDiscussions(auth.viewer.login) : participated;
			if (page === seed && request === activeRequest) {
				expanded = all;
				participated = numbers;
			}
		} catch (err) {
			if (request === activeRequest) error = err instanceof Error ? err.message : 'Failed to filter discussions.';
		} finally {
			if (request === activeRequest) busy = false;
		}
	}

	async function loadMore() {
		if (!current?.pageInfo.hasNextPage || busy) return;
		busy = true;
		error = null;
		const seed = page;
		const activeRequest = ++request;
		try {
			const next = await listDiscussions({ categoryId, after: current.pageInfo.endCursor });
			if (page === seed && request === activeRequest) expanded = { ...next, nodes: [...current.nodes, ...next.nodes] };
		} catch (err) {
			if (request === activeRequest) error = err instanceof Error ? err.message : 'Failed to load discussions.';
		} finally {
			if (request === activeRequest) busy = false;
		}
	}
</script>

<div class="mb-4 flex max-w-full flex-wrap gap-1 rounded-lg border border-fd-border bg-fd-muted/50 p-1 text-sm w-fit" aria-label="Discussion filters">
	{#each tabs as tab (tab.id)}
		<button
			type="button"
			onclick={() => select(tab.id)}
			aria-pressed={filter === tab.id}
			title={!auth.signedIn && (tab.id === 'following' || tab.id === 'participated') ? 'Sign in to use this filter.' : tab.description}
			disabled={busy || !page || (!auth.signedIn && (tab.id === 'following' || tab.id === 'participated'))}
			class="rounded-md px-3 py-1 transition-colors disabled:opacity-50 {filter === tab.id
				? 'bg-fd-background font-medium shadow-sm'
				: 'text-fd-muted-foreground hover:text-fd-foreground'}"
		>
			{tab.label}
		</button>
	{/each}
</div>

{#if error}
	<p class="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500" role="alert">{error}</p>
{/if}
{#if !page || busy}
	<Loading />
{:else if !error && filtered.length === 0}
	<div class="rounded-2xl border border-dashed border-fd-border py-16 text-center">
		<p class="font-medium">{filter === 'all' && showCategory ? 'No discussions yet' : 'Nothing here yet'}</p>
		<p class="mt-1 text-sm text-fd-muted-foreground">
			{filter === 'all' ? (showCategory ? 'Be the first to start one.' : 'No discussions in this topic.') : 'No discussions match this filter.'}
		</p>
		{#if filter === 'all' && showCategory}
			<a href={resolve('/new')} class="mt-4 inline-flex rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground hover:opacity-90">New post</a>
		{/if}
	</div>
{:else if !error}
	<div class="flex flex-col gap-3">
		{#each filtered as discussion (discussion.id)}
			<DiscussionRow {discussion} {showCategory} />
		{/each}
	</div>
{/if}
{#if current?.pageInfo.hasNextPage && !busy}
	<div class="mt-6 flex justify-center">
		<button type="button" onclick={error ? () => select(filter) : loadMore}
			class="rounded-lg border border-fd-border px-4 py-2 text-sm font-medium hover:bg-fd-accent disabled:opacity-50">
			{error ? 'Try again' : 'Load more'}
		</button>
	</div>
{:else if error}
	<button type="button" onclick={() => select(filter)} class="mt-4 rounded-lg border border-fd-border px-4 py-2 text-sm font-medium hover:bg-fd-accent">Try again</button>
{/if}
