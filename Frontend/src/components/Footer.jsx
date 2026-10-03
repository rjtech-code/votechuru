import { Link } from 'react-router-dom'
import { Info, Mail } from 'lucide-react'
import { LogoTile, StateEmblem } from './BrandMark'
import { footerNav, site } from '../config/site'
import { useLanguage } from '../i18n/I18nContext'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="mt-auto bg-navy-900 text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3">
            <LogoTile className="h-11 w-11" />
            <div className="leading-tight">
              <p className="text-[18px] font-extrabold">{t('site.title')}</p>
              <p className="mt-0.5 text-[13px] text-white/75">{t('footer.tagline')}</p>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-white/75">
            <StateEmblem className="h-6 w-6" />
            {t('footer.district')}
          </p>
        </div>

        <nav aria-labelledby="footer-links" className="md:col-span-2">
          <h2 id="footer-links" className="text-[15px] font-bold">
            {t('footer.quickLinks')}
          </h2>
          <ul className="mt-3 space-y-2">
            {footerNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-white/75 transition-colors hover:text-white">
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <Info className="h-4 w-4 text-[#f5b400]" aria-hidden="true" />
            {t('footer.disclaimerTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">{t('pages.about.disclaimer')}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{t('footer.notAffiliated')}</p>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-[15px] font-bold">{t('footer.contact')}</h2>
          <a href={`mailto:${site.contactEmail}`} className="mt-3 inline-flex items-center gap-2 break-all text-sm text-white/75 hover:text-white">
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            {site.contactEmail}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-white/60">{t('footer.copyright')}</p>
      </div>
    </footer>
  )
}
