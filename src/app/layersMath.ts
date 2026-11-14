// The ambient layer mixer and the sleep timer, as pure functions (no audio, no store).

export const LAYER_IDS = ['rain', 'ocean', 'bells', 'pads', 'tanpura'] as const;
export type LayerId = (typeof LAYER_IDS)[number];
export type LayerLevels = Record<LayerId, number>;

export const LAYER_NAMES: Record<LayerId, string> = {
  rain: 'Rain',
  ocean: 'Ocean',
  bells: 'Bells',
  pads: 'Pads',
  tanpura: 'Tanpura',
};

export const NO_LAYERS: LayerLevels = { rain: 0, ocean: 0, bells: 0, pads: 0, tanpura: 0 };

/** Clean up saved levels: unknown keys dropped, each value clamped to 0..1. */
export function normalizeLayers(raw: unknown): LayerLevels {
  const out = { ...NO_LAYERS };
  if (raw && typeof raw === 'object') {
    for (const id of LAYER_IDS) {
      const v = Number((raw as Record<string, unknown>)[id]);
      if (Number.isFinite(v)) out[id] = Math.max(0, Math.min(1, v));
    }
  }
  return out;
}

export const anyLayer = (l: LayerLevels) => LAYER_IDS.some(id => l[id] > 0);

export const SLEEP_MINUTES = [15, 30, 60] as const;

/** Seconds of fade at the end of a sleep timer: a minute and a half, less for very short timers. */
export function sleepFadeSec(totalMin: number): number {
  return Math.max(5, Math.min(90, (totalMin * 60) / 5));
}

/** "12 min left" / "45 s left". */
export function sleepLeft(endAt: number, now: number): string {
  const sec = Math.max(0, Math.ceil((endAt - now) / 1000));
  return sec >= 60 ? `${Math.ceil(sec / 60)} min left` : `${sec} s left`;
}
