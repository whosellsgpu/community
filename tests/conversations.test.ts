import { describe, expect, it } from 'vitest';
import { filterConversations, readVersion, type ConversationFilter } from '$lib/conversations';
import type { DiscussionListItem } from '$lib/github/types';

const post = (id: string, overrides: Partial<DiscussionListItem> = {}): DiscussionListItem => ({
	id, number: Number(id), title: id, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z',
	upvoteCount: 0, author: { login: 'alice', avatarUrl: '', url: '' },
	category: { id: 'q', name: 'Q&A', slug: 'q-a', emojiHTML: '', isAnswerable: true },
	comments: { totalCount: 0 }, answerChosenAt: null, ...overrides
});
const context = () => ({ read: {} as Record<string, string>, previousVisit: Date.parse('2026-11-05T00:00:00Z'),
	login: 'Alice' as string | undefined, participated: new Set<number>(), isArticle: (body?: string) => body === 'article' });

describe('conversation filters', () => {
	it('separates a new thread from an old thread with unread activity', () => {
		const old = post('1', { updatedAt: '2026-11-10T00:00:00Z' });
		const fresh = post('2', { createdAt: '2026-11-10T00:00:00Z' });
		const ctx = context();
		ctx.read[old.id] = readVersion({ ...old, updatedAt: '2026-11-09T00:00:00Z' });
		expect(filterConversations([old, fresh], 'unread', ctx)).toEqual([old, fresh]);
		expect(filterConversations([old, fresh], 'new', ctx)).toEqual([fresh]);
		ctx.read[old.id] = readVersion(old);
		expect(filterConversations([old, fresh], 'unread', ctx)).toEqual([fresh]);
	});
	it('detects new replies in old archives without updatedAt', () => {
		const old = post('1', { updatedAt: undefined });
		const ctx = context(); ctx.read[old.id] = readVersion(old);
		expect(filterConversations([{ ...old, comments: { totalCount: 1 } }], 'unread', ctx)).toHaveLength(1);
	});
	it('distinguishes no replies from unanswered Q&A and ignores unknown archive answer status', () => {
		const empty = post('1');
		const answered = post('2', { answerChosenAt: '2026-11-02', comments: { totalCount: 1 } });
		const pending = post('3', { comments: { totalCount: 2 } });
		const discussion = post('4', { category: { ...empty.category, isAnswerable: false } });
		const unknown = post('5', { answerChosenAt: undefined });
		const nodes = [empty, answered, pending, discussion, unknown];
		expect(filterConversations(nodes, 'unanswered', context())).toEqual([empty, pending]);
		expect(filterConversations(nodes, 'no-replies', context())).toEqual([empty, discussion, unknown]);
	});
	it('uses explicit GitHub subscriptions for Following', () => {
		const subscribed = post('1', { viewerSubscription: 'SUBSCRIBED' });
		const nodes = [subscribed, post('2', { viewerSubscription: 'IGNORED' }), post('3')];
		expect(filterConversations(nodes, 'following', context())).toEqual([subscribed]);
		expect(filterConversations(nodes, 'following', { ...context(), login: undefined })).toEqual([]);
	});
	it('includes authored threads and commented/replied threads, but not other users’ threads', () => {
		const own = post('1');
		const replied = post('2', { author: null });
		const other = post('3', { author: { login: 'bob', avatarUrl: '', url: '' } });
		const ctx = { ...context(), participated: new Set([2]) };
		expect(filterConversations([own, replied, other], 'participated', ctx)).toEqual([own, replied]);
		expect(filterConversations([own], 'participated', { ...ctx, login: undefined })).toEqual([]);
	});
	it('ranks all threads by reply count with activity breaking ties, without changing the default order', () => {
		const nodes = [post('1'), post('2', { comments: { totalCount: 40 }, updatedAt: undefined }),
			post('3', { comments: { totalCount: 40 }, updatedAt: '2026-11-10T00:00:00Z' })];
		expect(filterConversations(nodes, 'most-replies', context()).map((d) => d.id)).toEqual(['3', '2', '1']);
		expect(nodes.map((d) => d.id)).toEqual(['1', '2', '3']);
		expect(filterConversations([post('4', { updatedAt: undefined }), post('5')], 'most-replies', context()).map((d) => d.id)).toEqual(['5', '4']);
		expect(filterConversations([post('6', { updatedAt: undefined }), post('7', { updatedAt: undefined, createdAt: '2026-11-03T00:00:00Z' })], 'most-replies', context()).map((d) => d.id)).toEqual(['7', '6']);
	});
	it.each(['all', 'posts', 'articles'] as ConversationFilter[])('preserves the existing %s filter', (filter) => {
		const nodes = [post('1'), post('2', { body: 'article' })];
		const expected = filter === 'all' ? nodes : filter === 'posts' ? [nodes[0]] : [nodes[1]];
		expect(filterConversations(nodes, filter, context())).toEqual(expected);
	});
});
