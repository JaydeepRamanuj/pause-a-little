// Four mandala designs for the raag palettes. Each is an SVG drawn with
// `currentColor`, so the palette's accent colour shows through. The animation
// classes (m-spin-a, m-breathe, m-shimmer, m-draw, m-pulse) are defined in index.css.
// The markup is built from constants only, so injecting it as HTML is safe.

export const MANDALA_IDS = ['lotus', 'yantra', 'peacock', 'rangoli', 'chakra', 'flower', 'kolam', 'sun'] as const;
export type MandalaId = (typeof MANDALA_IDS)[number];

export const MANDALA_NAMES: Record<MandalaId, string> = {
  lotus: 'Lotus',
  yantra: 'Yantra',
  peacock: 'Peacock',
  rangoli: 'Rangoli',
  chakra: 'Chakra',
  flower: 'Flower',
  kolam: 'Kolam',
  sun: 'Sun',
};

const C = 500;
const f = (n: number) => n.toFixed(1);

/** A petal pointing up from radius r0 to r1, half-width w. */
function petal(r0: number, r1: number, w: number) {
  const m = (r0 + r1) / 2;
  return `M${C} ${f(C - r0)} Q${f(C + w)} ${f(C - m)} ${C} ${f(C - r1)} Q${f(C - w)} ${f(C - m)} ${C} ${f(C - r0)}Z`;
}

