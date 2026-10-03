import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, ExternalLink, LayoutGrid, List, RotateCcw, Scale, Trash2 } from 'lucide-react'
import FilterBar from '../FilterBar'
import StatusBadge, { wardStatus } from '../StatusBadge'
import CandidateAvatar from '../CandidateAvatar'
import FormModal from './FormModal'
import ManualResultForm from './ManualResultForm'
import RowActions from './RowActions'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import Pagination, { paginate } from '../ui/Pagination'
import { EmptyState } from '../ui/States'
import { useResults } from '../../context/ResultsContext'
import { useToast } from '../../context/ToastContext'
import { useCandidateProfile } from '../../context/CandidateProfileContext'
import { useLanguage } from '../../i18n/I18nContext'
import { matchesCandidate } from '../../lib/wards'
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

/** Candidate as a list row or a card; the name opens the (manageable) profile popup. */
function CandidateEntry({ row, isWinner, mode, onOpen, onEdit, onDelete }) {
  const { t, formatNumber, formatPercent } = useLanguage()
  const nameButton = (
    <button type="button" onClick={onOpen} className="truncate text-left font-semibold text-navy-900 hover:text-brand-700 hover:underline" aria-label={t('result.viewProfile', { name: row.name })}>
      {row.name}
    </button>
  )
  if (mode === 'list') {
    return (
      <li className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
        <span className="w-5 shrink-0 text-sm tabular-nums text-slate-400">{row.position}</span>
        <CandidateAvatar candidate={row} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex flex-wrap items-center gap-2">
            {nameButton}
            {isWinner && <WinnerBadge />}
          </span>
          <span className="truncate text-xs text-slate-500">{row.party || '—'}</span>
        </span>
        <span className="text-right text-sm font-semibold tabular-nums text-navy-900">{formatNumber(row.totalVotes)}</span>
        <span className="hidden w-14 text-right text-xs tabular-nums text-slate-500 sm:inline">{formatPercent(row.percent)}</span>
        <RowActions label={row.name} onEdit={onEdit} onDelete={onDelete} />
      </li>
    )
  }
  return (
    <li className={cn('flex flex-col rounded-lg border p-3', isWinner ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200/80 bg-white')}>
      <div className="flex items-start gap-3">
        <CandidateAvatar candidate={row} size="md" />
        <div className="min-w-0 flex-1">
          {nameButton}
          <p className="truncate text-xs text-slate-500">{row.party || '—'}</p>
          {isWinner && (
            <div className="mt-1">
              <WinnerBadge />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-2">
        <div className="text-xs text-slate-500">
          <span className="block text-base font-bold tabular-nums text-navy-900">{formatNumber(row.totalVotes)}</span>
          {t('result.position')} {row.position} · {formatPercent(row.percent)}
        </div>
        <RowActions label={row.name} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </li>
  )
}

function WardBlock({ ward, rows, mode, onDeclare, onReopen, onDeleteWard, onEdit, onDeleteCandidate, onOpen }) {
  const { t, formatNumber } = useLanguage()
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
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {ward.wardName && <>{ward.wardName} · </>}
            {t('result.candidatesCount', { count: formatNumber(ward.rows.length) })} · {t('result.totalVotes')}: {formatNumber(ward.totalVotes)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            href={wardPath(ward.wardNo)}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            icon={ExternalLink}
            aria-label={`${t('admin.results.viewWard', { ward: ward.wardNo })} ${t('common.opensNewTab')}`}
          >
            {t('admin.results.view')}
          </Button>
          {ward.status === 'declared' ? (
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => onReopen(ward)}>
              {t('admin.results.reopen')}
            </Button>
          ) : (
            <Button size="sm" icon={CheckCircle2} onClick={() => onDeclare(ward)} disabled={!ward.rows.length}>
              {t('admin.results.declare')}
            </Button>
          )}
          {ward.rows.length > 0 && (
            <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDeleteWard(ward)}>
              {t('admin.results.deleteWard')}
            </Button>
          )}
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
              onDelete={() => onDeleteCandidate(row)}
            />
          ))}
        </ul>
      )}
    </article>
  )
}

