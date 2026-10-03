import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import StatusBadge, { wardStatus } from './StatusBadge'
import { useLanguage } from '../i18n/I18nContext'
import { wardPath } from '../lib/paths'
import { cn } from '../lib/format'

/**
 * Ward result summary. `variant="card"` is the bordered grid card used on the home
 * page; `variant="row"` is the compact list row used in place of tables on phones.
 */
export default function ResultCard({ ward, variant = 'card' }) {
  const { t, formatNumber } = useLanguage()
  const isCard = variant === 'card'
  const { winner } = ward

  return (
    <Link
      to={wardPath(ward.wardNo)}
      className={cn(
        'group flex h-full flex-col transition-colors',
        isCard
          ? 'rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-shadow hover:shadow-card-hover'
          : 'px-4 py-4 hover:bg-slate-50 sm:px-5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-snug text-navy-900">{t('common.ward', { ward: ward.wardNo })}</p>
          {ward.wardName && <p className="truncate text-[13px] text-slate-600">{ward.wardName}</p>}
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('result.candidatesCount', { count: formatNumber(ward.rows.length) })}
          </p>
        </div>
        <StatusBadge status={wardStatus(ward)} className="shrink-0" />
      </div>

      {winner ? (
        <dl className={cn('mt-4 grid grid-cols-3 gap-3 text-sm', isCard && 'border-t border-slate-100 pt-4')}>
          <div className="col-span-3">
            <dt className="text-xs text-slate-500">{t('result.winner')}</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">
              {winner.name} <span className="font-normal text-slate-500">· {winner.party}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{t('result.votes')}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{formatNumber(winner.totalVotes)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500">{t('result.margin')}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">
              {ward.margin != null ? t('result.marginValue', { count: formatNumber(ward.margin) }) : '—'}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          {ward.status === 'tie' ? t('result.tieNote') : ward.rows.length || ward.withheld ? t('result.pendingNote') : t('result.noCandidates')}
        </p>
      )}

      {isCard && (
        <span className="mt-auto inline-flex items-center gap-0.5 pt-4 text-[13.5px] font-bold text-brand-600 group-hover:text-brand-800">
          {t('result.viewWard')}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </Link>
  )
}
