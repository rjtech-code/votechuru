import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import SummaryStats from '../../components/admin/SummaryStats'
import WardResultList from '../../components/admin/WardResultList'
import { Card, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useLanguage } from '../../i18n/I18nContext'

/** /admin/results — summary and the ward-wise result list (declare / reopen / edit / delete). */
export default function AdminResults() {
  const { t } = useLanguage()
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  return (
    <>
      <AdminPageHeader
        title={t('admin.results.title')}
        description={t('admin.results.description')}
        actions={
          <Button to="/admin/upload" icon={Upload}>
            {t('admin.nav.upload')}
          </Button>
        }
      />
      <div className="space-y-6">
        <section aria-labelledby="result-summary">
          <h2 id="result-summary" className="mb-3 text-base font-bold text-navy-900">
            {t('admin.results.summaryTitle')}
          </h2>
          <SummaryStats />
        </section>

        <Card as="section" id="result-list" aria-labelledby="list-title" className="scroll-mt-20">
          <CardHeader title={<span id="list-title">{t('admin.results.listTitle')}</span>} description={t('admin.results.listText')} />
          <div className="p-4 sm:p-5">
            <WardResultList />
          </div>
        </Card>
      </div>
    </>
  )
}
