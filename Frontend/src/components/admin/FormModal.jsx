import { AlertCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useLanguage } from '../../i18n/I18nContext'

/** Modal wrapper for admin create/edit forms with standard Save / Cancel actions. `formError` is a translation key. */
export default function FormModal({ open, onClose, title, description, size = 'lg', formId, submitLabel, submitting, formError, children }) {
  const { t } = useLanguage()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description ?? t('admin.requiredNote')}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {formError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t(formError)}
        </div>
      )}
      {children}
    </Modal>
  )
}
