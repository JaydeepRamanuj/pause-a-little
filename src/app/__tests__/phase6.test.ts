import { describe, expect, it } from "vitest";
import { anyLayer, normalizeLayers, NO_LAYERS, sleepFadeSec, sleepLeft } from "../layersMath";
import { raagInfoFor, raagLine } from "../../data/raags";

describe("layer mixer", () => {
  it("cleans saved levels", () => {
    expect(normalizeLayers(null)).toEqual(NO_LAYERS);
    const l = normalizeLayers({ rain: 2, ocean: -1, bells: "0.4", pads: "x", junk: 1 });
    expect(l).toEqual({ rain: 1, ocean: 0, bells: 0.4, pads: 0, tanpura: 0 });
    expect(anyLayer(l)).toBe(true);
    expect(anyLayer(NO_LAYERS)).toBe(false);
  });
});

describe("sleep timer", () => {
  it("fades over at most 90 seconds", () => {
    expect(sleepFadeSec(60)).toBe(90);
    expect(sleepFadeSec(15)).toBe(90);
    expect(sleepFadeSec(0.5)).toBe(6);
  });
  it("says how long is left", () => {
    expect(sleepLeft(1_000 + 12 * 60_000, 1_000)).toBe("12 min left");
    expect(sleepLeft(1_000 + 45_000, 1_000)).toBe("45 s left");
    expect(sleepLeft(0, 1_000)).toBe("0 s left");
  });
});

describe("raag details", () => {
  it("finds a raag in a title, longest name first", () => {
    expect(raagInfoFor("Raag Bhairavi")?.name).toBe("Bhairavi");
    expect(raagInfoFor("Raag Bhairav · Sitar")?.name).toBe("Bhairav");
    expect(raagInfoFor("Raag Yaman · Bansuri")?.thaat).toBe("Kalyan");
    expect(raagInfoFor("Krishna Bansuri")).toBeNull();
  });
  it("writes one line", () => {
    expect(raagLine(raagInfoFor("Yaman")!)).toBe("Kalyan thaat · early evening · peaceful, romantic");
  });
});
