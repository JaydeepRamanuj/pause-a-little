import { useEffect, useRef } from 'react';
import { setYTHost } from '../audio/music';
import { useStore } from '../lib/store';
import { cn } from '../lib/cn';

/** The YouTube player. Its own small window stays visible while a YouTube track plays. */
export function YouTubeCard() {
  const on = useStore(s => s.ytOn);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setYTHost(host.current);
    return () => setYTHost(null);
  }, []);

  return (
    <div
      className={cn(
        'glass fixed right-6 top-[100px] z-[6] h-[140px] w-[248px] overflow-hidden rounded-[18px] border-glass-border bg-black shadow-[0_18px_50px_rgba(0,0,0,.25)]',
        'max-[700px]:bottom-[84px] max-[700px]:right-4 max-[700px]:top-auto max-[700px]:h-[113px] max-[700px]:w-[200px]',
        on ? 'block' : 'hidden',
      )}
    >
      <div ref={host} className="h-full w-full [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0" />
    </div>
  );
}
