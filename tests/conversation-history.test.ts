import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/config', () => ({ forumConfig: { repo: { owner: 'o', name: 'r' } } }));
let history: typeof import('$lib/conversation-history.svelte');
const key = 'dk:conversations:o/r:alice';
const discussion = { id: 'D1', createdAt: '2026-11-01', updatedAt: '2026-11-02', comments: { totalCount: 2 } };

beforeEach(async () => {
	vi.restoreAllMocks(); vi.resetModules(); localStorage.clear();
	history = await import('$lib/conversation-history.svelte');
});

describe('browser conversation history', () => {
	it('remembers a previous visit, records a read version and isolates users and guests', () => {
		localStorage.setItem(key, JSON.stringify({ visitedAt: 123, read: { old: 'version', invalid: 4 } }));
		history.initConversationHistory('Alice');
		expect(history.conversationHistory.previousVisit).toBe(123);
		expect(history.conversationHistory.read).toEqual({ old: 'version' });
		history.markConversationRead(discussion);
		expect(JSON.parse(localStorage.getItem(key)!).read.D1).toBe('2026-11-02:2');
		history.initConversationHistory('ALICE');
		expect(history.conversationHistory.previousVisit).toBe(123);
		history.initConversationHistory('bob');
		expect(history.conversationHistory.read).toEqual({});
		expect(history.conversationHistory.previousVisit).toBe(0);
		history.initConversationHistory();
		expect(history.conversationHistory.scope).toBe('dk:conversations:o/r:guest');
	});
	it.each(['bad json', 'null', '3', '{}', '{"visitedAt":"bad","read":[]}', '{"read":null}'])(
		'tolerates a missing or invalid stored shape: %s', (value) => {
			localStorage.setItem(key, value);
			history.initConversationHistory('alice');
			expect(history.conversationHistory.previousVisit).toBe(0);
			expect(history.conversationHistory.read).toEqual({});
		});
	it('still tracks reads in memory when storage is blocked or full', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
		expect(() => history.initConversationHistory('alice')).not.toThrow();
		history.markConversationRead(discussion);
		expect(history.conversationHistory.read.D1).toBe('2026-11-02:2');
	});
});
