// The pure part of the breathing guide: where in the breath you are at a given moment.

export type BreathId = "box" | "478" | "slow";
export type BreathKind = "in" | "hold" | "out";

interface Step {
  kind: BreathKind;
  sec: number;
  from: number; // how full the lungs are at the start of the step (0..1)
  to: number;
}

export const BREATHS: { id: BreathId; label: string; hint: string; steps: Step[] }[] = [
  {
    id: "box",
    label: "Box 4-4-4-4",
    hint: "in 4 · hold 4 · out 4 · hold 4",
    steps: [
      { kind: "in", sec: 4, from: 0, to: 1 },
      { kind: "hold", sec: 4, from: 1, to: 1 },
      { kind: "out", sec: 4, from: 1, to: 0 },
      { kind: "hold", sec: 4, from: 0, to: 0 },
    ],
  },
  {
    id: "478",
    label: "4-7-8",
    hint: "in 4 · hold 7 · out 8",
    steps: [
      { kind: "in", sec: 4, from: 0, to: 1 },
      { kind: "hold", sec: 7, from: 1, to: 1 },
      { kind: "out", sec: 8, from: 1, to: 0 },
    ],
  },
  {
    id: "slow",
    label: "Slow",
    hint: "in 4 · out 6",
    steps: [
      { kind: "in", sec: 4, from: 0, to: 1 },
      { kind: "out", sec: 6, from: 1, to: 0 },
    ],
  },
];

export const BREATH_TEXT: Record<BreathKind, string> = {
  in: "Breathe in",
  hold: "Hold",
  out: "Breathe out",
};

/** Length of one full breath, in seconds. */
export const breathLength = (id: BreathId) => BREATHS.find((b) => b.id === id)!.steps.reduce((a, s) => a + s.sec, 0);

const ease = (p: number) => (1 - Math.cos(Math.PI * p)) / 2;

/** Where the breath is `tSec` seconds after it began: the step, and how full the lungs are (0..1). */
export function breathAt(id: BreathId, tSec: number): { kind: BreathKind; level: number } {
  const steps = BREATHS.find((b) => b.id === id)!.steps;
  const total = steps.reduce((a, s) => a + s.sec, 0);
  let t = ((tSec % total) + total) % total;
  for (const s of steps) {
    if (t < s.sec) return { kind: s.kind, level: s.from + (s.to - s.from) * ease(t / s.sec) };
    t -= s.sec;
  }
  return { kind: "in", level: 0 };
}

/** The mandala scale for a lung level: 0.9 breathed out, 1.12 breathed in. */
export const mandalaScale = (level: number) => 0.9 + 0.22 * level;
