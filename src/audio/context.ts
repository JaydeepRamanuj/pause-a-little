// One AudioContext for the whole app: the ambient engine and the music engine both play into it.
// It is created on the first user gesture (browsers refuse audio before that).

let ctx: AudioContext | null = null;

export function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export function resumeCtx(): Promise<void> {
  const c = getCtx();
  return c.state === 'running' ? Promise.resolve() : c.resume().then(() => undefined, () => undefined);
}

/** Pause the clock when nothing is sounding, so an idle page costs nothing. */
export function suspendCtx() {
  if (ctx && ctx.state === 'running') ctx.suspend();
}

/** A stereo impulse response: random noise with an exponential decay. Used as a room. */
export function impulse(sec: number, decay: number): AudioBuffer {
  const c = getCtx(), len = Math.floor(c.sampleRate * sec), buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}
