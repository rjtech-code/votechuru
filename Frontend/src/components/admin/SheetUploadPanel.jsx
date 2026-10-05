import { useRef } from 'react'
import { AlertTriangle, CheckCircle2, CopyCheck, FileSpreadsheet, RefreshCw, Scale, Upload, X } from 'lucide-react'
import ExcelUploader from './ExcelUploader'
import UploadProgressModal from './UploadProgressModal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Table from '../ui/Table'
import { useLanguage } from '../../i18n/I18nContext'
import { cn } from '../../lib/format'

const PREVIEW_LIMIT = 100
const MAX_REJECTED_SHOWN = 100

/** "Row 8: Total Voters is required." for a server rejection { row, code, field, ward, … }. */
export function useRowMessage() {
  const { t } = useLanguage()
  return (r) =>
    t('admin.progress.row', {
      row: r.row,
      message: t(`admin.progress.rowCodes.${r.code}`, {
        field: r.field,
        ward: r.ward,
        firstRow: r.firstRow,
        candidateId: r.candidateId,
        candidateWard: r.candidateWard,
        scopeWard: r.scopeWard,
      }),
    })
}

/** Small figure tiles: [{ label, value, tone }]. */
export function SheetStats({ items }) {
  const { formatNumber } = useLanguage()
  const tones = { red: 'text-red-700', amber: 'text-amber-700', green: 'text-emerald-700' }
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, tone }) => (
        <div key={label} className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2.5">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className={cn('mt-0.5 text-lg font-bold tabular-nums text-navy-900', tones[tone])}>{typeof value === 'number' ? formatNumber(value) : value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Row-by-row reasons for rejected rows. Nothing is dropped silently. */
export function RejectedRows({ rejected }) {
  const { t, formatNumber } = useLanguage()
  const rowMessage = useRowMessage()
  if (!rejected.length) return null
  return (
    <section aria-label={t('admin.overview.rejectedTitle')} className="rounded-lg border border-red-200 bg-red-50/60">
      <p className="flex items-center gap-1.5 border-b border-red-100 px-3 py-2 text-sm font-semibold text-red-800">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {t('admin.overview.rejectedTitle')}
      </p>
      <ul className="max-h-48 space-y-1 overflow-y-auto px-3 py-2 text-[13px] text-red-800">
        {rejected.slice(0, MAX_REJECTED_SHOWN).map((r, index) => (
          <li key={`${r.row}-${r.code}-${index}`}>{rowMessage(r)}</li>
        ))}
        {rejected.length > MAX_REJECTED_SHOWN && <li>{t('admin.results.moreConflicts', { count: formatNumber(rejected.length - MAX_REJECTED_SHOWN) })}</li>}
      </ul>
    </section>
  )
}

const STATUS = {
  new: { tone: 'green', icon: CheckCircle2, key: 'admin.overview.statusNew' },
  duplicate: { tone: 'gray', icon: CopyCheck, key: 'admin.overview.statusDuplicate' },
  conflict: { tone: 'amber', icon: Scale, key: 'admin.overview.statusConflict' },
}

export function RowStatus({ status, labelKey }) {
  const { t } = useLanguage()
  const style = STATUS[status]
  return (
    <Badge tone={style.tone} icon={style.icon}>
      {t(labelKey ?? style.key)}
    </Badge>
  )
}

/** Preview of the valid rows (the first 100). */
export function PreviewTable({ title, columns, rows, rowKey = (r) => r.row }) {
  const { t, formatNumber } = useLanguage()
  if (!rows.length) return null
  return (
    <section aria-label={title} className="overflow-hidden rounded-lg border border-slate-200/80">
      <p className="border-b border-slate-100 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900">{title}</p>
      <div className="max-h-80 overflow-y-auto">
        <Table columns={[{ key: 'row', header: t('admin.overview.row'), className: 'tabular-nums text-slate-500', render: (r) => r.row }, ...columns]} rows={rows.slice(0, PREVIEW_LIMIT)} rowKey={rowKey} caption={title} />
      </div>
      {rows.length > PREVIEW_LIMIT && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">{t('admin.overview.previewLimited', { shown: formatNumber(PREVIEW_LIMIT), total: formatNumber(rows.length) })}</p>
      )}
    </section>
  )
}

/** Explicit decision for records that differ from stored ones. "Keep existing" is the default. */
export function ConflictChoice({ name, count, value, onChange, message, replaceLabel }) {
  const { t, formatNumber } = useLanguage()
  if (!count) return null
  const options = [
    ['keep', t('admin.results.keepExisting')],
    ['replace', replaceLabel],
  ]
  return (
    <fieldset className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
      <legend className="sr-only">{t('admin.overview.conflictDecision')}</legend>
      <p className="flex items-start gap-1.5 text-sm font-semibold text-amber-900">
        <Scale className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {message ?? t('admin.overview.conflictCount', { count: formatNumber(count) })}
      </p>
      <p className="mt-1 text-xs text-amber-900/80">{t('admin.results.conflictHint')}</p>
      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:gap-5">
        {options.map(([option, label]) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="h-4 w-4 accent-brand-700" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * Drop zone, then — once the sheet has been validated — its overview in the same place.
 * The submit button is enabled only when the overview has something valid to save.
 */
export default function SheetUploadPanel({ importer, submitLabel, canSubmit, onSubmit, children }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const { preview, busy } = importer

  return (
    <div>
      {preview ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f6ed] text-[#1d8a4b]" aria-hidden="true">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">{t('admin.overview.file')}</p>
              <p className="truncate text-sm font-semibold text-navy-900">{preview.fileName}</p>
            </div>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => inputRef.current?.click()} disabled={busy}>
              {t('admin.overview.chooseAnother')}
            </Button>
            <button
              type="button"
              onClick={importer.discard}
              disabled={busy}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={t('admin.upload.removeFile')}
              title={t('admin.upload.removeFile')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              tabIndex={-1}
              aria-label={t('admin.overview.chooseAnother')}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) importer.start(file)
              }}
            />
          </div>
          <div className="space-y-4 p-4">{children}</div>
        </div>
      ) : (
        <ExcelUploader onSelect={importer.start} busy={busy} />
      )}

      <div className="mt-4 flex justify-end">
        <Button icon={Upload} onClick={onSubmit} disabled={!preview || !canSubmit || busy} loading={importer.progress?.stage === 'saving'}>
          {submitLabel}
        </Button>
      </div>
      <UploadProgressModal state={importer.progress} onClose={importer.close} />
    </div>
  )
}
