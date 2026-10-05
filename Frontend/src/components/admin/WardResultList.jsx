import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ExternalLink, Eye, LayoutGrid, List, RotateCcw, Scale, Trash2, Upload } from 'lucide-react'
import FilterBar from '../FilterBar'
import StatusBadge, { wardStatus } from '../StatusBadge'
import CandidateAvatar from '../CandidateAvatar'
import { useVotesGivenText } from '../VotesGiven'
import FormModal from './FormModal'
import RowActions from './RowActions'
import WardDetailModal from './WardDetailModal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import Pagination, { paginate } from '../ui/Pagination'
import { EmptyState } from '../ui/States'
import { Field, Input } from '../ui/Form'
import { useForm } from '../../hooks/useForm'
import { useResults } from '../../context/ResultsContext'
import { useToast } from '../../context/ToastContext'
import { useCandidateProfile } from '../../context/CandidateProfileContext'
import { useLanguage } from '../../i18n/I18nContext'
import { matchesCandidate, validateVotesInput } from '../../lib/wards'
import { wardPath } from '../../lib/paths'
import { cn } from '../../lib/format'

const PAGE_SIZE = 10
const STATUS_LABELS = { declared: 'Declared', pending: 'Pending', tie: 'Tie' }

function WinnerBadge() {
  const { t } = useLanguage()
  return (
    <Badge tone="green" icon={CheckCircle2}>
      {t('result.winner')}
    </Badge>
  )
}

/** Votes, or a note that no result has been uploaded for this candidate yet. */
function Votes({ row, className }) {
  const { t, formatNumber } = useLanguage()
  return row.totalVotes != null ? (
    <span className={cn('font-semibold tabular-nums text-navy-900', className)}>{formatNumber(row.totalVotes)}</span>
  ) : (
    <span className="text-xs text-slate-400">{t('admin.wardDetail.noResult')}</span>
  )
}

