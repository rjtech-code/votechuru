import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Field, Select } from './ui/Form'
import Button from './ui/Button'
import SearchBar from './SearchBar'
import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

const LG_COLUMNS = { 1: 'lg:grid-cols-3', 2: 'lg:grid-cols-3', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' }

/**
 * Search box plus a row of select filters.
 * filters: [{ key, label, options }]  — options are strings or { value, label }.
 */
export default function FilterBar({ search, onSearchChange, searchPlaceholder, filters = [], values, onChange, onReset, canReset, className }) {
  const { t } = useLanguage()
  return (
    <div className={cn('rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {t('filter.title')}
        </p>
        {canReset && (
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>
            {t('filter.reset')}
          </Button>
        )}
      </div>
      {onSearchChange && (
        <SearchBar id="filter-search" className="mt-3" value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
      )}
      <div className={cn('mt-3 grid gap-3 sm:grid-cols-2', LG_COLUMNS[filters.length])}>
        {filters.map((filter) => (
          <Field key={filter.key} label={filter.label} hideLabel>
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={values[filter.key] ?? ''}
                onChange={(event) => onChange(filter.key, event.target.value)}
                options={filter.options}
                placeholder={t('filter.all', { label: filter.label })}
              />
            )}
          </Field>
        ))}
      </div>
    </div>
  )
}
