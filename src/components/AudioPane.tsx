import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { MOODS } from '../data/moods';
import { SONGS_COLLECTIONS, TIME_LABEL, type Collection } from '../data/tracks';
import type { Prahar } from '../data/palettes';
import {
  addFiles, addYouTube, allTracks, playChapter, removeTrack, selectTrack, setMood, setMusicMode, setSongsPanel,
  YOUR_SONGS, type Track,
} from '../app/session';
import { useStore } from '../lib/store';
import type { MusicMode } from '../lib/store';
import { cn } from '../lib/cn';
import { Chip } from './Focus';
import { Heading, Seg, fieldClass } from './controls';
import { Waves } from './NowPlaying';
import { CloseIcon, UploadIcon } from './icons';

const SOURCE_TITLE = { ambient: 'Ambient', raag: 'Raag', songs: 'Calm songs' } as const;

/**
 * The audio selector, opened from the audio card and placed just above it. Ambient lists its
 * moods. Raag and Calm songs share one design: add a link or files, see what is playing, and
 * pick from the list.
 */
export function AudioPane() {
  const open = useStore(s => s.songsOpen);
  const source = useStore(s => s.source);
  return (
    <>
      <motion.div
        aria-hidden="true"
        onClick={() => setSongsPanel(false)}
        className="fixed inset-0 z-[9]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="Audio"
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 12 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        // just above the audio card, which sits 16px from the bottom
        className="themed-scroll fixed bottom-[88px] left-1/2 z-10 flex max-h-[calc(100dvh_-_200px)] w-[min(460px,calc(100vw_-_24px))] -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-glass-border sheet-surface shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur-[24px] backdrop-saturate-[1.3]"
      >
        <div className="themed-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-display text-[20px] font-normal">{SOURCE_TITLE[source]}</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSongsPanel(false)}
              className="glass grid size-8 place-items-center rounded-full hover:bg-glass-strong"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>

          {source === 'ambient' ? (
            <MoodGrid />
          ) : (
            <>
              <AddBar group={source} />
              <NowPlayingRow />
              {source === 'raag' ? <RaagList /> : <CalmList />}
            </>
          )}
        </div>
      </motion.section>
    </>
  );
}

/** Add a YouTube link or your own files, to the sound type you are in. */
function AddBar({ group }: { group: 'raag' | 'songs' }) {
  const [form, setForm] = useState(false);
  const files = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setForm(!form)}
          aria-expanded={form}
          className="glass inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[12.5px] hover:bg-glass-strong"
        >
          + YouTube link
        </button>
        <button
          type="button"
          onClick={() => files.current?.click()}
          className="glass inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[12.5px] hover:bg-glass-strong"
        >
          <UploadIcon className="size-3.5" />
          Your audio
        </button>
        <input
          ref={files} type="file" accept="audio/*" multiple hidden
          onChange={e => {
            if (e.target.files?.length) addFiles(e.target.files, group);
            e.target.value = '';
          }}
        />
      </div>
      {form && <YouTubeForm group={group} onDone={() => setForm(false)} />}
    </>
  );
}

function YouTubeForm({ group, onDone }: { group: 'raag' | 'songs'; onDone: () => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const add = () => {
    if (addYouTube(url, title, (time || undefined) as Prahar | undefined, group)) {
      setUrl('');
      setTitle('');
      onDone();
    }
  };
  return (
    <div className="mt-2.5 grid gap-2">
      <input
        type="url" value={url} onChange={e => setUrl(e.target.value)} autoFocus
        placeholder="Paste a YouTube link" autoComplete="off" spellCheck={false} aria-label="YouTube link"
        className={fieldClass}
      />
      <div className="flex gap-2">
        <input
          type="text" maxLength={60} value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          placeholder="Title (optional)" autoComplete="off" aria-label="Title"
          className={cn(fieldClass, 'min-w-0 flex-1')}
        />
        <select
          value={time} onChange={e => setTime(e.target.value)} aria-label="Best time"
          className={cn(fieldClass, 'w-auto cursor-pointer pr-7')}
        >
          <option value="">Any time</option>
          {(Object.keys(TIME_LABEL) as Prahar[]).map(p => <option key={p} value={p}>{TIME_LABEL[p]}</option>)}
        </select>
        <button type="button" onClick={add} className="h-10 flex-none rounded-full bg-ink px-4 text-[13px] text-bg">Add</button>
      </div>
    </div>
  );
}

/** What is playing now, with its waves, so you can see it in the list too. */
function NowPlayingRow() {
  const playing = useStore(s => s.timer === 'running');
  const track = useStore(s => allTracks(s).find(t => t.key === s.musicKey) ?? null);
  const chapter = useStore(s => s.musicChapter);
  if (!track) return null;
  const song = track.chapters && chapter !== null ? track.chapters[chapter]?.title : null;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-glass-strong px-3.5 py-2.5">
      <Waves playing={playing} />
      <div className="min-w-0 flex-1">
        <span className="block text-[10.5px] uppercase tracking-[.16em] text-ink-soft">Now playing</span>
        <b className="block truncate text-sm font-normal">{song ?? track.title}</b>
      </div>
    </div>
  );
}

