import { AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import CandidateAvatar from '../CandidateAvatar'
import StatusBadge, { wardStatus } from '../StatusBadge'
import { useVotesGivenText } from '../VotesGiven'
import { useResults } from '../../context/ResultsContext'
import { useCandidateProfile } from '../../context/CandidateProfileContext'
import { useLanguage } from '../../i18n/I18nContext'

/**
 * Super Admin ward detail: Ward Master details, result status and every candidate of the
 * ward (by votes when results exist). Pending results are visible here because this is the
 * admin panel; candidates open their manageable profile.
 */
export default function WardDetailModal({ wardNo, onClose, footerActions }) {
  const { t, formatNumber, formatDateTime } = useLanguage()
  const { getWard } = useResults()
  const { openProfile } = useCandidateProfile()
  const votesGivenText = useVotesGivenText()
  const ward = wardNo != null ? getWard(wardNo) : null
  const dash = <span className="text-slate-400">—</span>

  const details = ward && [
    [t('admin.wards.columns.wardNo'), ward.wardNo],
    [t('admin.wards.columns.wardName'), ward.wardName ?? dash],
    [t('admin.wards.columns.areas'), ward.areas ?? dash],
    [t('admin.wards.columns.totalVoters'), ward.totalVoters != null ? formatNumber(ward.totalVoters) : dash],
    [t('result.votesGiven'), ward.votesGiven != null ? votesGivenText(ward) : t('result.votesGivenUnavailable')],
    [t('admin.wards.columns.candidates'), formatNumber(ward.rows.length)],
    [t('result.status'), <StatusBadge key="status" status={wardStatus(ward)} />],
    ward.status === 'declared' && [t('admin.wardDetail.declaredAt'), ward.declaredAt ? formatDateTime(ward.declaredAt) : dash],
    ward.winner && [t('result.winner'), `${ward.winner.name} · ${ward.winner.party}`],
  ].filter(Boolean)

  return (
    <Modal
      open={Boolean(ward)}
      onClose={onClose}
      title={ward ? t('admin.wardDetail.title', { ward: ward.wardNo }) : ''}
      description={ward?.wardName ?? undefined}
      size="lg"
      footer={
        ward && (
          <>
            {footerActions}
            <Button to={`/admin/results?ward=${ward.wardNo}#result-list`} variant="secondary" icon={BarChart3} onClick={onClose}>
              {t('admin.wardDetail.manageResult')}
            </Button>
            <Button onClick={onClose}>{t('common.close')}</Button>
          </>
        )
      }
    >
      {ward && (
        <>
          <dl className="grid gap-x-6 rounded-lg border border-slate-100 text-sm sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-2.5 last:border-b-0">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-semibold text-navy-900">{value}</dd>
              </div>
            ))}
          </dl>
          {ward.status === 'tie' && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t('result.tieNote')}
            </p>
          )}

          <h3 className="mb-2 mt-5 text-sm font-bold text-navy-900">{t('admin.wardDetail.candidates')}</h3>
          {ward.rows.length === 0 ? (
            <p className="rounded-lg border border-slate-100 px-4 py-3 text-sm text-slate-500">{t('result.noCandidates')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {ward.rows.map((row) => {
                const isWinner = ward.winner?.id === row.id
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => openProfile(row.id, { manage: true })}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                      aria-label={t('result.viewProfile', { name: row.name })}
                    >
                      <CandidateAvatar candidate={row} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-navy-900">{row.name}</span>
                          {isWinner && (
                            <Badge tone="green" icon={CheckCircle2}>
                              {t('result.winner')}
                            </Badge>
                          )}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {row.party} · <span className="font-mono">{row.candidateId ?? t('admin.candidates.idMissing')}</span>
                        </span>
                      </span>
                      {row.totalVotes != null ? (
                        <span className="text-right text-sm font-bold tabular-nums text-navy-900">{t('result.votesValue', { count: formatNumber(row.totalVotes) })}</span>
                      ) : (
                        <span className="text-right text-xs text-slate-400">{t('admin.wardDetail.noResult')}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </Modal>
  )
}
