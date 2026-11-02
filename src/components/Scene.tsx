import { useEffect, useRef } from 'react';
import { analyseFrame, level as musicLevel } from '../audio/music';
import { CalmArt, type CalmVisualId } from './calmArt';
import type { ShapeStyle } from '../lib/store';
import type { Palette } from '../data/palettes';
import { hex, rand, rgba } from '../lib/util';
import type { RGB } from '../lib/util';
import { mandalaSvg, type MandalaId } from './mandalas';

// The living background: slow colour blobs, plus (for the raag palettes) a diya glow,
// and stars and a shooting star at night.

interface Target {
  bg: RGB;
  accent: RGB;
  colors: RGB[];
  stars: number; // 0..1, how starry the sky is
  fx: number;    // 0..1, how much of the raag ornament is shown
}

const toTarget = (p: Palette): Target => ({
  bg: hex(p.bg),
  accent: p.accent ? hex(p.accent) : [59, 47, 63],
  colors: p.colors.map(hex),
  stars: p.raag && p.dark ? 1 : 0,
  fx: p.raag ? 1 : 0,
});

const cloneTarget = (t: Target): Target => ({
  bg: [...t.bg] as RGB,
  accent: [...t.accent] as RGB,
  colors: t.colors.map(c => [...c] as RGB),
  stars: t.stars,
  fx: t.fx,
});

interface Star { x: number; y: number; r: number; a: number; tw: number; ph: number }
interface Shoot { x: number; y: number; vx: number; vy: number; life: number; dur: number }