/** One line in a list: waves when it is the one playing, and an optional remove. */
function Row({ title, sub, right, active, playing, onClick, onRemove }: {
  title: string; sub?: string; right?: string; active: boolean; playing: boolean;
  onClick: () => void; onRemove?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-300 hover:bg-glass-strong',
        active ? 'bg-glass-strong' : 'glass',
      )}
    >
      <span className="flex h-4 w-5 flex-none items-center justify-center">
        {active ? <Waves playing={playing} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm font-normal">{title}</b>
        {sub && <span className="mt-0.5 block truncate text-[11.5px] text-ink-soft">{sub}</span>}
      </span>
      {right && <span className="flex-none text-[11px] text-ink-soft tabular-nums">{right}</span>}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="grid size-7 flex-none place-items-center rounded-full text-ink-soft hover:bg-glass-strong hover:text-ink"
        >
          <CloseIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** Raag: the playlist, with the order choice. */
function RaagList() {
  const all = useStore(s => allTracks(s)); // cached, so stable between renders
  const musicKey = useStore(s => s.musicKey);
  const timer = useStore(s => s.timer);
  const mode = useStore(s => s.musicMode);
  const prahar = useStore(s => s.prahar);
  const tracks = all.filter(t => !t.collection);
  return (
    <>
      <Heading>Playlist</Heading>
      <div className="flex flex-col gap-1.5">
        {tracks.length
          ? tracks.map(t => (
            <Row
              key={t.key}
              title={t.title}
              sub={[t.kind === 'yt' ? 'YouTube' : t.origin === 'session' ? 'This visit' : 'Your audio', t.time === prahar ? 'suits now' : ''].filter(Boolean).join(' · ')}
              active={musicKey === t.key}
              playing={timer === 'running' && musicKey === t.key}
              onClick={() => selectTrack(t.key)}
              onRemove={t.origin !== 'fixed' ? () => removeTrack(t.key) : undefined}
            />
          ))
          : <p className="px-0.5 text-[13px] text-ink-soft">No music yet. Add a YouTube link or your own audio above.</p>}
      </div>
      <Seg<MusicMode>
        className="mt-3"
        value={mode}
        onChange={setMusicMode}
        options={[['order', 'In order'], ['shuffle', 'Shuffle'], ['one', 'Repeat one']]}
      />
    </>
  );
}

/** Calm songs: your own links and files, then the long videos and their songs. */
function CalmList() {
  const all = useStore(s => allTracks(s)); // cached, so stable between renders
  const musicKey = useStore(s => s.musicKey);
  const timer = useStore(s => s.timer);
  const yours = all.filter(t => t.collection === YOUR_SONGS);
  return (
    <>
      {yours.length > 0 && (
        <>
          <Heading>{YOUR_SONGS}</Heading>
          <div className="flex flex-col gap-1.5">
            {yours.map(t => (
              <Row
                key={t.key}
                title={t.title}
                sub={t.kind === 'yt' ? 'YouTube' : 'Your audio'}
                active={musicKey === t.key}
                playing={timer === 'running' && musicKey === t.key}
                onClick={() => selectTrack(t.key)}
                onRemove={() => removeTrack(t.key)}
              />
            ))}
          </div>
        </>
      )}
      {SONGS_COLLECTIONS.map(c => <CollectionBlock key={c.title} collection={c} />)}
      {yours.length === 0 && SONGS_COLLECTIONS.every(c => !all.some(t => t.collection === c.title)) && (
        <p className="mt-3 text-[13px] text-ink-soft">Add a YouTube link or your own audio above. The Chill Songs collection appears here once its links are added.</p>
      )}
    </>
  );
}

/** One collection: pick a volume, then a song. */
function CollectionBlock({ collection }: { collection: Collection }) {
  const [vol, setVol] = useState(0);
  const all = useStore(s => allTracks(s)); // cached, so stable between renders
  const video = all.find(t => t.collection === collection.title && t.title === collection.videos[vol]?.title);
  const hasAny = all.some(t => t.collection === collection.title);
  if (!hasAny) return null;
  return (
    <section className="mt-4">
      <Heading>{collection.title}</Heading>
      <div className="flex flex-wrap gap-2">
        {collection.videos.map((v, i) => (
          <Chip key={v.title} active={vol === i} onClick={() => setVol(i)}>{v.title}</Chip>
        ))}
      </div>
      <div className="mt-2.5">{video && <ChapterRows track={video} />}</div>
    </section>
  );
}

/** The songs inside a long video, each a jump point. */
function ChapterRows({ track }: { track: Track }) {
  const musicKey = useStore(s => s.musicKey);
  const timer = useStore(s => s.timer);
  const current = useStore(s => (s.musicKey === track.key ? s.musicChapter : null));
  const chapters = track.chapters ?? [];
  return (
    <div className="flex flex-col gap-1.5">
      {chapters.map((c, i) => (
        <Row
          key={`${c.start}-${i}`}
          title={c.title}
          right={fmtStart(c.start)}
          active={current === i}
          playing={timer === 'running' && musicKey === track.key && current === i}
          onClick={() => playChapter(track, i)}
        />
      ))}
    </div>
  );
}

const fmtStart = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
};

function MoodGrid() {
  const mood = useStore(s => s.mood);
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        {MOODS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMood(m.id, true)}
            aria-pressed={m.id === mood}
            className={cn(
              'rounded-2xl p-3 text-left transition-colors duration-300',
              m.id === mood ? 'bg-ink text-bg' : 'glass hover:bg-glass-strong',
            )}
          >
            <b className="mb-[3px] block text-sm font-medium">{m.name}</b>
            <span className={cn('block text-xs leading-snug', m.id === mood ? 'opacity-75' : 'text-ink-soft')}>{m.desc}</span>
          </button>
        ))}
      </div>
      <p className="mx-0.5 mt-3 text-[11.5px] leading-relaxed text-ink-soft">
        Tap a sound to hear a short preview. Everything is composed live in your browser, so it never repeats. Your name and lines stay on this device only.
      </p>
    </>
  );
}

