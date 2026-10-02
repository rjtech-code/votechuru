import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ExcelUploader from '../../components/admin/ExcelUploader'
import UploadProgressModal from '../../components/admin/UploadProgressModal'
import ManualResultForm from '../../components/admin/ManualResultForm'
import { Card, CardHeader } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { useResults } from '../../context/ResultsContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/I18nContext'
import { uploadResults } from '../../services/api'

// Each stage stays on screen at least this long so the admin can read it.
const MIN_STAGE_MS = 700
const SUCCESS_CLOSE_MS = 1800
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AdminUpload() {
  const { t } = useLanguage()
  const { token, logout } = useAuth()
  const { addResults, findDuplicates } = useResults()
  const notify = useToast()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const pendingRef = useRef(null)
  const closeTimer = useRef(null)

  const { hash } = useLocation()

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // The dashboard's "add manually" shortcut links to #manual.
  useEffect(() => {
    if (hash === '#manual') document.getElementById('manual')?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  const closeProgress = () => {
    clearTimeout(closeTimer.current)
    pendingRef.current = null
    setProgress(null)
  }

  /** Saves validated records; any storage failure is shown in the popup and nothing is kept. */
  const save = (records, skipped, fileName) => {
    try {
      const added = records.length ? addResults(records) : 0
      setProgress({ stage: 'success', fileName, added, skipped })
      closeTimer.current = setTimeout(() => setProgress(null), SUCCESS_CLOSE_MS)
      return true
    } catch (error) {
      setProgress({ stage: 'error', fileName, error })
      return false
    }
  }

  /** Upload → server checks fields and rows → duplicate check → save. Returns true when the file was accepted. */
  const handleUpload = async (file) => {
    const fileName = file.name
    setProgress({ stage: 'uploading', fileName })

    let markUploaded
    const uploaded = new Promise((resolve) => {
      markUploaded = resolve
    })
    const response = uploadResults(file, token, { onUploaded: markUploaded }).then(
      (data) => ({ data }),
      (error) => ({ error }),
    )

    await Promise.all([Promise.race([uploaded, response]), wait(MIN_STAGE_MS)])
    setProgress({ stage: 'checking', fileName })
    const [outcome] = await Promise.all([response, wait(MIN_STAGE_MS)])

    if (outcome.error) {
      if (outcome.error.code === 'UNAUTHORIZED') {
        setProgress(null)
        logout({ revoke: false })
        navigate('/admin', { replace: true, state: { reason: 'expired' } })
        return false
      }
      setProgress({ stage: 'error', fileName, error: outcome.error })
      return false
    }

    const { duplicates, fresh } = findDuplicates(outcome.data)
    if (duplicates.length) {
      pendingRef.current = { all: outcome.data, fresh, skipped: duplicates.length, fileName }
      setProgress({ stage: 'duplicates', fileName, duplicates: duplicates.length, total: outcome.data.length })
      return true
    }
    return save(outcome.data, 0, fileName)
  }

  const resolveDuplicates = (skip) => {
    const pending = pendingRef.current
    pendingRef.current = null
    if (!pending) return
    save(skip ? pending.fresh : pending.all, skip ? pending.skipped : 0, pending.fileName)
  }

  const addManual = async (record) => {
    if (findDuplicates([record]).duplicates.length) throw Object.assign(new Error('Duplicate'), { code: 'DUPLICATE_RECORD' })
    addResults([record])
    notify(t('admin.manual.added'))
  }

  return (
    <>
      <AdminPageHeader title={t('admin.upload.title')} description={t('admin.upload.description')} />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title={t('admin.upload.sectionTitle')}
            description={
              <>
                {t('admin.upload.requiredColumns')}{' '}
                {['Name', 'Ward No.', 'Total Votes'].map((column) => (
                  <code key={column} className="mx-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-navy-900">
                    {column}
                  </code>
                ))}
              </>
            }
          />
          <div className="p-5">
            <ExcelUploader onUpload={handleUpload} busy={progress?.stage === 'uploading' || progress?.stage === 'checking'} />
          </div>
        </Card>

        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500" id="manual">
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          {t('admin.upload.orManual')}
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        </div>

        <Card>
          <CardHeader title={t('admin.manual.title')} description={t('admin.manual.description')} />
          <div className="p-5">
            <ManualResultForm onSubmit={addManual} />
          </div>
        </Card>
      </div>

      <UploadProgressModal
        state={progress}
        onClose={closeProgress}
        onSkipDuplicates={() => resolveDuplicates(true)}
        onImportAnyway={() => resolveDuplicates(false)}
      />
    </>
  )
}
