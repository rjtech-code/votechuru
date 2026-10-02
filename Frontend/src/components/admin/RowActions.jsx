import { Pencil, Trash2 } from 'lucide-react'
import { useLanguage } from '../../i18n/I18nContext'

const base = 'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors'

/** Edit / Delete icon buttons for an admin table row. `label` names the record for screen readers. */
export default function RowActions({ label, onEdit, onDelete }) {
  const { t } = useLanguage()
  const edit = t('admin.edit', { label })
  const remove = t('admin.remove', { label })
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button type="button" onClick={onEdit} className={`${base} text-slate-500 hover:bg-brand-50 hover:text-brand-700`} title={edit} aria-label={edit}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className={`${base} text-slate-500 hover:bg-red-50 hover:text-red-700`} title={remove} aria-label={remove}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
