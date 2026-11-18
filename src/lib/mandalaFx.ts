// A small hook for other parts of the app to move the mandala.
// `setMandalaBreath(1)` is its normal size; Phase 3's breathing guide can pass
// a value between about 0.85 (breathed out) and 1.15 (breathed in) every frame.

let el: HTMLElement | null = null;

export function attachMandala(node: HTMLElement | null) {
  el = node;
}

/** Scale the mandala with a breath value. 1 = normal size. */
export function setMandalaBreath(v: number) {
  el?.style.setProperty('--m-breath', String(v));
}

/** Swell with the beat, 0..1. Used by the Raag background analysis. */
export function setMandalaBeat(v: number) {
  el?.style.setProperty('--m-beat', v.toFixed(3));
}
