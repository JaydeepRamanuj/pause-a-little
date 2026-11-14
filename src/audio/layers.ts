// The ambient layer mixer: rain, ocean, bells, pads and tanpura, each with its own volume.
// They play beside whatever else is sounding (ambient mood, raag, calm songs).
// Noise and pads are always built once and only their volume moves; bells and tanpura
// are played note by note while their layer is up.

import { LAYER_IDS, type LayerId, type LayerLevels } from '../app/layersMath';
import { mtof, pick, rand } from '../lib/util';
import { getCtx, impulse } from './context';

const FULL = 0.6; // a layer at full volume sits at this gain, so five together do not clip

class Layers {
  private built = false;
  private master!: GainNode;
  private bus!: GainNode;
  private verb!: ConvolverNode;
  private gains = {} as Record<LayerId, GainNode>;
  private levels = {} as Record<LayerId, number>;
  private nextBell = 0;
  private nextString = 0;
  private stringI = 0;
  playing = false;

  private init() {
    if (this.built) return;
    this.built = true;
    const c = getCtx();
    this.master = c.createGain(); this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    this.master.connect(comp).connect(c.destination);
    // a shared room for the bells and tanpura
    this.bus = c.createGain();
    this.verb = c.createConvolver(); this.verb.buffer = impulse(4, 2.4);
    const wet = c.createGain(); wet.gain.value = .5;
    this.bus.connect(this.verb).connect(wet).connect(this.master);
    for (const id of LAYER_IDS) { this.gains[id] = c.createGain(); this.gains[id].gain.value = 0; this.levels[id] = 0; }
    this.gains.bells.connect(this.bus); this.gains.bells.connect(this.master);
    this.gains.tanpura.connect(this.bus); this.gains.tanpura.connect(this.master);
    this.buildRain(c); this.buildOcean(c); this.buildPads(c);
    window.setInterval(() => this.tick(), 400);
  }

  private noise(c: AudioContext, brown: boolean) {
    const len = c.sampleRate * 6, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const x = Math.random() * 2 - 1; last = (last + .02 * x) / 1.02; d[i] = brown ? last * 3.5 : x; }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.start();
    return s;
  }

  private filter(c: AudioContext, type: BiquadFilterType, f: number) {
    const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; return x;
  }

  private buildRain(c: AudioContext) {
    const lp = this.filter(c, 'lowpass', 5200);
    this.noise(c, false).connect(this.filter(c, 'highpass', 700)).connect(lp).connect(this.gains.rain);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .06; lg.gain.value = 1300;
    lfo.connect(lg).connect(lp.frequency); lfo.start();
    // a low patter underneath
    const low = c.createGain(); low.gain.value = .8;
    this.noise(c, true).connect(this.filter(c, 'lowpass', 300)).connect(low).connect(this.gains.rain);
    this.gains.rain.connect(this.master);
  }

  private buildOcean(c: AudioContext) {
    const lp = this.filter(c, 'lowpass', 650), swell = c.createGain(); swell.gain.value = .6;
    this.noise(c, true).connect(lp).connect(swell).connect(this.gains.ocean);
    // the swell: the wave slowly rises and falls
    const lfo = c.createOscillator(); lfo.frequency.value = .085;
    const a = c.createGain(); a.gain.value = .4; lfo.connect(a).connect(swell.gain);
    const b = c.createGain(); b.gain.value = 450; lfo.connect(b).connect(lp.frequency);
    lfo.start();
    this.gains.ocean.connect(this.master);
  }

  private buildPads(c: AudioContext) {
    const lp = this.filter(c, 'lowpass', 900); lp.Q.value = .4;
    lp.connect(this.gains.pads);
    [[48, 'sine', .16], [55, 'triangle', .1], [64, 'sine', .08], [67, 'sine', .06]].forEach(([m, type, g], i) => {
      const env = c.createGain(); env.gain.value = g as number;
      const o = c.createOscillator(); o.type = type as OscillatorType; o.frequency.value = mtof(m as number); o.detune.value = i * 3 - 4;
      const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = .05 + i * .027; tg.gain.value = (g as number) * .5;
      trem.connect(tg).connect(env.gain);
      o.connect(env).connect(lp); o.start(); trem.start();
    });
    this.gains.pads.connect(this.master);
  }

  private partial(f: number, t: number, peak: number, attack: number, decay: number, type: OscillatorType, dest: AudioNode) {
    const c = getCtx(), env = c.createGain();
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(peak, t + attack);
    env.gain.exponentialRampToValueAtTime(.0001, t + attack + decay); env.connect(dest);
    const o = c.createOscillator(); o.type = type; o.frequency.value = f;
    o.connect(env); o.start(t); o.stop(t + attack + decay + .1);
  }

  private ramp(p: AudioParam, v: number, sec: number) {
    const n = getCtx().currentTime;
    p.cancelScheduledValues(n); p.setValueAtTime(p.value, n); p.linearRampToValueAtTime(v, n + sec);
  }

  private tick() {
    if (!this.playing) return;
    const c = getCtx();
    if (c.state !== 'running') return;
    const ahead = c.currentTime + 2;
    if (this.levels.bells > 0) while (this.nextBell < ahead) {
      const t = Math.max(this.nextBell, c.currentTime), f = mtof(pick([72, 74, 76, 79, 81, 84]));
      [[1, 1, 9], [2.76, .35, 5], [5.4, .12, 3]].forEach(([r, a, d]) => this.partial(f * r, t, .18 * a, .02, d, 'sine', this.gains.bells));
      this.nextBell = t + rand(5, 12);
    }
    if (this.levels.tanpura > 0) while (this.nextString < ahead) {
      const t = Math.max(this.nextString, c.currentTime), m = [43, 50, 50, 38][this.stringI++ % 4];
      this.partial(mtof(m), t, .2, .01, 4.5, 'triangle', this.gains.tanpura);
      this.partial(mtof(m) * 2, t, .05, .01, 2.5, 'sine', this.gains.tanpura);
      this.nextString = t + 1.45;
    }
  }

  /** Bring the layers up to their levels. `scale` is a little lower for breaks. */
  play(levels: LayerLevels, scale = 1) {
    if (!LAYER_IDS.some(id => levels[id] > 0)) { if (this.built) this.stop(1); return; }
    this.init();
    const c = getCtx();
    if (c.state !== 'running') c.resume();
    this.playing = true;
    this.nextBell = c.currentTime + 1.5; this.nextString = c.currentTime + .3;
    this.set(levels, scale, 1.5);
    this.ramp(this.master.gain, 1, 1.5);
  }

  /** Move the volumes while playing. */
  set(levels: LayerLevels, scale = 1, sec = .2) {
    if (!this.built) return;
    for (const id of LAYER_IDS) {
      this.levels[id] = levels[id] * scale;
      this.ramp(this.gains[id].gain, levels[id] * scale * FULL, sec);
    }
  }

  stop(fade = .8) {
    if (!this.built) return;
    this.playing = false;
    this.ramp(this.master.gain, 0, fade);
  }
}

export const layers = new Layers();