/** Ward-grouped admin result list (wards by number, candidates by votes) with all result actions. */
export default function WardResultList() {
  const { t, formatNumber } = useLanguage()
  const { wards, updateCandidate, deleteCandidate, deleteWardCandidates, declareWard, reopenWard, checkCandidate } = useResults()
  const { openProfile } = useCandidateProfile()
  const notify = useToast()
  const [searchParams] = useSearchParams()
  // The dashboard links here with ?ward=<n> to open one ward directly.
  const [filters, setFilters] = useState({ q: '', ward: searchParams.get('ward') ?? '', status: '' })
  const [mode, setMode] = useState('cards')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null) // { type, ward?, record? }

  const close = () => setDialog(null)
  const reportReopened = (reopened) => {
    if (reopened?.length) notify(t('admin.results.autoReopened', { wards: reopened.join(', ') }), 'warning')
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

  const saveEdit = async (record) => {
    if (checkCandidate(record, dialog.record.id).duplicate) throw Object.assign(new Error('Duplicate'), { code: 'DUPLICATE_RECORD' })
    const reopened = updateCandidate(dialog.record.id, record)
    close()
    notify(t('admin.results.updated'))
    reportReopened(reopened)
  }

  const recordLine = (r) => t('admin.results.recordLine', { name: r.name, ward: r.wardNo, votes: formatNumber(r.totalVotes) })
  const declareWinner = dialog?.type === 'declare' && dialog.ward.rows[0]

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
              onDeclare={(w) => setDialog({ type: w.canDeclare ? 'declare' : 'tied', ward: w })}
              onReopen={(w) => setDialog({ type: 'reopen', ward: w })}
              onDeleteWard={(w) => setDialog({ type: 'deleteWard', ward: w })}
              onEdit={(record) => setDialog({ type: 'edit', record })}
              onDeleteCandidate={(record) => setDialog({ type: 'deleteCandidate', record })}
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
        onConfirm={() => {
          declareWard(dialog.ward.wardNo)
          notify(t('admin.results.declared', { ward: dialog.ward.wardNo }))
        }}
        onClose={close}
      />

      <Modal open={dialog?.type === 'tied'} onClose={close} title={t('admin.results.declareTitle')} size="sm" footer={<Button onClick={close}>{t('common.close')}</Button>}>
        <p className="flex items-start gap-2 text-sm text-slate-700">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          {t('admin.results.declareTied')}
        </p>
      </Modal>

      <ConfirmDialog
        open={dialog?.type === 'reopen'}
        title={t('admin.results.reopenTitle')}
        message={dialog?.type === 'reopen' && t('admin.results.reopenConfirm', { ward: dialog.ward.wardNo })}
        confirmLabel={t('admin.results.reopen')}
        confirmVariant="primary"
        onConfirm={() => {
          reopenWard(dialog.ward.wardNo)
          notify(t('admin.results.reopened', { ward: dialog.ward.wardNo }))
        }}
        onClose={close}
      />

      <ConfirmDialog
        open={dialog?.type === 'deleteWard'}
        title={t('admin.results.deleteWardTitle')}
        message={dialog?.type === 'deleteWard' && t('admin.results.deleteWardConfirm', { ward: dialog.ward.wardNo, count: formatNumber(dialog.ward.rows.length) })}
        confirmLabel={t('admin.results.deleteWard')}
        onConfirm={() => {
          deleteWardCandidates(dialog.ward.wardNo)
          notify(t('admin.results.wardDeleted', { ward: dialog.ward.wardNo }))
        }}
        onClose={close}
      />

      <ConfirmDialog
        open={dialog?.type === 'deleteCandidate'}
        title={t('admin.results.deleteCandidateTitle')}
        message={
          dialog?.type === 'deleteCandidate' && (
            <>
              {t('admin.results.deleteMessage')}
              <span className="mt-2 block font-semibold text-navy-900">{recordLine(dialog.record)}</span>
            </>
          )
        }
        confirmLabel={t('admin.results.deleteCandidate')}
        onConfirm={() => {
          const reopened = deleteCandidate(dialog.record.id)
          notify(t('admin.results.deleted'))
          reportReopened(reopened)
        }}
        onClose={close}
      />

      {dialog?.type === 'edit' && (
        <FormModal open onClose={close} size="md" title={t('admin.results.editTitle')} formId="edit-result-form" submitLabel={t('admin.manual.save')}>
          <ManualResultForm formId="edit-result-form" initial={dialog.record} onSubmit={saveEdit} />
        </FormModal>
      )}
    </div>
  )
}

/** Link used by the dashboard to open one ward in the list. */
export const adminWardLink = (wardNo) => `/admin/results?ward=${wardNo}#result-list`
