import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { exportData, hm, importData, loadSessions, setHistory } from '../app/session';
import { byHour, heatmap, lastDays, longestStreak, thisMonth, topItems, totalMin } from '../app/historyMath';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { Heading } from './controls';
import { CloseIcon } from './icons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FEEL = ['', 'Scattered', 'Steady', 'Deep'];
// heat levels use the accent colour at growing strength
const HEAT = ['var(--glass)', 'color-mix(in srgb, var(--accent) 22%, transparent)', 'color-mix(in srgb, var(--accent) 42%, transparent)', 'color-mix(in srgb, var(--accent) 66%, transparent)', 'var(--accent)'];

/** The History page: a year of focus at a glance, your rhythms, and every session. */
export function History() {
  const open = useStore(s => s.history);
  const goal = useStore(s => s.goal);
  const stats = useStore(s => s.stats); // changes when a session is logged, so the page refreshes
  // read the log only while the page is open
  const recs = useMemo(() => (open ? loadSessions() : []), [open, stats]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        onClick={() => setHistory(false)}
        className="fixed inset-0 z-[9] bg-black/[.18]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="History"
        aria-hidden={!open}
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 16 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        className="fixed inset-x-3 bottom-3 top-[max(64px,calc(env(safe-area-inset-top)_+_56px))] z-10 mx-auto flex max-w-[860px] flex-col overflow-hidden rounded-3xl border border-glass-border sheet-surface shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur-[24px] backdrop-saturate-[1.3]"
      >
        <div className="themed-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pb-[22px] pt-5">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-display text-[22px] font-normal">History</h2>
            <button type="button" aria-label="Close" onClick={() => setHistory(false)} className="glass grid size-9 place-items-center rounded-full hover:bg-glass-strong">
              <CloseIcon className="size-4" />
            </button>
          </div>
          {open && <Body recs={recs} goal={goal} />}
        </div>
      </motion.section>
    </>
  );
}

function Body({ recs, goal }: { recs: ReturnType<typeof loadSessions>; goal: number }) {
  const week = lastDays(recs, 7);
  const month = thisMonth(recs);
  const best = longestStreak(recs);
  const hours = useMemo(() => byHour(recs), [recs]);
  const moods = topItems(recs, r => r.mood);
  const raags = topItems(recs, r => r.mode === 'raag' ? r.track : null);
  const list = useMemo(() => [...recs].sort((a, b) => b.start - a.start).slice(0, 200), [recs]);

  if (!recs.length) {
    return (
      <>
        <p className="mt-8 text-center text-[13px] leading-relaxed text-ink-soft">
          Nothing here yet. Finish a focus session (or stop one after 5 minutes) and it will show up.
        </p>
        <DataSection />
      </>
    );
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card value={hm(week.min)} label="Last 7 days" sub={`${week.n} sessions`} />
        <Card value={hm(month.min)} label="This month" sub={`${month.n} sessions`} />
        <Card value={`${best} day${best === 1 ? '' : 's'}`} label="Longest streak" />
        <Card value={hm(totalMin(recs))} label="Kept in total" sub={`${recs.length} sessions`} />
      </div>

      <Heading>This year</Heading>
      <Heat recs={recs} goal={goal} />

      <Heading>When you focus</Heading>
      <Hours hours={hours} />

      <div className="grid gap-x-6 sm:grid-cols-2">
        <div>
          <Heading>Top moods</Heading>
          <Bars items={moods} />
        </div>
        <div>
          <Heading>Top raags &amp; tracks</Heading>
          <Bars items={raags} empty="Raag tracks you focus with will show here." />
        </div>
      </div>

      <Heading>Sessions</Heading>
      <ul className="m-0 list-none p-0">
        {list.map(r => <Row key={r.start} r={r} />)}
      </ul>
      {recs.length > list.length && <p className="mt-2 text-center text-[11.5px] text-ink-soft">Showing the latest {list.length} sessions.</p>}

      <DataSection />
    </>
  );
}

function Card({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl px-2 py-3 text-center">
      <b className="block font-display text-[24px] font-light leading-[1.1]">{value}</b>
      <span className="mt-1 block text-[10.5px] uppercase tracking-[.14em] text-ink-soft">{label}</span>
      {sub && <span className="mt-0.5 block text-[11px] text-ink-soft opacity-80">{sub}</span>}
    </div>
  );
}

