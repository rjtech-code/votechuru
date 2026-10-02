import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useLanguage } from '../i18n/I18nContext'
import { parseWardQuery } from '../lib/wards'
import { wardPath } from '../lib/paths'

/**
 * Large hero search. A ward number ("12", "Ward 12", "वार्ड 12") opens that ward's
 * result; any other text searches candidate names on the results page.
 */
export default function SearchBox() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const q = query.trim()
    const wardNo = parseWardQuery(q)
    if (wardNo != null) navigate(wardPath(wardNo))
    else navigate(q ? `/results?q=${encodeURIComponent(q)}` : '/results')
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="w-full max-w-[674px]">
      <div className="flex h-[54px] items-center rounded-xl border-2 border-white bg-white pl-4 shadow-[0_8px_24px_rgba(4,14,40,0.25)] sm:h-[58px]">
        <Search className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
        <label htmlFor="hero-search" className="sr-only">
          {t('hero.searchLabel')}
        </label>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('hero.searchPlaceholder')}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          className="mr-[4px] h-[44px] shrink-0 rounded-lg bg-navy-800 px-5 text-[15px] font-bold text-white transition-colors hover:bg-navy-700 sm:h-[46px] sm:px-6"
        >
          {t('hero.searchButton')}
        </button>
      </div>
      <p className="mt-2 text-[12.5px] text-white/75 sm:text-[13px]">{t('hero.example')}</p>
    </form>
  )
}
