import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Users } from 'lucide-react'
import StatusBadge, { wardStatus } from './StatusBadge'
import { EmptyState } from './ui/States'
import { useLanguage } from '../i18n/I18nContext'
import { allCandidateRows, parseWardQuery } from '../lib/wards'
import { wardPath } from '../lib/paths'

const LIMIT = 8

/** Matches wards (by number) and candidates (by name) for a search query. */
export function searchWards(wards, query) {
  const q = query.trim().toLowerCase()
  const wardNo = parseWardQuery(q)
  const matchedWards = wardNo != null ? wards.filter((w) => String(w.wardNo).startsWith(String(wardNo))) : []
  const candidates = allCandidateRows(wards).filter((c) => c.name.toLowerCase().includes(q))
  return { wards: matchedWards, candidates }
}

function Group({ title, icon: Icon, total, children }) {
  const { formatNumber } = useLanguage()
  return (
    <section>
      <h3 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {title}
        <span className="font-normal normal-case tracking-normal text-slate-400">({formatNumber(total)})</span>
      </h3>
      <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200/70 bg-white">{children}</ul>
    </section>
  )
}

function Item({ to, title, subtitle, badge, onNavigate }) {
  return (
    <li>
      <Link to={to} onClick={onNavigate} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
        {badge}
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      </Link>
    </li>
  )
}

export default function SearchResults({ results, onNavigate }) {
  const { t, formatNumber } = useLanguage()
  if (!results.wards.length && !results.candidates.length) return <EmptyState description={t('search.noResultsDescription')} />

  return (
    <div className="space-y-5">
      {results.wards.length > 0 && (
        <Group title={t('search.wards')} icon={MapPin} total={results.wards.length}>
          {results.wards.slice(0, LIMIT).map((w) => (
            <Item
              key={w.wardNo}
              to={wardPath(w.wardNo)}
              title={t('common.ward', { ward: w.wardNo })}
              subtitle={w.winner ? t('search.winnerLine', { name: w.winner.name }) : t('result.tieNote')}
              badge={<StatusBadge status={wardStatus(w)} />}
              onNavigate={onNavigate}
            />
          ))}
        </Group>
      )}
      {results.candidates.length > 0 && (
        <Group title={t('search.candidates')} icon={Users} total={results.candidates.length}>
          {results.candidates.slice(0, LIMIT).map((c) => (
            <Item
              key={c.id}
              to={wardPath(c.wardNo)}
              title={c.name}
              subtitle={`${t('common.ward', { ward: c.wardNo })} · ${t('result.votesValue', { count: formatNumber(c.totalVotes) })}`}
              onNavigate={onNavigate}
            />
          ))}
        </Group>
      )}
    </div>
  )
}
