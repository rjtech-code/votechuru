import { ExternalLink, Menu } from 'lucide-react'
import Button from '../ui/Button'
import LanguageSwitcher from '../LanguageSwitcher'
import { useLanguage } from '../../i18n/I18nContext'

export default function AdminHeader({ user, onOpenSidebar, sidebarOpen }) {
  const { t } = useLanguage()
  const initials = 'SA'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar} aria-label={t('admin.openNav')} aria-controls="admin-sidebar" aria-expanded={sidebarOpen}>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        <Button to="/" variant="ghost" size="sm" icon={ExternalLink} className="hidden sm:inline-flex">
          {t('admin.viewSite')}
        </Button>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white" aria-hidden="true">
            {initials}
          </span>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-semibold text-navy-900">{t('admin.superAdmin')}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
