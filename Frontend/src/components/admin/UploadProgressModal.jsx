import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import ConflictList from './ConflictList'
import { useLanguage } from '../../i18n/I18nContext'
import { translations } from '../../i18n/translations'
import { cn } from '../../lib/format'

const STEP = { uploading: 1, checking: 2, validating: 3, saving: 4, success: 4 }
const TOTAL_STEPS = 4

/** Turns an upload ApiError into { messageKey, vars, items } translation descriptors. */
function describeError(error) {
  const code = error?.code
  const details = error?.details ?? {}
  if (code === 'MISSING_FIELDS') {
    return {
      message: { key: 'admin.progress.errors.MISSING_FIELDS', vars: { fields: (details.requiredFields ?? []).join(', ') } },
      items: details.missingFields?.length ? [{ key: 'admin.progress.errors.missingList', vars: { fields: details.missingFields.join(', ') } }] : [],
    }
  }
  const key = translations.en.admin.progress.errors[code]
    ? `admin.progress.errors.${code}`
    : translations.en.errors[code]
      ? `errors.${code}`
      : 'errors.generic'
  return { message: { key }, items: [] }
}

/**
 * Small centred popup that follows a spreadsheet upload:
 *   uploading → checking → validating (then the overview is shown on the page),
 *   saving → success after the Super Admin confirms, or an error state.
 * state: {
 *   stage, fileName, validatingKey,
 *   lines?: [{ key, vars, tone }]           summary on success
 *   rejected?: [{ key, vars }]              records not imported (shown on success)
 *   error?
 * }
 */
export default function UploadProgressModal({ state, onClose }) {
  const { t, formatNumber } = useLanguage()
  const titleId = useId()
  const panelRef = useRef(null)
  const stage = state?.stage
  const busy = stage in { uploading: 1, checking: 1, validating: 1, saving: 1 }
  const needsClose = stage === 'error' || (stage === 'success' && state.rejected?.length > 0)
  const closable = stage === 'error' || stage === 'success'

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

  const error = stage === 'error' ? describeError(state.error) : null
  const title = {
    uploading: t('admin.progress.uploading'),
    checking: t('admin.progress.checking'),
    validating: t(state.validatingKey ?? 'admin.progress.validatingCandidates'),
    saving: t('admin.progress.saving'),
    success: t('admin.progress.success'),
    error: t('admin.progress.failed'),
  }[stage]

  const icon =
    stage === 'success' ? (
      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
    ) : stage === 'error' ? (
      <XCircle className="h-7 w-7 text-red-600" />
    ) : (
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
    )
  const iconBg = { success: 'bg-emerald-50', error: 'bg-red-50' }[stage] ?? 'bg-brand-50'
  const tr = (d) => t(d.key, Object.fromEntries(Object.entries(d.vars ?? {}).map(([k, v]) => [k, typeof v === 'number' && k !== 'ward' ? formatNumber(v) : v])))

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
          <div className="mt-4 flex items-center justify-center gap-1.5" aria-label={t('admin.progress.step', { n: STEP[stage], total: TOTAL_STEPS })}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
              <span key={n} className={cn('h-1.5 w-7 rounded-full transition-colors', n <= STEP[stage] ? 'bg-brand-600' : 'bg-slate-200')} />
            ))}
          </div>
        )}

        {stage === 'success' && (
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            {state.lines?.map((line) => (
              <p key={line.key} className={line.tone === 'warning' ? 'text-amber-800' : undefined}>
                {tr(line)}
              </p>
            ))}
            {state.rejected?.length > 0 && (
              <div className="pt-2">
                <ConflictList items={state.rejected} tone="red" />
              </div>
            )}
          </div>
        )}

        {stage === 'error' && (
          <div className="mt-3 text-left">
            <p className="text-sm text-slate-700">{tr(error.message)}</p>
            {error.items.length > 0 && (
              <div className="mt-2">
                <ConflictList
                  tone="red"
                  items={error.items.map((item) => ({ key: item.key, vars: { ...item.vars, message: item.inner ? tr(item.inner) : '' } }))}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">{t('admin.progress.nothingSaved')}</p>
          </div>
        )}

        {needsClose && (
          <Button variant="secondary" className="mt-5 w-full" onClick={onClose}>
            {t('common.close')}
          </Button>
        )}
      </div>
    </div>,
    document.body,
  )
}
