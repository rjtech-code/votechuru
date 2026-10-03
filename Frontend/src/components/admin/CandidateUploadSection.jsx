import { Info, MapPin } from 'lucide-react'
import ExcelUploader from './ExcelUploader'
import UploadProgressModal from './UploadProgressModal'
import Button from '../ui/Button'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'
import { useSheetImport } from '../../hooks/useSheetImport'
import { uploadCandidateSheet } from '../../services/api'

/**
 * Candidate result sheet upload. The server validates columns and rows, rejects rows whose
 * ward is not in the Ward Master and previews duplicates/conflicts; confirming runs the
 * server-side import, which re-validates and only appends. Nothing is overwritten, and
 * nothing becomes public until the ward is declared.
 */
export default function CandidateUploadSection() {
  const { t } = useLanguage()
  const { wardMaster, importCandidates } = useResults()

  const importer = useSheetImport({
    validatingKey: 'admin.progress.validatingCandidates',
    upload: (file, { token, onUploaded }) => uploadCandidateSheet(file, token, { onUploaded }),
    prepare: (preview) => {
      const previewRejected = (preview.rejected ?? []).map((r) => ({ key: 'admin.progress.rejectedRow', vars: { row: r.row, ward: r.wardNo } }))
      return {
        conflicts: (preview.conflicts ?? []).map((c) => ({
          key: 'admin.results.conflictUpload',
          vars: { name: c.existing.name, ward: c.record.wardNo, existing: c.existing.totalVotes, incoming: c.record.totalVotes },
        })),
        apply: async (choice) => {
          const summary = preview.data.length
            ? await importCandidates(preview.data, choice === 'alternative' ? 'add' : 'keep')
            : { added: 0, duplicates: 0, conflictsKept: 0, rejected: [], reopened: [] }
          // Rows the import itself rejected (e.g. a ward deleted after the preview).
          const rejected = [
            ...previewRejected,
            ...summary.rejected.map((r) => ({ key: 'admin.progress.rejectedRecord', vars: { name: r.name, ward: r.wardNo } })),
          ]
          const lines = [{ key: 'admin.progress.added', vars: { count: summary.added } }]
          if (summary.duplicates) lines.push({ key: 'admin.progress.skipped', vars: { count: summary.duplicates } })
          if (summary.conflictsKept) lines.push({ key: 'admin.progress.conflictsKept', vars: { count: summary.conflictsKept } })
          if (rejected.length) lines.push({ key: 'admin.progress.rejectedCount', vars: { count: rejected.length }, tone: 'warning' })
          if (summary.reopened.length) lines.push({ key: 'admin.results.autoReopened', vars: { wards: summary.reopened.join(', ') }, tone: 'warning' })
          return { lines, rejected }
        },
      }
    },
  })

  if (!wardMaster.length) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-[#f4d77e] bg-[#fffbeb] p-4 text-sm text-[#7a4a06] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t('admin.upload.needWards')}
        </p>
        <Button to="/admin/wards" variant="secondary" size="sm" icon={MapPin}>
          {t('admin.upload.goToWards')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <ul className="mb-4 space-y-1.5 text-sm text-slate-600">
        <li className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          {t('admin.upload.appendNote')}
        </li>
        <li className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          {t('admin.upload.wardRule')}
        </li>
      </ul>
      <ExcelUploader onUpload={importer.start} busy={['uploading', 'checking', 'validating'].includes(importer.progress?.stage)} />
      <UploadProgressModal state={importer.progress} onClose={importer.close} onKeepExisting={importer.keep} onAlternative={importer.alternative} />
    </>
  )
}
