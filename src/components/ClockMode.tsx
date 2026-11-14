import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { setClock } from '../app/session';
import { useStore } from '../lib/store';
import { fmt } from '../lib/util';

/**
 * Clock-only full screen: the time of day, large and quiet, over the scene. The session
 * time sits beneath while one is running. Tap, or press Esc / T, to leave.
 */
export function ClockMode() {
  const on = useStore(s => s.clock);
  const timer = useStore(s => s.timer);
  const remaining = useStore(s => s.remaining);
  const minutes = useStore(s => s.minutes);
  const [now, setNow] = useState(() => new Date());
  const [hint, setHint] = useState(true);

  useEffect(() => {
    if (!on) return;
    setNow(new Date());
    setHint(true);
    const iv = setInterval(() => setNow(new Date()), 1000);
    const h = setTimeout(() => setHint(false), 4000);
    // leaving the browser's fullscreen (Esc) also leaves the clock
    const onFs = () => { if (!document.fullscreenElement) setClock(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      clearInterval(iv);
      clearTimeout(h);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [on]);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const date = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const session = timer === 'running' || timer === 'paused' ? (minutes ? fmt(remaining) : null) : null;

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          role="dialog"
          aria-label="Clock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={() => setClock(false)}
          className="fixed inset-0 z-30 flex cursor-none flex-col items-center justify-center bg-bg/[.86] text-ink backdrop-blur-[2px]"
        >
          <div className="font-display text-[clamp(88px,26vw,320px)] font-extralight leading-none tabular-nums tracking-[-.02em]">
            {hh}<span className="mx-[.04em] opacity-50">:</span>{mm}
          </div>
          <div className="mt-[3vh] text-[clamp(13px,2.2vw,22px)] tracking-[.2em] text-ink-soft uppercase">{date}</div>
          <div className="mt-[2vh] min-h-[1.4em] text-[clamp(13px,2vw,20px)] tabular-nums tracking-[.2em] text-ink-soft">
            {session ? `${timer === 'paused' ? '❚❚ ' : ''}${session}` : ''}
          </div>
          <p className="ui absolute inset-x-0 bottom-[6vh] text-center text-[12px] tracking-[.08em] text-ink-soft transition-opacity duration-[1.4s]" style={{ opacity: hint ? 1 : 0 }}>
            Tap or press Esc to leave
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
