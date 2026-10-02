import { History } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { EmptyState } from '../components/ui/States'
import { useLanguage } from '../i18n/I18nContext'

/**
 * The current data model holds a single set of ward results with no election history,
 * so this page states that plainly rather than showing invented records.
 */
export default function PreviousElections() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeader title={t('pages.previous.title')} description={t('pages.previous.description')} />
      <PageBody>
        <Card>
          <EmptyState
            icon={History}
            title={t('pages.previous.emptyTitle')}
            description={t('pages.previous.emptyText')}
            action={<Button to="/results" variant="secondary">{t('pages.previous.cta')}</Button>}
          />
        </Card>
      </PageBody>
    </>
  )
}
