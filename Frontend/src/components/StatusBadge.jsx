import { CheckCircle2, Scale } from 'lucide-react'
import Badge from './ui/Badge'
import { useLanguage } from '../i18n/I18nContext'

// Each status pairs a colour with an icon and a text label, so meaning never relies on colour alone.
const STATUS_STYLES = {
  Declared: { tone: 'green', icon: CheckCircle2 },
  Tie: { tone: 'amber', icon: Scale },
}

export default function StatusBadge({ status, className }) {
  const { tx } = useLanguage()
  const style = STATUS_STYLES[status] ?? { tone: 'neutral', icon: null }
  return (
    <Badge tone={style.tone} icon={style.icon} className={className}>
      {tx('status', status)}
    </Badge>
  )
}

/** Status of a ward computed from its candidates. */
export const wardStatus = (ward) => (ward.isTie ? 'Tie' : 'Declared')
