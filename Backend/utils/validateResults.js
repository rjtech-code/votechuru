import { generateCandidateId, parseCandidateId } from './candidateId.js'

/**
 * Spreadsheet validation for the three upload types (wards, candidates, results).
 *
 * Columns are matched by header name in any order (case, extra spaces, a trailing dot
 * and spacing around "/" are ignored). A missing required column rejects the whole file.
 * Otherwise every row is checked on its own: invalid rows are returned in `rejected` with
 * a row-specific reason (never silently dropped) and the valid rows in `data`.
 */
const MAX_TEXT = { name: 120, party: 80, wardName: 120, areas: 500 }

const normalizeHeader = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')

const isBlank = (value) => String(value ?? '').trim() === ''

/** Accepts integers given as numbers or digit strings ("5,421" allowed). Returns null if invalid. */
function parseWholeNumber(value) {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 0 ? value : null
  const text = String(value ?? '').trim().replace(/,/g, '')
  return /^\d+$/.test(text) ? Number(text) : null
}

const cleanText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

/**
 * Field types. Each returns { value } or { code } (an error code).
 * Optional fields return { value: null } when blank.
 */
const parsers = {
  text: (key, required) => (raw) => {
    const value = cleanText(raw)
    if (!value) return required ? { code: 'REQUIRED' } : { value: null }
    if (value.length > MAX_TEXT[key]) return { code: 'TOO_LONG' }
    return { value }
  },
  ward: (raw) => {
    if (isBlank(raw)) return { code: 'REQUIRED' }
    const value = parseWholeNumber(raw)
    return value === null || value < 1 ? { code: 'WARD_INVALID' } : { value }
  },
  count: (required) => (raw) => {
    if (isBlank(raw)) return required ? { code: 'REQUIRED' } : { value: null }
    const value = parseWholeNumber(raw)
    return value === null ? { code: 'NUMBER_INVALID' } : { value }
  },
  candidateId: (raw) => {
    if (isBlank(raw)) return { code: 'REQUIRED' }
    const value = parseCandidateId(raw)
    return value ? { value } : { code: 'CANDIDATE_ID_INVALID' }
  },
}

const WARD_FIELD = { key: 'wardNo', header: 'Ward No.', aliases: ['ward no', 'ward number'], required: true, parse: parsers.ward }

export const SCHEMAS = {
  wards: [
    WARD_FIELD,
    { key: 'wardName', header: 'Ward Name', aliases: ['ward name'], required: false, parse: parsers.text('wardName', false) },
    { key: 'areas', header: 'Area / Localities', aliases: ['area/localities', 'area', 'areas', 'localities'], required: false, parse: parsers.text('areas', false) },
    { key: 'totalVoters', header: 'Total Voters', aliases: ['total voters'], required: true, parse: parsers.count(true) },
  ],
  // Candidate Master: no votes and no Candidate ID (the server generates it).
  candidates: [
    { key: 'name', header: 'Name', aliases: ['name'], required: true, parse: parsers.text('name', true) },
    { key: 'party', header: 'Party', aliases: ['party'], required: true, parse: parsers.text('party', true) },
    WARD_FIELD,
  ],
  results: [
    { key: 'candidateId', header: 'Candidate ID', aliases: ['candidate id', 'candidateid'], required: true, parse: parsers.candidateId },
    WARD_FIELD,
    { key: 'totalVotes', header: 'Total Votes', aliases: ['total votes', 'votes'], required: true, parse: parsers.count(true) },
  ],
}

/** Maps schema fields to column indexes. Returns { columns, missingFields }. */
export function findColumns(headerRow = [], schema) {
  const columns = {}
  headerRow.forEach((cell, index) => {
    const field = schema.find((f) => f.aliases.includes(normalizeHeader(cell)))
    if (field && columns[field.key] === undefined) columns[field.key] = index
  })
  const missingFields = schema.filter((f) => f.required && columns[f.key] === undefined).map((f) => f.header)
  return { columns, missingFields }
}

/**
 * Parses sheet rows (row arrays, header first) against a schema.
 * Returns { ok: false, code, message, ... } for file-level problems, otherwise
 * { ok: true, records, rejected, totalRows }. Each record and rejection carries `row`,
 * its spreadsheet row number (header = row 1).
 */
function parseSheet(rows, schema, { maxRows }) {
  const [headerRow, ...dataRows] = rows
  if (!headerRow) return { ok: false, code: 'EMPTY_SHEET', message: 'The Excel sheet is empty.' }

  const { columns, missingFields } = findColumns(headerRow, schema)
  if (missingFields.length) {
    return {
      ok: false,
      code: 'MISSING_FIELDS',
      message: 'Required fields are missing',
      missingFields,
      requiredFields: schema.filter((f) => f.required).map((f) => f.header),
    }
  }
  if (dataRows.length > maxRows) return { ok: false, code: 'TOO_MANY_ROWS', message: `The sheet has more than ${maxRows} rows.`, maxRows }

  const used = schema.filter((f) => columns[f.key] !== undefined)
  const records = []
  const rejected = []
  let totalRows = 0
  dataRows.forEach((cells, index) => {
    const raw = Object.fromEntries(used.map((f) => [f.key, cells[columns[f.key]]]))
    // Rows where every mapped cell is blank are ignored (e.g. trailing formatting).
    if (Object.values(raw).every(isBlank)) return
    totalRows += 1
    const row = index + 2
    const record = { row }
    const errors = []
    for (const field of schema) {
      const result = field.parse(raw[field.key])
      if (result.code) errors.push({ row, field: field.header, code: result.code })
      else record[field.key] = result.value
    }
    if (errors.length) rejected.push(...errors)
    else records.push(record)
  })

  if (!totalRows) return { ok: false, code: 'NO_ROWS', message: 'The Excel sheet has no data rows.' }
  return { ok: true, records, rejected, totalRows }
}

