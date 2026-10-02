import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CheckCircle2, FileSpreadsheet, ListChecks, PenLine, Users, Vote } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatCard from '../../components/StatCard'
import StatusBadge, { wardStatus } from '../../components/StatusBadge'
import { Card, CardHeader } from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/States'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'
import { recentWards } from '../../lib/wards'
import { wardPath } from '../../lib/paths'

const QUICK_LINKS = [
  { to: '/admin/upload', labelKey: 'admin.dashboard.quickUpload', icon: FileSpreadsheet },
  { to: '/admin/upload#manual', labelKey: 'admin.dashboard.quickManual', icon: PenLine },
  { to: '/admin/results', labelKey: 'admin.dashboard.quickResults', icon: BarChart3 },
]

export default function AdminDashboard() {
  const { t, formatNumber } = useLanguage()
  const { stats, wards } = useResults()
  const recent = recentWards(wards, 8)
  const dash = <span className="text-slate-400">—</span>

  const C = 'admin.columns.'
  const columns = [
    {
      key: 'ward',
      header: t(`${C}ward`),
      render: (w) => (
        <Link to={wardPath(w.wardNo)} className="whitespace-nowrap font-semibold text-navy-900 hover:text-brand-700">
          {t('common.ward', { ward: w.wardNo })}
        </Link>
      ),
    },
    { key: 'candidates', header: t(`${C}candidates`), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.rows.length) },
    { key: 'votes', header: t(`${C}totalVotes`), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.totalVotes) },
    { key: 'winner', header: t(`${C}winner`), render: (w) => w.winner?.name ?? dash },
    { key: 'status', header: t('result.status'), render: (w) => <StatusBadge status={wardStatus(w)} /> },
  ]

  return (
    <>
      <AdminPageHeader title={t('admin.dashboard.title')} description={t('admin.dashboard.welcome')} />

      <section aria-label={t('home.statsLabel')} className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ListChecks} tone="navy" label={t('stats.wards')} value={stats.wards} />
        <StatCard icon={Users} tone="blue" label={t('stats.candidates')} value={stats.candidates} />
        <StatCard icon={Vote} tone="orange" label={t('stats.votes')} value={stats.votes} />
        <StatCard icon={CheckCircle2} tone="green" label={t('stats.declared')} value={stats.declared} />
      </section>

      <nav aria-label={t('admin.nav.dashboard')} className="mt-6 grid gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-shadow hover:shadow-card-hover"
          >
            <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {t(labelKey)}
            <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" aria-hidden="true" />
          </Link>
        ))}
      </nav>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title={t('admin.dashboard.recentWards')}
          description={t('admin.dashboard.recentWardsText')}
          action={recent.length > 0 && <Button to="/admin/results" variant="link">{t('common.viewAll')}</Button>}
        />
        {recent.length ? (
          <Table columns={columns} rows={recent} rowKey={(w) => w.wardNo} caption={t('admin.dashboard.recentWards')} />
        ) : (
          <EmptyState
            icon={FileSpreadsheet}
            title={t('admin.dashboard.emptyTitle')}
            description={t('admin.dashboard.emptyText')}
            action={<Button to="/admin/upload">{t('admin.dashboard.quickUpload')}</Button>}
          />
        )}
      </Card>
    </>
  )
}
