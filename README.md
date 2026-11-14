# pause a little

A calm focus timer, generative ambient sound, and a quiet room for Indian classical music, in one app.

## Run it

```bash
npm install
npm run dev        # local development at http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

The app needs to be served over http (dev server, `npm run preview`, or a host such as Netlify or Vercel). It no longer runs by opening a file from disk.

## Where things live

```
src/
  App.tsx                  the page: keyboard shortcuts, the palette, the toast
  app/session.ts           the one controller: timer, sound, music queue, words, stats
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
| R | reset |
| C | motivation corner on / off |
| M | sound on / off |
| P | next colour palette |
| N | next mood (ambient) or next track (music) |
| D | tanpura drone on / off |
| L | open / close the Atmosphere sheet |
| F | fullscreen |
| Esc | close the sheet |

## The mandala

In Raag mode a mandala turns behind the clock. Outer rings turn slowly, inner ones faster, in alternating directions, with a soft glow at the centre. Settings → Screen → *Mandala spin* (Still / Slow / Flowing / Lively) sets the speed. It eases almost still when you pause, glows a little brighter in the last three minutes, blooms once when a session finishes, and swells gently with the music's beat. It respects reduced-motion settings.

## Saved data

Preferences, saved YouTube tracks, and daily focus stats are kept in this browser's localStorage, under the same keys the original pages used (`drift:*` and `raag:*`), so existing data carries over when the app is served from the same address.
