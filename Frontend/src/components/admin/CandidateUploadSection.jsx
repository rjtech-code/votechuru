import { AlertTriangle, Info, MapPin } from 'lucide-react'
import SheetUploadPanel, { PreviewTable, RejectedRows, RowStatus, SheetStats } from './SheetUploadPanel'
import { rejectedRowCount } from './WardUploadSection'
import Button from '../ui/Button'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'
import { useSheetImport } from '../../hooks/useSheetImport'
import { uploadCandidateSheet } from '../../services/api'

/** Success-popup descriptors for records the import itself did not save. */
export function importIssues(summary) {
  return [
    ...(summary.conflicts ?? []).map((c) => ({ key: 'admin.progress.importCodes.ID_CONFLICT', vars: { name: c.name, ward: c.wardNo, candidateId: c.candidateId } })),
    ...(summary.rejected ?? []).map((r) => ({ key: `admin.progress.importCodes.${r.code}`, vars: { name: r.name ?? '', ward: r.wardNo ?? r.ward ?? '', candidateId: r.candidateId ?? '' } })),
  ]
}

/**
 * Candidate Master sheet upload (Name, Party, Ward No.). The server rejects rows whose ward
 * is not in the Ward Master, generates each Candidate ID and reports ID conflicts; confirming
 * only adds new candidates. Existing candidates are never changed or removed.
 */
export default function CandidateUploadSection() {
  const { t, formatNumber } = useLanguage()
  const { wardMaster, importCandidates } = useResults()

  const importer = useSheetImport({
    validatingKey: 'admin.progress.validatingCandidates',
    upload: (file, { token, onUploaded }) => uploadCandidateSheet(file, token, { onUploaded }),
  })
  const preview = importer.preview?.data
  const conflicts = preview?.rows.filter((r) => r.status === 'conflict') ?? []
  const missingWards = preview?.rejected.filter((r) => r.code === 'WARD_NOT_FOUND') ?? []

  const save = () =>
    importer.confirm(async (data) => {
      const summary = await importCandidates(data.data)
      const rejected = importIssues(summary)
      const lines = [{ key: 'admin.candidates.addedCount', vars: { count: summary.added } }]
      if (summary.duplicates) lines.push({ key: 'admin.candidates.duplicatesSkipped', vars: { count: summary.duplicates } })
      if (rejected.length) lines.push({ key: 'admin.progress.rejectedCount', vars: { count: rejected.length }, tone: 'warning' })
      if (summary.reopened?.length) lines.push({ key: 'admin.results.autoReopened', vars: { wards: summary.reopened.join(', ') }, tone: 'warning' })
      return { lines, rejected }
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

  const columns = [
    { key: 'candidateId', header: t('profile.candidateCode'), className: 'whitespace-nowrap font-mono text-xs font-semibold text-navy-900', render: (r) => r.candidateId },
    { key: 'name', header: t('admin.columns.name'), className: 'font-semibold text-navy-900', render: (r) => r.name },
    { key: 'party', header: t('result.party'), render: (r) => r.party },
    { key: 'wardNo', header: t('admin.columns.ward'), className: 'whitespace-nowrap', render: (r) => t('common.ward', { ward: r.wardNo }) },
    {
      key: 'status',
      header: t('result.status'),
      render: (r) => (
        <div>
          <RowStatus status={r.status} labelKey={r.status === 'conflict' ? 'admin.overview.statusIdConflict' : undefined} />
          {r.conflictWith && <p className="mt-1 text-xs text-slate-500">{t('admin.overview.usedBy', { name: r.conflictWith.name, party: r.conflictWith.party })}</p>}
        </div>
      ),
    },
  ]

  return (
    <>
      <ul className="mb-4 space-y-1.5 text-sm text-slate-600">
        {['admin.candidates.appendNote', 'admin.upload.wardRule', 'admin.candidates.idNote'].map((key) => (
          <li key={key} className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            {t(key)}
          </li>
        ))}
      </ul>
      <SheetUploadPanel importer={importer} submitLabel={t('admin.candidates.uploadButton')} canSubmit={preview?.data.length > 0} onSubmit={save}>
        {preview && (
          <>
            <SheetStats
              items={[
                { label: t('admin.overview.totalRows'), value: preview.totalRows },
                { label: t('admin.overview.validCandidates'), value: preview.rows.length, tone: 'green' },
                { label: t('admin.overview.newCandidates'), value: preview.data.length },
                { label: t('admin.overview.rejected'), value: rejectedRowCount(preview.rejected), tone: preview.rejected.length ? 'red' : undefined },
              ]}
            />
            <p className={`flex items-start gap-2 text-sm ${missingWards.length ? 'text-red-700' : 'text-emerald-700'}`}>
              {missingWards.length ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              {missingWards.length ? t('admin.overview.wardsMissing', { count: formatNumber(missingWards.length) }) : t('admin.overview.wardsOk')}
            </p>
            {preview.ignoredColumns?.length > 0 && (
              <p className="flex items-start gap-2 text-sm text-slate-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {t('admin.overview.ignoredColumns', { columns: preview.ignoredColumns.join(', ') })}
              </p>
            )}
            {conflicts.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t('admin.overview.idConflicts', { count: formatNumber(conflicts.length) })}
              </p>
            )}
            <RejectedRows rejected={preview.rejected} />
            <PreviewTable title={t('admin.overview.candidatePreview')} columns={columns} rows={preview.rows} />
            {!preview.data.length && <p className="text-sm text-slate-500">{t('admin.overview.nothingNew')}</p>}
          </>
        )}
      </SheetUploadPanel>
    </>
  )
}
