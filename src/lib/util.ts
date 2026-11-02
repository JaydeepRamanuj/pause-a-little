export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(arr: readonly T[]): T => arr[(Math.random() * arr.length) | 0];
export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Midi note number to frequency in Hz. */
export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export type RGB = [number, number, number];

export const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

export const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/** mm:ss, or h:mm:ss from one hour up. */
export function fmt(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Local calendar day, e.g. 2026-11-02. */
export const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');

/** Pull the 11-character id out of a YouTube link (or accept a bare id). */
export function ytId(u: string): string | null {
  const s = String(u || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
