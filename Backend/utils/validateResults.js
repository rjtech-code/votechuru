/**
 * Validation for uploaded result sheets.
 *
 * Required columns (matched by header name, any order, case/space/trailing-dot insensitive):
 *   Name | Ward No. | Total Votes
 * Every row must be valid; one bad row rejects the whole file so a partial import
 * can never leave incomplete election data.
 */
export const REQUIRED_FIELDS = [
  { key: 'name', header: 'Name' },
  { key: 'wardNo', header: 'Ward No.' },
  { key: 'totalVotes', header: 'Total Votes' },
]

const MAX_NAME_LENGTH = 120

const normalizeHeader = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')

const HEADER_KEYS = { name: 'name', 'ward no': 'wardNo', 'total votes': 'totalVotes' }

/** Maps each required field to its column index. Returns { columns, missingFields }. */
export function findColumns(headerRow = []) {
  const columns = {}
  headerRow.forEach((cell, index) => {
    const key = HEADER_KEYS[normalizeHeader(cell)]
    if (key && columns[key] === undefined) columns[key] = index
  })
  const missingFields = REQUIRED_FIELDS.filter((f) => columns[f.key] === undefined).map((f) => f.header)
  return { columns, missingFields }
}

/** Accepts integers given as numbers or digit strings ("5,421" allowed). Returns null if invalid. */
function parseWholeNumber(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : null
  const text = String(value ?? '').trim().replace(/,/g, '')
  return /^\d+$/.test(text) ? Number(text) : null
}

/** Validates a single record. Returns { record } or { errors: [{ field, code }] }. */
export function validateRecord(input) {
  const errors = []
  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ')
  if (!name) errors.push({ field: 'Name', code: 'NAME_EMPTY' })
  else if (name.length > MAX_NAME_LENGTH) errors.push({ field: 'Name', code: 'NAME_TOO_LONG' })

  const wardNo = parseWholeNumber(input.wardNo)
  if (wardNo === null || wardNo < 1) errors.push({ field: 'Ward No.', code: 'WARD_INVALID' })

  const totalVotes = parseWholeNumber(input.totalVotes)
  if (totalVotes === null || totalVotes < 0) errors.push({ field: 'Total Votes', code: 'VOTES_INVALID' })

  return errors.length ? { errors } : { record: { name, wardNo, totalVotes } }
}

const ERROR_TEXT = {
  NAME_EMPTY: 'Name cannot be empty.',
  NAME_TOO_LONG: `Name must be at most ${MAX_NAME_LENGTH} characters.`,
  WARD_INVALID: 'Ward No. must be a whole number of 1 or more.',
  VOTES_INVALID: 'Total Votes must be a valid non-negative whole number.',
}

/**
 * Validates parsed sheet rows (row arrays, header first).
 * Returns { ok: true, data } or { ok: false, code, message, ...details }.
 */
export function validateSheet(rows, { maxRows }) {
  const [headerRow, ...dataRows] = rows
  if (!headerRow) return { ok: false, code: 'EMPTY_SHEET', message: 'The Excel sheet is empty.' }

  const { columns, missingFields } = findColumns(headerRow)
  if (missingFields.length) {
    return {
      ok: false,
      code: 'MISSING_FIELDS',
      message: 'Required fields are missing',
      missingFields,
      requiredFields: REQUIRED_FIELDS.map((f) => f.header),
    }
  }

  if (dataRows.length > maxRows) return { ok: false, code: 'TOO_MANY_ROWS', message: `The sheet has more than ${maxRows} rows.`, maxRows }

  const data = []
  const rowErrors = []
  dataRows.forEach((cells, index) => {
    const values = { name: cells[columns.name], wardNo: cells[columns.wardNo], totalVotes: cells[columns.totalVotes] }
    // Rows where all three required cells are blank are ignored (e.g. trailing formatting).
    if (Object.values(values).every((v) => String(v ?? '').trim() === '')) return
    const rowNumber = index + 2 // spreadsheet row number: header is row 1
    const { record, errors } = validateRecord(values)
    if (errors) errors.forEach((e) => rowErrors.push({ row: rowNumber, ...e, message: `Row ${rowNumber}: ${ERROR_TEXT[e.code]}` }))
    else data.push(record)
  })

  if (rowErrors.length) {
    return { ok: false, code: 'INVALID_ROWS', message: rowErrors[0].message, errors: rowErrors.slice(0, 100), errorCount: rowErrors.length }
  }
  if (!data.length) return { ok: false, code: 'NO_ROWS', message: 'The Excel sheet has no result rows.' }
  return { ok: true, data }
}
