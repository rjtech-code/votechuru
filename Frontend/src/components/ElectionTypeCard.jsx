import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '../lib/format'

const THEMES = {
  saffron: {
    card: 'border-[#f4d77e] bg-gradient-to-r from-[#fff8e1] to-[#fffdf6]',
    icon: 'bg-[#f5b400] text-navy-900',
    title: 'text-[#a3470a]',
  },
}

/** Large entry card linking into the ward results. */
export default function ElectionTypeCard({ to, icon: Icon, title, subtitle, tone = 'saffron' }) {
  const theme = THEMES[tone]
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-4 rounded-xl border px-5 py-5 shadow-[0_2px_8px_rgba(16,24,40,0.06)] transition-shadow duration-200 hover:shadow-card-hover sm:gap-5 sm:px-6 sm:py-6',
        theme.card,
      )}
    >
      <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16', theme.icon)}>
        <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[18px] font-extrabold leading-snug sm:text-[20px]', theme.title)}>{title}</span>
        <span className="mt-1 block text-[13px] text-slate-600 sm:text-[13.5px]">{subtitle}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-slate-700 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}
