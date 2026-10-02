import { AlertTriangle, Loader2, SearchX } from 'lucide-react'
import Button from './Button'
import { cn } from '../../lib/format'
import { useLanguage } from '../../i18n/I18nContext'

export function LoadingState({ label, className }) {
  const { t } = useLanguage()
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm text-slate-500">{label ?? t('state.loading')}</p>
    </div>
  )
}

export function EmptyState({ title, description, icon: Icon = SearchX, action, className }) {
  const { t } = useLanguage()
  const text = description === undefined ? t('state.emptyDescription') : description
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-semibold text-slate-900">{title ?? t('state.emptyTitle')}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ title, description, onRetry, className }) {
  const { t } = useLanguage()
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-semibold text-slate-900">{title ?? t('state.errorTitle')}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description ?? t('state.errorDescription')}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          {t('state.retry')}
        </Button>
      )}
    </div>
  )
}
