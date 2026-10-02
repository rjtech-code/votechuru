import { useState } from 'react'
import { Database, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { Card, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useResults } from '../../context/ResultsContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/I18nContext'

export default function AdminSettings() {
  const { t, formatNumber } = useLanguage()
  const { records, stats, clearAll } = useResults()
  const notify = useToast()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <AdminPageHeader title={t('admin.settings.title')} description={t('admin.settings.description')} />
      <Card className="max-w-3xl">
        <CardHeader title={t('admin.settings.dataTitle')} description={t('admin.settings.dataText')} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Database className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {t('admin.settings.storedCount', { count: formatNumber(records.length), wards: formatNumber(stats.wards) })}
          </p>
          <div className="sm:text-right">
            <Button variant="danger" icon={Trash2} onClick={() => setConfirming(true)} disabled={!records.length}>
              {t('admin.settings.clear')}
            </Button>
            <p className="mt-1.5 text-xs text-slate-500">{t('admin.settings.clearHint')}</p>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={confirming}
        title={t('admin.settings.clearTitle')}
        message={t('admin.settings.clearMessage')}
        confirmLabel={t('admin.settings.clear')}
        onConfirm={() => {
          clearAll()
          notify(t('admin.settings.cleared'))
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
