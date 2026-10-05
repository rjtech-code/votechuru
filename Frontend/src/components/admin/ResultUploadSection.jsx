import { useState } from 'react'
import { Info } from 'lucide-react'
import SheetUploadPanel, { ConflictChoice, PreviewTable, RejectedRows, RowStatus, SheetStats } from './SheetUploadPanel'
import { rejectedRowCount } from './WardUploadSection'
import { importIssues } from './CandidateUploadSection'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'
import { useSheetImport } from '../../hooks/useSheetImport'
import { uploadResultSheet } from '../../services/api'

/**
 * Result sheet upload (Candidate ID, Ward No., Total Votes) for all wards or, with `wardNo`,
 * for one ward. The server verifies every row against the Ward and Candidate Masters; the
 * Super Admin reviews the overview and confirms. Saved results stay Pending until declared.
 */
export default function ResultUploadSection({ wardNo = null }) {
  const { t, formatNumber } = useLanguage()
  const { importResults } = useResults()
  const [resolution, setResolution] = useState('keep')
  const [confirming, setConfirming] = useState(false)

  const importer = useSheetImport({
    validatingKey: 'admin.progress.validatingResults',
    upload: (file, { token, onUploaded }) => uploadResultSheet(file, token, { onUploaded, wardNo }),
  })
  const preview = importer.preview?.data
  const newCount = preview?.rows.filter((r) => r.status === 'new').length ?? 0
  const conflictCount = preview?.rows.filter((r) => r.status === 'conflict').length ?? 0
  const savedCount = newCount + (resolution === 'replace' ? conflictCount : 0)
  const wardCount = new Set(preview?.rows.filter((r) => r.status === 'new' || (resolution === 'replace' && r.status === 'conflict')).map((r) => r.wardNo)).size

  const save = () =>
    importer.confirm(async (data) => {
      const summary = await importResults(data.data, { scopeWard: wardNo, conflictResolution: resolution })
      const rejected = importIssues(summary)
      const lines = [{ key: 'admin.results.addedCount', vars: { count: summary.added } }]
      if (summary.replaced) lines.push({ key: 'admin.results.replacedCount', vars: { count: summary.replaced } })
      if (summary.kept) lines.push({ key: 'admin.progress.conflictsKept', vars: { count: summary.kept } })
      if (summary.duplicates) lines.push({ key: 'admin.progress.skipped', vars: { count: summary.duplicates } })
      if (rejected.length) lines.push({ key: 'admin.progress.rejectedCount', vars: { count: rejected.length }, tone: 'warning' })
      if (summary.reopened?.length) lines.push({ key: 'admin.results.autoReopened', vars: { wards: summary.reopened.join(', ') }, tone: 'warning' })
      lines.push({ key: 'admin.results.pendingUntilDeclared' })
      setResolution('keep')
      return { lines, rejected }
    })

  const columns = [
    { key: 'candidateId', header: t('profile.candidateCode'), className: 'whitespace-nowrap font-mono text-xs font-semibold text-navy-900', render: (r) => r.candidateId },
    { key: 'name', header: t('admin.columns.name'), className: 'font-semibold text-navy-900', render: (r) => r.name },
    { key: 'party', header: t('result.party'), render: (r) => r.party },
    { key: 'wardNo', header: t('admin.columns.ward'), className: 'whitespace-nowrap', render: (r) => t('common.ward', { ward: r.wardNo }) },
    { key: 'totalVotes', header: t('admin.columns.totalVotes'), align: 'right', className: 'tabular-nums font-semibold text-navy-900', render: (r) => formatNumber(r.totalVotes) },
    {
      key: 'status',
      header: t('result.status'),
      render: (r) => (
        <div>
          <RowStatus status={r.status} labelKey={r.status === 'duplicate' ? 'admin.overview.statusIdentical' : undefined} />
          {r.status === 'conflict' && <p className="mt-1 text-xs text-slate-500">{t('admin.overview.storedVotes', { votes: formatNumber(r.existingVotes) })}</p>}
        </div>
      ),
    },
  ]

  return (
    <>
      <ul className="mb-4 space-y-1.5 text-sm text-slate-600">
        {[wardNo ? t('admin.resultUpload.wardNote', { ward: wardNo }) : t('admin.resultUpload.allNote'), t('admin.resultUpload.verifyNote'), t('admin.resultUpload.pendingNote')].map((text) => (
          <li key={text} className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
      <SheetUploadPanel importer={importer} submitLabel={t('admin.resultUpload.submit')} canSubmit={savedCount > 0} onSubmit={() => setConfirming(true)}>
        {preview && (
          <>
            <SheetStats
              items={[
                { label: t('admin.overview.totalRows'), value: preview.totalRows },
                { label: t('admin.overview.validRows'), value: preview.rows.length, tone: 'green' },
                { label: t('admin.overview.newResults'), value: newCount },
                { label: t('admin.overview.rejected'), value: rejectedRowCount(preview.rejected), tone: preview.rejected.length ? 'red' : undefined },
              ]}
            />
            <ConflictChoice
              name="result-conflicts"
              count={conflictCount}
              value={resolution}
              onChange={setResolution}
              message={t('admin.overview.resultConflicts', { count: formatNumber(conflictCount) })}
              replaceLabel={t('admin.overview.replaceVotes')}
            />
            <RejectedRows rejected={preview.rejected} />
            <PreviewTable title={t('admin.overview.resultPreview')} columns={columns} rows={preview.rows} />
            {!savedCount && <p className="text-sm text-slate-500">{t('admin.overview.nothingNew')}</p>}
          </>
        )}
      </SheetUploadPanel>

      <ConfirmDialog
        open={confirming}
        title={t('admin.resultUpload.confirmTitle')}
        message={t('admin.resultUpload.confirmText', { count: formatNumber(savedCount), wards: formatNumber(wardCount) })}
        confirmLabel={t('admin.resultUpload.submit')}
        confirmVariant="primary"
        onConfirm={() => {
          save()
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
