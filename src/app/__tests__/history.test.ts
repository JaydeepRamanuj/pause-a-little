import { describe, expect, it } from "vitest";
import { byHour, heatLevel, heatmap, lastDays, longestStreak, thisMonth, topItems, goalFraction } from "../historyMath";
import { applyImport, buildExport, parseImport } from "../dataIO";
import type { SessionRec } from "../statsMath";

const now = new Date(2026, 5, 15, 14, 0); // Monday 15 June 2026
const rec = (daysAgo: number, min: number, hour = 9, extra: Partial<SessionRec> = {}): SessionRec => ({
  start: new Date(2026, 5, 15 - daysAgo, hour).getTime(),
  min, intent: "", mode: "ambient", mood: "drift", track: null, completed: true, ...extra,
});

function fakeStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

describe("history maths", () => {
  it("levels follow the goal", () => {
    expect(heatLevel(0, 120)).toBe(0);
    expect(heatLevel(20, 120)).toBe(1);
    expect(heatLevel(60, 120)).toBe(2);
    expect(heatLevel(100, 120)).toBe(3);
    expect(heatLevel(120, 120)).toBe(4);
  });
  it("heatmap has 53 weeks of 7 days, Monday first, ending this week", () => {
    const h = heatmap([rec(0, 30)], 120, now);
    expect(h).toHaveLength(53);
    expect(h[52][0].day).toBe("2026-06-15"); // today is a Monday
    expect(h[52][0].min).toBe(30);
    expect(h[52][1].future).toBe(true);
  });
  it("week and month totals", () => {
    const recs = [rec(0, 25), rec(3, 25), rec(10, 50)];
    expect(lastDays(recs, 7, now)).toEqual({ min: 50, n: 2 });
    expect(thisMonth(recs, now)).toEqual({ min: 100, n: 3 });
  });
  it("longest streak", () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak([rec(0, 5), rec(1, 5), rec(2, 5), rec(5, 5), rec(6, 5)])).toBe(3);
  });
  it("by hour and top items", () => {
    const recs = [rec(0, 20, 7), rec(1, 30, 7, { mood: "rain" }), rec(2, 10, 21)];
    const h = byHour(recs);
    expect(h[7]).toBe(50);
    expect(h[21]).toBe(10);
    expect(topItems(recs, (r) => r.mood)[0]).toEqual({ name: "drift", min: 30, n: 2 });
  });
  it("goal fraction is capped", () => {
    expect(goalFraction(60, 120)).toBe(0.5);
    expect(goalFraction(300, 120)).toBe(1);
    expect(goalFraction(30, 0)).toBe(0);
  });
});

describe("export and import", () => {
  it("round-trips only the app's keys", () => {
    const s = fakeStorage({ "drift:minutes": "25", "raag:yt": '[{"id":"x"}]', "other": "1" });
    const file = buildExport(s, now);
    expect(Object.keys(file.data).sort()).toEqual(["drift:minutes", "raag:yt"]);
    const parsed = parseImport(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    const t = fakeStorage({ "drift:old": "1", "keep": "me" });
    if (parsed.ok) applyImport(t, parsed.data);
    expect(t.m.get("drift:minutes")).toBe("25");
    expect(t.m.has("drift:old")).toBe(false);
    expect(t.m.get("keep")).toBe("me");
  });
  it("rejects bad files", () => {
    expect(parseImport("nope").ok).toBe(false);
    expect(parseImport('{"app":"x"}').ok).toBe(false);
    expect(parseImport('{"app":"pause-a-little","version":99,"data":{}}').ok).toBe(false);
    expect(parseImport('{"app":"pause-a-little","version":1,"data":{"evil":1}}').ok).toBe(false);
  });
});
