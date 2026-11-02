// Generative ambient engine: soft pads, bells, and rain/ocean/air textures.
// Composed live from the mood definitions, so it never repeats. Ported from the timer room.

import type { Mood } from '../data/moods';
import { moodById } from '../data/moods';
import { mtof, pick, rand } from '../lib/util';
import { getCtx, impulse } from './context';

interface Layer {
  mood: Mood;
  sources: AudioScheduledSourceNode[];
  dryF: GainNode;
  wetF: GainNode;
  pad: GainNode;
  bell: GainNode;
  nextChord: number;
  ci: number;
  chordLog: { t: number; notes: number[] }[];
  bellNext: number[];
  arpNext: number;
  arpI: number;
}

class Ambient {
  private built = false;
  private comp!: DynamicsCompressorNode;
  private master!: GainNode;
  private reverb!: ConvolverNode;
  private dry!: GainNode;
  private chimeBus!: GainNode;
  private white!: AudioBuffer;
  private brown!: AudioBuffer;
  private ir!: AudioBuffer;
  private layer: Layer | null = null;
  private tok = 0;
  private mood: Mood = moodById('drift');
  playing = false;

  private init() {
    if (this.built) return;
    this.built = true;
    const c = getCtx();
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -20; this.comp.ratio.value = 3; this.comp.knee.value = 12;
    this.comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = 0; this.master.connect(this.comp);
    this.ir = impulse(5.5, 2.6);
    this.reverb = c.createConvolver(); this.reverb.buffer = this.ir;
    const wet = c.createGain(); wet.gain.value = .6;
    this.reverb.connect(wet).connect(this.master);
    this.dry = c.createGain(); this.dry.gain.value = .55; this.dry.connect(this.master);
    const len = c.sampleRate * 6;
    this.white = c.createBuffer(1, len, c.sampleRate);
    this.brown = c.createBuffer(1, len, c.sampleRate);
    const w = this.white.getChannelData(0), b = this.brown.getChannelData(0);
    let lastN = 0;
    for (let i = 0; i < len; i++) { const x = Math.random() * 2 - 1; w[i] = x; lastN = (lastN + .02 * x) / 1.02; b[i] = lastN * 3.5; }
    this.chimeBus = c.createGain(); this.chimeBus.gain.value = .5;
    const cvb = c.createConvolver(); cvb.buffer = this.ir;
    const cw = c.createGain(); cw.gain.value = .5;
    this.chimeBus.connect(this.comp); this.chimeBus.connect(cvb); cvb.connect(cw).connect(this.comp);
    window.setInterval(() => this.tick(), 400);
  }

  private ramp(param: AudioParam, v: number, sec: number) {
    const n = getCtx().currentTime;
    param.cancelScheduledValues(n); param.setValueAtTime(param.value, n); param.linearRampToValueAtTime(v, n + sec);
  }

  private buildLayer(mood: Mood): Layer {
    const c = getCtx();
    const L: Layer = {
      mood, sources: [], nextChord: 0, ci: 0, chordLog: [], bellNext: [], arpNext: 0, arpI: 0,
      dryF: c.createGain(), wetF: c.createGain(), pad: c.createGain(), bell: c.createGain(),
    };
    L.dryF.gain.value = 0; L.wetF.gain.value = 0;
    L.dryF.connect(this.dry); L.wetF.connect(this.reverb);
    L.pad.gain.value = mood.padGain;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = mood.cutoff; lp.Q.value = .4;
    L.pad.connect(lp); lp.connect(L.dryF); lp.connect(L.wetF);
    const lfo = c.createOscillator(), lfoG = c.createGain();
    lfo.frequency.value = mood.lfoRate; lfoG.gain.value = mood.lfoDepth;
    lfo.connect(lfoG).connect(lp.frequency); lfo.start(); L.sources.push(lfo);
    L.bell.gain.value = .16;
    const bd = c.createGain(); bd.gain.value = .35;
    L.bell.connect(L.wetF); L.bell.connect(bd).connect(L.dryF);
    if (mood.drone) mood.drone.forEach((m, i) => {
      const f = mtof(m), env = c.createGain(); env.gain.value = .07 / Math.sqrt(i + 1);
      const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; o2.detune.value = 4 + i * 2;
      const g2 = c.createGain(); g2.gain.value = .35;
      const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = .07 + i * .031; tg.gain.value = .02;
      trem.connect(tg).connect(env.gain);
      o1.connect(env); o2.connect(g2).connect(env); env.connect(L.pad);
      [o1, o2, trem].forEach(o => { o.start(); L.sources.push(o); });
    });
    this.buildNoise(L, mood.noise);
    const n = c.currentTime;
    L.nextChord = n + .3;
    L.bellNext = (mood.bells || []).map(b => n + rand(1.5, 1.5 + b.min));
    L.arpNext = n + .5;
    return L;
  }

