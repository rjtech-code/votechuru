import { useRef, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import Button from '../ui/Button'
import { useLanguage } from '../../i18n/I18nContext'
import { cn } from '../../lib/format'

const ACCEPT = '.xlsx,.xls'
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Drag & drop / file-picker area. "Choose Excel File" opens the system file picker and
 * `onSelect(file)` runs as soon as a file is chosen or dropped — no second step.
 */
export default function ExcelUploader({ onSelect, busy }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [errorKey, setErrorKey] = useState('')

  // Quick client-side check; the server validates the file again.
  const pick = (file) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!file || busy) return
    if (!/\.(xlsx|xls)$/i.test(file.name)) return setErrorKey('admin.upload.wrongType')
    if (file.size > MAX_BYTES) return setErrorKey('admin.upload.tooLarge')
    setErrorKey('')
    onSelect(file)
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
    </div>
  )
}
