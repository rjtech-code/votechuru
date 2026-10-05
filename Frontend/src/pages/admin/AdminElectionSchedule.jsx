import { ArrowLeft } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ScheduleCard from '../../components/admin/ScheduleCard'
import Button from '../../components/ui/Button'
import { useLanguage } from '../../i18n/I18nContext'

/** /admin/settings/election-schedule — opened from the Home page's Election Schedule button. */
export default function AdminElectionSchedule() {
  const { t } = useLanguage()

  return (
    <>
      <AdminPageHeader
        title={t('admin.schedule.title')}
        description={t('admin.schedule.pageDescription')}
        actions={
          <Button to="/admin" variant="secondary" icon={ArrowLeft}>
            {t('admin.back')}
          </Button>
        }
      />
      <ScheduleCard />
    </>
  )
}
