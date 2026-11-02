import type { Analysis } from '../audio/music';
import { rand, rgba, type RGB } from '../lib/util';

// The visuals for Calm songs. Ripples follow the beat; Particles drift with the bass and bloom
// on the beat. Without a readable signal (YouTube plays in its own frame) a steady stand-in
// beat keeps them moving.

export type CalmVisualId =
  | 'ripples' | 'ripples-filled' | 'ripples-scatter' | 'ripples-fine'
  | 'drift' | 'drift-fine' | 'drift-glow' | 'drift-rise'
  | 'bokeh' | 'sparks';

export const CALM_VISUALS: { id: CalmVisualId; name: string; family: 'Ripples' | 'Particles' }[] = [
  { id: 'ripples', name: 'Classic', family: 'Ripples' },
  { id: 'ripples-filled', name: 'Filled', family: 'Ripples' },
  { id: 'ripples-scatter', name: 'Scatter', family: 'Ripples' },
  { id: 'ripples-fine', name: 'Fine', family: 'Ripples' },
  { id: 'drift', name: 'Drift', family: 'Particles' },
  { id: 'drift-fine', name: 'Dust', family: 'Particles' },
  { id: 'drift-glow', name: 'Glow', family: 'Particles' },
  { id: 'drift-rise', name: 'Rise', family: 'Particles' },
  { id: 'bokeh', name: 'Bokeh', family: 'Particles' },
  { id: 'sparks', name: 'Sparks', family: 'Particles' },
];

interface Ripple { x: number; y: number; t0: number; c: RGB; scale: number }
interface Particle { x: number; y: number; r: number; vy: number; sway: number; ph: number; c: RGB }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; c: RGB }

/** Draws one Calm songs visual on the effects canvas. */
export class CalmArt {
  private ripples: Ripple[] = [];
  private ripplesFor: CalmVisualId | null = null;
  private particles: Particle[] = [];
  private particlesFor: CalmVisualId | null = null;
  private sparks: Spark[] = [];
  private prevBeat = 0;
  private amt = 0; // how much of the visual is showing, 0 to 1

  draw(
    f: CanvasRenderingContext2D, W: number, H: number, dpr: number,
    t: number, dt: number, on: boolean, colors: RGB[],
    variant: CalmVisualId, analysis: Analysis | null, playing: boolean,
  ) {
    this.amt += ((on ? 1 : 0) - this.amt) * (1 - Math.exp(-dt / 1.5));
    if (this.amt < 0.02) return;

    // the beat: the music's own when it can be read, otherwise a steady stand-in
    const live = !!analysis && analysis.live;
    const beat = live ? analysis!.beat : playing ? fakeBeat(t) : 0;
    const rising = beat > 0.85 && this.prevBeat <= 0.85;
    this.prevBeat = beat;

    f.save();
    f.globalAlpha = this.amt;
    if (variant.startsWith('ripples')) this.ripplesFx(f, W, H, dpr, t, rising, colors, variant);
    else this.particlesFx(f, W, H, dpr, t, dt, beat, rising, colors, variant);
    f.restore();
  }

  // ---------- Ripples: a ring spreads on every beat ----------

  private ripplesFx(f: CanvasRenderingContext2D, W: number, H: number, dpr: number, t: number, rising: boolean, colors: RGB[], variant: CalmVisualId) {
    if (variant !== this.ripplesFor) {
      this.ripples = [];
      this.ripplesFor = variant;
    }
    if (rising) {
      const scatter = variant === 'ripples-scatter';
      const x = scatter ? rand(0.15, 0.85) * W : W / 2;
      const y = scatter ? rand(0.2, 0.8) * H : H / 2;
      const copies = variant === 'ripples-fine' ? 4 : scatter ? 2 : 1;
      const c = colors[this.ripples.length % colors.length];
      for (let k = 0; k < copies; k++) {
        this.ripples.push({ x, y, t0: t + k * (variant === 'ripples-fine' ? 0.25 : 0.45), c, scale: scatter ? 0.35 : 0.8 });
      }
      if (this.ripples.length > 60) this.ripples.splice(0, this.ripples.length - 60);
    }
    const life = 3.6;
    const maxR = Math.min(W, H) * 0.7;
    this.ripples = this.ripples.filter(r => t - r.t0 < life);
    for (const r of this.ripples) {
      const age = (t - r.t0) / life;
      if (age < 0) continue;
      const R = maxR * r.scale * (0.2 + 0.8 * (1 - Math.pow(1 - age, 2)));
      const alpha = (1 - age) * 0.85;
      f.beginPath();
      f.arc(r.x, r.y, R, 0, 6.283);
      if (variant === 'ripples-filled') {
        f.fillStyle = rgba(r.c, alpha * 0.22);
        f.fill();
      }
      f.strokeStyle = rgba(r.c, alpha);
      f.lineWidth = (variant === 'ripples-fine' ? 1 : 2.5) * dpr;
      f.stroke();
    }
  }

