import type { Palette } from '../data/palettes';
import { moodById } from '../data/moods';
import { allTracks, setSheet, setWordsMode } from '../app/session';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { toggleFullscreen } from '../lib/fullscreen';
import { CornerIcon, FullscreenIcon, NoteIcon } from './icons';

/** Brand, colours, sound, motivation corner and fullscreen. */
export function TopBar({ palette }: { palette: Palette }) {
  const zen = useStore(s => s.zen);
  const corner = useStore(s => s.words.mode === 'corner');
  const source = useStore(s => s.source);
  const mood = useStore(s => s.mood);
  const trackTitle = useStore(s => allTracks(s).find(t => t.key === s.musicKey)?.title ?? null);
  const soundName = source === 'ambient' ? moodById(mood).name : trackTitle ?? 'Music';

  const [s1, s2, s3] = [palette.colors[0], palette.colors[2], palette.colors[3]];

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-[5] flex items-center justify-between gap-2 px-4 pt-[max(18px,env(safe-area-inset-top))] transition-opacity duration-[1.4s]',
        zen && 'pointer-events-none opacity-0',
      )}
    >
      <div className="flex items-center gap-[11px] font-display text-xl font-light leading-none">
        <span className="size-3 animate-breathe rounded-full bg-ink opacity-[.55]" aria-hidden="true" />
        <span className="max-[460px]:hidden">
          pause <span className="italic text-ink-soft">a little</span>
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2 max-[460px]:gap-1.5">
        <button
          type="button"
          title="Colors (P to cycle)"
          onClick={() => setSheet(true)}
          className={pill}
        >
          <span
            className="size-3.5 shrink-0 rounded-full"
            style={{ background: `conic-gradient(${s1}, ${s2}, ${s3}, ${s1})` }}
          />
          <span className="max-[430px]:hidden">{palette.raag ? 'Raag clock' : palette.name}</span>
        </button>

        <button type="button" title="Sound (N to change)" onClick={() => setSheet(true)} className={pill}>
          <NoteIcon className="size-[15px] opacity-80" />
          <span className="max-w-[140px] truncate max-[430px]:hidden">{soundName}</span>
        </button>

        <button
          type="button"
          title="Motivation corner (C)"
          aria-label="Toggle motivation corner"
          aria-pressed={corner}
          onClick={() => setWordsMode(corner ? 'timer' : 'corner')}
          className={iconButton(corner)}
        >
          <CornerIcon className="size-[17px]" />
        </button>

        <button type="button" title="Fullscreen (F)" aria-label="Toggle fullscreen" onClick={toggleFullscreen} className={iconButton(false)}>
          <FullscreenIcon className="size-[17px]" />
        </button>
      </div>
    </header>
  );
}

const pill =
  'glass inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] tracking-[.02em] transition-colors duration-300 hover:bg-glass-strong max-[460px]:px-[11px]';

const iconButton = (on: boolean) =>
  cn(
    'glass grid size-[38px] shrink-0 place-items-center rounded-full transition-[background,transform] duration-300 hover:bg-glass-strong active:scale-[.94]',
    on && 'bg-glass-strong',
  );
