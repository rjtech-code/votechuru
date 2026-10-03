import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Pagination, { paginate } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/States'
import FilterBar from '../components/FilterBar'
import NoResults from '../components/NoResults'
import CandidateRow from '../components/CandidateRow'
import StatusBadge, { wardStatus } from '../components/StatusBadge'
import { useFilterParams } from '../hooks/useFilterParams'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { matchesCandidate } from '../lib/wards'
import { wardPath } from '../lib/paths'

const FILTER_KEYS = ['q', 'ward']
const PAGE_SIZE = 10

/** One ward: header with status, then its candidates by votes (each opens a profile). */
function WardGroup({ ward, rows }) {
  const { t, formatNumber } = useLanguage()
  const label = t('common.ward', { ward: ward.wardNo })
  return (
    <Card as="article" aria-labelledby={`ward-${ward.wardNo}`} className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id={`ward-${ward.wardNo}`} className="text-[17px] font-extrabold text-navy-900">
              {label}
            </h2>
            <StatusBadge status={wardStatus(ward)} />
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {ward.wardName && <>{ward.wardName} · </>}
            {t('result.candidatesCount', { count: formatNumber(ward.rows.length) })} · {t('result.totalVotes')}: {formatNumber(ward.totalVotes)}
            {ward.margin != null && <> · {t('result.margin')}: {formatNumber(ward.margin)}</>}
          </p>
        </div>
        <Link to={wardPath(ward.wardNo)} className="inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-brand-600 hover:text-brand-800">
          {t('result.viewWard')}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('common.for', { label })}</span>
        </Link>
      </header>
      {rows.length ? (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <CandidateRow key={row.id} row={row} isWinner={ward.winner?.id === row.id} />
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-slate-500">{t(ward.withheld ? (ward.status === 'tie' ? 'result.tieNote' : 'result.pendingNote') : 'result.noCandidates')}</p>
      )}
      {ward.status !== 'declared' && ward.rows.length > 0 && (
        <p className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs text-slate-500">
          {ward.status === 'tie' ? t('result.tieNote') : t('result.pendingNote')}
        </p>
      )}
    </Card>
  )
}

/** /results — every ward in the Ward Master (numeric order) with its candidates by votes. */
export default function Results() {
  const { t, formatNumber } = useLanguage()
  const { wards } = useResults()
  const { filters, setFilter, resetFilters, hasFilters, page, setPage } = useFilterParams(FILTER_KEYS)

  const q = filters.q.trim()
  const wardFilter = filters.ward ? Number(filters.ward) : null
  const groups = wards
    .filter((w) => !wardFilter || w.wardNo === wardFilter)
    .map((ward) => ({ ward, rows: q ? ward.rows.filter((r) => matchesCandidate(r, q)) : ward.rows }))
    .filter(({ rows }) => !q || rows.length)
  const { pageItems, pageCount, current } = paginate(groups, page, PAGE_SIZE)

  return (
    <>
      <PageHeader title={t('pages.results.title')} description={t('pages.results.description')} />
      <PageBody>
        {!wards.length ? (
          <NoResults />
        ) : (
          <>
            <FilterBar
              search={filters.q}
              onSearchChange={(value) => setFilter('q', value)}
              searchPlaceholder={t('pages.results.searchPlaceholder')}
              values={filters}
              onChange={setFilter}
              onReset={resetFilters}
              canReset={hasFilters}
              filters={[{ key: 'ward', label: t('field.ward'), options: wards.map((w) => ({ value: String(w.wardNo), label: t('common.ward', { ward: w.wardNo }) })) }]}
            />
            {groups.length === 0 ? (
              <Card>
                <EmptyState action={<Button variant="secondary" onClick={resetFilters}>{t('filter.reset')}</Button>} />
              </Card>
            ) : (
              <>
                <p className="text-sm text-slate-500" aria-live="polite">
                  {t('pages.results.wardCount', { count: formatNumber(groups.length) })}
                </p>
                {pageItems.map(({ ward, rows }) => (
                  <WardGroup key={ward.wardNo} ward={ward} rows={rows} />
                ))}
                {pageCount > 1 && (
                  <Card>
                    <Pagination page={current} pageCount={pageCount} total={groups.length} pageSize={PAGE_SIZE} onChange={setPage} />
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
