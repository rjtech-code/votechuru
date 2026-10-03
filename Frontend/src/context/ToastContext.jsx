import { createContext, useCallback, useContext, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { cn } from '../lib/format'
import { useLanguage } from '../i18n/I18nContext'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const { t } = useLanguage()
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    (message, tone = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((list) => [...list, { id, message, tone }])
      setTimeout(() => dismiss(id), tone === 'warning' ? 7000 : 3500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        {toasts.map((toast) => {
          const Icon = { error: AlertCircle, warning: AlertTriangle }[toast.tone] ?? CheckCircle2
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-pop-in items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-card-hover"
            >
              <Icon
                aria-hidden="true"
                className={cn('mt-0.5 h-5 w-5 shrink-0', { error: 'text-red-600', warning: 'text-amber-600' }[toast.tone] ?? 'text-emerald-600')}
              />
              <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-0.5 text-slate-400 hover:text-slate-600"
                aria-label={t('common.dismiss')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
