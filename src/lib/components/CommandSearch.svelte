<script lang="ts">
	import { goto } from '$app/navigation';
	import { base, resolve } from '$app/paths';
	import {
		buildIndex,
		isOpenShortcut,
		mergeRemote,
		rankCommands,
		type CommandItem
	} from '$lib/command-search';
	import { forumConfig, signInEnabled } from '$lib/config';
	import { searchDiscussions } from '$lib/github/api';
	import type { DiscussionListItem } from '$lib/github/types';
	import { auth } from '$lib/github/auth.svelte';
	import { ui } from '$lib/ui.svelte';

	// ⌘K / Ctrl K search, styled and behaving like whosellsgpu.com's site
	// search. Posts already loaded (the whole archive for signed-out visitors)
	// are searched instantly; signed-in members also get GitHub's search.
	let dialog = $state<HTMLDialogElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	let list = $state<HTMLUListElement | null>(null);
	let query = $state('');
	let active = $state(0);
	let remote = $state<{ query: string; items: DiscussionListItem[] } | null>(null);
	let searching = $state(false);
	let previousFocus: HTMLElement | null = null;

	const pages = $derived(
		(forumConfig.host.enabled ? forumConfig.host.nav : forumConfig.nav)
			.filter((link) => !('current' in link && link.current))
			.map((link) => ({ label: link.label, href: link.href }))
	);
	const index = $derived(
		buildIndex({
			base,
			discussions: [...ui.pinned, ...(ui.home?.nodes ?? [])],
			categories: ui.categories,
			pages,
			canPost: signInEnabled
		})
	);
	const local = $derived(rankCommands(index, query));
	const results = $derived.by(() => {
		const merged =
			remote && remote.query === query.trim() ? mergeRemote(local, remote.items, base) : local;
		// Members can open GitHub's full results for the query.
		if (auth.signedIn && query.trim())
			return [
				...merged,
				{
					id: 'action:all',
					kind: 'Action' as const,
					title: `See all results for “${query.trim()}”`,
					detail: 'Full search across every post',
					href: `${resolve('/search')}?q=${encodeURIComponent(query.trim())}`,
					text: ''
				}
			];
		return merged;
	});

	// Open and close the native modal with the shared flag.
	$effect(() => {
		if (!dialog) return;
		if (ui.searchOpen && !dialog.open) {
			previousFocus = document.activeElement as HTMLElement | null;
			query = '';
			remote = null;
			active = 0;
			dialog.showModal();
			input?.focus();
		} else if (!ui.searchOpen && dialog.open) {
			dialog.close();
			previousFocus?.focus();
		}
	});

	// ⌘K / Ctrl K from anywhere, unless another dialog is already open.
	$effect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!isOpenShortcut(event)) return;
			if (!ui.searchOpen && (ui.signInOpen || document.querySelector('dialog[open]'))) return;
			event.preventDefault();
			ui.searchOpen = !ui.searchOpen;
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

	// GitHub search for members, debounced; stale answers are dropped.
	$effect(() => {
		const q = query.trim();
		if (!ui.searchOpen || !auth.signedIn || q.length < 2) {
			searching = false;
			return;
		}
		searching = true;
		const timer = setTimeout(async () => {
			try {
				const found = await searchDiscussions(q);
				if (query.trim() === q)
					remote = { query: q, items: found.nodes };
			} catch {
				// local matches still show
			} finally {
				if (query.trim() === q) searching = false;
			}
		}, 250);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		void query;
		active = 0;
	});
	$effect(() => {
		list?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
	});

	function close() {
		ui.searchOpen = false;
	}

	function go(item: CommandItem) {
		close();
		// forum pages navigate in place; site pages load normally
		if (item.href.startsWith(`${base}/`) || item.href === base) goto(item.href);
		else location.assign(item.href);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (results.length === 0) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = (active + 1) % results.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = (active - 1 + results.length) % results.length;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			go(results[active]);
		}
	}
</script>

<dialog
	bind:this={dialog}
	class="command-search wsg-tokens"
	aria-label="Search the forum"
	oncancel={(event) => {
		event.preventDefault();
		close();
	}}
	onclick={(event) => {
		if (event.target === event.currentTarget) close();
	}}
