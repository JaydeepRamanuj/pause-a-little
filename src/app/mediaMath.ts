// What the lock screen, headphones and media keys show. Pure, so it can be tested.

export interface MediaInfo {
  title: string;
  artist: string;
  album: string;
}

/**
 * `sound` is the track or mood name, `intent` the focus intention, `onBreak` true during a break.
 * The title is what is playing; the album carries the intention (or the break).
 */
export function mediaInfo(sound: string | null, intent: string, onBreak: boolean, minutes: number): MediaInfo {
  const album = onBreak ? "Break" : intent.trim() || (minutes ? `${minutes} min focus` : "Focus");
  return { title: sound || (onBreak ? "A little pause" : "Focus"), artist: "pause a little", album };
}
