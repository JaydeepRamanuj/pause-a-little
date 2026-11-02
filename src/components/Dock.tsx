import { moodById } from '../data/moods';
import { allTracks, setSheet, step, toggleDrone, trackLabel } from '../app/session';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { ListIcon, NextIcon, PrevIcon, TanpuraIcon } from './icons';
import type { ReactNode } from 'react';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F'];

/** The sound bar: what is playing, previous and next, the tanpura, and the sound sheet. */
export function Dock() {
  const zen = useStore(s => s.zen);
  const corner = useStore(s => s.words.mode === 'corner');
  const source = useStore(s => s.source);
  const mood = useStore(s => s.mood);
  const drone = useStore(s => s.drone);
  const droneKey = useStore(s => s.droneKey);
  const soundOn = useStore(s => s.soundOn);
  const track = useStore(s => allTracks(s).find(t => t.key === s.musicKey) ?? null);

  let title: string;
  let sub: string;
  if (source === 'ambient') {
    const m = moodById(mood);
    title = m.name;
    sub = m.desc;
  } else if (track) {
    title = track.title;
    sub = trackLabel(track);
  } else if (drone) {
    title = 'Tanpura';
    sub = `Drone in ${KEYS[droneKey]}`;
  } else {
    title = 'Your music';
    sub = 'Tap the list to add some';
  }

  return (
    <div
      className={cn(
        'glass fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-[5] flex w-[min(640px,calc(100vw_-_24px))] -translate-x-1/2 items-center gap-2 rounded-full py-2 pl-2 pr-2.5 transition-opacity duration-[1.4s]',
        corner && 'hidden',
        zen && 'opacity-[.35]',
        !soundOn && 'opacity-60',
      )}
    >
      <IconBtn label="Previous" onClick={() => step(-1)} className="max-[520px]:hidden">
        <PrevIcon className="size-[18px]" />
      </IconBtn>

      <div className="min-w-0 flex-1 px-1.5">
        <b className="block truncate text-sm font-normal">{title}</b>
        <span className="mt-0.5 block truncate text-[11.5px] text-ink-soft">{sub}</span>
      </div>

      <IconBtn label="Next (N)" onClick={() => step(1)}>
        <NextIcon className="size-[18px]" />
      </IconBtn>

      <IconBtn label="Tanpura drone (D)" onClick={toggleDrone} on={drone}>
        <TanpuraIcon className="size-[18px]" />
      </IconBtn>

      <IconBtn label="Sound and settings (L)" onClick={() => setSheet(true)}>
        <ListIcon className="size-[18px]" />
      </IconBtn>
    </div>
  );
}

function IconBtn({ label, onClick, on = false, className, children }: {
  label: string; onClick: () => void; on?: boolean; className?: string; children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full transition-[background,transform,color] duration-300 hover:bg-glass-strong active:scale-[.94]',
        on && 'bg-ink text-bg hover:bg-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}
