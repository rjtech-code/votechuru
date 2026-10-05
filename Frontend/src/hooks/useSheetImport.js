import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Each stage stays on screen at least this long so the admin can read it.
const MIN_STAGE_MS = 650
const SUCCESS_CLOSE_MS = 2800
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Drives a spreadsheet upload:
 *   file chosen → popup (uploading → checking → validating) → overview of the sheet →
 *   explicit confirmation → popup (saving → success).
 *
 * upload(file, { token, onUploaded }) → Promise<server preview JSON>   (writes nothing)
 * confirm(apply): apply(preview) → Promise<{ lines, rejected }>         (the import; the server validates again)
 */
export function useSheetImport({ upload, validatingKey }) {
  const { token, handleUnauthorized } = useAuth()
  const [progress, setProgress] = useState(null)
  const [preview, setPreview] = useState(null) // { fileName, data }
  const closeTimer = useRef(null)

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const close = useCallback(() => {
    clearTimeout(closeTimer.current)
    setProgress(null)
  }, [])

  const fail = (fileName, error) => {
    if (error.code === 'UNAUTHORIZED') {
      setProgress(null)
      handleUnauthorized()
    } else setProgress({ stage: 'error', fileName, error })
  }

  /** Uploads the chosen file for validation; on success the overview replaces the drop zone. */
  const start = async (file) => {
    const fileName = file.name
    clearTimeout(closeTimer.current)
    setPreview(null)
    setProgress({ stage: 'uploading', fileName })

    let markUploaded
    const uploaded = new Promise((resolve) => {
      markUploaded = resolve
    })
    const response = upload(file, { token, onUploaded: markUploaded }).then(
      (json) => ({ json }),
      (error) => ({ error }),
    )

    await Promise.all([Promise.race([uploaded, response]), wait(MIN_STAGE_MS)])
    setProgress({ stage: 'checking', fileName })
    const [outcome] = await Promise.all([response, wait(MIN_STAGE_MS)])
    if (outcome.error) return fail(fileName, outcome.error)

    setProgress({ stage: 'validating', fileName, validatingKey })
    await wait(MIN_STAGE_MS)
    setProgress(null)
    setPreview({ fileName, data: outcome.json })
  }

  /** Saves the previewed sheet. Returns true when it was saved. */
  const confirm = async (apply) => {
    if (!preview) return false
    const { fileName } = preview
    setProgress({ stage: 'saving', fileName })
    try {
      const [{ lines, rejected = [] }] = await Promise.all([apply(preview.data), wait(MIN_STAGE_MS)])
      setPreview(null)
      setProgress({ stage: 'success', fileName, lines, rejected })
      // Stay open when records were rejected so the admin can read them.
      if (!rejected.length) closeTimer.current = setTimeout(() => setProgress(null), SUCCESS_CLOSE_MS)
      return true
    } catch (error) {
      fail(fileName, error)
      return false
    }
  }

  const busy = ['uploading', 'checking', 'validating', 'saving'].includes(progress?.stage)

  return { progress, preview, busy, start, confirm, discard: () => setPreview(null), close }
}
