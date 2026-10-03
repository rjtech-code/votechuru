import { readFirstSheet } from '../utils/excelParser.js'
import { validateCandidateSheet, validateWardSheet } from '../utils/validateResults.js'
import { planCandidates, planWards, serializeCandidate } from '../utils/results.js'
import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { config } from '../config.js'

/**
 * Spreadsheet uploads are a preview step: the server parses and validates the sheet and
 * compares it with the database, but writes nothing. The admin panel then confirms the
 * import (with a conflict decision if needed) and the import endpoint re-validates.
 */

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

/** POST /api/admin/upload-results — candidate sheet preview against the stored Ward Master. */
export async function uploadResults(req, res) {
  const rows = readUpload(req, res)
  if (!rows) return undefined
  const knownWards = new Set((await Ward.find({}, { wardNo: 1 }).lean()).map((w) => w.wardNo))
  const result = validateCandidateSheet(rows, { maxRows: config.upload.maxRows, knownWards })
  if (!result.ok) return sendFailure(res, result)

  const records = result.data.map(({ row, ...record }) => record)
  const wardNos = [...new Set(records.map((r) => r.wardNo))]
  const existing = await Candidate.find({ wardNo: { $in: wardNos } }).lean()
  const plan = planCandidates(existing, records)
  return res.json({
    success: true,
    message: 'File uploaded successfully',
    data: records,
    rejected: result.rejected,
    duplicates: plan.duplicates,
    conflicts: plan.conflicts.map((c) => ({ record: c.record, existing: serializeCandidate(c.existing) })),
  })
}

/** POST /api/admin/upload-wards — Ward Master sheet preview. */
export async function uploadWards(req, res) {
  const rows = readUpload(req, res)
  if (!rows) return undefined
  const result = validateWardSheet(rows, { maxRows: config.upload.maxRows })
  if (!result.ok) return sendFailure(res, result)
  const existing = await Ward.find({ wardNo: { $in: result.data.map((w) => w.wardNo) } }).lean()
  const plan = planWards(existing, result.data)
  return res.json({ success: true, message: 'File uploaded successfully', data: result.data, duplicates: plan.duplicates, conflicts: plan.conflicts })
}
