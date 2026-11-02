// Music engine: your own audio files, YouTube tracks, the tanpura drone and the raag bell.
// Ported from the raag room. Only the Web Audio graph and the players live here; what plays
// next is decided by the session controller in app/.

import { mtof } from '../lib/util';
import { getCtx, impulse } from './context';

interface YTPlayer {
  setVolume(v: number): void;
  getVolume(): number;
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
}

declare global {
  interface Window {
    YT: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Callbacks the controller registers for the players' own events. */
export const hooks: {
  time?: () => void;
  ended?: () => void;
  error?: () => void;
} = {};

/** How hard each tanpura string was just plucked (0..1). The visuals read this. */
export const strE = [0, 0, 0, 0];

let built = false;
let comp: DynamicsCompressorNode, master: GainNode, analyser: AnalyserNode, bus: GainNode;
let music: GainNode, el: HTMLAudioElement, rev: ConvolverNode, drone: GainNode, chime: GainNode, wave: PeriodicWave;
let analyserBuf: Float32Array<ArrayBuffer>;

function build() {
  if (built) return;
  built = true;
  const c = getCtx();
  comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.knee.value = 12;
  comp.connect(c.destination);
  master = c.createGain(); master.connect(comp);
  analyser = c.createAnalyser(); analyser.fftSize = 1024; analyserBuf = new Float32Array(1024);
  bus = c.createGain(); bus.connect(master); bus.connect(analyser);

  music = c.createGain(); music.gain.value = 0; music.connect(bus);
  el = new Audio(); el.preload = 'auto';
  c.createMediaElementSource(el).connect(music);
  el.addEventListener('timeupdate', () => hooks.time?.());
  el.addEventListener('ended', () => hooks.ended?.());
  el.addEventListener('error', () => hooks.error?.());

  const ir = impulse(4.5, 2.8);
  rev = c.createConvolver(); rev.buffer = ir;
  const wet = c.createGain(); wet.gain.value = .5; rev.connect(wet).connect(bus);
  drone = c.createGain(); drone.gain.value = 0; drone.connect(bus);
  const send = c.createGain(); send.gain.value = .4; drone.connect(send).connect(rev);

  // tanpura timbre: rich, slowly falling harmonics
  const N = 28, re = new Float32Array(N), im = new Float32Array(N);
  for (let n = 1; n < N; n++) im[n] = (n === 1 ? 1 : .75 / Math.pow(n, .75)) * (n % 7 === 0 ? .5 : 1);
  wave = c.createPeriodicWave(re, im);

  chime = c.createGain(); chime.gain.value = .45; chime.connect(comp);
  const cv = c.createConvolver(); cv.buffer = ir;
  const cw = c.createGain(); cw.gain.value = .5;
  chime.connect(cv); cv.connect(cw).connect(comp);
  setInterval(droneTick, 300);
}

function ramp(p: AudioParam, v: number, sec: number) {
  const n = getCtx().currentTime;
  p.cancelScheduledValues(n); p.setValueAtTime(p.value, n); p.linearRampToValueAtTime(v, n + sec);
}

/** Loudness of what is playing right now, 0..1. Used by the glow and the strings. */
export function level(): number {
  if (!built || getCtx().state !== 'running') return 0;
  analyser.getFloatTimeDomainData(analyserBuf);
  let s = 0;
  for (let i = 0; i < analyserBuf.length; i += 4) s += analyserBuf[i] * analyserBuf[i];
  return Math.min(1, Math.sqrt(s / (analyserBuf.length / 4)) * 3);
}

export function ensureMusic() {
  build();
}

// ---------- your own audio files ----------

/** Load a file and start it, silent at first. Remote files need CORS, or the browser mutes them. */
export function fileStart(src: string, remote: boolean): Promise<void> {
  build();
  if (remote) el.crossOrigin = 'anonymous'; else el.removeAttribute('crossorigin');
  el.src = src;
  music.gain.cancelScheduledValues(getCtx().currentTime);
  music.gain.setValueAtTime(0, getCtx().currentTime);
  return el.play().then(() => undefined);
}

export function fileFade(to: number, sec: number) {
  if (!built) return;
  ramp(music.gain, to, sec);
}

export function fileSilence() {
  if (!built) return;
  const n = getCtx().currentTime;
  music.gain.cancelScheduledValues(n); music.gain.setValueAtTime(0, n);
}

export function filePause() {
  if (built) el.pause();
}

export function fileProgress() {
  return { current: built ? el.currentTime : 0, duration: built ? el.duration : NaN };
}

export function filePlay(): Promise<void> {
  build();
  return el.play().then(() => undefined, () => undefined);
}

// ---------- YouTube ----------

let ytHost: HTMLElement | null = null;
let ytPromise: Promise<void> | null = null;
let yt: YTPlayer | null = null;
let ytFadeTok = 0;

export function setYTHost(el: HTMLElement | null) {
  ytHost = el;
}

export function ytEnsure(): Promise<void> {
  if (ytPromise) return ytPromise;
  ytPromise = new Promise<void>((res, rej) => {
    window.onYouTubeIframeAPIReady = () => {
      const host = document.createElement('div');
      ytHost?.appendChild(host);
      yt = new window.YT.Player(host, {
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin, widget_referrer: location.href },
        events: {
          onReady: () => res(),
          onStateChange: (e: { data: number }) => { if (e.data === 0) hooks.ended?.(); },
          onError: () => hooks.error?.(),
        },
      });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { ytPromise = null; rej(new Error('yt')); };
    document.head.appendChild(s);
  });
  return ytPromise;
}

export function ytLoad(id: string) {
  if (!yt) return;
  yt.setVolume(0);
  yt.loadVideoById(id);
}

export function ytPlay() {
  yt?.playVideo();
}

export function ytPause() {
  yt?.pauseVideo();
}

export function ytSetVolume(v: number) {
  ytFadeTok++;
  yt?.setVolume(Math.round(v * 100));
}

/** Fade the YouTube volume. Both ends are on YouTube's 0–100 scale. */
export function ytFade(to: number, ms: number): Promise<void> {
  if (!yt) return Promise.resolve();
  const tok = ++ytFadeTok;
  const from = yt.getVolume();
  const steps = Math.max(1, Math.round(ms / 60));
  return new Promise(res => {
    let i = 0;
    const iv = setInterval(() => {
      if (tok !== ytFadeTok || !yt) { clearInterval(iv); return res(); }
      i++;
      yt.setVolume(Math.round(from + (to - from) * (i / steps)));
      if (i >= steps) { clearInterval(iv); res(); }
    }, 60);
  });
}

export function ytIsReady() {
  return !!yt;
}

// ---------- tanpura: Pa · Sa · Sa · Sa (low) ----------

const PAT: [number, number, number][] = [[-5, 0, 0], [0, 1, 1.35], [0, 2, 2.7], [-12, 3, 4.05]];
const CYCLE = 6.4;
let dNext = 0, dStep = 0, droneLive = false, droneKey = 1;

function pluck(m: number, t: number, str: number) {
  const c = getCtx(), fq = mtof(m);
  const env = c.createGain();
  env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(.11, t + .03);
  env.gain.exponentialRampToValueAtTime(.03, t + 2.5); env.gain.exponentialRampToValueAtTime(.0001, t + 7.5);
  const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.Q.value = 5; pk.gain.value = 11;
  pk.frequency.setValueAtTime(fq * 3, t); pk.frequency.exponentialRampToValueAtTime(Math.min(fq * 16, 5200), t + 2.4); pk.frequency.exponentialRampToValueAtTime(fq * 6, t + 7);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600;
  [0, 4].forEach(det => {
    const o = c.createOscillator(); o.setPeriodicWave(wave); o.frequency.value = fq; o.detune.value = det;
    o.connect(pk); o.start(t); o.stop(t + 7.6);
  });
  pk.connect(lp).connect(env).connect(drone);
  setTimeout(() => { strE[str] = 1; }, Math.max(0, (t - c.currentTime) * 1000));
}

function droneTick() {
  if (!built || !droneLive || getCtx().state !== 'running') return;
  const ahead = getCtx().currentTime + 1.6, base = 48 + droneKey;
  while (dNext < ahead) {
    const i = dStep % 4, [semi, str] = PAT[i];
    pluck(base + semi, dNext, str);
    dNext += i === 3 ? CYCLE - PAT[3][2] : PAT[i + 1][2] - PAT[i][2];
    dStep++;
  }
}

export function setDroneKey(k: number) {
  droneKey = k;
}

export function droneStart(vol: number) {
  build();
  if (droneLive) return;
  droneLive = true;
  dNext = getCtx().currentTime + .15; dStep = 0;
  ramp(drone.gain, vol * .55, 1.5);
  droneTick();
}

export function droneSetVolume(vol: number) {
  if (droneLive) ramp(drone.gain, vol * .55, .15);
}

export function droneStop(sec = 2) {
  if (!built) return;
  droneLive = false;
  ramp(drone.gain, 0, sec);
}

/** The raag bell: three soft strikes, used when a session ends with music. */
export function bell() {
  build();
  const c = getCtx(), t = c.currentTime + .2;
  [[0, 69], [1.8, 64], [3.6, 69]].forEach(([dt, m]) => {
    const fq = mtof(m);
    [[1, 1, 9], [2.76, .35, 5], [5.4, .14, 3], [1.003, .6, 9]].forEach(([r, a, d]) => {
      const env = c.createGain(); env.gain.setValueAtTime(0, t + dt); env.gain.linearRampToValueAtTime(.16 * a, t + dt + .02);
      env.gain.exponentialRampToValueAtTime(.0001, t + dt + d); env.connect(chime);
      const o = c.createOscillator(); o.frequency.value = fq * r; o.connect(env); o.start(t + dt); o.stop(t + dt + d + .1);
    });
  });
}
