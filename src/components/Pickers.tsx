import { motion, AnimatePresence } from 'motion/react';
import { FOCUS_PALETTES, RAAG_CLOCK_ID, SONG_PALETTES, resolvePalette, type Palette } from '../data/palettes';
import { setMandala, setPalette, setPicker } from '../app/session';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { MANDALA_IDS, MANDALA_NAMES, mandalaSvg } from './mandalas';
import { CloseIcon } from './icons';

/** The colour or mandala card, opened from the top bar. Each choice shows a preview. */
export function Pickers() {
  const picker = useStore(s => s.picker);
  return (
    <AnimatePresence>
      {picker && (
        <>
          <motion.div
            key="backdrop"
            aria-hidden="true"
            onClick={() => setPicker(null)}
            className="fixed inset-0 z-[9]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.section
            key={picker}
            role="dialog"
            aria-modal="true"
            aria-label={picker === 'colors' ? 'Colors' : 'Mandala'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="themed-scroll fixed right-3 top-[max(70px,calc(env(safe-area-inset-top)_+_60px))] z-10 max-h-[min(70dvh,640px)] w-[min(400px,calc(100vw_-_24px))] overflow-y-auto overscroll-contain rounded-3xl border border-glass-border sheet-surface px-4 pb-4 pt-4 shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur-[24px] backdrop-saturate-[1.3]"
          >
            <div className="flex items-center justify-between">
              <h2 className="m-0 font-display text-[20px] font-normal">{picker === 'colors' ? 'Colors' : 'Mandala'}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPicker(null)}
                className="glass grid size-8 place-items-center rounded-full hover:bg-glass-strong"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
            <div className="mt-3">{picker === 'colors' ? <ColorChoices /> : <MandalaChoices />}</div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

function Orb({ colors, bg }: { colors: string[]; bg: string }) {
  const background = `radial-gradient(circle at 30% 30%, ${colors[0]}, transparent 62%), radial-gradient(circle at 72% 55%, ${colors[2]}, transparent 60%), radial-gradient(circle at 40% 82%, ${colors[3]}, transparent 60%), ${bg}`;
  return <span className="block size-[52px] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.25)]" style={{ background }} />;
}

/** Every colour, for any mode, and the raag clock. */
function ColorChoices() {
  const palette = useStore(s => s.palette);
  const raagMode = useStore(s => s.raagMode);
  const prahar = useStore(s => s.prahar);
  const raag: Palette = resolvePalette(RAAG_CLOCK_ID, raagMode, prahar);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
      {[...FOCUS_PALETTES, ...SONG_PALETTES].map(p => (
        <Choice key={p.id} active={palette === p.id} label={p.name} onClick={() => setPalette(p.id)}>
          <Orb colors={p.colors} bg={p.bg} />
        </Choice>
      ))}
      <Choice active={palette === RAAG_CLOCK_ID} label="Raag" onClick={() => setPalette(RAAG_CLOCK_ID)}>
        <Orb colors={raag.colors} bg={raag.bg} />
      </Choice>
    </div>
  );
}

/** The mandala designs, each previewed, and a blank choice that removes it. */
function MandalaChoices() {
  const mandala = useStore(s => s.mandala);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
      <Choice active={mandala === 'none'} label="None" onClick={() => setMandala('none')}>
        <span className="block size-[52px] rounded-full border border-dashed border-ink-soft" />
      </Choice>
      {MANDALA_IDS.map(id => (
        <Choice key={id} active={mandala === id} label={MANDALA_NAMES[id]} onClick={() => setMandala(id)}>
          <span className="block size-[52px] overflow-hidden rounded-full bg-glass">
            <span
              className="block size-full scale-[.62] text-accent"
              dangerouslySetInnerHTML={{ __html: mandalaSvg(id) }}
            />
          </span>
        </Choice>
      ))}
    </div>
  );
}

function Choice({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-xs transition-colors duration-300 hover:bg-glass',
        active && 'bg-glass-strong',
      )}
    >
      <span className={cn('block rounded-full transition-shadow duration-300', active && 'shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--ink)]')}>
        {children}
      </span>
      {label}
    </button>
  );
}
