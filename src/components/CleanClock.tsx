import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { fmt } from '../lib/util';
import { Waves } from './NowPlaying';

/**
 * In clean screen: the waves show that something is playing, and the clock (optional)
 * shows the time of day, with the session time while it runs.
 */
export function CleanClock() {
  const clean = useStore(s => s.clean);
  const show = useStore(s => s.cleanClock);
  const revealed = useStore(s => s.revealed);
  const timer = useStore(s => s.timer);
  const remaining = useStore(s => s.remaining);
  const minutes = useStore(s => s.minutes);
  const soundOn = useStore(s => s.soundOn);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(iv);
  }, []);

  const playing = timer === 'running' && soundOn;
  if (!clean || (!show && !playing)) return null;

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const session = timer !== 'idle' && minutes ? fmt(remaining) : null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        // it sits where the corner controls appear; when they come back, this fades out
        'pointer-events-none fixed bottom-7 left-7 z-[3] transition-opacity duration-[2.2s] max-[700px]:left-5',
        revealed ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div className="flex items-center gap-3">
        <Waves playing={playing} />
        {show && <div className="font-display text-[40px] font-light leading-none tabular-nums opacity-80">{hh}:{mm}</div>}
      </div>
      {show && session && (
        <div className="mt-2 text-[12px] uppercase tracking-[.2em] text-ink-soft tabular-nums">{session}</div>
      )}
    </div>
  );
}
