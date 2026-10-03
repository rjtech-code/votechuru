import { Info } from 'lucide-react'
import ExcelUploader from './ExcelUploader'
import UploadProgressModal from './UploadProgressModal'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'
import { useSheetImport } from '../../hooks/useSheetImport'
import { uploadWardSheet } from '../../services/api'

/** Short text summary of a ward's details, used in conflict messages. */
const describe = (ward, formatNumber) => [ward.wardName, ward.areas, ward.totalVoters != null ? formatNumber(ward.totalVoters) : null].filter(Boolean).join(', ') || '—'

/**
 * Ward Master sheet upload. The server previews new, identical and changed wards; the
 * admin decides whether changed details are kept or replaced; the server then imports.
 */
export default function WardUploadSection() {
  const { t, formatNumber } = useLanguage()
  const { importWards } = useResults()

  const importer = useSheetImport({
    validatingKey: 'admin.progress.validatingWards',
    upload: (file, { token, onUploaded }) => uploadWardSheet(file, token, { onUploaded }),
    prepare: (preview) => ({
      conflictTitleKey: 'admin.wards.conflictTitle',
      alternativeKey: 'admin.wards.replace',
      conflicts: (preview.conflicts ?? []).map((c) => ({
        key: 'admin.wards.conflictLine',
        vars: { ward: c.record.wardNo, existing: describe(c.existing, formatNumber), incoming: describe(c.record, formatNumber) },
      })),
      apply: async (choice) => {
        const summary = await importWards(preview.data, choice === 'alternative' ? 'replace' : 'keep')
        const lines = [{ key: 'admin.wards.addedCount', vars: { count: summary.added } }]
        if (summary.duplicates) lines.push({ key: 'admin.wards.duplicatesSkipped', vars: { count: summary.duplicates } })
        if (summary.replaced) lines.push({ key: 'admin.wards.replacedCount', vars: { count: summary.replaced } })
        if (summary.kept) lines.push({ key: 'admin.wards.keptCount', vars: { count: summary.kept } })
        return { lines }
      },
    }),
  })

  return (
    <>
      <p className="mb-4 flex items-start gap-2 text-sm text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        {t('admin.wards.appendNote')}
      </p>
      <ExcelUploader onUpload={importer.start} busy={['uploading', 'checking', 'validating'].includes(importer.progress?.stage)} />
      <UploadProgressModal state={importer.progress} onClose={importer.close} onKeepExisting={importer.keep} onAlternative={importer.alternative} />
    </>
  )
}
