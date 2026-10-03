import { CheckCircle2, Clock, ListChecks, Users, Vote } from 'lucide-react'
import StatCard from '../StatCard'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'

/** Total Wards · Total Candidates · Total Votes · Declared Results · Pending Results */
export default function SummaryStats() {
  const { t } = useLanguage()
  const { stats } = useResults()
  return (
    <section aria-label={t('admin.results.summaryTitle')} className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <StatCard icon={ListChecks} tone="navy" label={t('stats.wards')} value={stats.wards} />
      <StatCard icon={Users} tone="blue" label={t('stats.candidates')} value={stats.candidates} />
      <StatCard icon={Vote} tone="orange" label={t('stats.votes')} value={stats.votes} />
      <StatCard icon={CheckCircle2} tone="green" label={t('stats.declared')} value={stats.declared} />
      <StatCard icon={Clock} tone="blue" label={t('stats.pending')} value={stats.pending} />
    </section>
  )
}
