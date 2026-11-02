import { motion } from 'motion/react';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';

/** The motivation corner: calm lines, poems and sayings, one at a time. */
export function Words() {
  const line = useStore(s => s.line);
  const shown = useStore(s => s.lineShown);
  const corner = useStore(s => s.words.mode === 'corner');
  // Devanagari and Gujarati lines are set larger, as poems
  const poem = !!line && (line.poem || /[ऀ-૿]/.test(line.text));

  return (
    <section
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed inset-0 z-[3] place-items-center px-[26px] pb-[190px] pt-[max(90px,calc(env(safe-area-inset-top)_+_80px))] text-center min-[760px]:px-14 min-[760px]:pb-[120px] min-[760px]:pt-[110px]',
        corner ? 'grid' : 'hidden',
      )}
    >
      <motion.blockquote
        className="m-0 max-w-[min(800px,94vw)]"
        initial={false}
        animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 10, filter: shown ? 'blur(0px)' : 'blur(2px)' }}
        transition={{ duration: 2.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <p
          className={cn(
            'm-0 whitespace-pre-line font-display font-light text-balance text-[clamp(27px,4.4vw,48px)] leading-[1.32] tracking-[-.005em]',
            poem && 'text-[clamp(23px,3.5vw,38px)] leading-[1.6] tracking-normal',
          )}
        >
          {line?.text}
        </p>
        {line?.mean && (
          <p className="mx-auto mt-[22px] max-w-[560px] font-display text-[clamp(15px,1.8vw,18px)] font-light italic leading-[1.55] text-ink-soft">
            {line.mean}
          </p>
        )}
        {line?.by && (
          <p className="mt-4 text-[11.5px] uppercase tracking-[.2em] text-ink-soft">
            <span className="mr-2.5 inline-block h-px w-[22px] align-middle opacity-60" style={{ background: 'currentColor' }} />
            {line.by}
          </p>
        )}
      </motion.blockquote>
    </section>
  );
}
