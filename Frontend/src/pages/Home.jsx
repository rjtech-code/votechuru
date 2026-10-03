import { CheckCircle2, Landmark, ListChecks, Users, Vote } from 'lucide-react'
import Hero from '../components/Hero'
import ElectionTypeCard from '../components/ElectionTypeCard'
import StatCard from '../components/StatCard'
import SectionHeader from '../components/SectionHeader'
import ResultCard from '../components/ResultCard'
import EventCountdown from '../components/EventCountdown'
import { EmptyState } from '../components/ui/States'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'

const RECENT_LIMIT = 6

export default function Home() {
  const { t } = useLanguage()
  const { stats, wards } = useResults()
  // Declared wards only, in ascending ward order (wards are already sorted numerically).
  const declared = wards.filter((w) => w.status === 'declared')

  return (
    <>
      <Hero />

      <div className="container-page relative pb-14">
        {/* Ward results entry card, overlapping the bottom of the hero */}
        <div className="-mt-8">
          <ElectionTypeCard to="/results" icon={Landmark} tone="saffron" title={t('home.wardCard.title')} subtitle={t('home.wardCard.subtitle')} />
        </div>

        <EventCountdown className="mt-8" />

        <section aria-label={t('home.statsLabel')} className="mt-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-[13px]">
          <StatCard icon={ListChecks} tone="navy" value={stats.wards} label={t('stats.wards')} />
          <StatCard icon={Users} tone="blue" value={stats.candidates} label={t('stats.candidates')} />
          <StatCard icon={Vote} tone="orange" value={stats.votes} label={t('stats.votes')} />
          <StatCard icon={CheckCircle2} tone="green" value={stats.declared} label={t('stats.declared')} />
        </section>

        <section aria-labelledby="recent-results" className="mt-10">
          <SectionHeader id="recent-results" title={t('home.recentResults')} linkTo={declared.length ? '/results' : undefined} />
          {declared.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {declared.slice(0, RECENT_LIMIT).map((ward) => (
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
      </div>
    </>
  )
}
