import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    repo: { owner: "o", name: "r" },
    archive: { enabled: true, dataBranch: "data" },
  },
}));
vi.mock("$lib/config", () => ({ forumConfig: mockConfig }));

let client: typeof import("$lib/archive/client");
let fetchMock: Mock;

const SHA = "a".repeat(40);
const REF_URL = "https://api.github.com/repos/o/r/git/ref/heads/data";
const ok = (data: unknown) => ({ ok: true, json: async () => data });

/** Answer the ref lookup with `refReply`, and every raw file with `file` */
function serve(
  file: unknown,
  refReply: unknown = ok({ object: { sha: SHA } }),
) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url === REF_URL) {
      if (refReply instanceof Error) throw refReply;
      return refReply;
    }
    if (file instanceof Error) throw file;
    return file;
  });
}
const rawCalls = () => fetchMock.mock.calls.filter(([url]) => url !== REF_URL);

beforeEach(async () => {
  vi.resetModules();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  client = await import("$lib/archive/client");
});
afterEach(() => {
  vi.useRealTimers();
});

describe("archive client", () => {
  it("fetches meta.json pinned to the data branch commit", async () => {
    const meta = { archivedAt: "T", categories: [], pinned: [] };
    serve(ok(meta));
    expect(await client.fetchArchiveMeta()).toEqual(meta);
    expect(fetchMock).toHaveBeenCalledWith(REF_URL);
    expect(rawCalls()[0]).toEqual([
      `https://raw.githubusercontent.com/o/r/${SHA}/meta.json`,
      { cache: "no-cache" },
    ]);
  });

  it("fetches the post index", async () => {
    const index = { archivedAt: "T", discussions: [{ id: "d1" }] };
    serve(ok(index));
    expect(await client.fetchArchiveIndex()).toEqual(index);
    expect(rawCalls()[0][0]).toContain(`/${SHA}/posts/index.json`);
  });

  it("fetches an archived discussion by number", async () => {
    serve(ok({ number: 42 }));
    expect(await client.fetchArchivedDiscussion(42)).toEqual({ number: 42 });
    expect(rawCalls()[0][0]).toContain(`/${SHA}/posts/42/content.json`);
  });

  it("fetches a profile rep file with the login lowercased", async () => {
    const rep = {
      rep: 12,
      updatedAt: "T",
      breakdown: { post: 1, comment: 2, answerAccepted: 0 },
    };
    serve(ok(rep));
    expect(await client.fetchProfileRep("Alice")).toEqual(rep);
    expect(rawCalls()[0][0]).toContain(`/${SHA}/profiles/alice/rep.json`);
  });

  it("returns null on HTTP errors (not yet archived)", async () => {
    serve({ ok: false, status: 404 });
    expect(await client.fetchArchiveMeta()).toBeNull();
  });

  it("returns null on network failure", async () => {
    serve(new TypeError("offline"), new TypeError("offline"));
    expect(await client.fetchArchivedDiscussion(1)).toBeNull();
  });
});

describe("snapshot commit", () => {
  it("is looked up once and reused within a minute, then refreshed", async () => {
    vi.useFakeTimers();
    serve(ok({}));
    await client.fetchArchiveMeta();
    await client.fetchArchiveIndex();
    expect(
      fetchMock.mock.calls.filter(([url]) => url === REF_URL),
    ).toHaveLength(1);
    vi.advanceTimersByTime(60_001);
    await client.fetchArchiveIndex();
    expect(
      fetchMock.mock.calls.filter(([url]) => url === REF_URL),
    ).toHaveLength(2);
  });

  it.each([
    ["the API refuses (rate limit)", { ok: false, status: 403 }],
    ["the API is unreachable", new TypeError("offline")],
    ["the reply has no usable sha", ok({ object: { sha: "not-a-sha" } })],
    ["the reply has no object", ok({})],
  ])("falls back to the branch name when %s", async (_, refReply) => {
    serve(ok({}), refReply);
    await client.fetchArchiveMeta();
    expect(rawCalls()[0][0]).toBe(
      "https://raw.githubusercontent.com/o/r/data/meta.json",
    );
  });
});
