import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CalendarClock, CheckCircle2, FileSpreadsheet, MapPin, Upload, Users } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import SummaryStats from '../../components/admin/SummaryStats'
import WardDetailModal from '../../components/admin/WardDetailModal'
import StatusBadge, { wardStatus } from '../../components/StatusBadge'
import { Card, CardHeader } from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/States'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'

const QUICK_LINKS = [
  { to: '/admin/wards', labelKey: 'admin.nav.wards', icon: MapPin },
  { to: '/admin/candidates', labelKey: 'admin.nav.candidates', icon: Users },
  { to: '/admin/results/upload', labelKey: 'admin.resultUpload.title', icon: Upload },
  { to: '/admin/results#result-list', labelKey: 'admin.dashboard.quickResults', icon: BarChart3 },
]

/** /admin — Super Admin Home: statistics, shortcuts and the wards awaiting declaration. */
export default function AdminDashboard() {
  const { t, formatNumber } = useLanguage()
  const { wards } = useResults()
  const [detailWard, setDetailWard] = useState(null)
  const pending = wards.filter((w) => w.status !== 'declared')

  const C = 'admin.columns.'
  const columns = [
    {
      key: 'ward',
      header: t(`${C}ward`),
      render: (w) => (
        <button type="button" onClick={() => setDetailWard(w.wardNo)} className="whitespace-nowrap font-semibold text-navy-900 hover:text-brand-700 hover:underline">
          {t('common.ward', { ward: w.wardNo })}
        </button>
      ),
    },
    { key: 'candidates', header: t(`${C}candidates`), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.rows.length) },
    { key: 'votes', header: t(`${C}totalVotes`), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.totalVotes) },
    { key: 'status', header: t('result.status'), render: (w) => <StatusBadge status={wardStatus(w)} /> },
    {
      key: 'action',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'right',
      render: (w) => (
        <button type="button" onClick={() => setDetailWard(w.wardNo)} className="inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-brand-600 hover:text-brand-800">
          {t('admin.dashboard.review')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('common.for', { label: t('common.ward', { ward: w.wardNo }) })}</span>
        </button>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title={t('admin.dashboard.title')}
        description={t('admin.dashboard.welcome')}
        actions={
          <Button to="/admin/settings/election-schedule" icon={CalendarClock}>
            {t('admin.dashboard.electionSchedule')}
          </Button>
        }
      />

      <SummaryStats />

      <nav aria-label={t('admin.dashboard.title')} className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <CardHeader title={t('admin.dashboard.pendingTitle')} description={t('admin.dashboard.pendingText')} />
        {!wards.length ? (
          <EmptyState
            icon={FileSpreadsheet}
            title={t('admin.wards.empty')}
            description={t('admin.wards.emptyText')}
            action={<Button to="/admin/wards">{t('admin.upload.goToWards')}</Button>}
          />
        ) : pending.length ? (
          <Table columns={columns} rows={pending} rowKey={(w) => w.wardNo} caption={t('admin.dashboard.pendingTitle')} />
        ) : (
          <EmptyState icon={CheckCircle2} title={t('admin.dashboard.noPending')} description={null} />
        )}
      </Card>

      <WardDetailModal wardNo={detailWard} onClose={() => setDetailWard(null)} />
    </>
  )
}
