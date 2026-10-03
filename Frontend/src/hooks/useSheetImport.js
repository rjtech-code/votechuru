import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Each stage stays on screen at least this long so the admin can read it.
const MIN_STAGE_MS = 650
const SUCCESS_CLOSE_MS = 2800
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Drives a spreadsheet upload through the progress popup:
 *   uploading → checking (server) → validating (against stored data) → success,
 * pausing for an explicit decision when conflicts are found.
 *
 * upload(file, { token, onUploaded }) → Promise<server preview JSON>
 * prepare(json) → { conflicts: [{ key, vars }], conflictTitleKey?, alternativeKey?,
 *                   apply(choice: 'keep' | 'alternative') → Promise<{ lines, rejected }> }
 * The server validates again when `apply` confirms the import.
 */
export function useSheetImport({ upload, prepare, validatingKey }) {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const pendingRef = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const close = useCallback(() => {
    clearTimeout(closeTimer.current)
    pendingRef.current = null
    setProgress(null)
  }, [])

  const finish = async (prepared, choice, fileName) => {
    setProgress({ stage: 'validating', fileName, validatingKey })
    try {
      const { lines, rejected = [] } = await prepared.apply(choice)
      setProgress({ stage: 'success', fileName, lines, rejected })
      // Stay open when rows were rejected so the admin can read them.
      if (!rejected.length) closeTimer.current = setTimeout(() => setProgress(null), SUCCESS_CLOSE_MS)
      return true
    } catch (error) {
      if (error.code === 'UNAUTHORIZED') {
        setProgress(null)
        return false
      }
      setProgress({ stage: 'error', fileName, error })
      return false
    }
  }

  /** Returns true when the file was accepted (so the uploader can clear its selection). */
  const start = async (file) => {
    const fileName = file.name
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

    setProgress({ stage: 'validating', fileName, validatingKey })
    await wait(MIN_STAGE_MS)
    let prepared
    try {
      prepared = prepare(outcome.json)
    } catch (error) {
      setProgress({ stage: 'error', fileName, error })
      return false
    }
    if (prepared.conflicts.length) {
      pendingRef.current = { prepared, fileName }
      setProgress({
        stage: 'conflicts',
        fileName,
        conflicts: prepared.conflicts,
        conflictTitleKey: prepared.conflictTitleKey,
        alternativeKey: prepared.alternativeKey,
      })
      return true
    }
    return finish(prepared, 'keep', fileName)
  }

  const resolve = (choice) => {
    const pending = pendingRef.current
    pendingRef.current = null
    if (pending) finish(pending.prepared, choice, pending.fileName)
  }

  return { progress, start, close, keep: () => resolve('keep'), alternative: () => resolve('alternative') }
}
