import { Landmark } from 'lucide-react'
import { cn } from '../lib/format'

/** Civic logo tile used in the top header, admin sidebar and login page. */
export function LogoTile({ className }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/[0.07] text-white',
        className,
      )}
      aria-hidden="true"
    >
      <Landmark className="h-[55%] w-[55%]" strokeWidth={1.75} />
    </span>
  )
}

/** Small saffron emblem loosely shaped like the outline of Rajasthan. */
export function StateEmblem({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M14 3l5 3 4-2 3 4 5 1 1 5 5 3-2 4 3 4-4 3-1 5-5 1-3 4-4-2-4 2-2-4-5-2 1-4-4-3 2-5-3-4 4-3 1-5 4-1z"
        fill="#f5b400"
        stroke="#e09a00"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="19" r="2.6" fill="#0b234f" />
    </svg>
  )
}
