// The softer look used on breaks: the current palette eased toward a calm sage-teal.

import type { Palette } from '../data/palettes';
import type { RGB } from './util';
import { hex } from './util';

const toHex = (c: RGB) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Blend a colour toward another by `t` (0 = unchanged, 1 = the target). */
export function mixHex(a: string, b: string, t: number): string {
  const x = hex(a), y = hex(b);
  return toHex([0, 1, 2].map(i => x[i] + (y[i] - x[i]) * t) as RGB);
}

export function breakPalette(p: Palette): Palette {
  const target = p.dark ? '#16403c' : '#d6efe3';
  return {
    ...p,
    id: p.id + '-break',
    bg: mixHex(p.bg, target, 0.35),
    colors: p.colors.map(c => mixHex(c, target, 0.55)),
    accent: p.dark ? '#8fd1bd' : '#4f9a86',
  };
}
