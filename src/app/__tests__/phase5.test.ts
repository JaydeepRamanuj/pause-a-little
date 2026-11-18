import { describe, expect, it } from "vitest";
import { DEFAULT_CYCLE } from "../cycleMath";
import { MAX_SETUPS, normalizeSetups, removeSetup, upsertSetup, type SetupSnapshot } from "../setupMath";
import { endNote } from "../notifyMath";
import { mediaInfo } from "../mediaMath";

const snap: SetupSnapshot = {
  minutes: 50, cycle: DEFAULT_CYCLE, source: "raag", mood: "drift", track: "c1",
  palette: "dawn", mandala: "lotus", langs: ["en"], calm: true, poems: true,
};

describe("saved setups", () => {
  it("adds, replaces by name and removes", () => {
    let l = upsertSetup([], "Deep work", snap);
    l = upsertSetup(l, "Evening riyaz", { ...snap, minutes: 20 });
    expect(l.map((s) => s.name)).toEqual(["Deep work", "Evening riyaz"]);
    const id = l[0].id;
    l = upsertSetup(l, "  deep   WORK ", { ...snap, minutes: 90 });
    expect(l).toHaveLength(2);
    expect(l.find((s) => s.id === id)?.minutes).toBe(90);
    expect(removeSetup(l, id)).toHaveLength(1);
  });
  it("ignores empty names and caps the list", () => {
    expect(upsertSetup([], "   ", snap)).toEqual([]);
    let l = upsertSetup([], "x0", snap);
    for (let i = 1; i < 20; i++) l = upsertSetup(l, "x" + i, snap);
    expect(l).toHaveLength(MAX_SETUPS);
    expect(l[l.length - 1].name).toBe("x19");
  });
  it("normalizes broken data", () => {
    const l = normalizeSetups([{ id: "a", name: "Ok", source: "ambient", minutes: 500 }, { name: "no id" }, 5, null]);
    expect(l).toHaveLength(1);
    expect(l[0].minutes).toBe(180);
    expect(l[0].cycle).toEqual(DEFAULT_CYCLE);
    expect(normalizeSetups("nope")).toEqual([]);
  });
});

describe("notification and media text", () => {
  it("tells what comes next", () => {
    expect(endNote("focus", "short", 25, 1).body).toContain("short break");
    expect(endNote("focus", "long", 25, 4).body).toContain("long break");
    expect(endNote("focus", "focus", 25, 1).title).toBe("Time’s up");
    expect(endNote("short", "focus", 25, 1).title).toBe("Break over");
  });
  it("describes what is playing", () => {
    expect(mediaInfo("Raag Yaman", "write chapter", false, 25)).toEqual({ title: "Raag Yaman", artist: "pause a little", album: "write chapter" });
    expect(mediaInfo(null, "", true, 25).album).toBe("Break");
    expect(mediaInfo(null, "", false, 0).title).toBe("Focus");
  });
});