/** Candidate as a list row or a card; the name opens the (manageable) profile popup. */
function CandidateEntry({ row, isWinner, mode, onOpen, onEdit, onDelete }) {
  const { t, formatPercent } = useLanguage()
  const nameButton = (
    <button type="button" onClick={onOpen} className="truncate text-left font-semibold text-navy-900 hover:text-brand-700 hover:underline" aria-label={t('result.viewProfile', { name: row.name })}>
      {row.name}
    </button>
  )
  const subline = (
    <span className="truncate text-xs text-slate-500">
      {row.party || '—'} · <span className="font-mono">{row.candidateId ?? t('admin.candidates.idMissing')}</span>
    </span>
  )
  const actions = <RowActions label={row.name} onEdit={onEdit} onDelete={row.totalVotes != null ? onDelete : undefined} />
  if (mode === 'list') {
    return (
      <li className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
        <span className="w-5 shrink-0 text-sm tabular-nums text-slate-400">{row.position ?? ''}</span>
        <CandidateAvatar candidate={row} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex flex-wrap items-center gap-2">
            {nameButton}
            {isWinner && <WinnerBadge />}
          </span>
          {subline}
        </span>
        <Votes row={row} className="text-right text-sm" />
        <span className="hidden w-14 text-right text-xs tabular-nums text-slate-500 sm:inline">{row.percent != null ? formatPercent(row.percent) : ''}</span>
        {actions}
      </li>
    )
  }
  return (
    <li className={cn('flex flex-col rounded-lg border p-3', isWinner ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200/80 bg-white')}>
      <div className="flex items-start gap-3">
        <CandidateAvatar candidate={row} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          {nameButton}
          {subline}
          {isWinner && (
            <div className="mt-1">
              <WinnerBadge />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-2">
        <div className="text-xs text-slate-500">
          <Votes row={row} className="block text-base font-bold" />
          {row.position != null && (
            <>
              {t('result.position')} {row.position} · {formatPercent(row.percent)}
            </>
          )}
        </div>
        {actions}
      </div>
    </li>
  )
}

function WardBlock({ ward, rows, mode, onView, onDeclare, onReopen, onDeleteResults, onEdit, onDeleteResult, onOpen }) {
  const { t, formatNumber } = useLanguage()
  const votesGivenText = useVotesGivenText()
  return (
    <article aria-labelledby={`admin-ward-${ward.wardNo}`} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 id={`admin-ward-${ward.wardNo}`} className="text-[17px] font-extrabold uppercase tracking-wide text-navy-900">
              {t('common.ward', { ward: ward.wardNo })}
            </h3>
            <StatusBadge status={wardStatus(ward)} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {ward.wardName && <>{ward.wardName} · </>}
            {t('result.candidatesCount', { count: formatNumber(ward.rows.length) })}
            {ward.votesGiven != null || ward.totalVoters != null ? <> · {votesGivenText(ward)}</> : null} ·{' '}
            {t(ward.status === 'declared' ? 'admin.results.declaredYes' : 'admin.results.declaredNo')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" icon={Eye} onClick={() => onView(ward)}>
            {t('admin.results.view')}
          </Button>
          {ward.rows.length > 0 && (
            <Button to={`/admin/results/upload?ward=${ward.wardNo}`} variant="secondary" size="sm" icon={Upload}>
              {t('admin.results.uploadWard')}
            </Button>
          )}
          {ward.status === 'declared' ? (
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => onReopen(ward)}>
              {t('admin.results.reopen')}
            </Button>
          ) : (
            <Button size="sm" icon={CheckCircle2} onClick={() => onDeclare(ward)} disabled={!ward.hasResults}>
              {t('admin.results.declare')}
            </Button>
          )}
          {ward.hasResults && (
            <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDeleteResults(ward)}>
              {t('admin.results.deleteWard')}
            </Button>
          )}
          <Button
            href={wardPath(ward.wardNo)}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="icon"
            icon={ExternalLink}
            aria-label={`${t('admin.results.viewWard', { ward: ward.wardNo })} ${t('common.opensNewTab')}`}
            title={t('admin.results.viewWard', { ward: ward.wardNo })}
          />
        </div>
      </header>
      {ward.rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-500">{t('result.noCandidates')}</p>
      ) : (
        <ul className={mode === 'list' ? 'divide-y divide-slate-100' : 'grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3'}>
          {rows.map((row) => (
            <CandidateEntry
              key={row.id}
              row={row}
              mode={mode}
              isWinner={ward.winner?.id === row.id}
              onOpen={() => onOpen(row)}
              onEdit={() => onEdit(row)}
              onDelete={() => onDeleteResult(row)}
            />
          ))}
        </ul>
      )}
    </article>
  )
}

/** Explicit edit of one candidate's vote count (returns a declared ward to Pending). */
function VotesForm({ candidate, onClose }) {
  const { t } = useLanguage()
  const notify = useToast()
  const { setResult } = useResults()
  const validate = (values) => validateVotesInput(values).errors ?? {}
  const { bind, errors, handleSubmit, submitting, formError } = useForm({ totalVotes: candidate.totalVotes != null ? String(candidate.totalVotes) : '' }, validate)

  const save = async (values) => {
    const response = await setResult(candidate.id, validateVotesInput(values).record.totalVotes)
    notify(t('admin.results.updated'))
    if (response.reopened?.length) notify(t('admin.results.autoReopened', { wards: response.reopened.join(', ') }), 'warning')
    onClose()
  }

  return (
    <FormModal
      open
      onClose={onClose}
      size="sm"
      title={t('admin.results.editTitle')}
      description={`${candidate.name} · ${candidate.party} · ${t('common.ward', { ward: candidate.wardNo })}`}
      formId="votes-form"
      submitLabel={t('admin.results.saveVotes')}
      submitting={submitting}
      formError={formError}
    >
      <form id="votes-form" onSubmit={handleSubmit(save)} noValidate>
        <Field label={t('admin.columns.totalVotes')} required error={errors.totalVotes && t(errors.totalVotes)}>
          {(p) => <Input {...p} {...bind('totalVotes')} inputMode="numeric" autoComplete="off" />}
        </Field>
      </form>
    </FormModal>
  )
}

/** Why a ward cannot be declared yet, in the order the server checks it. */
function declareBlocker(ward) {
  if (!ward.rows.length) return 'errors.NO_CANDIDATES'
  if (!ward.hasResults) return 'errors.NO_RESULTS'
  if (!ward.resultsComplete) return 'admin.results.declareIncomplete'
  if (ward.isTie) return 'admin.results.declareTied'
  return null
}

/** Ward-grouped admin result list (wards by number, candidates by votes) with all result actions. */
export default function WardResultList() {
  const { t, formatNumber, errorText } = useLanguage()
  const { wards, deleteResult, deleteWardResults, declareWard, reopenWard } = useResults()
  const { openProfile } = useCandidateProfile()
  const notify = useToast()
  const [searchParams] = useSearchParams()
  // Links elsewhere in the panel open one ward directly with ?ward=<n>.
  const [filters, setFilters] = useState({ q: '', ward: searchParams.get('ward') ?? '', status: '' })
  const [mode, setMode] = useState('cards')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null) // { type, ward?, record?, reason? }

  const close = () => setDialog(null)
  const reportReopened = (reopened) => {
    if (reopened?.length) notify(t('admin.results.autoReopened', { wards: reopened.join(', ') }), 'warning')
  }
  /** Runs a server action; failures become a toast (an expired session is handled by the context). */
  const run = async (action) => {
    try {
      await action()
    } catch (error) {
      if (error.code !== 'UNAUTHORIZED') notify(errorText(error), 'error')
    }
  }

  const q = filters.q.trim()
  const visible = wards
    .filter((w) => (!filters.ward || w.wardNo === Number(filters.ward)) && (!filters.status || w.status === filters.status))
    .map((w) => ({ ward: w, rows: q ? w.rows.filter((r) => matchesCandidate(r, q)) : w.rows }))
    .filter(({ rows }) => !q || rows.length)
  const { pageItems, pageCount, current } = paginate(visible, page, PAGE_SIZE)

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const recordLine = (r) => t('admin.results.recordLine', { name: r.name, ward: r.wardNo, votes: formatNumber(r.totalVotes) })
  const declareWinner = dialog?.type === 'declare' && dialog.ward.rows[0]
  const openDeclare = (ward) => {
    const reason = declareBlocker(ward)
    setDialog(reason ? { type: 'cannotDeclare', ward, reason } : { type: 'declare', ward })
  }

  if (!wards.length) return <EmptyState title={t('admin.wards.empty')} description={t('admin.wards.emptyText')} action={<Button to="/admin/wards">{t('admin.upload.goToWards')}</Button>} />

  return (
    <div className="space-y-4">
      <FilterBar
        search={filters.q}
        onSearchChange={(value) => updateFilter('q', value)}
        searchPlaceholder={t('admin.results.search')}
        values={filters}
        onChange={updateFilter}
        onReset={() => {
          setFilters({ q: '', ward: '', status: '' })
          setPage(1)
        }}
        canReset={Boolean(filters.q || filters.ward || filters.status)}
        filters={[
          { key: 'ward', label: t('field.ward'), options: wards.map((w) => ({ value: String(w.wardNo), label: t('common.ward', { ward: w.wardNo }) })) },
          { key: 'status', label: t('field.status'), options: Object.entries(STATUS_LABELS).map(([value, key]) => ({ value, label: t(`status.${key}`) })) },
        ]}
        className="border-slate-200/80 shadow-none"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500" aria-live="polite">
          {t('admin.results.wardCount', { count: formatNumber(visible.length) })}
        </p>
        <div role="group" aria-label={t('admin.results.viewMode')} className="inline-flex rounded-md border border-slate-200 bg-white p-[3px]">
          {[
            ['cards', LayoutGrid, 'admin.results.viewCards'],
            ['list', List, 'admin.results.viewList'],
          ].map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-[13px] font-semibold transition-colors',
                mode === value ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {visible.length ? (
        <>
          {pageItems.map(({ ward, rows }) => (
            <WardBlock
              key={ward.wardNo}
              ward={ward}
              rows={rows}
              mode={mode}
              onOpen={(row) => openProfile(row.id, { manage: true })}
              onView={(w) => setDialog({ type: 'view', ward: w })}
              onDeclare={openDeclare}
              onReopen={(w) => setDialog({ type: 'reopen', ward: w })}
              onDeleteResults={(w) => setDialog({ type: 'deleteResults', ward: w })}
              onEdit={(record) => setDialog({ type: 'edit', record })}
              onDeleteResult={(record) => setDialog({ type: 'deleteResult', record })}
            />
          ))}
          {pageCount > 1 && (
            <div className="rounded-xl border border-slate-200/80 bg-white">
              <Pagination page={current} pageCount={pageCount} total={visible.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </div>
          )}
        </>
      ) : (
        <EmptyState />
      )}

      <WardDetailModal
        wardNo={dialog?.type === 'view' ? dialog.ward.wardNo : null}
        onClose={close}
        footerActions={
          dialog?.type === 'view' &&
          dialog.ward.status !== 'declared' && (
            <Button icon={CheckCircle2} onClick={() => openDeclare(dialog.ward)} disabled={!dialog.ward.hasResults}>
              {t('admin.results.declare')}
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={dialog?.type === 'declare'}
        title={t('admin.results.declareTitle')}
        message={
          dialog?.type === 'declare' && (
            <>
              {t('admin.results.declareConfirm', { ward: dialog.ward.wardNo })}
              <span className="mt-2 block font-semibold text-navy-900">
                {t('admin.results.declareWinner', { name: declareWinner.name, votes: formatNumber(declareWinner.totalVotes) })}
              </span>
            </>
          )
        }
        confirmLabel={t('admin.results.declare')}
        confirmVariant="primary"
        onConfirm={async () => {
          const ward = dialog.ward
          try {
            await declareWard(ward.wardNo)
            notify(t('admin.results.declared', { ward: ward.wardNo }))
          } catch (error) {
            // The server is the final check: a tie or missing result found there is explained.
            if (['TIE', 'RESULTS_INCOMPLETE', 'NO_RESULTS', 'NO_CANDIDATES'].includes(error.code)) {
              setDialog({ type: 'cannotDeclare', ward, reason: error.code === 'TIE' ? 'admin.results.declareTied' : `errors.${error.code}` })
              return false
            }
            if (error.code !== 'UNAUTHORIZED') notify(errorText(error), 'error')
          }
        }}
        onClose={close}
      />

      <Modal open={dialog?.type === 'cannotDeclare'} onClose={close} title={t('admin.results.declareTitle')} size="sm" footer={<Button onClick={close}>{t('common.close')}</Button>}>
        {dialog?.type === 'cannotDeclare' && (
          <p className="flex items-start gap-2 text-sm text-slate-700">
            {dialog.reason === 'admin.results.declareTied' ? (
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            )}
            {t(dialog.reason, { count: formatNumber(dialog.ward.rows.length - dialog.ward.resultCount) })}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={dialog?.type === 'reopen'}
        title={t('admin.results.reopenTitle')}
        message={dialog?.type === 'reopen' && t('admin.results.reopenConfirm', { ward: dialog.ward.wardNo })}
        confirmLabel={t('admin.results.reopen')}
        confirmVariant="primary"
        onConfirm={() =>
          run(async () => {
            await reopenWard(dialog.ward.wardNo)
            notify(t('admin.results.reopened', { ward: dialog.ward.wardNo }))
          })
        }
        onClose={close}
      />

      <ConfirmDialog
        open={dialog?.type === 'deleteResults'}
        title={t('admin.results.deleteWardTitle')}
        message={dialog?.type === 'deleteResults' && t('admin.results.deleteWardConfirm', { ward: dialog.ward.wardNo, count: formatNumber(dialog.ward.resultCount) })}
        confirmLabel={t('admin.results.deleteWard')}
        onConfirm={() =>
          run(async () => {
            await deleteWardResults(dialog.ward.wardNo)
            notify(t('admin.results.wardDeleted', { ward: dialog.ward.wardNo }))
          })
        }
        onClose={close}
      />

      <ConfirmDialog
        open={dialog?.type === 'deleteResult'}
        title={t('admin.results.deleteCandidateTitle')}
        message={
          dialog?.type === 'deleteResult' && (
            <>
              {t('admin.results.deleteMessage')}
              <span className="mt-2 block font-semibold text-navy-900">{recordLine(dialog.record)}</span>
            </>
          )
        }
        confirmLabel={t('admin.results.deleteCandidate')}
        onConfirm={() =>
          run(async () => {
            const response = await deleteResult(dialog.record.id)
            notify(t('admin.results.deleted'))
            reportReopened(response.reopened)
          })
        }
        onClose={close}
      />

      {dialog?.type === 'edit' && <VotesForm candidate={dialog.record} onClose={close} />}
    </div>
  )
}
