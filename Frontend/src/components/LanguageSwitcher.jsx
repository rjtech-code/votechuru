import { useLanguage } from '../i18n/I18nContext'
import { LANGUAGES } from '../i18n/translations'
import { cn } from '../lib/format'

/** हिन्दी / English toggle. Changes the language for the whole application. */
export default function LanguageSwitcher({ className }) {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div role="group" aria-label={t('lang.label')} className={cn('inline-flex rounded-md border border-slate-200 bg-white p-[3px]', className)}>
      {LANGUAGES.map((code) => {
        const active = language === code
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            className={cn(
              'h-7 rounded px-2.5 text-[14px] font-semibold transition-colors duration-150',
              active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            {t(`lang.${code}`)}
          </button>
        )
      })}
    </div>
  )
}
