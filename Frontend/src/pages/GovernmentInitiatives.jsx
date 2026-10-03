import { ExternalLink, Info } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import SectionHeader from '../components/SectionHeader'
import { useLanguage } from '../i18n/I18nContext'
import { initiativeSections } from '../config/site'

/** External link to an official source; always opens in a new tab. */
export function OfficialLink({ href, children }) {
  const { t } = useLanguage()
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[13.5px] font-bold text-brand-600 hover:text-brand-800"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">{t('common.opensNewTab')}</span>
    </a>
  )
}

function InitiativeCard({ itemKey, url }) {
  const { t } = useLanguage()
  const base = `pages.initiatives.items.${itemKey}`
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
      <h3 className="text-[16px] font-bold leading-snug text-navy-900">{t(`${base}.title`)}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`${base}.text`)}</p>
      <p className="mt-3 text-xs text-slate-500">{t('pages.initiatives.source', { source: t(`${base}.source`) })}</p>
      <div className="mt-auto pt-4">
        <OfficialLink href={url}>{t('pages.initiatives.officialLink')}</OfficialLink>
      </div>
    </article>
  )
}

export default function GovernmentInitiatives() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeader title={t('pages.initiatives.title')} description={t('pages.initiatives.description')} />
      <PageBody>
        <p className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          {t('pages.initiatives.intro')}
        </p>

        {initiativeSections.map(({ key, items }) => (
            <section key={key} aria-labelledby={`initiatives-${key}`} className="pt-4">
              <SectionHeader id={`initiatives-${key}`} title={t(`pages.initiatives.${key}.title`)} description={t(`pages.initiatives.${key}.description`)} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <InitiativeCard key={item.key} itemKey={item.key} url={item.url} />
                ))}
              </div>
            </section>
        ))}
      </PageBody>
    </>
  )
}
