import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, ListChecks, Scale } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import { Field, Select } from '../components/ui/Form'
import { EmptyState } from '../components/ui/States'
import StatusBadge, { wardStatus } from '../components/StatusBadge'
import NotFound from './NotFound'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { wardPath } from '../lib/paths'
import { cn } from '../lib/format'

function WinnerPanel({ ward }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  if (!ward.winner) {
    return (
      <Card className="h-full border-l-4 border-l-amber-500 p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
          <Scale className="h-4 w-4" aria-hidden="true" />
          {t('status.Tie')}
        </p>
        <p className="mt-2 text-sm text-slate-700">{t('result.tieNote')}</p>
      </Card>
    )
  }
  return (
    <Card className="h-full border-l-4 border-l-emerald-600 p-5">
      <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {t('result.winner')}
      </p>
      <p className="mt-2 text-xl font-bold text-navy-900">{ward.winner.name}</p>
      <p className="mt-3 text-sm text-slate-700">
        <span className="text-lg font-bold tabular-nums text-navy-900">{formatNumber(ward.winner.totalVotes)}</span>{' '}
        {t('result.votesUnit')} · {formatPercent(ward.winner.percent)}
      </p>
    </Card>
  )
}

function Summary({ ward }) {
  const { t, formatNumber } = useLanguage()
  const items = [
    [t('result.totalVotes'), formatNumber(ward.totalVotes)],
    [t('result.candidates'), formatNumber(ward.rows.length)],
    [t('result.margin'), ward.margin != null ? formatNumber(ward.margin) : '—'],
  ]
  return (
    <Card className="grid h-full grid-cols-3 divide-x divide-slate-100">
      {items.map(([label, value]) => (
        <div key={label} className="p-4 sm:p-5">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-navy-900 sm:text-xl">{value}</p>
        </div>
      ))}
    </Card>
  )
}

function CandidateTable({ ward }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  const isWinner = (r) => ward.winner?.id === r.id
  const winnerBadge = <Badge tone="green" icon={CheckCircle2}>{t('result.winner')}</Badge>

  const columns = [
    { key: 'position', header: t('result.position'), className: 'w-20 tabular-nums', render: (r) => r.position },
    {
      key: 'name',
      header: t('result.candidate'),
      render: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-navy-900">{r.name}</span>
          {isWinner(r) && winnerBadge}
        </span>
      ),
    },
    { key: 'votes', header: t('result.totalVotes'), align: 'right', className: 'tabular-nums', render: (r) => formatNumber(r.totalVotes) },
    {
      key: 'percent',
      header: t('result.percent'),
      className: 'w-48',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="w-12 text-right tabular-nums">{formatPercent(r.percent)}</span>
          {/* The same neutral bar colour for every candidate. */}
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <span className="block h-full rounded-full bg-slate-400" style={{ width: `${r.percent}%` }} />
          </span>
        </div>
      ),
    },
  ]

  const mobileCard = (r) => (
    <div className={cn('flex items-start gap-3 px-4 py-3.5', isWinner(r) && 'bg-emerald-50/50')}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold tabular-nums text-slate-700">{r.position}</span>
      <p className="flex min-w-0 flex-1 flex-wrap items-center gap-2 font-semibold text-navy-900">
        {r.name}
        {isWinner(r) && winnerBadge}
      </p>
      <div className="text-right">
        <p className="font-semibold tabular-nums text-navy-900">{formatNumber(r.totalVotes)}</p>
        <p className="text-xs tabular-nums text-slate-500">{formatPercent(r.percent)}</p>
      </div>
    </div>
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader title={t('pages.ward.tableTitle')} description={t('pages.ward.tableDescription')} />
      <Table
        columns={columns}
        rows={ward.rows}
        caption={t('pages.ward.tableCaption')}
        rowClassName={(r) => isWinner(r) && 'bg-emerald-50/50 hover:bg-emerald-50/70'}
        renderMobileCard={mobileCard}
      />
    </Card>
  )
}

/** /results/:wardNo — one ward's candidate-wise result. */
export default function WardResult() {
  const { wardNo: param } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { wards, getWard } = useResults()

  if (!/^\d{1,6}$/.test(param) || Number(param) < 1) return <NotFound />
  const wardNo = Number(param)
  const ward = getWard(wardNo)
  const index = wards.findIndex((w) => w.wardNo === wardNo)
  const title = t('common.ward', { ward: wardNo })

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: t('nav.home'), to: '/' }, { label: t('nav.results'), to: '/results' }, { label: title }]}
        title={title}
        meta={ward && <StatusBadge status={wardStatus(ward)} />}
      />
      <PageBody>
        {!ward ? (
          <Card>
            <EmptyState
              icon={ListChecks}
              title={t('pages.ward.notFoundTitle', { ward: wardNo })}
              description={t('pages.ward.notFoundText')}
              action={<Button to="/results" variant="secondary">{t('pages.ward.allResults')}</Button>}
            />
          </Card>
        ) : (
          <>
            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <Field label={t('pages.ward.select')} className="flex-1">
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={String(wardNo)}
                    onChange={(event) => navigate(wardPath(event.target.value), { replace: true })}
                    options={wards.map((w) => ({ value: String(w.wardNo), label: t('common.ward', { ward: w.wardNo }) }))}
                  />
                )}
              </Field>
              <div className="flex gap-2">
                <Button variant="secondary" icon={ChevronLeft} disabled={index <= 0} onClick={() => navigate(wardPath(wards[index - 1].wardNo), { replace: true })} className="flex-1">
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="secondary"
                  iconRight={ChevronRight}
                  disabled={index >= wards.length - 1}
                  onClick={() => navigate(wardPath(wards[index + 1].wardNo), { replace: true })}
                  className="flex-1"
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <WinnerPanel ward={ward} />
              </div>
              <div className="lg:col-span-3">
                <Summary ward={ward} />
              </div>
            </div>
            <CandidateTable ward={ward} />
          </>
        )}
      </PageBody>
    </>
  )
}
