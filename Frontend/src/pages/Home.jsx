import { CheckCircle2, Info, Landmark, ListChecks, Users, Vote } from 'lucide-react'
import Hero from '../components/Hero'
import ElectionTypeCard from '../components/ElectionTypeCard'
import StatCard from '../components/StatCard'
import SectionHeader from '../components/SectionHeader'
import ResultCard from '../components/ResultCard'
import { EmptyState } from '../components/ui/States'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'
import { recentWards } from '../lib/wards'

export default function Home() {
  const { t } = useLanguage()
  const { stats, wards } = useResults()
  const recent = recentWards(wards, 6)

  return (
    <>
      <Hero />

      <div className="container-page relative pb-14">
        {/* Ward results entry card, overlapping the bottom of the hero */}
        <div className="-mt-8">
          <ElectionTypeCard to="/results" icon={Landmark} tone="saffron" title={t('home.wardCard.title')} subtitle={t('home.wardCard.subtitle')} />
        </div>

        <section aria-label={t('home.statsLabel')} className="mt-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-[13px]">
          <StatCard icon={ListChecks} tone="navy" value={stats.wards} label={t('stats.wards')} />
          <StatCard icon={Users} tone="blue" value={stats.candidates} label={t('stats.candidates')} />
          <StatCard icon={Vote} tone="orange" value={stats.votes} label={t('stats.votes')} />
          <StatCard icon={CheckCircle2} tone="green" value={stats.declared} label={t('stats.declared')} />
        </section>

        <section aria-labelledby="recent-results" className="mt-10">
          <SectionHeader id="recent-results" title={t('home.recentResults')} linkTo={recent.length ? '/results' : undefined} />
          {recent.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recent.map((ward) => (
                <ResultCard key={ward.wardNo} ward={ward} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ListChecks}
              title={t('state.noData')}
              description={t('state.noDataDescription')}
              className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]"
            />
          )}
        </section>

        <p className="mt-10 flex items-start gap-2 rounded-lg border border-[#f4d77e] bg-[#fffbeb] px-4 py-3 text-[13.5px] text-[#7a4a06]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t('home.prototypeNote')}
        </p>
      </div>
    </>
  )
}
