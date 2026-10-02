import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

const TONES = {
  navy: 'bg-navy-800 text-white',
  blue: 'bg-brand-50 text-brand-600',
  orange: 'bg-[#fff1e0] text-[#d9730d]',
  green: 'bg-[#e8f6ed] text-[#1d8a4b]',
}

/** Compact statistic card: tinted icon tile, value and label. `value` null shows a loading placeholder. */
export default function StatCard({ icon: Icon, label, value, hint, tone = 'blue', className }) {
  const { formatNumber } = useLanguage()
  return (
    <div className={cn('flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)]', className)}>
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[20px] font-extrabold leading-tight text-navy-900">
          {value == null ? <span aria-hidden="true">…</span> : typeof value === 'number' ? formatNumber(value) : value}
        </p>
        <p className="truncate text-[13.5px] text-slate-600">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  )
}
