import type { Palette } from '../data/palettes';
import { setPicker, setSheet, setSource, setView } from '../app/session';
import { toggleFullscreen } from '../lib/fullscreen';
import { useStore } from '../lib/store';
import type { Source, View } from '../lib/store';
import { cn } from '../lib/cn';
import { CornerIcon, EyeOffIcon, FullscreenIcon, LotusIcon, NoteIcon, SettingsIcon, TimerIcon, WaveIcon } from './icons';
import { mandalaSvg } from './mandalas';

const SOUNDS: { id: Source; label: string; Icon: (p: { className?: string }) => React.JSX.Element }[] = [
  { id: 'ambient', label: 'Ambient', Icon: WaveIcon },
  { id: 'raag', label: 'Raag', Icon: LotusIcon },
  { id: 'songs', label: 'Calm songs', Icon: NoteIcon },
];

const VIEWS: { id: View; label: string; Icon: (p: { className?: string }) => React.JSX.Element }[] = [
  { id: 'focus', label: 'Focus', Icon: TimerIcon },
  { id: 'motivation', label: 'Motivation', Icon: CornerIcon },
  { id: 'off', label: 'Off', Icon: EyeOffIcon },
];

/** Colours, sound, mandala (Raag only), Focus, settings and fullscreen. */
export function TopBar({ palette }: { palette: Palette }) {
  const zen = useStore(s => s.zen);
  const source = useStore(s => s.source);
  const view = useStore(s => s.view);
  const mandala = useStore(s => s.mandala);
  const picker = useStore(s => s.picker);

  const [s1, s2, s3] = [palette.colors[0], palette.colors[2], palette.colors[3]];
  // Calm songs has no motivation texts
  const views = VIEWS.filter(v => !(source === 'songs' && v.id === 'motivation'));

  return (
    <header
      className={cn(
        'ui fixed inset-x-0 top-0 z-[5] flex items-center justify-between gap-2 px-4 pt-[max(18px,env(safe-area-inset-top))] transition-opacity duration-[1.4s]',
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
          title="Colors"
          aria-haspopup="dialog"
          aria-expanded={picker === 'colors'}
          onClick={() => setPicker(picker === 'colors' ? null : 'colors')}
          className={cn(pill, picker === 'colors' && 'bg-glass-strong')}
        >
          <span
            className="size-3.5 shrink-0 rounded-full"
            style={{ background: `conic-gradient(${s1}, ${s2}, ${s3}, ${s1})` }}
          />
          <span className="max-[820px]:hidden">{palette.name}</span>
        </button>

        <Segment<Source>
          label="Sound"
          value={source}
          onChange={setSource}
          items={SOUNDS.map(s => ({ id: s.id, label: s.label, Icon: s.Icon }))}
        />

        {source === 'raag' && (
          <button
            type="button"
            title="Mandala"
            aria-haspopup="dialog"
            aria-expanded={picker === 'mandala'}
            onClick={() => setPicker(picker === 'mandala' ? null : 'mandala')}
            className={cn(pill, picker === 'mandala' && 'bg-glass-strong')}
          >
            <span className="size-4 flex-none overflow-hidden rounded-full" aria-hidden="true">
              {mandala === 'none'
                ? <span className="block size-full rounded-full border border-glass-border" />
                : <span className="block size-full scale-[.5]" dangerouslySetInnerHTML={{ __html: mandalaSvg(mandala) }} />}
            </span>
            <span className="max-[760px]:hidden">Mandala</span>
          </button>
        )}

        <Segment<View>
          label="Focus"
          value={view}
          onChange={v => setView(v)}
          items={views.map(v => ({ id: v.id, label: v.label, Icon: v.Icon }))}
        />

        <button type="button" title="Settings (L)" aria-label="Settings" onClick={() => setSheet(true)} className={iconButton(false)}>
          <SettingsIcon className="size-[17px]" />
        </button>

        <button type="button" title="Fullscreen (F)" aria-label="Toggle fullscreen" onClick={toggleFullscreen} className={iconButton(false)}>
          <FullscreenIcon className="size-[17px]" />
        </button>
      </div>
    </header>
  );
}

/** A group of icon choices, the chosen one lit, like the sound switch. */
function Segment<T extends string>({ label, value, onChange, items }: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: string; Icon: (p: { className?: string }) => React.JSX.Element }[];
}) {
  return (
    <div role="group" aria-label={label} className="glass flex h-[38px] items-center rounded-full p-[3px]">
      {items.map(({ id, label: text, Icon }) => (
        <button
          key={id}
          type="button"
          title={text}
          aria-label={text}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            'inline-flex h-full items-center gap-1.5 rounded-full px-2.5 text-[13px] transition-[background,color] duration-300',
            value === id ? 'bg-ink text-bg' : 'hover:bg-glass-strong',
          )}
        >
          <Icon className="size-[15px]" />
          {value === id && <span className="whitespace-nowrap max-[760px]:hidden">{text}</span>}
        </button>
      ))}
    </div>
  );
}

const pill =
  'glass inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] tracking-[.02em] transition-colors duration-300 hover:bg-glass-strong max-[460px]:px-[11px]';

const iconButton = (on: boolean) =>
  cn(
    'glass grid size-[38px] shrink-0 place-items-center rounded-full transition-[background,transform] duration-300 hover:bg-glass-strong active:scale-[.94]',
    on && 'bg-glass-strong',
  );
