import { readFirstSheet } from '../utils/excelParser.js'
import { validateSheet } from '../utils/validateResults.js'
import { config } from '../config.js'

/**
 * POST /api/admin/upload-results (multipart/form-data, field "file").
 * Parses and validates the sheet and returns the clean records. Nothing is stored
 * server-side in this prototype — the admin panel saves the returned data.
 */
export function uploadResults(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, code: 'NO_FILE', message: 'Please choose an Excel file to upload.' })
  }

  let rows
  try {
    rows = readFirstSheet(req.file.buffer)
  } catch {
    return res.status(422).json({ success: false, code: 'PARSE_ERROR', message: 'The file could not be read as an Excel sheet.' })
  }

  const result = validateSheet(rows, { maxRows: config.upload.maxRows })
  if (!result.ok) {
    const { ok, ...body } = result
    return res.status(422).json({ success: false, ...body })
  }

  return res.json({ success: true, message: 'File uploaded successfully', data: result.data })
}
