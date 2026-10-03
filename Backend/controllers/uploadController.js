import { readFirstSheet } from '../utils/excelParser.js'
import { validateCandidateSheet, validateWardSheet } from '../utils/validateResults.js'
import { config } from '../config.js'

/** Reads the uploaded workbook, or sends the matching error response and returns null. */
function readUpload(req, res) {
  if (!req.file) {
    res.status(400).json({ success: false, code: 'NO_FILE', message: 'Please choose an Excel file to upload.' })
    return null
  }
  try {
    return readFirstSheet(req.file.buffer)
  } catch {
    res.status(422).json({ success: false, code: 'PARSE_ERROR', message: 'The file could not be read as an Excel sheet.' })
    return null
  }
}

function sendFailure(res, result) {
  const { ok, ...body } = result
  return res.status(422).json({ success: false, ...body })
}

/** The admin panel sends its current Ward Master as a JSON array of ward numbers. */
function parseWardList(value) {
  try {
    const list = JSON.parse(value ?? '[]')
    return Array.isArray(list) ? new Set(list.filter((n) => Number.isInteger(n) && n > 0)) : new Set()
  } catch {
    return new Set()
  }
}

/**
 * POST /api/admin/upload-results (multipart: "file", "wardNos").
 * Returns { data: valid candidate records, rejected: rows whose ward is not in the Ward Master }.
 * Nothing is stored server-side; the admin panel saves the returned data.
 */
export function uploadResults(req, res) {
  const rows = readUpload(req, res)
  if (!rows) return undefined
  const result = validateCandidateSheet(rows, { maxRows: config.upload.maxRows, knownWards: parseWardList(req.body?.wardNos) })
  if (!result.ok) return sendFailure(res, result)
  return res.json({ success: true, message: 'File uploaded successfully', data: result.data, rejected: result.rejected })
}

/** POST /api/admin/upload-wards (multipart: "file"). Returns the validated Ward Master rows. */
export function uploadWards(req, res) {
  const rows = readUpload(req, res)
  if (!rows) return undefined
  const result = validateWardSheet(rows, { maxRows: config.upload.maxRows })
  if (!result.ok) return sendFailure(res, result)
  return res.json({ success: true, message: 'File uploaded successfully', data: result.data })
}
