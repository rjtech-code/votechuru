import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import SearchDialog from './SearchDialog'
import { publicNav } from '../config/site'
import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

const desktopLink = ({ isActive }) =>
  cn(
    'relative flex h-[52px] items-center whitespace-nowrap px-2 text-[13.5px] font-semibold transition-colors xl:px-[15px] xl:text-[14.5px]',
    'after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t-sm after:transition-colors xl:after:inset-x-[15px]',
    isActive ? 'text-brand-600 after:bg-brand-600' : 'text-slate-700 after:bg-transparent hover:text-brand-700',
  )

const mobileLink = ({ isActive }) =>
  cn(
    'block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100',
  )

/** White navigation bar below the top header, with search and the language switcher. */
export default function Navbar() {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    // "/" opens search from anywhere outside a form field.
    const onKeyDown = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="container-page flex h-[52px] items-center justify-between gap-3">
        <button
          type="button"
          className="-ml-1 inline-flex h-9 items-center gap-2 rounded-md px-2 text-[15px] font-semibold text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          <span className="hidden sm:inline">{t('nav.menu')}</span>
        </button>

        <nav aria-label={t('nav.main')} className="-ml-2 hidden lg:block xl:ml-0">
          <ul className="flex items-center">
            {publicNav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={desktopLink}>
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t('nav.searchPortal')}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-[14px] text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 xl:min-w-[76px]"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden xl:inline">{t('nav.search')}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label={t('nav.main')} className="animate-slide-down border-t border-slate-100 bg-white lg:hidden">
          <ul className="container-page grid gap-1 py-3 sm:grid-cols-2">
            {[...publicNav, { to: '/about', labelKey: 'nav.about' }].map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={mobileLink}>
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