  // ---------- Particles: drift with the bass, bloom on the beat ----------

  private particlesFx(f: CanvasRenderingContext2D, W: number, H: number, dpr: number, t: number, dt: number, beat: number, rising: boolean, colors: RGB[], variant: CalmVisualId) {
    if (variant !== this.particlesFor) {
      this.particlesFor = variant;
      const counts: Partial<Record<CalmVisualId, number>> = { drift: 70, 'drift-fine': 180, 'drift-glow': 26, 'drift-rise': 90, bokeh: 16 };
      const n = counts[variant] ?? 0;
      const bokeh = variant === 'bokeh';
      this.particles = Array.from({ length: n }, (_, i) => ({
        x: rand(0, W),
        y: rand(0, H),
        r: bokeh ? rand(0.1, 0.2) * Math.min(W, H)
          : variant === 'drift-fine' ? rand(0.6, 1.4) * dpr
          : variant === 'drift-glow' ? rand(4, 8) * dpr
          : rand(1, 3) * dpr,
        vy: rand(0.4, 1.2) * dpr * (bokeh ? 0.25 : 1),
        sway: rand(0.2, 0.6),
        ph: rand(0, 6.28),
        c: colors[i % colors.length],
      }));
      this.sparks = [];
    }
    if (variant === 'bokeh') {
      for (const p of this.particles) {
        const r = p.r * (1 + 0.14 * beat);
        const gr = f.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        gr.addColorStop(0, rgba(p.c, 0.42));
        gr.addColorStop(0.6, rgba(p.c, 0.18));
        gr.addColorStop(1, rgba(p.c, 0));
        f.fillStyle = gr;
        f.beginPath(); f.arc(p.x, p.y, r, 0, 6.283); f.fill();
        p.x += Math.sin(t * p.sway + p.ph) * 6 * dpr * dt;
        p.y -= p.vy * 4 * dt;
        if (p.y < -r) p.y = H + r;
      }
    } else if (variant === 'sparks') {
      if (rising) {
        for (let k = 0; k < 18; k++) {
          const ang = rand(0, 6.283), sp = rand(140, 360) * dpr;
          this.sparks.push({ x: W / 2, y: H / 2, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, c: colors[k % colors.length] });
        }
      }
      this.sparks = this.sparks.filter(s => s.life > 0);
      for (const s of this.sparks) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 0.7;
        f.fillStyle = rgba(s.c, Math.max(0, Math.min(1, s.life)));
        f.beginPath(); f.arc(s.x, s.y, (3 * s.life + 1) * dpr, 0, 6.283); f.fill();
      }
    } else {
      // the drifting family: each variant sets how the dots move and glow
      const glow = variant === 'drift-glow';
      const rise = variant === 'drift-rise';
      const speed = rise ? 90 : 30;
      for (const p of this.particles) {
        const bass = 0.35 + beat * 0.5;
        p.y -= p.vy * (speed + bass * 120) * dt;
        if (p.y < -10) { p.y = H + 10; p.x = rand(0, W); }
        const x = p.x + Math.sin(t * p.sway + p.ph) * (rise ? 6 : 14) * dpr;
        const r = p.r * (1 + beat * 0.8);
        if (glow) {
          const gr = f.createRadialGradient(x, p.y, 0, x, p.y, r * 3);
          gr.addColorStop(0, rgba(p.c, 0.6));
          gr.addColorStop(1, rgba(p.c, 0));
          f.fillStyle = gr;
          f.beginPath(); f.arc(x, p.y, r * 3, 0, 6.283); f.fill();
        } else {
          f.fillStyle = rgba(p.c, 0.6);
          f.beginPath(); f.arc(x, p.y, r, 0, 6.283); f.fill();
        }
      }
    }
  }
}

/** A stand-in beat for when the music can't be read: a soft pulse every 1.6 seconds. */
function fakeBeat(t: number) {
  return Math.exp(-(t % 1.6) * 6);
}
