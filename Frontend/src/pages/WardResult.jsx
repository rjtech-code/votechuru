import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, ListChecks, Scale } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Field, Select } from '../components/ui/Form'
import { EmptyState } from '../components/ui/States'
import StatusBadge, { wardStatus } from '../components/StatusBadge'
import CandidateRow from '../components/CandidateRow'
import VotesGiven from '../components/VotesGiven'
import { useCandidateProfile } from '../context/CandidateProfileContext'
import NotFound from './NotFound'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { wardPath } from '../lib/paths'
import { cn } from '../lib/format'

function WinnerPanel({ ward }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  const { openProfile } = useCandidateProfile()
  if (!ward.winner) {
    const tie = ward.status === 'tie'
    return (
      <Card className={cn('h-full border-l-4 p-5', tie ? 'border-l-amber-500' : 'border-l-brand-500')}>
        <p className={cn('flex items-center gap-1.5 text-xs font-bold', tie ? 'text-amber-800' : 'text-brand-800')}>
          {tie ? <Scale className="h-4 w-4" aria-hidden="true" /> : <Clock className="h-4 w-4" aria-hidden="true" />}
          {tie ? t('status.Tie') : t('result.pendingTitle')}
        </p>
        <p className="mt-2 text-sm text-slate-700">{tie ? t('result.tieNote') : ward.rows.length ? t('result.pendingNote') : t('result.noCandidates')}</p>
      </Card>
    )
  }
  return (
    <Card className="h-full border-l-4 border-l-emerald-600 p-5">
      <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {t('result.winner')}
      </p>
      <button type="button" onClick={() => openProfile(ward.winner.id)} className="mt-2 text-left text-xl font-bold text-navy-900 hover:text-brand-700 hover:underline">
        {ward.winner.name}
      </button>
      <p className="text-sm text-slate-600">{ward.winner.party}</p>
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
    ward.totalVoters != null && [t('result.totalVoters'), formatNumber(ward.totalVoters)],
  ].filter(Boolean)
  return (
    <Card className="flex h-full flex-col">
      <div className={cn('grid flex-1 divide-x divide-slate-100', items.length > 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
        {items.map(([label, value]) => (
          <div key={label} className="p-4 sm:p-5">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-navy-900 sm:text-xl">{value}</p>
          </div>
        ))}
      </div>
      {ward.votesGiven != null && <VotesGiven ward={ward} className="border-t border-slate-100 px-4 py-3 sm:px-5" />}
    </Card>
  )
}

function CandidateList({ ward }) {
  const { t } = useLanguage()
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={ward.hasResults ? t('pages.ward.tableTitle') : t('pages.ward.candidatesTitle')}
        description={ward.hasResults ? t('pages.ward.tableDescription') : t('pages.ward.candidatesDescription')}
      />
      {ward.rows.length ? (
        <ul className="divide-y divide-slate-100" aria-label={t('pages.ward.tableCaption')}>
          {ward.rows.map((row) => (
            <CandidateRow key={row.id} row={row} isWinner={ward.winner?.id === row.id} />
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-slate-500">{t('result.noCandidates')}</p>
      )}
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
        description={ward ? [ward.wardName, ward.areas].filter(Boolean).join(' · ') || undefined : undefined}
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
            <CandidateList ward={ward} />
          </>
        )}
      </PageBody>
    </>
  )
}
