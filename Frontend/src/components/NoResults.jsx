import { ListChecks } from 'lucide-react'
import { Card } from './ui/Card'
import { EmptyState } from './ui/States'
import { useLanguage } from '../i18n/I18nContext'

/** Shown on public pages while no result data has been published. */
export default function NoResults() {
  const { t } = useLanguage()
  return (
    <Card>
      <EmptyState icon={ListChecks} title={t('state.noData')} description={t('state.noDataDescription')} />
    </Card>
  )
}
