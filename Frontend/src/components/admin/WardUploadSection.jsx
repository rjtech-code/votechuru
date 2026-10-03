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
 * Ward Master sheet upload. New wards are added; identical wards are skipped; wards whose
 * details differ from the stored ones need the admin's decision (keep or replace).
 */
export default function WardUploadSection() {
  const { t, formatNumber } = useLanguage()
  const { addWards, replaceWards, prepareWardPlan } = useResults()

  const importer = useSheetImport({
    validatingKey: 'admin.progress.validatingWards',
    upload: (file, { token, onUploaded }) => uploadWardSheet(file, token, { onUploaded }),
    prepare: (json) => {
      const plan = prepareWardPlan(json.data ?? [])
      return {
        conflictTitleKey: 'admin.wards.conflictTitle',
        alternativeKey: 'admin.wards.replace',
        conflicts: plan.conflicts.map((c) => ({
          key: 'admin.wards.conflictLine',
          vars: { ward: c.record.wardNo, existing: describe(c.existing, formatNumber), incoming: describe(c.record, formatNumber) },
        })),
        apply: (choice) => {
          if (plan.fresh.length) addWards(plan.fresh)
          const replace = choice === 'alternative' && plan.conflicts.length
          if (replace) replaceWards(plan.conflicts.map((c) => c.record))
          const lines = [{ key: 'admin.wards.addedCount', vars: { count: plan.fresh.length } }]
          if (plan.duplicates) lines.push({ key: 'admin.wards.duplicatesSkipped', vars: { count: plan.duplicates } })
          if (plan.conflicts.length) {
            lines.push({ key: replace ? 'admin.wards.replacedCount' : 'admin.wards.keptCount', vars: { count: plan.conflicts.length } })
          }
          return { lines }
        },
      }
    },
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
