import { Vote } from 'lucide-react'
import HeroSkyline from './HeroSkyline'
import SearchBox from './SearchBox'
import { useLanguage } from '../i18n/I18nContext'

/** Home page hero: navy sky over the Churu skyline, with title and search. */
export default function Hero() {
  const { t } = useLanguage()
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-gradient-to-b from-[#132c63] to-[#183673]">
      <HeroSkyline className="absolute inset-x-0 bottom-0 -z-10 h-[78%] w-full sm:h-full" />
      <div className="container-page pb-[112px] pt-12 sm:pb-[72px] sm:pt-[78px]">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[12.5px] font-bold text-white sm:text-[13px]">
          <Vote className="h-3.5 w-3.5 text-[#f5b400]" aria-hidden="true" />
          {t('hero.badge')}
        </p>
        <h1 id="hero-title" className="mt-1.5 text-[34px] font-extrabold leading-[1.18] tracking-tight text-white sm:text-[44px] lg:text-[50px]">
          {t('hero.title')}
        </h1>
        <p className="mt-2.5 max-w-[670px] text-[15px] leading-[1.65] text-white/90 sm:text-[17px]">{t('hero.description')}</p>
        <div className="mt-[30px]">
          <SearchBox />
        </div>
      </div>
    </section>
  )
}
