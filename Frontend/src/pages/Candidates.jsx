import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, MapPin, UserRound } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Pagination, { paginate } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/States'
import FilterBar from '../components/FilterBar'
import NoResults from '../components/NoResults'
import { useFilterParams } from '../hooks/useFilterParams'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { allCandidateRows } from '../lib/wards'
import { wardPath } from '../lib/paths'

const FILTER_KEYS = ['q', 'ward']
const PAGE_SIZE = 24

function CandidateCard({ candidate }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-bold leading-snug text-navy-900">{candidate.name}</h2>
          <p className="flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            {t('common.ward', { ward: candidate.wardNo })}
          </p>
        </div>
        {candidate.isWinner && (
          <Badge tone="green" icon={CheckCircle2} className="shrink-0">
            {t('result.winner')}
          </Badge>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-sm">
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
      <Link to={wardPath(candidate.wardNo)} className="mt-auto inline-flex items-center gap-0.5 pt-4 text-[13.5px] font-bold text-brand-600 hover:text-brand-800">
        {t('result.viewWard')}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{t('common.for', { label: candidate.name })}</span>
      </Link>
    </article>
  )
}

export default function Candidates() {
  const { t, formatNumber } = useLanguage()
  const { wards } = useResults()
  const { filters, setFilter, resetFilters, hasFilters, page, setPage } = useFilterParams(FILTER_KEYS)

  const q = filters.q.trim().toLowerCase()
  const wardFilter = filters.ward ? Number(filters.ward) : null
  const rows = allCandidateRows(wardFilter ? wards.filter((w) => w.wardNo === wardFilter) : wards).filter(
    (c) => !q || c.name.toLowerCase().includes(q),
  )
  const { pageItems, pageCount, current } = paginate(rows, page, PAGE_SIZE)

  return (
    <>
      <PageHeader title={t('pages.candidates.title')} description={t('pages.candidates.description')} />
      <PageBody>
        {!wards.length ? (
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pageItems.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
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
