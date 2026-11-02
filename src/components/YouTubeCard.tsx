import { useEffect, useRef, useState } from 'react';
import { setYTHost, ytSoundOn, ytToggleSound } from '../audio/music';
import { closeYouTube } from '../app/session';
import { getState, useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { CloseIcon, SoundOffIcon, SoundOnIcon } from './icons';

/**
 * A small YouTube player with mute and close, in one row.
 * Bottom right on wide screens, under the top bar on phones.
 */
export function YouTubeCard() {
  const on = useStore(s => s.ytOn);
  const host = useRef<HTMLDivElement>(null);
  const [sound, setSound] = useState(false);
  const [hint, setHint] = useState(false);

  // The hint stays for 15 seconds after the card opens, or until the speaker is tapped.
  // It doesn't depend on the sound state: the player can report sound before anything is heard.
  useEffect(() => {
    if (!on) return setHint(false);
    setHint(true);
    const t = setTimeout(() => setHint(false), 15000);
    return () => clearTimeout(t);
  }, [on]);

  useEffect(() => {
    setYTHost(host.current);
    // follow the player, in case the browser changes its state
    const iv = setInterval(() => setSound(ytSoundOn()), 500);
    return () => {
      clearInterval(iv);
      setYTHost(null);
    };
  }, []);

  const toggleSound = () => {
    setHint(false);
    setSound(ytToggleSound(Math.round(getState().musicVol * 100)));
  };

  return (
    <div
      className={cn(
        'ui glass fixed z-[6] flex items-center gap-2.5 rounded-full py-2 pl-2 pr-2.5',
        'bottom-[84px] right-4 min-[1100px]:bottom-[max(16px,env(safe-area-inset-bottom))] min-[1100px]:right-6',
        'max-[700px]:bottom-auto max-[700px]:left-3 max-[700px]:right-auto max-[700px]:top-[84px]',
        on ? 'flex' : 'hidden',
      )}
    >
      {hint && (
        <p className="animate-hint pointer-events-none absolute -top-8 right-2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[11.5px] tracking-[.02em] text-bg max-[700px]:left-0 max-[700px]:right-auto max-[700px]:top-full max-[700px]:mt-2">
          Tap the speaker once or twice to start the sound
        </p>
      )}
      <div className="relative h-[45px] w-[80px] overflow-hidden rounded-lg bg-black">
        <div ref={host} className="h-full w-full [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0" />
      </div>
      <button
        type="button"
        aria-label={sound ? 'Mute YouTube' : 'Unmute YouTube'}
        title={sound ? 'Mute' : 'Unmute'}
        aria-pressed={sound}
        onClick={toggleSound}
        className="grid size-8 place-items-center rounded-full bg-ink text-bg transition-transform active:scale-[.94]"
      >
        {sound ? <SoundOnIcon className="size-4" /> : <SoundOffIcon className="size-4" />}
      </button>
      <button
        type="button"
        aria-label="Close YouTube player"
        title="Close"
        onClick={closeYouTube}
        className="glass grid size-8 place-items-center rounded-full hover:bg-glass-strong"
      >
        <CloseIcon className="size-3.5" />
      </button>
    </div>
  );
}
