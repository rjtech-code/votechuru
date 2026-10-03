import { useEffect, useState } from 'react'
import { CalendarClock, Trophy } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

/** Current time, refreshed every second only while `active` is true. */
function useNow(active) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])
  return now
}

function split(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return { days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 }
}

const pad = (n) => String(n).padStart(2, '0')

function CountdownCard({ titleKey, icon: Icon, iso, now, accent }) {
  const { t, formatDate, formatWeekday, formatTime } = useLanguage()
  const parts = split(new Date(iso).getTime() - now)
  const units = ['days', 'hours', 'minutes', 'seconds']
  return (
    <section aria-label={t(titleKey)} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
      <div className="flex items-start gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-extrabold text-navy-900">{t(titleKey)}</h2>
          <p className="text-sm text-slate-600">
            {formatDate(iso)} • {formatWeekday(iso)} • {formatTime(iso)}
          </p>
        </div>
      </div>
      {/* Spoken once as a sentence; the ticking digits are hidden from screen readers. */}
      <p className="sr-only">{t('countdown.remaining', { days: parts.days, hours: parts.hours, minutes: parts.minutes })}</p>
      <div role="timer" aria-hidden="true" className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        {units.map((unit) => (
          <div key={unit} className="rounded-lg bg-navy-900 px-1 py-2.5 text-center text-white sm:py-3">
            <span className="block text-[22px] font-extrabold tabular-nums leading-none sm:text-[28px]">{unit === 'days' ? parts.days : pad(parts[unit])}</span>
            <span className="mt-1.5 block text-[11px] font-semibold text-white/75 sm:text-xs">{t(`countdown.${unit}`)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Public countdowns to the configured election and result-declaration times. Each one is
 * shown only while its time is in the future; with no upcoming event nothing renders.
 */
export default function EventCountdown({ className }) {
  const { t } = useLanguage()
  const { electionDateTime, resultDeclarationDateTime } = useSettings()
  const configured = [electionDateTime, resultDeclarationDateTime].filter(Boolean)
  const now = useNow(configured.some((iso) => new Date(iso).getTime() > Date.now()))

  const events = [
    { id: 'election', iso: electionDateTime, titleKey: 'countdown.election', icon: CalendarClock, accent: 'bg-navy-800 text-white' },
    { id: 'result', iso: resultDeclarationDateTime, titleKey: 'countdown.result', icon: Trophy, accent: 'bg-[#fff1e0] text-[#d9730d]' },
  ].filter((event) => event.iso && new Date(event.iso).getTime() > now)

  if (!events.length) return null
  return (
    <div aria-label={t('countdown.sectionLabel')} role="region" className={cn('grid gap-4', events.length > 1 && 'lg:grid-cols-2', className)}>
      {events.map(({ id, ...event }) => (
        <CountdownCard key={id} {...event} now={now} />
      ))}
    </div>
  )
}
