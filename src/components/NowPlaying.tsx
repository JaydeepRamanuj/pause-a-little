import { useEffect, useRef, useState } from 'react';
import { allTracks, setSongsPanel, setVolume, step, toggleSession } from '../app/session';
import { moodById } from '../data/moods';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, ListIcon, SoundOnIcon } from './icons';

/**
 * The audio card: what is playing in any mode, with previous, play and next, and a button
 * that opens the audio pane.
 */
export function NowPlaying() {
  const source = useStore(s => s.source);
  const timer = useStore(s => s.timer);
  const mood = useStore(s => s.mood);
  const track = useStore(s => allTracks(s).find(t => t.key === s.musicKey) ?? null);
  const chapter = useStore(s => s.musicChapter);
  const volume = useStore(s => (s.source === 'ambient' ? s.ambientVol : s.musicVol));
  const [volOpen, setVolOpen] = useState(false);
  const volRef = useRef<HTMLDivElement>(null);

  // a press anywhere outside the volume control closes it
  useEffect(() => {
    if (!volOpen) return;
    const close = (e: PointerEvent) => {
      if (!volRef.current?.contains(e.target as Node)) setVolOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [volOpen]);

  const playing = timer === 'running';
  let title: string;
  let sub: string;
  if (source === 'ambient') {
    const m = moodById(mood);
    title = m.name;
    sub = `Ambient · ${m.desc}`;
  } else if (track?.collection) {
    title = track.chapters && chapter !== null ? (track.chapters[chapter]?.title ?? track.title) : track.title;
    sub = `${track.collection} · ${track.title}`;
  } else if (track) {
    title = track.title;
    sub = 'Your Raag playlist';
  } else {
    title = source === 'songs' ? 'Calm songs' : 'Raag';
    sub = source === 'songs' ? 'Open the list to pick one' : 'Open the list to pick a track';
  }

  return (
    <div
      className={cn(
        'ui glass fixed left-1/2 z-[5] flex w-[min(460px,calc(100vw_-_24px))] -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5',
        // on wide screens, on the same line as the Focus controls; on phones, stacked above them
        'bottom-4',
      )}
    >
      <Waves playing={playing} />
      <div className="min-w-0 flex-1 px-1">
        <b className="block truncate text-sm font-normal">{title}</b>
        <span className="block truncate text-[11px] text-ink-soft">{sub}</span>
      </div>
      <RoundBtn label="Previous" onClick={() => step(-1)}><PrevIcon className="size-4" /></RoundBtn>
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        title={playing ? 'Pause' : 'Play'}
        onClick={toggleSession}
        className="grid size-9 flex-none place-items-center rounded-full bg-ink text-bg transition-transform active:scale-[.94]"
      >
        {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      </button>
      <RoundBtn label="Next" onClick={() => step(1)}><NextIcon className="size-4" /></RoundBtn>
      <div ref={volRef} className="relative">
        {volOpen && (
          <div className="glass absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-full px-3 py-4">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              aria-label="Volume"
              onChange={e => setVolume(+e.target.value)}
              // a vertical slider: the writing mode turns it upright
              style={{ writingMode: 'vertical-lr', direction: 'rtl', width: 6, height: 104 }}
            />
          </div>
        )}
        <RoundBtn label="Volume" onClick={() => setVolOpen(!volOpen)}><SoundOnIcon className="size-4" /></RoundBtn>
      </div>
      <RoundBtn label="Choose what plays" onClick={() => setSongsPanel(true)}><ListIcon className="size-4" /></RoundBtn>
    </div>
  );
}

function RoundBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 flex-none place-items-center rounded-full transition-colors hover:bg-glass-strong"
    >
      {children}
    </button>
  );
}

/** Four bars that bounce while the audio plays. */
export function Waves({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-4 w-5 flex-none items-end justify-between" aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <i
          key={i}
          className={cn('animate-eq w-[3px] rounded-full bg-accent', !playing && 'opacity-40')}
          style={{ animationDelay: `${-i * 0.35}s`, animationPlayState: playing ? 'running' : 'paused' }}
        />
      ))}
    </span>
  );
}