/** n copies of `draw`, each turned evenly around the centre. */
function ring(n: number, draw: (i: number) => string, offset = 0) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<g transform="rotate(${f(offset + (360 / n) * i)} ${C} ${C})">${draw(i)}</g>`;
  return s;
}

/** Dots on a circle of radius r. */
function dots(r: number, n: number, size: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    s += `<circle cx="${f(C + r * Math.sin(a))}" cy="${f(C - r * Math.cos(a))}" r="${size}" fill="currentColor" stroke="none"/>`;
  }
  return s;
}

const svg = (body: string) =>
  `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="1.1" class="h-full w-full overflow-visible">${body}</svg>`;

// 1. Lotus: two rings of petals, the outer turning one way, the inner the other.
const lotus = () => svg(
  `<g class="m-spin-b">${ring(16, i => `<path class="m-breathe" style="animation-delay:${-i * 0.4}s" d="${petal(330, 470, 44)}"/>`)}</g>` +
  `<g class="m-spin-a">${ring(8, i => `<path class="m-breathe" style="animation-delay:${-i * 0.7}s" d="${petal(110, 300, 62)}"/>`, 22.5)}</g>` +
  `<circle cx="500" cy="500" r="110"/><circle cx="500" cy="500" r="96"/>` +
  `<g class="m-spin-a">${dots(190, 24, 2.4)}</g>` +
  `<circle class="m-pulse" cx="500" cy="500" r="16" fill="currentColor" stroke="none"/>`,
);

// 2. Yantra: interlocking triangles, alternately up and down, turning in turn.
const triangle = (R: number, down: boolean) => {
  const y = down ? -1 : 1;
  const pts = [
    [C, C - R * y],
    [C + R * 0.866, C + R * 0.5 * y],
    [C - R * 0.866, C + R * 0.5 * y],
  ].map(([x, yy]) => `${f(x)},${f(yy)}`).join(' ');
  return `<polygon points="${pts}" fill="currentColor" fill-opacity=".04"/>`;
};
const yantra = () => svg(
  [400, 320, 240, 165, 100].map((R, k) =>
    `<g class="${k % 2 ? 'm-spin-b' : 'm-spin-a'}">${triangle(R, k % 2 === 1)}</g>`,
  ).join('') +
  `<circle cx="500" cy="500" r="430"/>` +
  `<g class="m-spin-b">${ring(16, () => `<circle class="m-pulse" cx="500" cy="70" r="5" fill="currentColor" stroke="none"/>`)}</g>` +
  `<circle class="m-pulse" cx="500" cy="500" r="12" fill="currentColor" stroke="none"/>`,
);

// 3. Peacock: long feathers, each ending in an eye that shimmers in turn.
const eye = (i: number) =>
  `<g class="m-shimmer" style="animation-delay:${-i * 0.5}s">` +
  `<circle cx="500" cy="90" r="34"/><circle cx="500" cy="90" r="18" fill="currentColor" stroke="none"/></g>`;
const peacock = () => svg(
  `<g class="m-spin-a">${ring(12, i => `<path d="M500 380 Q580 180 500 10 Q420 180 500 380Z"/>` + eye(i), 0)}</g>` +
  `<g class="m-spin-b">${ring(12, () => `<path d="${petal(330, 430, 14)}"/>`, 15)}</g>` +
  `<circle cx="500" cy="500" r="300"/><circle cx="500" cy="500" r="250"/>` +
  `<g class="m-spin-b">${dots(275, 36, 2)}</g>` +
  `<circle class="m-pulse" cx="500" cy="500" r="24" fill="currentColor" stroke="none"/>`,
);

// 4. Rangoli: dot grids joined by star patterns that draw themselves in turn.
const RINGS: [number, number][] = [[60, 8], [120, 12], [180, 16], [240, 24], [300, 32], [360, 40], [420, 48]];
const rangoli = () => {
  let s = '';
  RINGS.forEach(([r, n], k) => {
    // a star: each dot joined to the dot a third of the way round
    const step = Math.round(n / 3);
    const at = (i: number) => {
      const a = (Math.PI * 2 * i) / n;
      return `${f(C + r * Math.sin(a))} ${f(C - r * Math.cos(a))}`;
    };
    let d = '';
    for (let i = 0; i < n; i++) d += `${i ? 'L' : 'M'}${at((i * step) % n)} `;
    s += `<path class="m-draw" pathLength="1" style="animation-delay:${-k * 1.4}s" d="${d}Z"/>`;
    s += dots(r, n, 2.6);
  });
  s += `<g class="m-spin-a">${ring(8, i => `<path class="m-breathe" style="animation-delay:${-i * 0.6}s" d="${petal(40, 150, 26)}"/>`)}</g>`;
  return svg(s);
};


// 5. Chakra: a dharma wheel. Twenty-four spokes and beads turn one way, the hub the other.
const chakra = () => {
  let spokes = '';
  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * 2 * i) / 24;
    spokes += `<line x1="${f(C + 95 * Math.sin(a))}" y1="${f(C - 95 * Math.cos(a))}" x2="${f(C + 430 * Math.sin(a))}" y2="${f(C - 430 * Math.cos(a))}"/>`;
  }
  return svg(
    `<circle cx="500" cy="500" r="470"/><circle cx="500" cy="500" r="445"/>` +
    `<g class="m-spin-a">${spokes}${dots(458, 24, 4)}</g>` +
    `<g class="m-spin-b">${ring(8, i => `<circle class="m-breathe" style="animation-delay:${-i * 0.6}s" cx="500" cy="235" r="26"/>`)}</g>` +
    `<circle cx="500" cy="500" r="95"/><circle cx="500" cy="500" r="70"/>` +
    `<circle class="m-pulse" cx="500" cy="500" r="26" fill="currentColor" stroke="none"/>`,
  );
};

// 6. Flower: overlapping circles, the classic seed-of-life pattern, in two turning rings.
const flower = () => {
  const circles = (cls: string, offset: number) => ring(6, i =>
    `<circle class="${cls}" style="animation-delay:${-i * 0.8}s" cx="500" cy="${f(500 - 150)}" r="150"/>`, offset);
  return svg(
    `<g class="m-spin-a">${circles('m-breathe', 0)}</g>` +
    `<g class="m-spin-b">${circles('m-breathe', 30)}</g>` +
    `<circle cx="500" cy="500" r="300"/><circle cx="500" cy="500" r="470"/>` +
    `<g class="m-spin-a">${dots(470, 36, 2.2)}</g>` +
    `<circle class="m-pulse" cx="500" cy="500" r="14" fill="currentColor" stroke="none"/>`,
  );
};

// 7. Kolam: a dot grid joined by looping curves, drawn one by one, as a kolam is drawn on the floor.
const kolam = () => {
  const G = 7, step = 120, start = 500 - ((G - 1) / 2) * step;
  let dotsSvg = '', curves = '';
  let k = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    dotsSvg += `<circle cx="${start + i * step}" cy="${start + j * step}" r="3.5" fill="currentColor" stroke="none"/>`;
  }
  for (let i = 0; i < G - 1; i++) for (let j = 0; j < G - 1; j++) {
    const x0 = start + i * step, y0 = start + j * step, x1 = x0 + step, y1 = y0 + step;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, off = 34;
    // two swooping curves per cell, bowing in opposite directions
    curves += `<path class="m-draw" pathLength="1" style="animation-delay:${-(k++) * 0.45}s" d="M${x0} ${y0} Q${f(mx + off)} ${f(my - off)} ${x1} ${y1}"/>`;
    curves += `<path class="m-draw" pathLength="1" style="animation-delay:${-(k++) * 0.45}s" d="M${x1} ${y0} Q${f(mx - off)} ${f(my - off)} ${x0} ${y1}"/>`;
  }
  return svg(dotsSvg + curves + `<circle cx="500" cy="500" r="430" class="m-pulse" stroke-dasharray="2 10"/>`);
};

// 8. Sun: a ring of triangular rays, a turning wheel of petals and a pulsing core.
const sun = () => {
  const ray = () => `<path d="M500 ${f(500 - 300)} L${f(500 + 22)} ${f(500 - 470)} L${f(500 - 22)} ${f(500 - 470)}Z" fill="currentColor" fill-opacity=".08"/>`;
  return svg(
    `<g class="m-spin-a">${ring(24, () => ray())}</g>` +
    `<circle cx="500" cy="500" r="300"/><circle cx="500" cy="500" r="270"/>` +
    `<g class="m-spin-b">${ring(16, i => `<path class="m-breathe" style="animation-delay:${-i * 0.5}s" d="${petal(120, 250, 34)}"/>`)}</g>` +
    `<circle cx="500" cy="500" r="110"/>` +
    `<circle class="m-pulse" cx="500" cy="500" r="46" fill="currentColor" fill-opacity=".15"/>`,
  );
};

const BUILD: Record<MandalaId, () => string> = { lotus, yantra, peacock, rangoli, chakra, flower, kolam, sun };
const CACHE = new Map<MandalaId, string>();

export function mandalaSvg(id: MandalaId): string {
  let s = CACHE.get(id);
  if (!s) {
    s = BUILD[id]();
    CACHE.set(id, s);
  }
  return s;
}
