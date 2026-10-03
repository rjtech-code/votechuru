import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { useLanguage } from '../../i18n/I18nContext'

export default function ConfirmDialog({ open, title, message, confirmLabel, confirmVariant = 'danger', onConfirm, onClose }) {
  const { t } = useLanguage()
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} loading={busy}>
            {confirmLabel ?? t('common.delete')}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  )
}