/** Year heatmap: one column per week, Monday at the top. */
function Heat({ recs, goal }: { recs: ReturnType<typeof loadSessions>; goal: number }) {
  const cols = useMemo(() => heatmap(recs, goal), [recs, goal]);
  const [tip, setTip] = useState<string | null>(null);
  // on a narrow screen, start at the latest weeks
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ left: 1e5 }); }, []);
  // a month label above the first week that starts in that month
  const labels = cols.map((c, i) => {
    const m = +c[0].day.slice(5, 7) - 1;
    const prev = i ? +cols[i - 1][0].day.slice(5, 7) - 1 : -1;
    return m !== prev ? MONTHS[m] : '';
  });
  return (
    <div>
      <div ref={scroller} className="themed-scroll overflow-x-auto pb-1">
        <div className="flex min-w-max gap-[3px]" role="img" aria-label="Focus minutes per day over the last year">
          {cols.map((c, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              <span className="h-3 text-[9.5px] leading-3 text-ink-soft">{labels[i]}</span>
              {c.map(cell => (
                <span
                  key={cell.day}
                  onPointerEnter={() => setTip(cell.future ? null : `${cell.day} · ${cell.min ? hm(cell.min) : 'nothing'}${cell.n > 1 ? ` · ${cell.n} sessions` : ''}`)}
                  onPointerLeave={() => setTip(null)}
                  title={cell.future ? undefined : `${cell.day}: ${cell.min}m`}
                  className="size-[11px] rounded-[3px] border border-glass-border/40"
                  style={{ background: cell.future ? 'transparent' : HEAT[cell.level], borderColor: cell.future ? 'transparent' : undefined }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-1.5 min-h-[1.3em] text-[11.5px] text-ink-soft">
        {tip ?? (goal ? `Darker means closer to your ${hm(goal)} goal.` : 'Darker means more minutes.')}
      </p>
    </div>
  );
}

/** Minutes by hour of the day. */
function Hours({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  return (
    <div>
      <div className="flex h-[84px] items-end gap-[3px]" role="img" aria-label="Focus minutes by hour of the day">
        {hours.map((m, h) => (
          <div key={h} className="flex h-full flex-1 items-end" title={`${h}:00 · ${m}m`}>
            <div className="w-full rounded-t-[3px]" style={{ height: `${Math.max(m ? 6 : 2, (m / max) * 100)}%`, background: m ? 'var(--accent)' : 'var(--track)', opacity: m ? 0.35 + 0.65 * (m / max) : 0.5 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-soft"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div>
    </div>
  );
}

function Bars({ items, empty = 'Nothing yet.' }: { items: { name: string; min: number; n: number }[]; empty?: string }) {
  if (!items.length) return <p className="text-[12px] text-ink-soft">{empty}</p>;
  const max = items[0].min || 1;
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {items.map(t => (
        <li key={t.name} className="text-[12.5px]">
          <div className="flex justify-between gap-3"><span className="truncate">{t.name}</span><span className="flex-none text-ink-soft">{hm(t.min)}</span></div>
          <div className="mt-1 h-1 rounded-full bg-track"><div className="h-full rounded-full bg-accent" style={{ width: `${(t.min / max) * 100}%`, opacity: 0.7 }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Row({ r }: { r: ReturnType<typeof loadSessions>[number] }) {
  const d = new Date(r.start);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = r.legacy ? '' : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const what = r.mode === 'raag' ? r.track : r.mood;
  return (
    <li className="border-b border-glass-border/60 py-2.5 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-display text-[15px] italic">{r.intent || (r.legacy ? 'Earlier session' : 'No intention')}</span>
        <span className="flex-none text-[13px] tabular-nums">{hm(r.min)}{!r.completed && <span className="text-ink-soft"> · ended early</span>}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11.5px] text-ink-soft">
        <span>{day}{time && ` · ${time}`}</span>
        {r.mode && <span>· {r.mode === 'raag' ? 'Raag' : r.mode === 'songs' ? 'Calm songs' : 'Ambient'}{what ? ` · ${what}` : ''}</span>}
        {r.feel && <span>· {FEEL[r.feel]}</span>}
      </div>
      {r.note && <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">“{r.note}”</p>}
    </li>
  );
}

/** Export and import everything as one JSON file. */
export function DataSection({ className }: { className?: string }) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const pick = async (f: File | undefined) => {
    if (!f) return;
    if (!confirm('Replace everything in this browser (settings, saved tracks, history) with this backup?')) return;
    const err = await importData(f);
    if (err) setMsg(err);
  };
  return (
    <div className={className}>
      <Heading>Your data</Heading>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportData} className={cn(btn)}>Export everything</button>
        <button type="button" onClick={() => file.current?.click()} className={cn(btn)}>Import a backup</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft" role="status">
        {msg || 'One JSON file with your settings, saved tracks and session history. Importing replaces what is in this browser.'}
      </p>
    </div>
  );
}

const btn = 'glass h-10 rounded-full px-4 text-[13px] hover:bg-glass-strong';

