import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

const SearchBar = forwardRef(function SearchBar({ value, onChange, placeholder, label, size = 'md', id = 'search-input', className, ...props }, ref) {
  const { t } = useLanguage()
  const large = size === 'lg'
  return (
    <div className={cn('relative', className)} role="search">
      <label className="sr-only" htmlFor={id}>
        {label ?? placeholder ?? t('nav.search')}
      </label>
      <Search
        className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400', large ? 'left-4 h-5 w-5' : 'left-3 h-4 w-4')}
        aria-hidden="true"
      />
      <input
        ref={ref}
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t('hero.searchPlaceholder')}
        autoComplete="off"
        className={cn(
          'block w-full rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 [&::-webkit-search-cancel-button]:hidden',
          large ? 'h-12 pl-12 pr-11 text-base' : 'h-10 pl-9 pr-9 text-sm',
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn('absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600', large ? 'right-3' : 'right-2')}
          aria-label={t('filter.reset')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
})

export default SearchBar