export function Scene({ palette, mandala, mandalaOn, beatOn, shapesOn, shapeStyle, calmOn, calmVisual }: {
  palette: Palette; mandala: MandalaId; mandalaOn: boolean; beatOn: boolean; shapesOn: boolean; shapeStyle: ShapeStyle;
  calmOn: boolean; calmVisual: CalmVisualId;
}) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const target = useRef<Target>(toTarget(palette));
  const beatRef = useRef(beatOn);
  const shapesRef = useRef(shapesOn);
  const styleRef = useRef(shapeStyle);
  const calmRef = useRef(calmOn);
  const calmVisualRef = useRef(calmVisual);
  const calmArt = useRef(new CalmArt());

  useEffect(() => {
    target.current = toTarget(palette);
  }, [palette]);

  useEffect(() => {
    beatRef.current = beatOn;
  }, [beatOn]);

  useEffect(() => {
    shapesRef.current = shapesOn;
  }, [shapesOn]);

  useEffect(() => {
    styleRef.current = shapeStyle;
  }, [shapeStyle]);

  useEffect(() => {
    calmRef.current = calmOn;
  }, [calmOn]);

  useEffect(() => {
    calmVisualRef.current = calmVisual;
  }, [calmVisual]);

  useEffect(() => {
    const bg = bgRef.current!, fx = fxRef.current!;
    const g = bg.getContext('2d', { alpha: false })!;
    const f = fx.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cur = cloneTarget(target.current);

    let W = 0, H = 0, FW = 0, FH = 0, dpr = 1;
    let stars: Star[] = [];
    const resize = () => {
      W = bg.width = Math.max(40, Math.ceil(innerWidth / 6));
      H = bg.height = Math.max(40, Math.ceil(innerHeight / 6));
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      FW = fx.width = Math.ceil(innerWidth * dpr);
      FH = fx.height = Math.ceil(innerHeight * dpr);
      const n = Math.round(Math.min(170, (innerWidth * innerHeight) / 9000));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * FW, y: Math.random() * FH * 0.78,
        r: rand(0.4, 1.25) * dpr, a: rand(0.25, 0.85), tw: rand(0.3, 1.2), ph: rand(0, 6.28),
      }));
    };
    resize();
    addEventListener('resize', resize);

    const blobs = Array.from({ length: 7 }, (_, i) => ({
      c: i % 5, sx: rand(0.55, 1.25), sy: rand(0.55, 1.25),
      px: rand(0, 6.28), py: rand(0, 6.28), pr: rand(0, 6.28),
      ax: rand(0.3, 0.44), ay: rand(0.3, 0.44), r: rand(0.36, 0.56),
    }));

    let tB = rand(0, 100), clock = 0, last = performance.now(), level = 0;
    let shoot: Shoot | null = null, nextShoot = rand(8, 20);
    let raf = 0;

    const lerp = (dt: number) => {
      const t = target.current;
      // the raag palettes settle slowly, the focus palettes quickly
      const k = t.fx > 0.5 ? 1 - Math.exp(-dt / 18) : 1 - Math.pow(0.3, dt);
      for (let j = 0; j < 3; j++) {
        cur.bg[j] += (t.bg[j] - cur.bg[j]) * k;
        cur.accent[j] += (t.accent[j] - cur.accent[j]) * k;
      }
      cur.colors.forEach((c, i) => { for (let j = 0; j < 3; j++) c[j] += (t.colors[i][j] - c[j]) * k; });
      cur.stars += (t.stars - cur.stars) * k;
      cur.fx += (t.fx - cur.fx) * k;
    };

    const drawBg = (beat: number) => {
      g.fillStyle = rgba(cur.bg, 1);
      g.fillRect(0, 0, W, H);
      const M = Math.max(W, H), t = tB;
      for (const b of blobs) {
        const x = W * (0.5 + b.ax * Math.sin(t * b.sx + b.px) + 0.08 * Math.sin(t * b.sx * 2.3 + b.py));
        const y = H * (0.5 + b.ay * Math.cos(t * b.sy + b.py) + 0.08 * Math.cos(t * b.sy * 1.9 + b.px));
        // on the beat the colours swell and brighten
        const r = M * (b.r + 0.08 * Math.sin(t * 0.9 + b.pr)) * (1 + 0.22 * beat);
        const c = cur.colors[b.c];
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, rgba(c, Math.min(1, 0.85 + 0.15 * beat))); gr.addColorStop(0.5, rgba(c, 0.35 + 0.2 * beat)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
      }
    };

    const drawFx = (dt: number) => {
      f.clearRect(0, 0, FW, FH);
      const t = clock, A = cur.accent;
      if (cur.stars > 0.02) {
        for (const s of stars) {
          const a = cur.stars * s.a * (0.55 + 0.45 * Math.sin(t * s.tw + s.ph));
          f.fillStyle = `rgba(255,246,230,${a})`;
          f.beginPath(); f.arc(s.x, s.y, s.r, 0, 6.283); f.fill();
        }
        nextShoot -= dt;
        if (!shoot && nextShoot <= 0 && cur.stars > 0.6 && !reduce) {
          const ang = rand(0.32, 0.6), sp = rand(0.55, 0.8) * Math.max(FW, FH);
          shoot = { x: rand(0.08, 0.7) * FW, y: rand(0.04, 0.32) * FH, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, dur: rand(1, 1.6) };
          nextShoot = rand(22, 60);
        }
        if (shoot) {
          shoot.life += dt;
          const u = shoot.life / shoot.dur;
          if (u >= 1) shoot = null;
          else {
            const hx = shoot.x + shoot.vx * shoot.life, hy = shoot.y + shoot.vy * shoot.life;
            const len = 150 * dpr, m = Math.hypot(shoot.vx, shoot.vy);
            const tx = hx - (shoot.vx / m) * len, ty = hy - (shoot.vy / m) * len;
            const a = Math.sin(Math.PI * u) * cur.stars;
            const gr = f.createLinearGradient(tx, ty, hx, hy);
            gr.addColorStop(0, 'rgba(255,240,215,0)');
            gr.addColorStop(1, `rgba(255,244,225,${0.85 * a})`);
            f.strokeStyle = gr; f.lineWidth = 1.4 * dpr; f.lineCap = 'round';
            f.beginPath(); f.moveTo(tx, ty); f.lineTo(hx, hy); f.stroke();
            f.fillStyle = `rgba(255,248,235,${a})`;
            f.beginPath(); f.arc(hx, hy, 1.6 * dpr, 0, 6.283); f.fill();
          }
        }
      }
      if (cur.fx < 0.02) return;
      // diya glow, low at the bottom centre
      const flick = 0.5 * Math.sin(t * 2.3) + 0.3 * Math.sin(t * 5.1 + 1) + 0.2 * Math.sin(t * 8.7 + 2);
      const ga = ((cur.stars > 0.5 ? 0.2 : 0.13) + flick * 0.02 + level * 0.05) * cur.fx;
      const gx = FW / 2, gy = FH * 1.04, gr = Math.max(FW, FH) * (0.42 + flick * 0.006);
      const dg = f.createRadialGradient(gx, gy, 0, gx, gy, gr);
      dg.addColorStop(0, rgba(A, ga)); dg.addColorStop(0.45, rgba(A, ga * 0.4)); dg.addColorStop(1, rgba(A, 0));
      f.fillStyle = dg; f.fillRect(0, 0, FW, FH);
    };

    // Calm songs: abstract shapes that drift and swell with the beat
    // four kinds of art, each a set of shapes drawn in its own way
    type Kind = 'ring' | 'disc' | 'arc' | 'tri' | 'wave';
    const KINDS_BY_STYLE: Record<ShapeStyle, Kind[]> = {
      orbs: ['disc', 'ring'],
      arcs: ['arc', 'ring'],
      waves: ['wave'],
      prisms: ['tri'],
    };
    const buildShapes = (style: ShapeStyle) => {
      const kinds = KINDS_BY_STYLE[style];
      return Array.from({ length: 9 }, (_, i) => ({
        kind: kinds[i % kinds.length],
        x: rand(0.12, 0.88), y: rand(0.12, 0.88), r: rand(0.05, 0.14),
        sp: rand(0.05, 0.12), ph: rand(0, 6.28), c: i % 5, rot: rand(0, 6.28),
      }));
    };
    let shapes = buildShapes(styleRef.current);
    let builtStyle = styleRef.current;
    let shapesAmt = 0;

    const drawShapes = (t: number, beat: number, dt: number) => {
      if (styleRef.current !== builtStyle) {
        builtStyle = styleRef.current;
        shapes = buildShapes(builtStyle);
      }
      const target = shapesRef.current ? 1 : 0;
      shapesAmt += (target - shapesAmt) * (1 - Math.exp(-dt / 2));
      if (shapesAmt < 0.02) return;
      const a = shapesAmt;
      f.lineWidth = 1.2 * dpr;
      for (const sh of shapes) {
        const x = FW * (sh.x + 0.03 * Math.sin(t * sh.sp + sh.ph));
        const y = FH * (sh.y + 0.03 * Math.cos(t * sh.sp * 0.8 + sh.ph));
        const R = Math.min(FW, FH) * sh.r * (1 + 0.25 * beat);
        const col = cur.colors[sh.c];
        f.strokeStyle = rgba(col, 0.8 * a);
        f.fillStyle = rgba(col, 0.3 * a);
        f.beginPath();
        if (sh.kind === 'ring') {
          f.arc(x, y, R, 0, 6.283);
          f.stroke();
        } else if (sh.kind === 'disc') {
          f.arc(x, y, R, 0, 6.283);
          f.fill();
        } else if (sh.kind === 'arc') {
          const a0 = sh.rot + t * 0.2;
          f.arc(x, y, R, a0, a0 + Math.PI);
          f.stroke();
        } else if (sh.kind === 'tri') {
          const a0 = sh.rot + t * 0.15;
          for (let k = 0; k < 3; k++) {
            const ang = a0 + (k * 2 * Math.PI) / 3;
            const px = x + R * Math.sin(ang), py = y - R * Math.cos(ang);
            if (k === 0) f.moveTo(px, py); else f.lineTo(px, py);
          }
          f.closePath();
          f.stroke();
        } else {
          for (let i = 0; i <= 40; i++) {
            const u = i / 40;
            const px = x - R * 2 + u * R * 4;
            const py = y + Math.sin(u * 9.42 + t + sh.ph) * R * 0.3;
            if (i === 0) f.moveTo(px, py); else f.lineTo(px, py);
          }
          f.stroke();
        }
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      clock += dt;
      const raag = target.current.fx > 0.5;
      tB += dt * (reduce ? (raag ? 0.012 : 0.03) : (raag ? 0.03 : 0.1));
      lerp(dt);
      level += (musicLevel() - level) * (1 - Math.exp(-dt * 3));
      // the music is read once a frame, for the background and the Calm songs visuals
      const analysis = beatRef.current || calmRef.current ? analyseFrame(dt, now) : null;
      const beat = analysis?.beat ?? 0;
      drawBg(beat);
      drawFx(dt);
      drawShapes(clock, beat, dt);
      calmArt.current.draw(
        f, FW, FH, dpr, clock, dt, calmRef.current, cur.colors,
        calmVisualRef.current, analysis, beatRef.current,
      );
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas ref={bgRef} aria-hidden="true" className="fixed inset-0 z-0 block h-full w-full" />
      <div aria-hidden="true" className="grain pointer-events-none fixed -inset-1/2 z-[1] opacity-[.09] mix-blend-overlay" />
      <Mandala on={mandalaOn} dark={palette.dark} id={mandala} />
      <canvas ref={fxRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2] block h-full w-full" />
    </>
  );
}

// ---------- the mandala (over any colour, when switched on) ----------

function Mandala({ on, dark, id }: { on: boolean; dark: boolean; id: MandalaId }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 top-[46%] z-[1] aspect-square w-[min(96vmin,820px)] -translate-x-1/2 -translate-y-1/2"
      style={{
        color: 'var(--accent)',
        opacity: on ? (dark ? 0.12 : 0.14) : 0,
        transition: 'color 6s var(--ease-soft), opacity 6s var(--ease-soft)',
      }}
      dangerouslySetInnerHTML={{ __html: mandalaSvg(id) }}
    />
  );
}
