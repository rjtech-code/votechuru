import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Copy, Loader2, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import { useLanguage } from '../../i18n/I18nContext'
import { cn } from '../../lib/format'

const MAX_ROW_ERRORS = 5
const STEP = { uploading: 1, checking: 2, success: 3 }

/** Translates an upload ApiError into a headline plus optional detail lines. */
function describeError(error, t) {
  const code = error?.code
  const details = error?.details ?? {}
  if (code === 'MISSING_FIELDS') {
    return {
      message: t('admin.progress.errors.MISSING_FIELDS'),
      lines: details.missingFields?.length ? [t('admin.progress.errors.missingList', { fields: details.missingFields.join(', ') })] : [],
    }
  }
  if (code === 'INVALID_ROWS') {
    const rows = details.errors ?? []
    const lines = rows
      .slice(0, MAX_ROW_ERRORS)
      .map((e) => t('admin.progress.row', { row: e.row, message: t(`admin.progress.rowCodes.${e.code}`) }))
    const remaining = (details.errorCount ?? rows.length) - lines.length
    if (remaining > 0) lines.push(t('admin.progress.moreErrors', { count: remaining }))
    return { message: t('admin.progress.errors.INVALID_ROWS'), lines }
  }
  const key = ['NO_ROWS', 'EMPTY_SHEET', 'TOO_MANY_ROWS', 'INVALID_FILE_TYPE', 'FILE_TOO_LARGE', 'PARSE_ERROR', 'NO_FILE', 'UPLOAD_ERROR'].includes(code)
    ? `admin.progress.errors.${code}`
    : ['UNAUTHORIZED', 'NETWORK_ERROR', 'STORAGE_FULL'].includes(code)
      ? `errors.${code}`
      : 'errors.generic'
  return { message: t(key), lines: [] }
}

/**
 * Small centred popup that follows an Excel upload:
 * uploading → checking → success, or error / duplicate-choice states.
 * state: { stage, fileName, error?, duplicates?, total?, added?, skipped? }
 */
export default function UploadProgressModal({ state, onClose, onSkipDuplicates, onImportAnyway }) {
  const { t, formatNumber } = useLanguage()
  const titleId = useId()
  const panelRef = useRef(null)
  const stage = state?.stage
  const busy = stage === 'uploading' || stage === 'checking'
  const closable = stage === 'error' || stage === 'duplicates' || stage === 'success'

  useEffect(() => {
    if (!stage) return undefined
    panelRef.current?.querySelector('button')?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && closable) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [stage, closable, onClose])

  if (!stage) return null

  const error = stage === 'error' ? describeError(state.error, t) : null
  const title = {
    uploading: t('admin.progress.uploading'),
    checking: t('admin.progress.checking'),
    success: t('admin.progress.success'),
    error: t('admin.progress.failed'),
    duplicates: t('admin.progress.duplicatesTitle'),
  }[stage]

  const icon = {
    uploading: <Loader2 className="h-7 w-7 animate-spin text-brand-600" />,
    checking: <Loader2 className="h-7 w-7 animate-spin text-brand-600" />,
    success: <CheckCircle2 className="h-7 w-7 text-emerald-600" />,
    error: <XCircle className="h-7 w-7 text-red-600" />,
    duplicates: <Copy className="h-7 w-7 text-amber-600" />,
  }[stage]

  const iconBg = { success: 'bg-emerald-50', error: 'bg-red-50', duplicates: 'bg-amber-50' }[stage] ?? 'bg-brand-50'

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 animate-fade-in bg-slate-900/40" aria-hidden="true" />
      <div
        ref={panelRef}
        role={stage === 'error' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        className="relative w-full max-w-sm animate-pop-in rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <span className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-full', iconBg)} aria-hidden="true">
          {icon}
        </span>
        <h2 id={titleId} className="mt-4 text-[17px] font-bold text-navy-900" aria-live="polite">
          {title}
        </h2>
        {state.fileName && <p className="mt-1 truncate text-xs text-slate-500">{state.fileName}</p>}

        {STEP[stage] && (
          <div className="mt-4 flex items-center justify-center gap-1.5" aria-label={t('admin.progress.step', { n: STEP[stage] })}>
            {[1, 2, 3].map((n) => (
              <span key={n} className={cn('h-1.5 w-8 rounded-full transition-colors', n <= STEP[stage] ? 'bg-brand-600' : 'bg-slate-200')} />
            ))}
          </div>
        )}

        {stage === 'success' && (
          <p className="mt-3 text-sm text-slate-600">
            {t('admin.progress.added', { count: formatNumber(state.added) })}
            {state.skipped > 0 && <> {t('admin.progress.skipped', { count: formatNumber(state.skipped) })}</>}
          </p>
        )}

        {stage === 'error' && (
          <div className="mt-3 text-left">
            <p className="text-sm text-slate-700">{error.message}</p>
            {error.lines.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">
                {error.lines.map((line) => (
                  <li key={line} className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-slate-500">{t('admin.progress.nothingSaved')}</p>
            <Button variant="secondary" className="mt-5 w-full" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        )}

        {stage === 'duplicates' && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {t('admin.progress.duplicatesText', { count: formatNumber(state.duplicates), total: formatNumber(state.total) })}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={onSkipDuplicates}>{t('admin.progress.skipDuplicates')}</Button>
              <Button variant="secondary" onClick={onImportAnyway}>
                {t('admin.progress.importAnyway')}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                {t('common.cancel')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
