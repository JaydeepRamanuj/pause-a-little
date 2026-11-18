import { describe, expect, it } from "vitest";
import { messageIndex, partialMinutes, phaseFor } from "../timerMath";

const MIN = 60000;

describe("phaseFor", () => {
  it("is done when the timer is done", () => {
    expect(phaseFor("done", 25, 0)).toBe("done");
  });
  it("has no phase when idle, paused, or without a timer", () => {
    expect(phaseFor("idle", 25, 25 * MIN)).toBeNull();
    expect(phaseFor("paused", 25, 10 * MIN)).toBeNull();
    expect(phaseFor("running", 0, 0)).toBeNull();
  });
  it("is start in the first tenth", () => {
    expect(phaseFor("running", 20, 20 * MIN)).toBe("start");
    expect(phaseFor("running", 20, 19 * MIN)).toBe("start");
    expect(phaseFor("running", 20, 17 * MIN)).toBeNull();
  });
  it("is mid between 45% and 62%", () => {
    expect(phaseFor("running", 20, 10 * MIN)).toBe("mid");
    expect(phaseFor("running", 20, 7 * MIN)).toBeNull();
  });
  it("is end in the last 3 minutes, or the last fifth of a short session", () => {
    expect(phaseFor("running", 60, 2.5 * MIN)).toBe("end");
    expect(phaseFor("running", 60, 4 * MIN)).toBeNull();
    expect(phaseFor("running", 10, 2 * MIN)).toBe("end");
  });
});

describe("messageIndex", () => {
  it("changes every two minutes", () => {
    expect(messageIndex(20 * MIN, 20 * MIN)).toBe(0);
    expect(messageIndex(20 * MIN, 18.5 * MIN)).toBe(0);
    expect(messageIndex(20 * MIN, 18 * MIN)).toBe(1);
    expect(messageIndex(20 * MIN, 10 * MIN)).toBe(5);
  });
});

describe("partialMinutes", () => {
  it("rounds the real time spent", () => {
    expect(partialMinutes(7.4 * MIN, 5)).toBe(7);
    expect(partialMinutes(7.6 * MIN, 5)).toBe(8);
  });
  it("ignores sessions shorter than the minimum", () => {
    expect(partialMinutes(4 * MIN, 5)).toBe(0);
    expect(partialMinutes(4.4 * MIN, 5)).toBe(0);
    expect(partialMinutes(5 * MIN, 5)).toBe(5);
  });
});
