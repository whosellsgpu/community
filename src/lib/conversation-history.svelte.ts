import { forumConfig } from './config';
import { readVersion } from './conversations';

export const conversationHistory = $state({
	scope: '',
	read: {} as Record<string, string>,
	previousVisit: 0
});

export function initConversationHistory(login?: string) {
	const { owner, name } = forumConfig.repo;
	const scope = `dk:conversations:${owner}/${name}:${login?.toLowerCase() ?? 'guest'}`;
	if (conversationHistory.scope === scope) return;
	conversationHistory.scope = scope;
	conversationHistory.read = {};
	conversationHistory.previousVisit = 0;
	try {
		const stored = JSON.parse(localStorage.getItem(scope) ?? 'null');
		if (stored && typeof stored === 'object') {
			conversationHistory.previousVisit = typeof stored.visitedAt === 'number' ? stored.visitedAt : 0;
			if (stored.read && typeof stored.read === 'object' && !Array.isArray(stored.read)) {
				conversationHistory.read = Object.fromEntries(
					Object.entries(stored.read).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
				);
			}
		}
	} catch { /* Storage may be unavailable or contain an old/corrupt value. */ }
	persist();
}

function persist() {
	try {
		localStorage.setItem(conversationHistory.scope, JSON.stringify({
			visitedAt: Date.now(), read: conversationHistory.read
		}));
	} catch { /* Reading still works when browser storage is unavailable. */ }
}

export function markConversationRead(d: { id: string; createdAt: string; updatedAt?: string; comments: { totalCount: number } }) {
	conversationHistory.read[d.id] = readVersion(d);
	persist();
}
