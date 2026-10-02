import { Link } from 'react-router-dom'
import { LogoTile, StateEmblem } from './BrandMark'
import { useLanguage } from '../i18n/I18nContext'

/** Dark navy civic header: logo + title on the left, values and district branding on the right. */
export default function TopHeader() {
  const { t } = useLanguage()
  const values = [t('header.values'), t('header.process'), t('header.democracy')]

  return (
    <div className="bg-navy-900 text-white">
      <div className="container-page flex min-h-[64px] items-center justify-between gap-4 py-2.5 sm:min-h-[75px]">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={t('site.homeLink')}>
          <LogoTile className="h-10 w-10 sm:h-[46px] sm:w-[46px]" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[18px] font-extrabold tracking-tight sm:text-[25px]">{t('site.title')}</span>
            <span className="mt-0.5 block truncate text-[11.5px] font-medium text-white/80 sm:text-[14px]">{t('site.subtitle')}</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center">
          <ul className="hidden items-center text-[13.5px] font-bold xl:flex">
            {values.map((value, index) => (
              <li key={value} className="flex items-center">
                {index > 0 && (
                  <span className="mx-1.5 text-white/60" aria-hidden="true">
                    |
                  </span>
                )}
                {value}
              </li>
            ))}
          </ul>
          <span className="mx-5 hidden h-10 w-px bg-white/20 xl:block" aria-hidden="true" />
          <div className="hidden items-center gap-2 sm:flex">
            <StateEmblem className="h-8 w-8" />
            <span className="leading-tight">
              <span className="block text-[14px] font-bold">{t('header.district')}</span>
              <span className="block text-[11px] text-white/75">{t('header.state')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
