/**
 * Timed read-only preview for signed-out visitors: they can read freely for
 * `archive.previewMinutes`, then the forum asks them to sign in. The clock
 * starts on their first visit and is kept in localStorage, so a refresh
 * doesn't restart it. Without storage (private mode, blocked site data) the
 * clock simply starts on each page load.
 */
const KEY = "wsg-forum-preview-started";

/** When this browser's preview started, recording `now` on the first visit */
export function previewStartedAt(now = Date.now()): number {
  try {
    const saved = Number(localStorage.getItem(KEY));
    if (Number.isFinite(saved) && saved > 0 && saved <= now) return saved;
    localStorage.setItem(KEY, String(now));
  } catch {
    // storage unavailable: count from this page load
  }
  return now;
}

/** Milliseconds of preview left (0 once it's over; Infinity if there's no limit) */
export function previewRemainingMs(
  minutes: number,
  startedAt: number,
  now = Date.now(),
): number {
  if (!(minutes > 0)) return Infinity;
  return Math.max(0, startedAt + minutes * 60_000 - now);
}
