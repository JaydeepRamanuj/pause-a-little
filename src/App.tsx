import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Scene } from './components/Scene';
import { TopBar } from './components/TopBar';
import { Focus } from './components/Focus';
import { Dock } from './components/Dock';
import { Words } from './components/Words';
import { YouTubeCard } from './components/YouTubeCard';
import { Sheet } from './components/Sheet';
import {
  boot, cyclePalette, setPrahar, setSheet, setSoundOn, setWordsMode, reset, step, toggleDrone, toggleSession, wake,
} from './app/session';
import { applyPaletteVars } from './lib/theme';
import { getState, useStore } from './lib/store';
import { cn } from './lib/cn';
import { toggleFullscreen } from './lib/fullscreen';
import { resolvePalette } from './data/palettes';
import { fmt } from './lib/util';

const WAKE_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'touchstart'] as const;

export default function App() {
  const paletteId = useStore(s => s.palette);
  const raagMode = useStore(s => s.raagMode);
  const prahar = useStore(s => s.prahar);
  const zen = useStore(s => s.zen);
  const timer = useStore(s => s.timer);
  const remaining = useStore(s => s.remaining);
  const minutes = useStore(s => s.minutes);
  const intent = useStore(s => s.intent);
  const corner = useStore(s => s.words.mode === 'corner');
  const sheet = useStore(s => s.sheet);

  const palette = resolvePalette(paletteId, raagMode, prahar);

  // before paint, so the first frame already has the right colours
  useLayoutEffect(() => { applyPaletteVars(palette); }, [palette]);

  useEffect(() => {
    boot();
    const clock = setInterval(setPrahar, 60_000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const time = minutes ? fmt(remaining) : '∞';
    document.title = timer === 'running' ? `${time} · pause a little`
      : timer === 'paused' ? `❚❚ ${time} · pause a little`
        : timer === 'done' ? '✦ Time’s up · pause a little'
          : 'pause a little';
  }, [timer, remaining, minutes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = getState();
      if (e.key === 'Escape' && s.sheet) return setSheet(false);
      const target = e.target;
      if (target instanceof Element && target.matches('textarea, input:not([type=range])')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'spacebar') { e.preventDefault(); toggleSession(); }
      else if (k === 'r') reset();
      else if (k === 'c') setWordsMode(s.words.mode === 'corner' ? 'timer' : 'corner');
      else if (k === 'm') setSoundOn(!s.soundOn);
      else if (k === 'p') cyclePalette();
      else if (k === 'n') step(1);
      else if (k === 'd') toggleDrone();
      else if (k === 'l') setSheet(!s.sheet);
      else if (k === 'f') toggleFullscreen();
    };
    addEventListener('keydown', onKey);
    WAKE_EVENTS.forEach(ev => addEventListener(ev, wake, { passive: true }));
    return () => {
      removeEventListener('keydown', onKey);
      WAKE_EVENTS.forEach(ev => removeEventListener(ev, wake));
    };
  }, []);

  return (
    <div className={cn('relative h-dvh overflow-hidden', zen && 'cursor-none')}>
      <Scene palette={palette} />
      <TopBar palette={palette} />

      <p className="pointer-events-none fixed inset-x-0 top-[max(86px,calc(env(safe-area-inset-top)_+_76px))] z-[3] px-6 text-center text-[11.5px] uppercase tracking-[.2em] text-ink-soft">
        {corner && intent.trim() ? `Focusing on · ${intent.trim()}` : ''}
      </p>

      <Focus palette={palette} />
      <Words />
      <Dock />
      <YouTubeCard />

      <footer
        className={cn(
          'hint pointer-events-none fixed inset-x-0 top-[66px] z-[3] text-center text-[11.5px] tracking-[.06em] text-ink-soft transition-opacity duration-[1.4s]',
          (corner || sheet) && 'hidden',
          zen && 'opacity-0',
        )}
      >
        <Kbd>Space</Kbd> start · <Kbd>R</Kbd> reset · <Kbd>C</Kbd> corner · <Kbd>M</Kbd> sound · <Kbd>P</Kbd> colors · <Kbd>N</Kbd> next · <Kbd>D</Kbd> tanpura · <Kbd>F</Kbd> fullscreen
      </footer>

      <Sheet />
      <Toast />
    </div>
  );
}

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-[5px] border border-track px-1.5 py-px font-sans">{children}</kbd>
);

function Toast() {
  const t = useStore(s => s.toast);
  return (
    <AnimatePresence>
      {t && (
        <motion.div
          key={t.id}
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="glass pointer-events-none fixed left-1/2 top-[max(76px,calc(env(safe-area-inset-top)_+_66px))] z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-[13px]"
        >
          {t.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
