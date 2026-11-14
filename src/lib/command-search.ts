/**
 * The ⌘K / Ctrl K palette's index and ranking (UI: CommandSearch.svelte).
 * Mirrors whosellsgpu.com's site search: one list of posts, topics, actions
 * and site pages, filtered as you type, best matches first.
 */
import type { Category, DiscussionListItem } from '$lib/github/types';

export type CommandKind = 'Action' | 'Topic' | 'Post' | 'Page';

export interface CommandItem {
	id: string;
	kind: CommandKind;
	title: string;
	detail: string;
	href: string;
	/** Normalised text the query is matched against */
	text: string;
}

export interface IndexInput {
	/** Forum base path, e.g. "/forum" */
	base: string;
	discussions: DiscussionListItem[];
	categories: Pick<Category, 'slug' | 'name' | 'description'>[];
	/** Host-site pages (Prices, GPUs, …) */
	pages: { label: string; href: string }[];
	/** Whether to offer "New post" */
	canPost: boolean;
}

/** Lower-case, accents stripped, whitespace collapsed. */
export function normalize(value: string): string {
	return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const replies = (count: number) => (count === 1 ? '1 reply' : `${count} replies`);

export function discussionItem(d: DiscussionListItem, base: string): CommandItem {
	const author = d.author?.login ?? 'ghost';
	return {
		id: `post:${d.number}`,
		kind: 'Post',
		title: d.title,
		detail: `${d.category.name} · @${author} · ${replies(d.comments.totalCount)}`,
		href: `${base}/d/${d.number}`,
		text: normalize(
			[d.title, d.category.name, author, `#${d.number}`, (d.body ?? '').slice(0, 600)].join(' ')
		)
	};
}

/** Everything the palette can jump to, in its default (empty-query) order. */
export function buildIndex(input: IndexInput): CommandItem[] {
	const items: CommandItem[] = [];
	if (input.canPost)
		items.push({
			id: 'action:new',
			kind: 'Action',
			title: 'New post',
			detail: 'Ask for GPUs, list supply, or start a discussion',
			href: `${input.base}/new`,
			text: normalize('new post create write ask request list supply start discussion')
		});
	for (const c of input.categories)
		items.push({
			id: `topic:${c.slug}`,
			kind: 'Topic',
			title: c.name,
			detail: c.description ?? '',
			href: `${input.base}/t/${c.slug}`,
			text: normalize(`${c.name} ${c.slug.replace(/-/g, ' ')} ${c.description ?? ''}`)
		});
	const seen = new Set<number>();
	for (const d of input.discussions) {
		if (seen.has(d.number)) continue;
		seen.add(d.number);
		items.push(discussionItem(d, input.base));
	}
	for (const p of input.pages)
		items.push({
			id: `page:${p.href}`,
			kind: 'Page',
			title: p.label,
			detail: 'whosellsgpu.com',
			href: p.href,
			text: normalize(p.label)
		});
	return items;
}

const DEFAULT_POSTS = 5;

/**
 * Items matching every word of the query, best first. Title matches beat
 * matches in the body; a title that starts with the word beats one that only
 * contains it. An empty query lists actions, topics and recent posts.
 */
export function rankCommands(items: CommandItem[], query: string, limit = 12): CommandItem[] {
	const q = normalize(query);
	if (!q) {
		let posts = 0;
		return items
			.filter((item) => item.kind !== 'Page' && (item.kind !== 'Post' || posts++ < DEFAULT_POSTS))
			.slice(0, limit);
	}
	const words = q.split(' ');
	const scored: { item: CommandItem; score: number; order: number }[] = [];
	items.forEach((item, order) => {
		if (!words.every((word) => item.text.includes(word))) return;
		const title = normalize(item.title);
		let score = 0;
		for (const word of words) {
			if (title.startsWith(word)) score += 6;
			else if (title.includes(` ${word}`)) score += 4;
			else if (title.includes(word)) score += 3;
			else score += 1;
		}
		scored.push({ item, score, order });
	});
	return scored
		.sort((a, b) => b.score - a.score || a.order - b.order)
		.slice(0, limit)
		.map((entry) => entry.item);
}

/** Local matches first, then GitHub's search results not already listed. */
export function mergeRemote(
	local: CommandItem[],
	remote: DiscussionListItem[],
	base: string,
	limit = 12
): CommandItem[] {
	const hrefs = new Set(local.map((item) => item.href));
	const extra = remote.map((d) => discussionItem(d, base)).filter((item) => !hrefs.has(item.href));
	return [...local, ...extra].slice(0, limit);
}

/** "⌘K" on Apple devices, "Ctrl K" elsewhere. */
export function shortcutLabel(platform: string): string {
	return /Mac|iPhone|iPad|iPod/.test(platform) ? '⌘K' : 'Ctrl K';
}

/** ⌘K / Ctrl K, without Alt (Alt+K types characters on some layouts). */
export function isOpenShortcut(event: {
	key: string;
	metaKey: boolean;
	ctrlKey: boolean;
	altKey: boolean;
}): boolean {
	return event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey;
}
