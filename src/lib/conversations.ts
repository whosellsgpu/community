import type { DiscussionListItem } from './github/types';

export const conversationTabs = [
	{ id: 'unread', label: 'Unread', description: 'Discussions with updates you have not read in this browser.' },
	{ id: 'new', label: 'New discussions', description: 'Discussions started since your previous visit.' },
	{ id: 'no-replies', label: 'No replies', description: 'Discussions waiting for their first reply.' },
	{ id: 'following', label: 'Following', description: 'Discussions you subscribe to on GitHub.' },
	{ id: 'participated', label: 'Participated', description: 'Discussions you started, commented on, or replied to.' },
	{ id: 'unanswered', label: 'Unanswered', description: 'Questions without an accepted answer.' },
	{ id: 'most-replies', label: 'Most replies', description: 'Most replies first, then most recent activity.' }
] as const;

export type ConversationFilter = 'all' | 'posts' | 'articles' | typeof conversationTabs[number]['id'];

export function readVersion(d: { createdAt: string; updatedAt?: string; comments: { totalCount: number } }): string {
	return `${d.updatedAt ?? d.createdAt}:${d.comments.totalCount}`;
}

export function filterConversations(
	nodes: DiscussionListItem[],
	filter: ConversationFilter,
	context: {
		read: Record<string, string>;
		previousVisit: number;
		login?: string;
		participated: Set<number>;
		isArticle: (body?: string) => boolean;
	}
): DiscussionListItem[] {
	const matches = nodes.filter((d) => {
		switch (filter) {
			case 'posts': return !context.isArticle(d.body);
			case 'articles': return context.isArticle(d.body);
			case 'unread': return context.read[d.id] !== readVersion(d);
			case 'new': return Date.parse(d.createdAt) > context.previousVisit;
			case 'no-replies': return d.comments.totalCount === 0;
			case 'following': return !!context.login && d.viewerSubscription === 'SUBSCRIBED';
			case 'participated': return !!context.login && (
				d.author?.login.toLowerCase() === context.login.toLowerCase() || context.participated.has(d.number)
			);
			case 'unanswered': return d.category.isAnswerable === true && d.answerChosenAt === null;
			default: return true;
		}
	});
	if (filter === 'most-replies') {
		matches.sort((a, b) => b.comments.totalCount - a.comments.totalCount ||
			Date.parse(b.updatedAt ?? b.createdAt) - Date.parse(a.updatedAt ?? a.createdAt));
	}
	return matches;
}
