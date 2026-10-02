import * as XLSX from 'xlsx'

/**
 * Reads the first worksheet of an .xlsx/.xls buffer into an array of row arrays
 * (row 0 = header row). Formulas and HTML are not evaluated or rendered.
 */
export function readFirstSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: false, cellHTML: false, dense: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', blankrows: false, raw: true })
}