/**
 * Moves records failing `check` into `rejected`. `check(record)` returns null or the
 * rejection details ({ field, code, ...vars }).
 */
function rejectWhere(parsed, check) {
  const records = []
  for (const record of parsed.records) {
    const problem = check(record)
    if (problem) parsed.rejected.push({ row: record.row, ...problem })
    else records.push(record)
  }
  parsed.records = records
}

/** Rejects rows repeating a key already used by an earlier valid row of the same file. */
function rejectRepeats(parsed, keyOf, details) {
  const firstRow = new Map()
  rejectWhere(parsed, (record) => {
    const key = keyOf(record)
    if (firstRow.has(key)) return details(record, firstRow.get(key))
    firstRow.set(key, record.row)
    return null
  })
}

const finish = (parsed) => ({
  ok: true,
  totalRows: parsed.totalRows,
  data: parsed.records,
  rejected: parsed.rejected.sort((a, b) => a.row - b.row),
})

/** Ward Master sheet: Ward No. and Total Voters required; Ward No. unique within the file. */
export function validateWardSheet(rows, options) {
  const parsed = parseSheet(rows, SCHEMAS.wards, options)
  if (!parsed.ok) return parsed
  rejectRepeats(parsed, (r) => r.wardNo, (r, firstRow) => ({ field: 'Ward No.', code: 'DUPLICATE_WARD', ward: r.wardNo, firstRow }))
  return finish(parsed)
}

/**
 * Candidate Master sheet. Rows whose ward is not in `knownWards`, or for which no valid
 * Candidate ID can be generated, are rejected. Valid rows get their generated `candidateId`.
 */
export function validateCandidateSheet(rows, { knownWards, ...options }) {
  const parsed = parseSheet(rows, SCHEMAS.candidates, options)
  if (!parsed.ok) return parsed
  rejectWhere(parsed, (record) => {
    if (!knownWards.has(record.wardNo)) return { field: 'Ward No.', code: 'WARD_NOT_FOUND', ward: record.wardNo }
    const generated = generateCandidateId(record.wardNo, record.party)
    if (generated.code) return { field: generated.code === 'PARTY_CODE_INVALID' ? 'Party' : 'Ward No.', code: generated.code, ward: record.wardNo }
    record.candidateId = generated.id
    return null
  })
  return finish(parsed)
}

/**
 * Checks one parsed result record against the database. The spreadsheet is not trusted:
 * the ward must exist, the candidate must exist and belong to that ward (and to `scopeWard`
 * when the upload is for one ward). `candidates` maps Candidate ID → stored candidate.
 * On success the record gains `candidate` (the candidate's _id), `name` and `party`.
 */
export function checkResultRecord(record, { candidates, knownWards, scopeWard = null }) {
  if (!knownWards.has(record.wardNo)) return { field: 'Ward No.', code: 'WARD_NOT_FOUND', ward: record.wardNo }
  if (scopeWard && record.wardNo !== scopeWard) return { field: 'Ward No.', code: 'OUTSIDE_WARD', ward: record.wardNo, scopeWard }
  const candidate = candidates.get(record.candidateId)
  if (!candidate) return { field: 'Candidate ID', code: 'CANDIDATE_NOT_FOUND', candidateId: record.candidateId }
  if (candidate.wardNo !== record.wardNo) {
    return { field: 'Ward No.', code: 'CANDIDATE_WARD_MISMATCH', candidateId: record.candidateId, ward: record.wardNo, candidateWard: candidate.wardNo }
  }
  record.candidate = candidate._id
  record.name = candidate.name
  record.party = candidate.party
  return null
}

/** Result sheet: Candidate ID, Ward No. and Total Votes; one row per candidate. */
export function validateResultSheet(rows, { candidates, knownWards, scopeWard = null, ...options }) {
  const parsed = parseSheet(rows, SCHEMAS.results, options)
  if (!parsed.ok) return parsed
  rejectWhere(parsed, (record) => checkResultRecord(record, { candidates, knownWards, scopeWard }))
  rejectRepeats(parsed, (r) => r.candidateId, (r, firstRow) => ({ field: 'Candidate ID', code: 'DUPLICATE_CANDIDATE', candidateId: r.candidateId, firstRow }))
  return finish(parsed)
}

/**
 * Validates one record sent as JSON by the admin panel (manual entry, edit or import
 * confirmation) with the same field rules as spreadsheet rows.
 * Returns { record } or { errors: [{ field, code }] }.
 */
export function validateRecord(schemaName, raw = {}) {
  const record = {}
  const errors = []
  for (const field of SCHEMAS[schemaName]) {
    const result = field.parse(raw?.[field.key])
    if (result.code) errors.push({ field: field.header, code: result.code })
    else record[field.key] = result.value
  }
  return errors.length ? { errors } : { record }
}