  private noiseSrc(L: Layer, buf: AudioBuffer) {
    const s = getCtx().createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, rand(0, buf.duration)); L.sources.push(s); return s;
  }

  private buildNoise(L: Layer, n: Mood['noise']) {
    if (!n) return;
    const c = getCtx();
    const filt = (type: BiquadFilterType, f: number) => { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; return x; };
    const gain = (v: number) => { const x = c.createGain(); x.gain.value = v; return x; };
    if (n.type === 'air') {
      this.noiseSrc(L, this.brown).connect(filt('lowpass', 420)).connect(gain(n.gain)).connect(L.dryF);
    } else if (n.type === 'rain') {
      const lp = filt('lowpass', 5200), g1 = gain(n.gain * .55);
      this.noiseSrc(L, this.white).connect(filt('highpass', 700)).connect(lp).connect(g1);
      g1.connect(L.dryF); g1.connect(gain(.35)).connect(L.wetF);
      const lfo = c.createOscillator(); lfo.frequency.value = .06;
      lfo.connect(gain(1300)).connect(lp.frequency); lfo.start(); L.sources.push(lfo);
      this.noiseSrc(L, this.brown).connect(filt('lowpass', 300)).connect(gain(n.gain * .9)).connect(L.dryF);
    } else if (n.type === 'ocean') {
      const lp = filt('lowpass', 650), g1 = gain(n.gain * .5);
      this.noiseSrc(L, this.brown).connect(lp).connect(g1);
      g1.connect(L.dryF); g1.connect(gain(.3)).connect(L.wetF);
      const lfo = c.createOscillator(); lfo.frequency.value = .085;
      lfo.connect(gain(n.gain * .5)).connect(g1.gain);
      lfo.connect(gain(450)).connect(lp.frequency);
      lfo.start(); L.sources.push(lfo);
    }
  }

  private fadeLayer(L: Layer, to: number, sec: number) { this.ramp(L.dryF.gain, to, sec); this.ramp(L.wetF.gain, to, sec); }

  private killLayer(L: Layer) {
    L.sources.forEach(s => { try { s.stop(); } catch { /* already stopped */ } });
    try { L.dryF.disconnect(); L.wetF.disconnect(); } catch { /* already disconnected */ }
  }

  private dropLayer(L: Layer) { this.fadeLayer(L, 0, 3); setTimeout(() => this.killLayer(L), 3600); }

  private switchLayer() {
    const old = this.layer;
    if (old) this.dropLayer(old);
    const L = this.buildLayer(this.mood);
    this.fadeLayer(L, 1, old ? 3 : .4);
    this.layer = L;
    this.tick();
  }

  private tick() {
    const L = this.layer;
    const c = getCtx();
    if (!L || c.state !== 'running') return;
    const m = L.mood, ahead = c.currentTime + 4;
    if (m.chords?.length) while (L.nextChord < ahead) {
      const notes = m.chords[L.ci++ % m.chords.length];
      L.chordLog.push({ t: L.nextChord, notes }); if (L.chordLog.length > 6) L.chordLog.shift();
      this.chord(L, notes, L.nextChord);
      L.nextChord += m.len ?? 14;
    }
    (m.bells || []).forEach((b, i) => {
      while (L.bellNext[i] < ahead) {
        const t = L.bellNext[i];
        if (Math.random() < b.prob) {
          const v = rand(b.vel[0], b.vel[1]);
          this.voice(b.type, pick(b.notes), t, v, L.bell);
          if (b.pair && Math.random() < b.pair) this.voice(b.type, pick(b.notes), t + rand(.45, .85), v * .7, L.bell);
        }
        L.bellNext[i] += rand(b.min, b.max);
      }
    });
    if (m.arp) while (L.arpNext < ahead) {
      let ch = L.chordLog[0];
      for (const e of L.chordLog) if (e.t <= L.arpNext) ch = e;
      if (ch && Math.random() < m.arp.prob) {
        const idx = m.arp.pattern[L.arpI % m.arp.pattern.length];
        this.voice(m.arp.type, ch.notes[Math.min(idx, ch.notes.length - 1)] + m.arp.octave, L.arpNext, rand(.45, .8), L.bell);
      }
      L.arpI++; L.arpNext += m.arp.step;
    }
  }

  private chord(L: Layer, notes: number[], t: number) {
    const c = getCtx(), m = L.mood, scale = 5 / notes.length, len = m.len ?? 14, rel = m.release ?? 6, att = m.attack ?? 4;
    const end = t + len + rel;
    notes.forEach((n, i) => {
      const f = mtof(n), peak = (i === 0 ? .07 : .045) * scale, env = c.createGain();
      env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(peak, t + att);
      env.gain.setValueAtTime(peak, t + len); env.gain.linearRampToValueAtTime(0, end);
      env.connect(L.pad);
      const parts: [OscillatorType, number, number][] = m.voice === 'warm' ? [['sine', 0, 1], ['sawtooth', -7, .06], ['triangle', 7, .25]]
        : m.voice === 'glass' ? [['sine', -9, .7], ['sine', 9, .7], ['sine', 1200, .1]]
          : [['sine', 0, 1], ['triangle', rand(6, 10), .35]];
      parts.forEach(([type, det, lvl]) => {
        const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
        const gg = c.createGain(); gg.gain.value = lvl;
        o.connect(gg).connect(env); o.start(t); o.stop(end + .2);
      });
    });
  }

  private partial(f: number, t: number, peak: number, attack: number, decay: number, type: OscillatorType, dest: AudioNode) {
    const c = getCtx(), env = c.createGain();
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(peak, t + attack);
    env.gain.exponentialRampToValueAtTime(.0001, t + attack + decay); env.connect(dest);
    const o = c.createOscillator(); o.type = type; o.frequency.value = f;
    o.connect(env); o.start(t); o.stop(t + attack + decay + .1);
  }

  private voice(type: string, m: number, t: number, vel: number, dest: AudioNode) {
    const f = mtof(m), P = this.partial.bind(this);
    switch (type) {
      case 'shimmer': P(f, t, .13 * vel, 1.4, 6, 'sine', dest); P(f * 2.003, t, .03 * vel, 1.8, 4, 'sine', dest); break;
      case 'bowl': [[1, 1, 10], [1.004, .6, 10], [2.76, .4, 6], [5.4, .18, 3.5], [8.93, .07, 2]].forEach(([r, a, d]) => P(f * r, t, .2 * vel * a, .05, d, 'sine', dest)); break;
      case 'pluck': P(f, t, .18 * vel, .006, 2.2, 'triangle', dest); P(f * 2, t, .03 * vel, .006, 1.2, 'sine', dest); break;
      case 'musicbox': P(f, t, .15 * vel, .004, 2.8, 'sine', dest); P(f * 2, t, .035 * vel, .004, 1.4, 'sine', dest); P(f * 3, t, .02 * vel, .003, .6, 'sine', dest); break;
      default: P(f, t, .22 * vel, .015, 4.5, 'sine', dest); P(f * 2.001, t, .026 * vel, .015, 3, 'sine', dest);
    }
  }

  /** Start (or resume) the ambient sound with the chosen mood. */
  play(volume: number, mood: string) {
    this.init();
    this.tok++; this.playing = true;
    const c = getCtx();
    if (c.state !== 'running') c.resume();
    const m = moodById(mood);
    if (!this.layer || this.mood !== m) { this.mood = m; this.switchLayer(); }
    this.ramp(this.master.gain, volume * .9, 2.5);
  }

  /** Fade out. */
  stop(fade = .8) {
    if (!this.built) return;
    this.playing = false;
    this.tok++;
    this.ramp(this.master.gain, 0, fade);
  }

  setMood(id: string) {
    const m = moodById(id);
    if (m === this.mood) return;
    this.mood = m;
    if (!this.built) return;
    if (this.playing) this.switchLayer();
    else if (this.layer) { this.killLayer(this.layer); this.layer = null; }
  }

  setVolume(v: number) {
    if (this.built && this.playing) this.ramp(this.master.gain, v * .9, .15);
  }

  /** A short bell phrase: the end-of-session sound for the ambient source. */
  chime() {
    this.init();
    const c = getCtx();
    if (c.state !== 'running') c.resume();
    const tok = ++this.tok, t = c.currentTime + .15;
    [81, 78, 74].forEach((m, i) => this.voice('bell', m, t + i * .7, .9, this.chimeBus));
    this.voice('bell', 69, t + 2.1, .6, this.chimeBus);
    return tok;
  }
}

export const ambient = new Ambient();
