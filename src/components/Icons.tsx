import type { ReactNode } from 'react';

const Svg = ({ children, sw = 2 }: { children: ReactNode; sw?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconFlame = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.6 2.2c.6 3.3-1.2 5.1-2.8 6.8C8.2 10.6 6.5 12.4 6.5 15.2 6.5 19 9 22 12.3 22c3.4 0 5.9-2.8 5.9-6.6 0-2.7-1.2-4.6-2.5-5.9.1 1.7-.5 3-1.6 3.6.3-3.6-.4-7.6-1.5-10.9z" />
  </svg>
);
export const IconGear = () => (
  <Svg>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2.2" />
    <circle cx="9" cy="17" r="2.2" />
  </Svg>
);
export const IconHome = () => (
  <Svg>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 9.8V20h4.5v-5.5h4V20h4.5V9.8" />
  </Svg>
);
export const IconMap = () => (
  <Svg>
    <circle cx="6" cy="18" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" />
  </Svg>
);
export const IconCards = () => (
  <Svg>
    <rect x="3" y="7" width="14" height="14" rx="2.5" />
    <path d="M7 3.5h11.5A2.5 2.5 0 0 1 21 6v11.5" />
  </Svg>
);
export const IconSound = () => (
  <Svg>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </Svg>
);
export const IconMic = () => (
  <Svg>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </Svg>
);
export const IconX = () => (
  <Svg>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconCheck = () => (
  <Svg sw={3}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const IconLock = () => (
  <Svg>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const IconMenu = () => (
  <Svg>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </Svg>
);
export const IconBack = () => (
  <Svg>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
