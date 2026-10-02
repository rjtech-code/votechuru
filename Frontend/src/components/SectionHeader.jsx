import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useLanguage } from '../i18n/I18nContext'

/** Section title with the blue accent bar, and an optional "view all" link. */
export default function SectionHeader({ id, title, description, linkTo, linkLabel, as: Heading = 'h2' }) {
  const { t } = useLanguage()
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Heading id={id} className="flex items-center gap-2.5 text-[21px] font-extrabold text-navy-900 sm:text-[24px]">
          <span className="h-[26px] w-1 rounded-full bg-brand-600" aria-hidden="true" />
          {title}
        </Heading>
        {description && <p className="mt-1 pl-[14px] text-sm text-slate-500">{description}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="inline-flex items-center gap-0.5 text-[14px] font-bold text-brand-600 hover:text-brand-800">
          {linkLabel ?? t('common.viewAll')}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
