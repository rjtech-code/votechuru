import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import HeroSkyline from '../HeroSkyline'
import { useLanguage } from '../../i18n/I18nContext'

export function Breadcrumbs({ items }) {
  const { t } = useLanguage()
  return (
    <nav aria-label={t('nav.breadcrumb')} className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-white/70">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${index}-${item.label}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-white">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-white/90' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 text-white/50" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Inner-page header: a compact version of the home hero (navy sky, faint skyline)
 * so every page shares the same visual language.
 */
export default function PageHeader({ title, description, breadcrumbs, actions, meta }) {
  const { t } = useLanguage()
  const crumbs = breadcrumbs ?? [{ label: t('nav.home'), to: '/' }, { label: title }]
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#132c63] to-[#183673]">
      <HeroSkyline className="absolute inset-x-0 bottom-0 -z-10 h-full w-full opacity-60" />
      <div className="container-page pb-14 pt-8 sm:pb-16 sm:pt-10">
        <Breadcrumbs items={crumbs} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-white sm:text-[36px]">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/85">{description}</p>}
            {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  )
}

/** Main content container that slightly overlaps the page header, like the home cards overlap the hero. */
export function PageBody({ children, className = '' }) {
  return <div className={`container-page relative -mt-8 space-y-6 pb-14 ${className}`}>{children}</div>
}
