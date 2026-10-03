import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '../../i18n/I18nContext'

const MAX_SHOWN = 5

/**
 * Lists conflicts or rejected rows. `items` are { key, vars } translation descriptors,
 * translated at render time so an open popup follows a language switch.
 * Numeric vars (other than ward and row numbers) are formatted.
 */
export default function ConflictList({ items, tone = 'amber' }) {
  const { t, formatNumber } = useLanguage()
  const format = (vars) =>
    Object.fromEntries(Object.entries(vars ?? {}).map(([k, v]) => [k, typeof v === 'number' && !['ward', 'row', 'firstRow'].includes(k) ? formatNumber(v) : v]))
  const colors = tone === 'red' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'
  return (
    <ul className={`max-h-48 space-y-1.5 overflow-y-auto rounded-lg px-3 py-2.5 text-left text-[13px] ${colors}`}>
      {items.slice(0, MAX_SHOWN).map((item, index) => (
        <li key={`${item.key}-${index}`} className="flex gap-1.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t(item.key, format(item.vars))}
        </li>
      ))}
      {items.length > MAX_SHOWN && <li className="pl-5">{t('admin.results.moreConflicts', { count: items.length - MAX_SHOWN })}</li>}
    </ul>
  )
}
