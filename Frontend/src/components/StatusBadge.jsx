import { CheckCircle2, Clock, Scale } from 'lucide-react'
import Badge from './ui/Badge'
import { useLanguage } from '../i18n/I18nContext'

// Each status pairs a colour with an icon and a text label, so meaning never relies on colour alone.
const STATUS_STYLES = {
  Declared: { tone: 'green', icon: CheckCircle2 },
  Pending: { tone: 'blue', icon: Clock },
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

const LABELS = { declared: 'Declared', pending: 'Pending', tie: 'Tie' }

/** Badge status for a ward computed by lib/wards.js. */
export const wardStatus = (ward) => LABELS[ward.status]
