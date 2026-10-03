import { Database, Info, Mail, MapPin, ShieldCheck } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { useLanguage } from '../i18n/I18nContext'
import { site } from '../config/site'

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
      <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
      {children}
    </h2>
  )
}

export default function About() {
  const { t } = useLanguage()
  const coverage = [
    ['coverageWard', 'coverageWardText'],
    ['coverageShown', 'coverageShownText'],
  ]

  return (
    <>
      <PageHeader title={t('pages.about.title')} description={t('pages.about.description')} />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <SectionTitle icon={Info}>{t('pages.about.purposeTitle')}</SectionTitle>
              <p className="mt-3 leading-relaxed text-slate-600">{t('pages.about.purpose1')}</p>
              <p className="mt-3 leading-relaxed text-slate-600">{t('pages.about.purpose2')}</p>
            </Card>

            <Card className="p-6">
              <SectionTitle icon={MapPin}>{t('pages.about.coverageTitle')}</SectionTitle>
              <dl className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
                {coverage.map(([title, text]) => (
                  <div key={title} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-bold text-navy-900">{t(`pages.about.${title}`)}</dt>
                    <dd className="text-sm text-slate-600 sm:col-span-2">{t(`pages.about.${text}`)}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card id="disclaimer" className="scroll-mt-24 p-6">
              <SectionTitle icon={ShieldCheck}>{t('pages.about.disclaimerTitle')}</SectionTitle>
              <p className="mt-3 leading-relaxed text-slate-600">{t('pages.about.disclaimer')}</p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <SectionTitle icon={Mail}>{t('pages.about.contactTitle')}</SectionTitle>
              <p className="mt-3 text-sm text-slate-600">{t('pages.about.contactText')}</p>
              <p className="mt-2 text-sm text-slate-600">
                {t('pages.about.email')}:{' '}
                <a href={`mailto:${site.contactEmail}`} className="font-semibold text-brand-600 hover:text-brand-800">
                  {site.contactEmail}
                </a>
              </p>
            </Card>
            <Card className="p-6">
              <SectionTitle icon={Database}>{t('pages.about.updatesTitle')}</SectionTitle>
              <p className="mt-2 text-sm text-slate-600">{t('pages.about.updatesText')}</p>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  )
}
