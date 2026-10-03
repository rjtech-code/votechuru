import AdminPageHeader from '../../components/admin/AdminPageHeader'
import DangerZone from '../../components/admin/DangerZone'
import { Card, CardHeader } from '../../components/ui/Card'
import { useLanguage } from '../../i18n/I18nContext'

export default function AdminSettings() {
  const { t } = useLanguage()

  return (
    <>
      <AdminPageHeader title={t('admin.settings.title')} description={t('admin.settings.description')} />
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader title={t('admin.settings.dataTitle')} description={t('admin.settings.dataText')} />
        </Card>
        <DangerZone />
      </div>
    </>
  )
}
