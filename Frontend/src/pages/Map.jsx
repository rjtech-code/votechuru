import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import NoResults from '../components/NoResults'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { wardPath } from '../lib/paths'
import { cn } from '../lib/format'

// Sequential single-hue ramp (light → dark) for total votes in a ward.
const RAMP = ['#eef3fe', '#dce6fd', '#94b2f7', '#4b74e8', '#1f45b8']
const DARK_STEPS = 2

/** Schematic ward grid: one tile per ward with results, shaded by total votes. */
export default function MapPage() {
  const { t, formatNumber } = useLanguage()
  const { wards } = useResults()
  const max = Math.max(1, ...wards.map((w) => w.totalVotes))
  const step = (votes) => Math.min(RAMP.length - 1, Math.floor((votes / max) * (RAMP.length - 0.01)))

  return (
    <>
      <PageHeader title={t('pages.map.title')} description={t('pages.map.description')} />
      <PageBody>
        {!wards.length ? (
          <NoResults />
        ) : (
          <Card className="p-4 sm:p-6">
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2.5">
              {wards.map((w) => {
                const level = step(w.totalVotes)
                const dark = level >= RAMP.length - DARK_STEPS
                return (
                  <li key={w.wardNo}>
                    <Link
                      to={wardPath(w.wardNo)}
                      title={`${t('common.ward', { ward: w.wardNo })} — ${t('result.votesValue', { count: formatNumber(w.totalVotes) })}`}
                      className={cn(
                        'flex h-full flex-col rounded-lg border px-3 py-3 transition-shadow hover:shadow-card-hover',
                        dark ? 'border-transparent text-white' : 'border-slate-200 text-navy-900',
                      )}
                      style={{ background: RAMP[level] }}
                    >
                      <span className="text-[15px] font-bold">{t('common.ward', { ward: w.wardNo })}</span>
                      <span className={cn('mt-1 truncate text-xs', dark ? 'text-white/85' : 'text-slate-600')}>{w.winner?.name ?? t('status.Tie')}</span>
                      <span className={cn('mt-0.5 text-xs tabular-nums', dark ? 'text-white/85' : 'text-slate-500')}>
                        {t('result.votesValue', { count: formatNumber(w.totalVotes) })}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1" aria-hidden="true">
                {RAMP.map((color) => (
                  <span key={color} className="h-3 w-6 rounded-sm border border-slate-200" style={{ background: color }} />
                ))}
              </span>
              {t('pages.map.legend')}
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('pages.map.note')}
            </p>
          </Card>
        )}
      </PageBody>
    </>
  )
}
