import { useState } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import SheetUploadPanel, { ConflictChoice, PreviewTable, RejectedRows, RowStatus, SheetStats } from './SheetUploadPanel'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'
import { useSheetImport } from '../../hooks/useSheetImport'
import { uploadWardSheet } from '../../services/api'

/** Short text summary of a ward's details, used for conflicts. */
const describe = (ward, formatNumber) => [ward.wardName, ward.areas, ward.totalVoters != null ? formatNumber(ward.totalVoters) : null].filter(Boolean).join(', ') || '—'
export const rejectedRowCount = (rejected) => new Set(rejected.map((r) => r.row)).size

/**
 * Ward Master sheet upload. Choosing a file validates it on the server and shows an overview;
 * "Upload Ward" then adds the new wards. Wards that already exist with different details are
 * only changed when the Super Admin explicitly chooses to replace them.
 */
export default function WardUploadSection() {
  const { t, formatNumber } = useLanguage()
  const { importWards } = useResults()
  const [resolution, setResolution] = useState('keep')
  const dash = <span className="text-slate-400">—</span>

  const importer = useSheetImport({
    validatingKey: 'admin.progress.validatingWards',
    upload: (file, { token, onUploaded }) => uploadWardSheet(file, token, { onUploaded }),
  })
  const preview = importer.preview?.data
  const newCount = preview?.rows.filter((r) => r.status === 'new').length ?? 0
  const conflictCount = preview?.conflicts.length ?? 0
  const existingByWard = new Map((preview?.conflicts ?? []).map((c) => [c.record.wardNo, c.existing]))

  const save = () =>
    importer.confirm(async (data) => {
      const summary = await importWards(data.data, resolution)
      const lines = [{ key: 'admin.wards.addedCount', vars: { count: summary.added } }]
      if (summary.duplicates) lines.push({ key: 'admin.wards.duplicatesSkipped', vars: { count: summary.duplicates } })
      if (summary.replaced) lines.push({ key: 'admin.wards.replacedCount', vars: { count: summary.replaced } })
      if (summary.kept) lines.push({ key: 'admin.wards.keptCount', vars: { count: summary.kept } })
      setResolution('keep')
      return { lines }
    })

  const columns = [
    { key: 'wardNo', header: t('admin.wards.columns.wardNo'), className: 'font-semibold tabular-nums text-navy-900', render: (r) => r.wardNo },
    { key: 'wardName', header: t('admin.wards.columns.wardName'), render: (r) => r.wardName ?? dash },
    { key: 'areas', header: t('admin.wards.columns.areas'), className: 'max-w-[16rem]', render: (r) => (r.areas ? <span className="line-clamp-2">{r.areas}</span> : dash) },
    { key: 'totalVoters', header: t('admin.wards.columns.totalVoters'), align: 'right', className: 'tabular-nums', render: (r) => formatNumber(r.totalVoters) },
    {
      key: 'status',
      header: t('admin.wards.columns.status'),
      render: (r) => (
        <div>
          <RowStatus status={r.status} labelKey={r.status === 'duplicate' ? 'admin.overview.statusIdentical' : undefined} />
          {r.status === 'conflict' && (
            <p className="mt-1 text-xs text-slate-500">{t('admin.overview.existingDetails', { details: describe(existingByWard.get(r.wardNo), formatNumber) })}</p>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <p className="mb-4 flex items-start gap-2 text-sm text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        {t('admin.wards.appendNote')}
      </p>
      <SheetUploadPanel importer={importer} submitLabel={t('admin.wards.uploadButton')} canSubmit={newCount > 0 || (conflictCount > 0 && resolution === 'replace')} onSubmit={save}>
        {preview && (
          <>
            <SheetStats
              items={[
                { label: t('admin.overview.records'), value: preview.totalRows },
                { label: t('admin.overview.validWards'), value: preview.rows.length, tone: 'green' },
                { label: t('admin.overview.newWards'), value: newCount },
                { label: t('admin.overview.rejected'), value: rejectedRowCount(preview.rejected), tone: preview.rejected.length ? 'red' : undefined },
              ]}
            />
            {preview.beyondIdRange?.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t('admin.overview.beyondIdRange', { wards: preview.beyondIdRange.join(', ') })}
              </p>
            )}
            <ConflictChoice
              name="ward-conflicts"
              count={conflictCount}
              value={resolution}
              onChange={setResolution}
              message={t('admin.overview.wardConflicts', { count: formatNumber(conflictCount) })}
              replaceLabel={t('admin.wards.replace')}
            />
            <RejectedRows rejected={preview.rejected} />
            <PreviewTable title={t('admin.overview.wardPreview')} columns={columns} rows={preview.rows} />
            {!newCount && !conflictCount && <p className="text-sm text-slate-500">{t('admin.overview.nothingNew')}</p>}
          </>
        )}
      </SheetUploadPanel>
    </>
  )
}
