import { CheckCircle2, MapPin } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Pagination, { paginate } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/States'
import FilterBar from '../components/FilterBar'
import NoResults from '../components/NoResults'
import CandidateAvatar from '../components/CandidateAvatar'
import StatusBadge from '../components/StatusBadge'
import { useFilterParams } from '../hooks/useFilterParams'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { useCandidateProfile } from '../context/CandidateProfileContext'
import { allCandidateRows, matchesCandidate } from '../lib/wards'

const FILTER_KEYS = ['q', 'ward']
const PAGE_SIZE = 24
const STATUS_LABEL = { declared: 'Declared', pending: 'Pending', tie: 'Tie' }

/** Candidate card; the whole card opens the read-only profile popup. */
function CandidateCard({ candidate }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  const { openProfile } = useCandidateProfile()
  return (
    <button
      type="button"
      onClick={() => openProfile(candidate.id)}
      aria-label={t('result.viewProfile', { name: candidate.name })}
      className="flex h-full w-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-shadow hover:shadow-card-hover"
    >
      <div className="flex w-full items-start gap-3">
        <CandidateAvatar candidate={candidate} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold leading-snug text-navy-900">{candidate.name}</p>
          <p className="truncate text-sm text-slate-600">{candidate.party}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            {t('common.ward', { ward: candidate.wardNo })}
          </p>
        </div>
        {candidate.isWinner ? (
          <Badge tone="green" icon={CheckCircle2} className="shrink-0">
            {t('result.winner')}
          </Badge>
        ) : (
          <StatusBadge status={STATUS_LABEL[candidate.wardStatus]} className="shrink-0" />
        )}
      </div>
      {candidate.totalVotes == null ? (
        <p className="mt-4 w-full border-t border-slate-100 pt-3 text-xs text-slate-500">{t('result.notDeclaredShort')}</p>
      ) : (
      <dl className="mt-4 grid w-full grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">{t('result.totalVotes')}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-navy-900">{formatNumber(candidate.totalVotes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t('result.percent')}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-navy-900">{formatPercent(candidate.percent)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t('result.position')}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-navy-900">{candidate.position}</dd>
        </div>
      </dl>
      )}
    </button>
  )
}

export default function Candidates() {
  const { t, formatNumber } = useLanguage()
  const { wards } = useResults()
  const { filters, setFilter, resetFilters, hasFilters, page, setPage } = useFilterParams(FILTER_KEYS)

  const wardFilter = filters.ward ? Number(filters.ward) : null
  const all = allCandidateRows(wards)
  const rows = all.filter((c) => (!wardFilter || c.wardNo === wardFilter) && matchesCandidate(c, filters.q))
  const { pageItems, pageCount, current } = paginate(rows, page, PAGE_SIZE)

  return (
    <>
      <PageHeader title={t('pages.candidates.title')} description={t('pages.candidates.description')} />
      <PageBody>
        {!all.length ? (
          <NoResults />
        ) : (
          <>
            <FilterBar
              search={filters.q}
              onSearchChange={(value) => setFilter('q', value)}
              searchPlaceholder={t('pages.candidates.searchPlaceholder')}
              values={filters}
              onChange={setFilter}
              onReset={resetFilters}
              canReset={hasFilters}
              filters={[{ key: 'ward', label: t('field.ward'), options: wards.map((w) => ({ value: String(w.wardNo), label: t('common.ward', { ward: w.wardNo }) })) }]}
            />
            {rows.length === 0 ? (
              <Card>
                <EmptyState action={<Button variant="secondary" onClick={resetFilters}>{t('filter.reset')}</Button>} />
              </Card>
            ) : (
              <>
                <p className="text-sm text-slate-500" aria-live="polite">
                  {t('pages.candidates.count', { count: formatNumber(rows.length) })}
                </p>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pageItems.map((candidate) => (
                    <li key={candidate.id}>
                      <CandidateCard candidate={candidate} />
                    </li>
                  ))}
                </ul>
                {pageCount > 1 && (
                  <Card>
                    <Pagination page={current} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </PageBody>
    </>
  )
}
