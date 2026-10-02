import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import Pagination, { paginate } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/States'
import FilterBar from '../components/FilterBar'
import ResultsTable from '../components/ResultsTable'
import NoResults from '../components/NoResults'
import { useFilterParams } from '../hooks/useFilterParams'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { allCandidateRows } from '../lib/wards'
import { wardPath } from '../lib/paths'

const FILTER_KEYS = ['q', 'ward']
const PAGE_SIZE = 20

/** Candidate rows matching a name search, with their ward position. */
function CandidateMatches({ rows }) {
  const { t, formatNumber } = useLanguage()
  const winnerBadge = <Badge tone="green" icon={CheckCircle2}>{t('result.winner')}</Badge>
  const columns = [
    {
      key: 'name',
      header: t('result.candidate'),
      render: (c) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-navy-900">{c.name}</span>
          {c.isWinner && winnerBadge}
        </span>
      ),
    },
    { key: 'ward', header: t('result.ward'), className: 'whitespace-nowrap', render: (c) => t('common.ward', { ward: c.wardNo }) },
    { key: 'votes', header: t('result.totalVotes'), align: 'right', className: 'tabular-nums', render: (c) => formatNumber(c.totalVotes) },
    { key: 'position', header: t('result.position'), align: 'right', className: 'tabular-nums', render: (c) => c.position },
    {
      key: 'action',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'right',
      render: (c) => (
        <Link to={wardPath(c.wardNo)} className="inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-brand-600 hover:text-brand-800">
          {t('result.viewWard')} <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('common.for', { label: c.name })}</span>
        </Link>
      ),
    },
  ]
  const mobileCard = (c) => (
    <Link to={wardPath(c.wardNo)} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-navy-900">
          {c.name}
          {c.isWinner && winnerBadge}
        </p>
        <p className="text-xs text-slate-500">
          {t('common.ward', { ward: c.wardNo })} · {t('result.position')} {c.position}
        </p>
      </div>
      <span className="font-semibold tabular-nums text-navy-900">{formatNumber(c.totalVotes)}</span>
    </Link>
  )
  return <Table columns={columns} rows={rows} caption={t('pages.results.candidateCaption')} renderMobileCard={mobileCard} />
}

export default function Results() {
  const { t, formatNumber } = useLanguage()
  const { wards } = useResults()
  const { filters, setFilter, resetFilters, hasFilters, page, setPage } = useFilterParams(FILTER_KEYS)

  const q = filters.q.trim().toLowerCase()
  const wardFilter = filters.ward ? Number(filters.ward) : null
  const visibleWards = wardFilter ? wards.filter((w) => w.wardNo === wardFilter) : wards
  // A name search switches the view from wards to matching candidates.
  const candidateRows = q ? allCandidateRows(visibleWards).filter((c) => c.name.toLowerCase().includes(q)) : null
  const items = candidateRows ?? visibleWards
  const { pageItems, pageCount, current } = paginate(items, page, PAGE_SIZE)

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
            <Card className="overflow-hidden">
              {items.length === 0 ? (
                <EmptyState action={<Button variant="secondary" onClick={resetFilters}>{t('filter.reset')}</Button>} />
              ) : (
                <>
                  <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-5" aria-live="polite">
                    {candidateRows
                      ? t('pages.results.candidateCount', { count: formatNumber(candidateRows.length) })
                      : t('pages.results.wardCount', { count: formatNumber(visibleWards.length) })}
                  </div>
                  {candidateRows ? <CandidateMatches rows={pageItems} /> : <ResultsTable wards={pageItems} />}
                  <Pagination page={current} pageCount={pageCount} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
                </>
              )}
            </Card>
          </>
        )}
      </PageBody>
    </>
  )
}
