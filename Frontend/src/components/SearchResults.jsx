import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Users } from 'lucide-react'
import StatusBadge, { wardStatus } from './StatusBadge'
import { EmptyState } from './ui/States'
import { useLanguage } from '../i18n/I18nContext'
import { allCandidateRows, matchesCandidate, parseWardQuery } from '../lib/wards'
import { useCandidateProfile } from '../context/CandidateProfileContext'
import { wardPath } from '../lib/paths'

const LIMIT = 8

/** Matches wards (by number) and candidates (by name or party) for a search query. */
export function searchWards(wards, query) {
  const q = query.trim().toLowerCase()
  const wardNo = parseWardQuery(q)
  const matchedWards = wardNo != null ? wards.filter((w) => String(w.wardNo).startsWith(String(wardNo))) : []
  const candidates = allCandidateRows(wards).filter((c) => matchesCandidate(c, q))
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

const itemClass = 'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50'

/** A result row that either links to a page (`to`) or runs an action (`onClick`). */
function Item({ to, onClick, title, subtitle, badge, onNavigate }) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {badge}
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    </>
  )
  return (
    <li>
      {to ? (
        <Link to={to} onClick={onNavigate} className={itemClass}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={itemClass}>
          {body}
        </button>
      )}
    </li>
  )
}

export default function SearchResults({ results, onNavigate }) {
  const { t, tx, formatNumber } = useLanguage()
  const { openProfile } = useCandidateProfile()
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
              subtitle={w.winner ? t('search.winnerLine', { name: w.winner.name }) : tx('status', wardStatus(w))}
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
              onClick={() => {
                onNavigate?.()
                openProfile(c.id)
              }}
              title={c.name}
              subtitle={`${c.party} · ${t('common.ward', { ward: c.wardNo })} · ${t('result.votesValue', { count: formatNumber(c.totalVotes) })}`}
            />
          ))}
        </Group>
      )}
    </div>
  )
}
