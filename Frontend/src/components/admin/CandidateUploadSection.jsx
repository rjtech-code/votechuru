import { Info, MapPin } from 'lucide-react'
import ExcelUploader from './ExcelUploader'
import UploadProgressModal from './UploadProgressModal'
import Button from '../ui/Button'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'
import { useSheetImport } from '../../hooks/useSheetImport'
import { uploadCandidateSheet } from '../../services/api'

/**
 * Candidate result sheet upload. The server validates columns and rows and rejects rows
 * whose ward is not in the Ward Master; the rest are appended here. Exact duplicates are
 * skipped and conflicting vote counts need the admin's decision. Nothing is overwritten.
 */
export default function CandidateUploadSection() {
  const { t } = useLanguage()
  const { wardMaster, addCandidates, prepareCandidatePlan } = useResults()

  const importer = useSheetImport({
    validatingKey: 'admin.progress.validatingCandidates',
    upload: (file, { token, onUploaded }) => uploadCandidateSheet(file, token, { wardNos: wardMaster.map((w) => w.wardNo), onUploaded }),
    prepare: (json) => {
      const rejected = (json.rejected ?? []).map((r) => ({ key: 'admin.progress.rejectedRow', vars: { row: r.row, ward: r.wardNo } }))
      const plan = prepareCandidatePlan((json.data ?? []).map(({ row, ...record }) => record))
      return {
        conflicts: plan.conflicts.map((c) => ({
          key: 'admin.results.conflictUpload',
          vars: { name: c.existing.name, ward: c.record.wardNo, existing: c.existing.totalVotes, incoming: c.record.totalVotes },
        })),
        apply: (choice) => {
          const records = choice === 'alternative' ? [...plan.fresh, ...plan.conflicts.map((c) => c.record)] : plan.fresh
          const { added, reopened } = records.length ? addCandidates(records) : { added: 0, reopened: [] }
          const lines = [{ key: 'admin.progress.added', vars: { count: added } }]
          if (plan.duplicates) lines.push({ key: 'admin.progress.skipped', vars: { count: plan.duplicates } })
          if (choice === 'keep' && plan.conflicts.length) lines.push({ key: 'admin.progress.conflictsKept', vars: { count: plan.conflicts.length } })
          if (rejected.length) lines.push({ key: 'admin.progress.rejectedCount', vars: { count: rejected.length }, tone: 'warning' })
          if (reopened.length) lines.push({ key: 'admin.results.autoReopened', vars: { wards: reopened.join(', ') }, tone: 'warning' })
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
