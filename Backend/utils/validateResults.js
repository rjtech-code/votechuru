/**
 * Spreadsheet validation for the two upload types.
 *
 * Columns are matched by header name in any order (case, extra spaces, a trailing dot
 * and spacing around "/" are ignored). Format errors in any row reject the whole file,
 * so a partial import can never leave incomplete data. The one exception is a candidate
 * row whose ward is not in the Ward Master: that row is reported as rejected and the
 * other valid rows are still returned.
 */
const MAX_TEXT = { name: 120, party: 80, candidateCode: 40, wardName: 120, areas: 500 }

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
  if (typeof value === 'number') return Number.isInteger(value) ? value : null
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
}

export const SCHEMAS = {
  candidates: [
    { key: 'name', header: 'Name', aliases: ['name'], required: true, parse: parsers.text('name', true) },
    { key: 'party', header: 'Party', aliases: ['party'], required: true, parse: parsers.text('party', true) },
    { key: 'wardNo', header: 'Ward No.', aliases: ['ward no', 'ward number'], required: true, parse: parsers.ward },
    { key: 'totalVotes', header: 'Total Votes', aliases: ['total votes'], required: true, parse: parsers.count(true) },
    { key: 'candidateCode', header: 'Candidate ID', aliases: ['candidate id'], required: false, parse: parsers.text('candidateCode', false) },
  ],
  wards: [
    { key: 'wardNo', header: 'Ward No.', aliases: ['ward no', 'ward number'], required: true, parse: parsers.ward },
    { key: 'wardName', header: 'Ward Name', aliases: ['ward name'], required: false, parse: parsers.text('wardName', false) },
    { key: 'areas', header: 'Area / Localities', aliases: ['area/localities', 'area', 'areas', 'localities'], required: false, parse: parsers.text('areas', false) },
    { key: 'totalVoters', header: 'Total Voters', aliases: ['total voters'], required: false, parse: parsers.count(false) },
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
 * Validates sheet rows (row arrays, header first) against a schema.
 * Returns { ok: true, records } or { ok: false, code, message, ...details }.
 * Each record carries `row`, its spreadsheet row number (header = row 1).
 */
function parseSheet(rows, schema, { maxRows }, extraErrors = () => []) {
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
  const errors = []
  dataRows.forEach((cells, index) => {
    const raw = Object.fromEntries(used.map((f) => [f.key, cells[columns[f.key]]]))
    // Rows where every mapped cell is blank are ignored (e.g. trailing formatting).
    if (Object.values(raw).every(isBlank)) return
    const row = index + 2
    const record = { row }
    for (const field of schema) {
      const result = field.parse(raw[field.key])
      if (result.code) errors.push({ row, field: field.header, code: result.code })
      else record[field.key] = result.value
    }
    records.push(record)
  })

  errors.push(...extraErrors(records))
  errors.sort((a, b) => a.row - b.row)
  if (errors.length) {
    return { ok: false, code: 'INVALID_ROWS', message: `Row ${errors[0].row}: ${errors[0].field} is invalid.`, errors: errors.slice(0, 100), errorCount: errors.length }
  }
  if (!records.length) return { ok: false, code: 'NO_ROWS', message: 'The Excel sheet has no data rows.' }
  return { ok: true, records }
}

/** Rows repeating a Ward No. already used earlier in the same file. */
function duplicateWardErrors(records) {
  const firstRowByWard = new Map()
  const errors = []
  for (const record of records) {
    if (record.wardNo == null) continue
    if (firstRowByWard.has(record.wardNo)) {
      errors.push({ row: record.row, field: 'Ward No.', code: 'DUPLICATE_WARD', wardNo: record.wardNo, firstRow: firstRowByWard.get(record.wardNo) })
    } else firstRowByWard.set(record.wardNo, record.row)
  }
  return errors
}

/** Ward Master sheet: Ward No. required and unique within the file. */
export function validateWardSheet(rows, options) {
  const parsed = parseSheet(rows, SCHEMAS.wards, options, duplicateWardErrors)
  if (!parsed.ok) return parsed
  return { ok: true, data: parsed.records.map(({ row, ...ward }) => ward) }
}

/**
 * Candidate sheet. Rows whose ward is not in `knownWards` are returned in `rejected`
 * (never silently dropped); every other valid row is returned in `data`.
 */
export function validateCandidateSheet(rows, { knownWards, ...options }) {
  const parsed = parseSheet(rows, SCHEMAS.candidates, options)
  if (!parsed.ok) return parsed
  const data = []
  const rejected = []
  for (const { row, ...record } of parsed.records) {
    if (knownWards.has(record.wardNo)) data.push({ ...record, row })
    else rejected.push({ row, wardNo: record.wardNo, name: record.name, code: 'WARD_NOT_FOUND' })
  }
  return { ok: true, data, rejected }
}
