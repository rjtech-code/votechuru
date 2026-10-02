import { Home, Search } from 'lucide-react'
import Button from '../components/ui/Button'
import { useLanguage } from '../i18n/I18nContext'

export default function NotFound({ title, message }) {
  const { t } = useLanguage()
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-sm font-bold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{title ?? t('notFound.title')}</h1>
      <p className="mt-3 max-w-md text-slate-600">{message ?? t('notFound.message')}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button to="/" icon={Home}>
          {t('notFound.home')}
        </Button>
        <Button to="/results" variant="secondary" icon={Search}>
          {t('notFound.browse')}
        </Button>
      </div>
    </div>
  )
}
