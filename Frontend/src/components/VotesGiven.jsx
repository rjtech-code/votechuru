import { Vote } from 'lucide-react'
import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

/**
 * "Votes Given: X out of Y" for a ward built by lib/wards.js. X is only shown when it is
 * known (a recorded ward figure, or results the viewer may see); otherwise only the total
 * number of voters is shown — the figure is never guessed.
 */
export function useVotesGivenText() {
  const { t, formatNumber } = useLanguage()
  return (ward) => {
    if (ward.votesGiven != null) {
      return ward.totalVoters != null
        ? t('result.votesGivenOf', { given: formatNumber(ward.votesGiven), total: formatNumber(ward.totalVoters) })
        : t('result.votesGivenOnly', { given: formatNumber(ward.votesGiven) })
    }
    return ward.totalVoters != null ? t('result.totalVotersLine', { total: formatNumber(ward.totalVoters) }) : null
  }
}

export default function VotesGiven({ ward, className }) {
  const text = useVotesGivenText()(ward)
  if (!text) return null
  return (
    <p className={cn('flex items-center gap-1.5 text-sm font-semibold text-navy-900', className)}>
      <Vote className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
      {text}
    </p>
  )
}
