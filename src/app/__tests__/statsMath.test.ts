import { describe, expect, it } from "vitest";
import {
  computeStats,
  dayTotals,
  KEEP_DAYS,
  migrateLegacy,
  trimHistory,
  type SessionRec,
} from "../statsMath";

const now = new Date(2026, 5, 15, 14, 0); // 15 June 2026, 2 pm
const at = (daysAgo: number, hour = 9) =>
  new Date(2026, 5, 15 - daysAgo, hour).getTime();
const rec = (daysAgo: number, min: number, extra: Partial<SessionRec> = {}): SessionRec => ({
  start: at(daysAgo),
  min,
  intent: "",
  mode: "ambient",
  mood: "drift",
  track: null,
  completed: true,
  ...extra,
});

describe("migrateLegacy", () => {
  it("keeps every day's minutes and session count", () => {
    const recs = migrateLegacy({
      "2026-06-10": { min: 50, n: 2 },
      "2026-06-11": { min: 25, n: 1 },
    });
    expect(recs).toHaveLength(3);
    expect(recs.reduce((a, r) => a + r.min, 0)).toBe(75);
    expect(recs.every((r) => r.legacy)).toBe(true);
    const days = dayTotals(recs);
    expect(days["2026-06-10"]).toEqual({ min: 50, n: 2 });
    expect(days["2026-06-11"]).toEqual({ min: 25, n: 1 });
  });
  it("puts uneven minutes on the first record without losing any", () => {
    const recs = migrateLegacy({ "2026-06-10": { min: 61, n: 3 } });
    expect(recs.map((r) => r.min).sort()).toEqual([20, 20, 21]);
  });
  it("skips empty or broken days", () => {
    expect(migrateLegacy({ "2026-06-10": { min: 0, n: 0 }, nonsense: { min: 5, n: 1 } })).toEqual([]);
  });
});

describe("trimHistory", () => {
  it("keeps a year and drops older sessions", () => {
    const keep = rec(KEEP_DAYS - 1, 10);
    const drop = rec(KEEP_DAYS, 10);
    expect(trimHistory([drop, keep], now)).toEqual([keep]);
  });
});

describe("computeStats", () => {
  it("is empty without sessions", () => {
    expect(computeStats([], now)).toEqual({ today: { min: 0, n: 0 }, week: 0, streak: 0 });
  });
  it("adds up today, including ended-early sessions", () => {
    const s = computeStats([rec(0, 25), rec(0, 8, { completed: false })], now);
    expect(s.today).toEqual({ min: 33, n: 2 });
  });
  it("sums the last 7 days for the week", () => {
    const s = computeStats([rec(0, 10), rec(6, 20), rec(7, 99)], now);
    expect(s.week).toBe(30);
  });
  it("counts consecutive days as a streak", () => {
    const s = computeStats([rec(0, 10), rec(1, 10), rec(2, 10), rec(4, 10)], now);
    expect(s.streak).toBe(3);
  });
  it("keeps yesterday's streak alive until today has a session", () => {
    expect(computeStats([rec(1, 10), rec(2, 10)], now).streak).toBe(2);
    expect(computeStats([rec(2, 10)], now).streak).toBe(0);
  });
  it("counts a streak longer than 120 days", () => {
    const recs = Array.from({ length: 200 }, (_, i) => rec(i, 10));
    expect(computeStats(recs, now).streak).toBe(200);
  });
});
