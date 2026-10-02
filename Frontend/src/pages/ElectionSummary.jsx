import { Link } from 'react-router-dom'
import { CheckCircle2, ListChecks, Users, Vote } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import Table from '../components/ui/Table'
import StatCard from '../components/StatCard'
import StatusBadge, { wardStatus } from '../components/StatusBadge'
import BarList from '../components/BarList'
import NoResults from '../components/NoResults'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { wardPath } from '../lib/paths'

export default function ElectionSummary() {
  const { t, formatNumber } = useLanguage()
  const { wards, stats } = useResults()
  const dash = <span className="text-slate-400">—</span>
  const wardLabel = (w) => t('common.ward', { ward: w.wardNo })

  const columns = [
    {
      key: 'ward',
      header: t('result.ward'),
      render: (w) => (
        <Link to={wardPath(w.wardNo)} className="whitespace-nowrap font-semibold text-navy-900 hover:text-brand-700">
          {wardLabel(w)}
        </Link>
      ),
    },
    { key: 'candidates', header: t('result.candidates'), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.rows.length) },
    { key: 'votes', header: t('result.totalVotes'), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.totalVotes) },
    { key: 'winner', header: t('result.winner'), render: (w) => w.winner?.name ?? dash },
    { key: 'winnerVotes', header: t('pages.summary.winnerVotes'), align: 'right', className: 'tabular-nums', render: (w) => (w.winner ? formatNumber(w.winner.totalVotes) : dash) },
    { key: 'margin', header: t('result.margin'), align: 'right', className: 'tabular-nums', render: (w) => (w.margin != null ? formatNumber(w.margin) : dash) },
    { key: 'status', header: t('result.status'), render: (w) => <StatusBadge status={wardStatus(w)} /> },
  ]

  return (
    <>
      <PageHeader title={t('pages.summary.title')} description={t('pages.summary.description')} />
      <PageBody>
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ListChecks} tone="navy" value={stats.wards} label={t('stats.wards')} />
          <StatCard icon={Users} tone="blue" value={stats.candidates} label={t('stats.candidates')} />
          <StatCard icon={Vote} tone="orange" value={stats.votes} label={t('stats.votes')} />
          <StatCard icon={CheckCircle2} tone="green" value={stats.declared} label={t('stats.declared')} />
        </div>

        {!wards.length ? (
          <NoResults />
        ) : (
          <>
            <Card>
              <CardHeader title={t('pages.summary.votesByWard')} />
              <div className="max-h-[28rem] overflow-y-auto p-5">
                <BarList
                  items={wards.map((w) => ({ key: w.wardNo, label: wardLabel(w), value: w.totalVotes }))}
                  caption={t('pages.summary.votesByWardNote')}
                />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader title={t('pages.summary.perWard')} />
              <Table columns={columns} rows={wards} rowKey={(w) => w.wardNo} caption={t('pages.summary.perWard')} />
            </Card>
          </>
        )}
      </PageBody>
    </>
  )
}
