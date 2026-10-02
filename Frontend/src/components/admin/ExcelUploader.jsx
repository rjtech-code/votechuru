import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload, X } from 'lucide-react'
import Button from '../ui/Button'
import { useLanguage } from '../../i18n/I18nContext'
import { cn } from '../../lib/format'

const ACCEPT = '.xlsx,.xls'
const MAX_BYTES = 5 * 1024 * 1024

const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

/** Drag & drop / file-picker area. Calls `onUpload(file)` when the admin confirms. */
export default function ExcelUploader({ onUpload, busy }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [errorKey, setErrorKey] = useState('')

  // Quick client-side check; the server validates the file again.
  const pick = (candidate) => {
    if (!candidate) return
    if (!/\.(xlsx|xls)$/i.test(candidate.name)) {
      setFile(null)
      setErrorKey('admin.upload.wrongType')
      return
    }
    if (candidate.size > MAX_BYTES) {
      setFile(null)
      setErrorKey('admin.upload.tooLarge')
      return
    }
    setErrorKey('')
    setFile(candidate)
  }

  const clear = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const upload = async () => {
    const succeeded = await onUpload(file)
    if (succeeded) clear()
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          pick(event.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50/60',
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f6ed] text-[#1d8a4b]" aria-hidden="true">
          <FileSpreadsheet className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-semibold text-navy-900">{t('admin.upload.dropHere')}</p>
        <p className="my-2 text-xs text-slate-400">{t('admin.upload.or')}</p>
        <Button variant="secondary" icon={FileSpreadsheet} onClick={() => inputRef.current?.click()} disabled={busy}>
          {t('admin.upload.choose')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label={t('admin.upload.choose')}
          onChange={(event) => pick(event.target.files?.[0])}
        />
        <p className="mt-3 text-xs text-slate-500">{t('admin.upload.accepted')}</p>
      </div>

      {errorKey && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {t(errorKey)}
        </p>
      )}

      {file && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#1d8a4b]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{file.name}</p>
            <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={t('admin.upload.removeFile')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button icon={Upload} onClick={upload} disabled={!file || busy} loading={busy}>
          {t('admin.upload.submit')}
        </Button>
      </div>
    </div>
  )
}
