/**
 * Decorative Churu skyline: muted moon, two layers of haveli / temple silhouettes,
 * a few lit windows and a desert horizon. Anchored to the bottom of its container
 * and cropped (not squashed) at narrow widths.
 */
const BACK = '#132d65'
const FRONT = '#0f2758'
const WINDOW = '#b99a5c'

export default function HeroSkyline({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1600 420"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="skyline-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4d4049" />
          <stop offset="0.45" stopColor="#3a3443" />
          <stop offset="1" stopColor="#2b2c42" />
        </linearGradient>
        <linearGradient id="skyline-ground-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4a4a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#3b3444" />
        </linearGradient>
      </defs>

      {/* Moon, partly behind the buildings */}
      <circle cx="1272" cy="226" r="110" fill="#5b6276" opacity="0.6" />

      {/* Back layer */}
      <g fill={BACK}>
        <rect x="0" y="232" width="80" height="188" />
        <rect x="60" y="268" width="70" height="152" />
        <rect x="248" y="248" width="176" height="172" />
        <rect x="300" y="214" width="70" height="40" />
        <path d="M424 300h120v120H424z" />
        <rect x="980" y="262" width="90" height="158" />
        <rect x="1250" y="244" width="190" height="176" />
        <rect x="1490" y="214" width="110" height="206" />
      </g>

      {/* Front layer — left: domed tower */}
      <g fill={FRONT}>
        <path d="M148 420V222l12-16h52l12 16v198z" />
        <rect x="181" y="186" width="10" height="24" />
        <circle cx="186" cy="174" r="22" />
        <rect x="183" y="140" width="6" height="14" />
        <path d="M118 420V300h40v120z" />
        <path d="M224 420V286h60v134z" />
        <path d="M232 286q22-30 44 0z" />

        {/* centre: haveli with stepped roof and temple spire */}
        <path d="M560 420V300h40v-20h80v-50h140v50h80v20h40v120z" />
        <path d="M680 232l70-62 70 62z" />
        <circle cx="750" cy="160" r="14" />
        <rect x="747" y="128" width="6" height="22" />
        <path d="M586 300q20-28 40 0z" />
        <path d="M874 300q20-28 40 0z" />
        <path d="M610 280h30v-10q-15-18-30 0z" />
        <path d="M860 280h30v-10q-15-18-30 0z" />

        {/* right: domed hall, pointed tower, domed minaret */}
        <path d="M1040 420V290h170v130z" />
        <path d="M1062 290a63 50 0 0 1 126 0z" />
        <rect x="1121" y="226" width="8" height="18" />
        <path d="M1166 420V196h96v224z" />
        <path d="M1156 200l58-58 58 58z" />
        <path d="M1430 420V236h70v184z" />
        <circle cx="1465" cy="208" r="26" />
        <rect x="1462" y="168" width="6" height="16" />
        <path d="M1500 420V300h100v120z" />
      </g>

      {/* Lit windows */}
      <g fill={WINDOW} opacity="0.75">
        <rect x="92" y="330" width="10" height="16" rx="5" />
        <rect x="262" y="344" width="10" height="16" rx="5" />
        <rect x="742" y="262" width="12" height="18" rx="6" />
        <rect x="1206" y="330" width="10" height="16" rx="5" />
        <rect x="1426" y="346" width="10" height="16" rx="5" />
        <rect x="1556" y="330" width="10" height="16" rx="5" />
      </g>

      {/* Desert horizon */}
      <path d="M0 322C220 300 430 306 650 318s420 4 620-10 250-12 330-8v120H0z" fill="url(#skyline-ground-far)" />
      <path d="M0 352c260-16 520-10 800-2s520 8 800-6v76H0z" fill="url(#skyline-ground)" />
    </svg>
  )
}
