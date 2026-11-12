import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { previewRemainingMs, previewStartedAt } from "$lib/preview";

const KEY = "wsg-forum-preview-started";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("previewStartedAt", () => {
  it("records the first visit and keeps it across later page loads", () => {
    expect(previewStartedAt(1_000)).toBe(1_000);
    expect(localStorage.getItem(KEY)).toBe("1000");
    expect(previewStartedAt(5_000)).toBe(1_000);
  });

  it.each([["garbage"], ["-5"], ["0"], ["9999"]])(
    "restarts the clock on a bad saved value (%s)",
    (saved) => {
      localStorage.setItem(KEY, saved);
      expect(previewStartedAt(2_000)).toBe(2_000);
      expect(localStorage.getItem(KEY)).toBe("2000");
    },
  );

  it("counts from this page load when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(previewStartedAt(3_000)).toBe(3_000);
  });

  it("defaults to the current time", () => {
    vi.spyOn(Date, "now").mockReturnValue(7_000);
    expect(previewStartedAt()).toBe(7_000);
  });
});

describe("previewRemainingMs", () => {
  it("counts down from the start and stops at zero", () => {
    expect(previewRemainingMs(2, 0, 30_000)).toBe(90_000);
    expect(previewRemainingMs(2, 0, 120_000)).toBe(0);
    expect(previewRemainingMs(2, 0, 500_000)).toBe(0);
  });

  it("never ends when there is no limit", () => {
    expect(previewRemainingMs(0, 0, 10)).toBe(Infinity);
    expect(previewRemainingMs(Number.NaN, 0, 10)).toBe(Infinity);
  });

  it("defaults to the current time", () => {
    vi.spyOn(Date, "now").mockReturnValue(60_000);
    expect(previewRemainingMs(2, 0)).toBe(60_000);
  });
});