>
	<div class="command-search-field">
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
		>
		<input
			bind:this={input}
			bind:value={query}
			role="combobox"
			aria-expanded="true"
			aria-controls="command-search-results"
			aria-autocomplete="list"
			aria-activedescendant={results.length ? `command-search-${active}` : undefined}
			aria-label="Search posts, topics and pages"
			placeholder="Search posts, topics, H100…"
			autocomplete="off"
			spellcheck="false"
			onkeydown={onKeyDown}
		/>
		<kbd>Esc</kbd>
	</div>
	<ul
		id="command-search-results"
		bind:this={list}
		role="listbox"
		aria-label="Search results"
		class="command-search-results"
	>
		{#each results as item, i (item.id)}
			<li role="presentation">
				<a
					id="command-search-{i}"
					role="option"
					aria-selected={i === active}
					data-index={i}
					href={item.href}
					onclick={(event) => {
						event.preventDefault();
						go(item);
					}}
					onmousemove={() => (active = i)}
				>
					<span class="command-search-kind">{item.kind}</span>
					<span class="command-search-text">
						<strong>{item.title}</strong>
						{#if item.detail}<small>{item.detail}</small>{/if}
					</span>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
				</a>
			</li>
		{/each}
	</ul>
	{#if results.length === 0}
		<p class="command-search-empty" role="status">
			{#if searching}Searching…{:else}No post, topic or page matches “{query}”.{/if}
		</p>
	{/if}
	<p class="command-search-hint">
		<span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
		<span><kbd>Enter</kbd> to open</span>
		{#if searching && results.length > 0}<span class="command-search-status">Searching GitHub…</span
			>{/if}
	</p>
</dialog>

<style>
	/* whosellsgpu.com's .command-search (styles.css), unchanged. */
	.command-search {
		width: min(620px, calc(100% - 32px));
		margin: 12vh auto auto;
		padding: 0;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: var(--panel);
		color: var(--text);
		box-shadow: var(--shadow);
		font-family: Inter, ui-sans-serif, system-ui, sans-serif;
	}
	/* the site's 70% page-colour veil, per theme */
	.command-search::backdrop {
		background: rgb(243 238 227 / 0.7);
		backdrop-filter: blur(3px);
	}
	:global(html.dark) .command-search::backdrop {
		background: rgb(4 8 4 / 0.7);
	}
	.command-search[open] {
		animation: command-in 0.16s ease-out;
	}
	@keyframes command-in {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.99);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.command-search[open] {
			animation: none;
		}
	}
	.command-search svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}
	.command-search-field {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 18px;
		border-bottom: 1px solid var(--line);
		color: var(--muted);
	}
	.command-search-field svg {
		width: 18px;
		height: 18px;
	}
	.command-search-field input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: none;
		background: transparent;
		color: var(--text);
		font-size: 16px;
	}
	.command-search-field input::placeholder {
		color: var(--subtle);
	}
	.command-search-results {
		list-style: none;
		margin: 0;
		padding: 6px;
		max-height: min(420px, 55vh);
		overflow-y: auto;
	}
	.command-search-results a {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 11px 12px;
		border-radius: 5px;
		color: var(--muted);
	}
	.command-search-results a[aria-selected='true'] {
		background: var(--surface);
		color: var(--text);
	}
	.command-search-results a > svg {
		opacity: 0;
	}
	.command-search-results a[aria-selected='true'] > svg {
		opacity: 1;
		color: var(--accent);
	}
	.command-search-kind {
		width: 62px;
		flex-shrink: 0;
		font:
			400 9px/1 'JetBrains Mono',
			monospace;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--subtle);
	}
	.command-search-text {
		flex: 1;
		min-width: 0;
	}
	.command-search-text strong {
		display: block;
		color: var(--text);
		font-size: 13px;
		font-weight: 500;
		overflow-wrap: anywhere;
	}
	.command-search-text small {
		display: block;
		margin-top: 3px;
		font-size: 11px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.command-search-empty {
		padding: 22px 18px;
		color: var(--muted);
		font-size: 12px;
	}
	.command-search-hint {
		display: flex;
		gap: 18px;
		padding: 10px 18px;
		border-top: 1px solid var(--line);
		color: var(--subtle);
		font-size: 10px;
	}
	.command-search-hint kbd {
		margin-right: 3px;
	}
	.command-search-status {
		margin-left: auto;
	}
</style>
