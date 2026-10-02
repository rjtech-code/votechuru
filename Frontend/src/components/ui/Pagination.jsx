import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'
import { useLanguage } from '../../i18n/I18nContext'

export function paginate(items, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)
  return { pageItems: items.slice((current - 1) * pageSize, current * pageSize), pageCount, current }
}

export default function Pagination({ page, pageCount, total, pageSize, onChange }) {
  const { t, formatNumber } = useLanguage()
  if (pageCount <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <nav aria-label={t('pagination.label')} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
      <p className="text-sm text-slate-500">
        {t('pagination.showing', { from: formatNumber(from), to: formatNumber(to), total: formatNumber(total) })}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          {t('pagination.previous')}
        </Button>
        <span className="text-sm text-slate-500" aria-current="page">
          {page} / {pageCount}
        </span>
        <Button variant="secondary" size="sm" iconRight={ChevronRight} disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
          {t('pagination.next')}
        </Button>
      </div>
    </nav>
  )
}
