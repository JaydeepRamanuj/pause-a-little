// Icons copied from the originals. Filled ones use currentColor, line ones are 1.6px strokes.

import type { ReactNode } from 'react';

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function Svg({ children, className, fill = 'none', strokeWidth = 1.6 }: IconProps & { children: ReactNode; fill?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={fill}
      stroke={fill === 'none' ? 'currentColor' : undefined}
      strokeWidth={fill === 'none' ? strokeWidth : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor">
    <path d="M8.5 5.8v12.4c0 .6.7 1 1.2.7l9.6-6.2c.5-.3.5-1.1 0-1.4L9.7 5.1c-.5-.3-1.2.1-1.2.7z" />
  </Svg>
);

export const PauseIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor">
    <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
  </Svg>
);

export const SoundOnIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
    <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
  </Svg>
);

export const SoundOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Svg>
);

export const ResetIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4h4" />
  </Svg>
);

export const FullscreenIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Svg>
);

export const NoteIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 18V6l11-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
);

export const CornerIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor">
    <path d="M10 7.5c-2.9.7-4.6 2.9-4.6 6v3.3c0 .5.4.9.9.9h3.4c.5 0 .9-.4.9-.9v-3.4c0-.5-.4-.9-.9-.9H8c.1-1.7 1-2.8 2.4-3.3.3-.1.5-.4.4-.8l-.2-.6c-.1-.3-.4-.4-.6-.3zm8 0c-2.9.7-4.6 2.9-4.6 6v3.3c0 .5.4.9.9.9h3.4c.5 0 .9-.4.9-.9v-3.4c0-.5-.4-.9-.9-.9H16c.1-1.7 1-2.8 2.4-3.3.3-.1.5-.4.4-.8l-.2-.6c-.1-.3-.4-.4-.6-.3z" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.8}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const PrevIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor">
    <path d="M7 6h2v12H7zM18 6.8v10.4c0 .6-.7 1-1.2.6l-7.4-5.2c-.4-.3-.4-.9 0-1.2l7.4-5.2c.5-.4 1.2 0 1.2.6z" />
  </Svg>
);

export const NextIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor">
    <path d="M15 6h2v12h-2zM6 6.8v10.4c0 .6.7 1 1.2.6l7.4-5.2c.4-.3.4-.9 0-1.2L7.2 6.2C6.7 5.8 6 6.2 6 6.8z" />
  </Svg>
);

export const TanpuraIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.5}>
    <path d="M12 2.5v10" />
    <ellipse cx="12" cy="17" rx="5" ry="4.5" />
    <path d="M10 3.5h4M10.5 13h3" />
    <path d="M9.5 9v3.5M14.5 9v3.5" opacity=".5" />
  </Svg>
);

export const ListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h12M4 11h12M4 16h7" />
    <path d="M17 13.5v6" />
    <circle cx="15" cy="19.5" r="2" />
  </Svg>
);

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const UploadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v3.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V15" />
  </Svg>
);

export const ColorIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v8.5l5 3" />
  </Svg>
);

export const LotusIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor">
    <path d="M12 3c1.6 2.2 2.4 4.4 2.4 6.4 0 1.6-.8 2.9-2.4 3.8-1.6-.9-2.4-2.2-2.4-3.8C9.6 7.4 10.4 5.2 12 3zM4 10c2.5.2 4.6 1 6.2 2.6.9.9 1.5 2 1.8 3.4-1.6.4-3 .3-4.3-.4C6 14.7 4.8 12.8 4 10zm16 0c-.8 2.8-2 4.7-3.7 5.6-1.3.7-2.7.8-4.3.4.3-1.4.9-2.5 1.8-3.4C15.4 11 17.5 10.2 20 10zM6 18.5h12c-1.5 1.6-3.5 2.5-6 2.5s-4.5-.9-6-2.5z" />
  </Svg>
);

export const ScreenIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <circle cx="12" cy="12" r="2.5" />
  </Svg>
);

export const WaveIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
  </Svg>
);

export const TimerIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 13V9M9.5 3h5M12 3v2.5" />
  </Svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c4.5 0 8 4 9 6-.4.9-1.1 2-2.2 3.1M6.6 7.6C4.6 9 3.3 10.8 3 12c1 2 4.5 6 9 6 1.4 0 2.7-.4 3.8-1" />
  </Svg>
);
