# pause a little

A calm focus timer, generative ambient sound, and a quiet room for Indian classical music, in one app.

## Run it

```bash
npm install
npm run dev        # local development at http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build locally
npm test           # unit tests (Vitest): timer maths, stats and streaks
```

The app needs to be served over http (dev server, `npm run preview`, or a host such as Netlify or Vercel). It no longer runs by opening a file from disk.

## Where things live

```
src/
  App.tsx                  the page: keyboard shortcuts, the palette, the toast
  app/session.ts           re-exports the controller parts below, plus boot()
  app/timer.ts             the focus timer (start, pause, reset, finish) and session logging
  app/sound.ts             tracks, music queue, ambient, tanpura, volumes
  app/words.ts             the lines, languages and personal lines
  app/stats.ts             the session log in localStorage and the totals
  app/ui.ts                toasts, zen, clean screen, settings sheet, look settings
  app/timerMath.ts         pure timer maths (phases, status message)  — tested
  app/statsMath.ts         pure stats maths (log, totals, streak)  — tested
  audio/
    context.ts             the single AudioContext both sound engines share
    ambient.ts             generative moods (pads, bells, rain, ocean)
    music.ts               your audio files, YouTube, tanpura drone, raag bell
  components/              Scene (background), TopBar, Focus (the timer card),
                           Dock (sound bar), Words (motivation corner), Sheet, YouTubeCard
  data/
    palettes.ts            every colour palette, copied from the two original rooms
    moods.ts               ambient mood definitions
    words.ts               calm lines, personal lines, poems and sayings
    tracks.ts              YOUR MUSIC: the list of tracks
  lib/                     store, storage (same localStorage keys as before), theme helpers
legacy/                    the original index.html, timer.html and raag.html, for reference
```

## Adding your own music

Open `src/data/tracks.ts` and add a line to `RAAG_TRACKS`:

- **A file in this project:** put it in `public/songs/` and use `file: 'songs/your-file.mp3'`.
- **A hosted file:** use its full link, for example from Cloudinary.
- **A YouTube video:** use `youtube: 'https://youtube.com/watch?v=…'`.

Add `time: 'dawn' | 'day' | 'dusk' | 'night'` to have a track marked "suits now" at that hour.

## Keyboard

| Key | Action |
|---|---|
| Space | start / pause the session |
| R | reset (starts the cycle again) |
| B | skip the break |
| C | motivation corner on / off |
| M | sound on / off |
| P | next colour palette |
| N | next mood (ambient) or next track (music) |
| D | tanpura drone on / off |
| L | open / close the Atmosphere sheet |
| F | fullscreen |
| Esc | close the sheet |

## Focus and break cycles

Focus (25 min by default, set with the chips on the timer), then a short break (5 min), with a long break (15 min) every 4th round. Dots under the time show how far through the cycle you are. All of it is in Settings → *Focus & breaks*: break lengths, how often the long break comes, and an off switch for a single plain timer.

- **Breaks look and sound different:** a softer sage palette and dial colour, and a lighter sound (the tanpura alone in Raag, an open ambient mood otherwise).
- **Guided breathing** on breaks: Box 4-4-4-4, 4-7-8 or Slow (4 in, 6 out), or off. The disc behind the time and the mandala grow and shrink with the breath, with *Breathe in / Hold / Breathe out* text. With reduced motion only the text changes.
- **Look-back** after a focus session: one to three dots (Scattered / Steady / Deep) and an optional note, saved on the session in `drift:sessions` (`feel`, `note`). Skippable.
- **Start next automatically** begins the next block by itself (it waits a little longer if the look-back is showing). *Skip break* (or B) goes straight back to focus.
- Only focus time is logged; breaks are not.

## The mandala

In Raag mode a mandala turns behind the clock. Outer rings turn slowly, inner ones faster, in alternating directions, with a soft glow at the centre. Settings → Screen → *Mandala spin* (Still / Slow / Flowing / Lively) sets the speed. It eases almost still when you pause, glows a little brighter in the last three minutes, blooms once when a session finishes, and swells gently with the music's beat. It respects reduced-motion settings.

## Saved data

Preferences, saved YouTube tracks, and your session history are kept in this browser's localStorage, under the same keys the original pages used (`drift:*` and `raag:*`), so existing data carries over when the app is served from the same address.

### Session history

Every session is logged under `drift:sessions` (start time, minutes, intention, mode, mood or track, whether the timer ran out, and the look-back if you gave one). A session you stop early (reset or close the tab) is logged with the real time spent if it was **5 minutes or more**; shorter ones are not counted. A year of history is kept. The old per-day log (`drift:log`) is carried over once and left in place.
