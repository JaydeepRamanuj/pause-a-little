import { describe, expect, it } from "vitest";
import { blockMinutes, breakAfter, DEFAULT_CYCLE, normalizeCycle, roundAfterBreak, roundAfterFocus } from "../cycleMath";
import { breathAt, breathLength, mandalaScale } from "../breathMath";

describe("cycle order", () => {
  it("gives short breaks, then a long one on the 4th", () => {
    let round = 0;
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      round = roundAfterFocus(round);
      const b = breakAfter(round, 4);
      seen.push(b);
      round = roundAfterBreak(b, round);
    }
    expect(seen).toEqual(["short", "short", "short", "long", "short"]);
    expect(round).toBe(1);
  });
  it("picks the length for each block", () => {
    expect(blockMinutes("focus", 25, DEFAULT_CYCLE)).toBe(25);
    expect(blockMinutes("short", 25, DEFAULT_CYCLE)).toBe(5);
    expect(blockMinutes("long", 25, DEFAULT_CYCLE)).toBe(15);
  });
});

describe("normalizeCycle", () => {
  it("uses the defaults for nothing or nonsense", () => {
    expect(normalizeCycle(null)).toEqual(DEFAULT_CYCLE);
    expect(normalizeCycle({ shortMin: NaN, every: "x" as unknown as number, breathing: "zzz" as never })).toEqual(DEFAULT_CYCLE);
  });
  it("keeps values in range", () => {
    const c = normalizeCycle({ shortMin: 500, longMin: 0, every: 99, on: false });
    expect(c.shortMin).toBe(60);
    expect(c.longMin).toBe(1);
    expect(c.every).toBe(8);
    expect(c.on).toBe(false);
  });
});

describe("breathAt", () => {
  it("box breathing goes in, hold, out, hold", () => {
    expect(breathAt("box", 0)).toEqual({ kind: "in", level: 0 });
    expect(breathAt("box", 2).level).toBeCloseTo(0.5);
    expect(breathAt("box", 5)).toEqual({ kind: "hold", level: 1 });
    expect(breathAt("box", 9).kind).toBe("out");
    expect(breathAt("box", 13)).toEqual({ kind: "hold", level: 0 });
    expect(breathAt("box", 16).kind).toBe("in");
  });
  it("4-7-8 lasts 19 seconds and the slow breath 10", () => {
    expect(breathLength("478")).toBe(19);
    expect(breathLength("slow")).toBe(10);
    expect(breathAt("478", 6).kind).toBe("hold");
    expect(breathAt("478", 12).kind).toBe("out");
  });
  it("scales the mandala between 0.9 and 1.12", () => {
    expect(mandalaScale(0)).toBeCloseTo(0.9);
    expect(mandalaScale(1)).toBeCloseTo(1.12);
  });
});

import { breakPalette, mixHex } from "../../lib/breakPalette";
import { RAAG_PALETTES } from "../../data/palettes";

describe("breakPalette", () => {
  it("mixes colours", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("#123456", "#ffffff", 0)).toBe("#123456");
  });
  it("keeps the palette's tone but softens it", () => {
    const p = RAAG_PALETTES.ratri;
    const b = breakPalette(p);
    expect(b.dark).toBe(true);
    expect(b.raag).toBe(true);
    expect(b.bg).not.toBe(p.bg);
    expect(b.colors).toHaveLength(p.colors.length);
  });
});
