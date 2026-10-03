import { Link, NavLink } from 'react-router-dom'
import { BarChart3, LayoutDashboard, LogOut, MapPin, Settings, Upload, X } from 'lucide-react'
import { LogoTile } from '../BrandMark'
import { useLanguage } from '../../i18n/I18nContext'
import { cn } from '../../lib/format'

export const adminNav = [
  { to: '/admin/dashboard', labelKey: 'admin.nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/results', labelKey: 'admin.nav.results', icon: BarChart3 },
  { to: '/admin/upload', labelKey: 'admin.nav.upload', icon: Upload },
  { to: '/admin/wards', labelKey: 'admin.nav.wards', icon: MapPin },
  { to: '/admin/settings', labelKey: 'admin.nav.settings', icon: Settings },
]

const itemClass = ({ isActive }) =>
  cn(
    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] font-semibold transition-colors',
    isActive ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r before:bg-[#f5b400]' : 'text-white/70 hover:bg-white/5 hover:text-white',
  )

/** Navy sidebar. Fixed on large screens; slide-in drawer on smaller ones. */
export default function AdminSidebar({ open, onClose, onLogout }) {
  const { t } = useLanguage()
  return (
    <>
      <div
        className={cn('fixed inset-0 z-40 bg-navy-950/60 transition-opacity duration-200 lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy-900 transition-[transform,visibility] duration-200 ease-out lg:visible lg:translate-x-0',
          // `invisible` keeps the off-screen drawer out of the keyboard tab order.
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
        aria-label={t('admin.panel')}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
          <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-2.5">
            <LogoTile className="h-9 w-9" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[14px] font-extrabold text-white">{t('site.title')}</span>
              <span className="block text-[11.5px] text-white/60">{t('admin.panel')}</span>
            </span>
          </Link>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden" aria-label={t('admin.closeNav')}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {adminNav.map(({ to, labelKey, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={itemClass} onClick={onClose}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {t(labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            {t('admin.nav.logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
