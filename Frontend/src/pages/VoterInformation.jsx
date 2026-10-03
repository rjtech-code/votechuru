import { BookOpen, CheckCircle2, ClipboardList, HelpCircle, Info, ListChecks, Megaphone, Phone, Vote } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { OfficialLink } from './GovernmentInitiatives'
import { useLanguage } from '../i18n/I18nContext'
import { translations } from '../i18n/translations'
import { officialSources } from '../config/site'

const BASE = 'pages.voterInfo'

/** A titled card with a bullet list of translated points. */
function PointsSection({ id, icon: Icon, extra }) {
  const { t, language } = useLanguage()
  const points = Object.keys(translations[language].pages.voterInfo[id].points)
  return (
    <Card as="section" aria-labelledby={`voter-${id}`} className="p-6">
      <h2 id={`voter-${id}`} className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
        <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
        {t(`${BASE}.${id}.title`)}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            {t(`${BASE}.${id}.points.${point}`)}
          </li>
        ))}
      </ul>
      {extra}
    </Card>
  )
}

export default function VoterInformation() {
  const { t, language } = useLanguage()
  const terms = Object.keys(translations[language].pages.voterInfo.terms.items)
  const resources = [
    { key: 'vsp', url: officialSources.votersPortal },
    { key: 'eci', url: officialSources.eci },
    { key: 'sec', url: officialSources.secRajasthan },
    { key: 'ceo', url: officialSources.ceoRajasthan },
  ]

  return (
    <>
      <PageHeader title={t(`${BASE}.title`)} description={t(`${BASE}.description`)} />
      <PageBody>
        <p className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          {t(`${BASE}.note`)}
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <PointsSection id="eligibility" icon={ListChecks} />
          <PointsSection
            id="roll"
            icon={ClipboardList}
            extra={
              <div className="mt-4">
                <OfficialLink href={officialSources.votersPortal}>{t(`${BASE}.help.vsp`)}</OfficialLink>
              </div>
            }
          />
          <PointsSection id="process" icon={Vote} />
          <PointsSection id="awareness" icon={Megaphone} />
        </div>

        <Card as="section" aria-labelledby="voter-terms" className="p-6">
          <h2 id="voter-terms" className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
            <BookOpen className="h-5 w-5 text-brand-600" aria-hidden="true" />
            {t(`${BASE}.terms.title`)}
          </h2>
          <dl className="mt-4 grid gap-x-8 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
            {terms.map((term) => (
              <div key={term} className="py-3 sm:border-b sm:border-slate-100">
                <dt className="text-sm font-bold text-navy-900">{t(`${BASE}.terms.items.${term}.term`)}</dt>
                <dd className="mt-0.5 text-sm text-slate-600">{t(`${BASE}.terms.items.${term}.definition`)}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card as="section" aria-labelledby="voter-help" className="p-6">
          <h2 id="voter-help" className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
            <HelpCircle className="h-5 w-5 text-brand-600" aria-hidden="true" />
            {t(`${BASE}.help.title`)}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
                <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
                <a href="tel:1950" className="hover:text-brand-700">
                  {t(`${BASE}.help.helpline`)}
                </a>
              </p>
              <p className="mt-1 text-xs text-slate-600">{t(`${BASE}.help.helplineText`)}</p>
            </div>
            {resources.map((resource) => (
              <div key={resource.key} className="flex items-center rounded-lg border border-slate-200/80 bg-slate-50/60 p-4">
                <OfficialLink href={resource.url}>{t(`${BASE}.help.${resource.key}`)}</OfficialLink>
              </div>
            ))}
          </div>
        </Card>
      </PageBody>
    </>
  )
}
