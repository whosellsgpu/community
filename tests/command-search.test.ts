import { describe, expect, it } from 'vitest';
import {
	buildIndex,
	discussionItem,
	isOpenShortcut,
	mergeRemote,
	normalize,
	rankCommands,
	shortcutLabel
} from '$lib/command-search';
import type { DiscussionListItem } from '$lib/github/types';

const post = (
	number: number,
	title: string,
	extra: Partial<DiscussionListItem> = {}
): DiscussionListItem => ({
	id: `D${number}`,
	number,
	title,
	createdAt: '2026-11-13T00:00:00Z',
	upvoteCount: 0,
	author: { login: 'alice', avatarUrl: '', url: '' },
	category: { id: 'c1', name: 'GPU requests', slug: 'gpu-requests', emojiHTML: '' },
	comments: { totalCount: 2 },
	...extra
});

const categories = [
	{ slug: 'gpu-requests', name: 'GPU requests', description: 'Looking for capacity' },
	{ slug: 'gpu-supply', name: 'GPU supply', description: 'Capacity on offer' }
];
const pages = [
	{ label: 'Prices', href: '/#compare' },
	{ label: 'GPUs', href: '/gpus' }
];
const discussions = [
	post(1, 'Need 64× H100 in Frankfurt', { body: 'Three months, InfiniBand required.' }),
	post(2, 'Spare A100 80GB nodes in Texas', {
		author: { login: 'bob', avatarUrl: '', url: '' },
		category: { id: 'c2', name: 'GPU supply', slug: 'gpu-supply', emojiHTML: '' },
		comments: { totalCount: 1 }
	}),
	post(3, 'Who rents B200 by the hour?', { author: null }),
	post(4, 'Pricing trends'),
	post(5, 'MI300X availability'),
	post(6, 'Older thread')
];
const index = buildIndex({ base: '/forum', discussions, categories, pages, canPost: true });

describe('buildIndex', () => {
	it('lists actions, topics, posts and pages with forum links', () => {
		expect(index.map((item) => item.kind)).toEqual([
			'Action',
			'Topic',
			'Topic',
			'Post',
			'Post',
			'Post',
			'Post',
			'Post',
			'Post',
			'Page',
			'Page'
		]);
		expect(index[0]).toMatchObject({ title: 'New post', href: '/forum/new' });
		expect(index[1]).toMatchObject({
			href: '/forum/t/gpu-requests',
			detail: 'Looking for capacity'
		});
		expect(index.find((item) => item.id === 'post:2')).toMatchObject({
			href: '/forum/d/2',
			detail: 'GPU supply · @bob · 1 reply'
		});
		expect(index.find((item) => item.id === 'post:1')?.detail).toBe(
			'GPU requests · @alice · 2 replies'
		);
		// deleted authors show as ghost, like GitHub
		expect(index.find((item) => item.id === 'post:3')?.detail).toContain('@ghost');
		expect(index.at(-1)).toMatchObject({ kind: 'Page', href: '/gpus', detail: 'whosellsgpu.com' });
	});

	it('skips New post when posting is not possible, and duplicate posts', () => {
		const items = buildIndex({
			base: '/forum',
			discussions: [post(1, 'A'), post(1, 'A again')],
			categories: [{ slug: 'x', name: 'X', description: undefined as unknown as string }],
			pages: [],
			canPost: false
		});
		expect(items.map((item) => item.id)).toEqual(['topic:x', 'post:1']);
		expect(items[0].detail).toBe('');
	});
});

describe('rankCommands', () => {
	it('shows actions, topics and the five latest posts for an empty query', () => {
		const ids = rankCommands(index, '   ').map((item) => item.id);
		expect(ids).toEqual([
			'action:new',
			'topic:gpu-requests',
			'topic:gpu-supply',
			'post:1',
			'post:2',
			'post:3',
			'post:4',
			'post:5'
		]);
	});

	it('requires every word and ranks title matches above body matches', () => {
		expect(rankCommands(index, 'h100').map((item) => item.id)).toEqual(['post:1']);
		// "infiniband" is only in the body, yet still found
		expect(rankCommands(index, 'infiniband').map((item) => item.id)).toEqual(['post:1']);
		expect(rankCommands(index, 'h100 texas')).toEqual([]);
		// topic titles starting with the word come before posts mentioning it
		expect(rankCommands(index, 'gpu supply').map((item) => item.id)).toEqual([
			'topic:gpu-supply',
			'post:2'
		]);
	});

	it('scores starts, word starts and inner matches in that order', () => {
		const items = buildIndex({
			base: '',
			discussions: [post(1, 'xcapacity'), post(2, 'spare capacity'), post(3, 'capacity now')],
			categories: [],
			pages: [],
			canPost: false
		});
		expect(rankCommands(items, 'capacity').map((item) => item.id)).toEqual([
			'post:3',
			'post:2',
			'post:1'
		]);
	});

	it('matches authors, topics, numbers and pages, ignoring case and accents', () => {
		expect(rankCommands(index, '@bob'.slice(1)).map((item) => item.id)).toEqual(['post:2']);
		expect(rankCommands(index, '#5').map((item) => item.id)).toEqual(['post:5']);
		expect(rankCommands(index, 'PRÍCES').map((item) => item.id)).toEqual(['page:/#compare']);
		expect(rankCommands(index, 'supply')[0].id).toBe('topic:gpu-supply');
	});

	it('honours the limit', () => {
		expect(rankCommands(index, '', 2)).toHaveLength(2);
		expect(rankCommands(index, 'gpu', 1)).toHaveLength(1);
	});
});

describe('mergeRemote', () => {
	it('adds GitHub results after local ones, without duplicates', () => {
		const local = rankCommands(index, 'h100');
		const merged = mergeRemote(
			local,
			[post(1, 'Need 64× H100'), post(42, 'H100 cluster wanted')],
			'/forum'
		);
		expect(merged.map((item) => item.id)).toEqual(['post:1', 'post:42']);
		expect(merged[1].href).toBe('/forum/d/42');
		expect(mergeRemote(local, [post(7, 'a'), post(8, 'b')], '/forum', 2)).toHaveLength(2);
	});
});

describe('helpers', () => {
	it('normalises case, accents and spacing', () => {
		expect(normalize('  Ünïcode   GPU ')).toBe('unicode gpu');
	});

	it('labels the shortcut for the platform', () => {
		expect(shortcutLabel('MacIntel')).toBe('⌘K');
		expect(shortcutLabel('iPhone')).toBe('⌘K');
		expect(shortcutLabel('Win32')).toBe('Ctrl K');
	});

	it('recognises ⌘K and Ctrl K only', () => {
		const key = (k: string, m = { metaKey: false, ctrlKey: false, altKey: false }) =>
			isOpenShortcut({ key: k, ...m });
		expect(key('k', { metaKey: true, ctrlKey: false, altKey: false })).toBe(true);
		expect(key('K', { metaKey: false, ctrlKey: true, altKey: false })).toBe(true);
		expect(key('k')).toBe(false);
		expect(key('k', { metaKey: true, ctrlKey: false, altKey: true })).toBe(false);
		expect(key('j', { metaKey: true, ctrlKey: false, altKey: false })).toBe(false);
	});

	it('builds a post item on its own', () => {
		expect(discussionItem(post(9, 'Solo'), '').href).toBe('/d/9');
	});
});
