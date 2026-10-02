import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Table from './ui/Table'
import StatusBadge, { wardStatus } from './StatusBadge'
import ResultCard from './ResultCard'
import { useLanguage } from '../i18n/I18nContext'
import { wardPath } from '../lib/paths'

const dash = <span className="text-slate-400">—</span>

/** Ward-wise results: a table on larger screens, ward rows on phones. */
export default function ResultsTable({ wards, caption }) {
  const { t, formatNumber } = useLanguage()
  const wardLabel = (w) => t('common.ward', { ward: w.wardNo })

  const columns = [
    { key: 'ward', header: t('result.ward'), render: (w) => <span className="whitespace-nowrap font-semibold text-navy-900">{wardLabel(w)}</span> },
    { key: 'winner', header: t('result.winner'), render: (w) => w.winner?.name ?? dash },
    { key: 'votes', header: t('result.votes'), align: 'right', className: 'tabular-nums', render: (w) => (w.winner ? formatNumber(w.winner.totalVotes) : dash) },
    { key: 'runnerUp', header: t('result.runnerUp'), render: (w) => w.runnerUp?.name ?? dash },
    { key: 'margin', header: t('result.margin'), align: 'right', className: 'tabular-nums', render: (w) => (w.margin != null ? formatNumber(w.margin) : dash) },
    { key: 'candidates', header: t('result.candidates'), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.rows.length) },
    { key: 'status', header: t('result.status'), render: (w) => <StatusBadge status={wardStatus(w)} /> },
    {
      key: 'action',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'right',
      render: (w) => (
        <Link to={wardPath(w.wardNo)} className="inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-brand-600 hover:text-brand-800">
          {t('result.viewWard')}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('common.for', { label: wardLabel(w) })}</span>
        </Link>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={wards}
      rowKey={(w) => w.wardNo}
      caption={caption ?? t('pages.results.wardCaption')}
      renderMobileCard={(w) => <ResultCard ward={w} variant="row" />}
    />
  )
}
