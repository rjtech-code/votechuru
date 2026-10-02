/**
 * Result records persisted in localStorage (prototype storage).
 * Record shape: { id: string, name: string, wardNo: number, totalVotes: number }
 *
 * When a database is added, replace these three functions with API calls; the
 * ResultsContext that uses them does not need to change shape.
 */
export const STORAGE_KEY = 'churuElectionResults'

const isValidRecord = (r) =>
  r &&
  typeof r.id === 'string' &&
  typeof r.name === 'string' &&
  r.name.trim() !== '' &&
  Number.isInteger(r.wardNo) &&
  r.wardNo >= 1 &&
  Number.isInteger(r.totalVotes) &&
  r.totalVotes >= 0

/** Reads stored records, ignoring anything malformed. */
export function loadResults() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isValidRecord) : []
  } catch {
    return []
  }
}

/** Throws a StorageFullError when the browser quota is exceeded. */
export function saveResults(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    const full = new Error('Browser storage is full.')
    full.code = 'STORAGE_FULL'
    full.cause = error
    throw full
  }
}

export function clearResults() {
  localStorage.removeItem(STORAGE_KEY)
}

export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
