import { UserRound } from 'lucide-react'
import { useLanguage } from '../i18n/I18nContext'
import { cn } from '../lib/format'

const SIZES = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-24 w-24' }
const ICONS = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }

/** Candidate photo, or a neutral placeholder when none has been uploaded. */
export default function CandidateAvatar({ candidate, size = 'md', className }) {
  const { t } = useLanguage()
  return candidate.image ? (
    <img
      src={candidate.image}
      alt={t('profile.photoAlt', { name: candidate.name })}
      className={cn('shrink-0 rounded-full border border-slate-200 bg-white object-cover', SIZES[size], className)}
    />
  ) : (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400', SIZES[size], className)} aria-hidden="true">
      <UserRound className={ICONS[size]} />
    </span>
  )
}
