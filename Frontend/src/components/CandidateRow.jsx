import { CheckCircle2 } from 'lucide-react'
import Badge from './ui/Badge'
import CandidateAvatar from './CandidateAvatar'
import { useCandidateProfile } from '../context/CandidateProfileContext'
import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

/** One candidate in a ward listing; the whole row opens the read-only profile popup. */
export default function CandidateRow({ row, isWinner, showWard = false }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  const { openProfile } = useCandidateProfile()
  return (
    <li>
      <button
        type="button"
        onClick={() => openProfile(row.id)}
        aria-label={t('result.viewProfile', { name: row.name })}
        className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 sm:px-5', isWinner && 'bg-emerald-50/50 hover:bg-emerald-50/80')}
      >
        <span className="w-5 shrink-0 text-sm tabular-nums text-slate-400">{row.position ?? ''}</span>
        <CandidateAvatar candidate={row} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-navy-900">{row.name}</span>
            {isWinner && (
              <Badge tone="green" icon={CheckCircle2}>
                {t('result.winner')}
              </Badge>
            )}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {row.party}
            {showWard && ` · ${t('common.ward', { ward: row.wardNo })}`}
          </span>
        </span>
        {/* No result figures until the ward's result is available (declared, on the public site). */}
        {row.totalVotes != null && (
          <span className="text-right">
            <span className="block text-sm font-bold tabular-nums text-navy-900">{formatNumber(row.totalVotes)}</span>
            <span className="block text-xs tabular-nums text-slate-500">{formatPercent(row.percent)}</span>
          </span>
        )}
      </button>
    </li>
  )
}
