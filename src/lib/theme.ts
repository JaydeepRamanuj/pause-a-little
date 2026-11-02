import type { Palette } from '../data/palettes';

// The two rooms had slightly different glass and ink tones. Both are kept, as two tone sets:
// focus palettes use the timer's tones, raag palettes use the raag room's.

const focusTone = (d: boolean) => ({
  ink: 'rgba(INK,.88)',
  inkSoft: 'rgba(INK,.58)',
  track: d ? 'rgba(INK,.16)' : 'rgba(INK,.10)',
  glass: d ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.30)',
  glassStrong: d ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.55)',
  glassBorder: d ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.55)',
  sheet: d ? 'rgba(22,20,34,.80)' : 'rgba(255,255,255,.72)',
});

const raagTone = (d: boolean) => ({
  ink: 'rgba(INK,.9)',
  inkSoft: 'rgba(INK,.6)',
  track: d ? 'rgba(INK,.16)' : 'rgba(INK,.13)',
  glass: d ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.34)',
  glassStrong: d ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.6)',
  glassBorder: d ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.6)',
  sheet: d ? 'rgba(28,20,30,.84)' : 'rgba(252,247,240,.82)',
});

/** Writes the palette into the CSS variables the whole interface reads. */
export function applyPaletteVars(p: Palette) {
  const tone = p.raag ? raagTone(p.dark) : focusTone(p.dark);
  const withInk = (v: string) => v.replace('INK', p.ink);
  const r = document.documentElement.style;
  r.setProperty('--ink', withInk(tone.ink));
  r.setProperty('--ink-soft', withInk(tone.inkSoft));
  r.setProperty('--track', withInk(tone.track));
  r.setProperty('--glass', tone.glass);
  r.setProperty('--glass-strong', tone.glassStrong);
  r.setProperty('--glass-border', tone.glassBorder);
  r.setProperty('--sheet', tone.sheet);
  r.setProperty('--bg', p.bg);
  r.setProperty('--accent', p.accent ?? `rgba(${p.ink},.88)`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg);
}
