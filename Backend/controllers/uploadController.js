import { readFirstSheet } from '../utils/excelParser.js'
import { validateCandidateSheet, validateResultSheet, validateWardSheet } from '../utils/validateResults.js'
import { planCandidates, planResults, planWards, resultMap, wardParam } from '../utils/results.js'
import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { Result } from '../models/Result.js'
import { config } from '../config.js'

/**
 * Spreadsheet uploads are a preview step: the server parses and validates the sheet and
 * compares it with the database, but writes nothing. The admin panel shows the overview,
 * the Super Admin confirms (with a conflict decision where one is needed) and the import
 * endpoint validates everything again before writing.
 *
 * Every preview returns { totalRows, rows, rejected, data }: `rows` are the valid rows with
 * their status against the database, `rejected` the invalid rows with a reason per row, and
 * `data` the records the import endpoint would receive.
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

/** Candidate sheets never supply votes or IDs; such columns are ignored and reported. */
const IGNORED_CANDIDATE_COLUMNS = { 'total votes': 'Total Votes', 'candidate id': 'Candidate ID' }
const ignoredColumnsOf = (headerRow = []) => [
  ...new Set(headerRow.map((cell) => IGNORED_CANDIDATE_COLUMNS[String(cell ?? '').trim().toLowerCase().replace(/\s+/g, ' ')]).filter(Boolean)),
]

const knownWardSet = async () => new Set((await Ward.find({}, { wardNo: 1 }).lean()).map((w) => w.wardNo))

/** POST /api/admin/upload-wards — Ward Master sheet preview. */
export async function uploadWards(req, res) {
  const rows = readUpload(req, res)
  if (!rows) return undefined
  const result = validateWardSheet(rows, { maxRows: config.upload.maxRows })
  if (!result.ok) return sendFailure(res, result)

  const records = result.data.map(({ row, ...ward }) => ward)
  const existing = await Ward.find({ wardNo: { $in: records.map((w) => w.wardNo) } }).lean()
  const plan = planWards(existing, records)
  const conflictWards = new Set(plan.conflicts.map((c) => c.record.wardNo))
  const existingWards = new Set(existing.map((w) => w.wardNo))
  return res.json({
    success: true,
    totalRows: result.totalRows,
    rows: result.data.map((w) => ({ ...w, status: conflictWards.has(w.wardNo) ? 'conflict' : existingWards.has(w.wardNo) ? 'duplicate' : 'new' })),
    rejected: result.rejected,
    data: records,
    duplicates: plan.duplicates,
    conflicts: plan.conflicts,
    // The Candidate ID format only has two digits for the ward number.
    beyondIdRange: records.filter((w) => w.wardNo > 99).map((w) => w.wardNo),
  })
}

/** POST /api/admin/upload-candidates — Candidate Master sheet preview (IDs generated here). */
export async function uploadCandidates(req, res) {
  const rows = readUpload(req, res)
  if (!rows) return undefined
  const result = validateCandidateSheet(rows, { maxRows: config.upload.maxRows, knownWards: await knownWardSet() })
  if (!result.ok) return sendFailure(res, result)

  const existing = await Candidate.find({ candidateId: { $in: [...new Set(result.data.map((r) => r.candidateId))] } }).lean()
  const plan = planCandidates(existing, result.data)
  const duplicateRows = new Set(plan.duplicates.map((r) => r.row))
  const conflictByRow = new Map(plan.conflicts.map((c) => [c.record.row, c.existing]))
  return res.json({
    success: true,
    totalRows: result.totalRows,
    rows: result.data.map((r) => ({
      ...r,
      status: conflictByRow.has(r.row) ? 'conflict' : duplicateRows.has(r.row) ? 'duplicate' : 'new',
      conflictWith: conflictByRow.get(r.row) ?? null,
    })),
    rejected: result.rejected,
    data: plan.fresh.map(({ name, party, wardNo }) => ({ name, party, wardNo })),
    ignoredColumns: ignoredColumnsOf(rows[0]),
  })
}

/** POST /api/admin/upload-results[?ward=N] — result sheet preview, optionally for one ward. */
export async function uploadResults(req, res) {
  const scopeWard = req.query.ward ? wardParam(req.query.ward) : null
  if (req.query.ward && !scopeWard) return res.status(422).json({ success: false, code: 'WARD_NOT_FOUND', message: 'This ward does not exist.' })
  const rows = readUpload(req, res)
  if (!rows) return undefined

  const knownWards = await knownWardSet()
  if (scopeWard && !knownWards.has(scopeWard)) return res.status(404).json({ success: false, code: 'WARD_NOT_FOUND', message: 'This ward does not exist.' })
  const stored = await Candidate.find({ candidateId: { $type: 'string' } }, { candidateId: 1, name: 1, party: 1, wardNo: 1 }).lean()
  const candidates = new Map(stored.map((c) => [c.candidateId, c]))
  const result = validateResultSheet(rows, { maxRows: config.upload.maxRows, candidates, knownWards, scopeWard })
  if (!result.ok) return sendFailure(res, result)

  const storedResults = resultMap(await Result.find({ candidate: { $in: result.data.map((r) => r.candidate) } }).lean())
  const plan = planResults(storedResults, result.data)
  const duplicateRows = new Set(plan.duplicates.map((r) => r.row))
  const conflictByRow = new Map(plan.conflicts.map((c) => [c.record.row, c.existingVotes]))
  return res.json({
    success: true,
    scopeWard,
    totalRows: result.totalRows,
    rows: result.data.map(({ candidate, ...r }) => ({
      ...r,
      status: conflictByRow.has(r.row) ? 'conflict' : duplicateRows.has(r.row) ? 'duplicate' : 'new',
      existingVotes: conflictByRow.get(r.row) ?? null,
    })),
    rejected: result.rejected,
    data: result.data.filter((r) => !duplicateRows.has(r.row)).map(({ candidateId, wardNo, totalVotes }) => ({ candidateId, wardNo, totalVotes })),
  })
}
