/**
 * Browser storage for the portal (no database yet). Each concept has its own key:
 *
 *   churuWards             Ward Master   [{ wardNo, wardName, areas, totalVoters }]
 *   churuCandidates        Candidates    [{ id, name, party, wardNo, totalVotes, candidateCode, image }]
 *   churuElectionResults   Ward status   { declaredWards: [wardNo, …] }
 *   churuElectionSettings  Schedule      { electionDateTime, resultDeclarationDateTime }
 *
 * Winners are never stored; they are derived (see lib/wards.js). When a database is
 * added, replace these functions with API calls; the contexts keep the same shape.
 */
export const KEYS = {
  wards: 'churuWards',
  candidates: 'churuCandidates',
  results: 'churuElectionResults',
  settings: 'churuElectionSettings',
}

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

/** Throws an error with code STORAGE_FULL when the browser quota is exceeded. */
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    throw Object.assign(new Error('Browser storage is full.'), { code: 'STORAGE_FULL', cause: error })
  }
}

const isWardNo = (n) => Number.isInteger(n) && n >= 1
const optionalText = (v) => (typeof v === 'string' && v.trim() ? v : null)
const optionalCount = (v) => (Number.isInteger(v) && v >= 0 ? v : null)

const cleanWard = (w) =>
  w && isWardNo(w.wardNo)
    ? { wardNo: w.wardNo, wardName: optionalText(w.wardName), areas: optionalText(w.areas), totalVoters: optionalCount(w.totalVoters) }
    : null

const cleanCandidate = (c) =>
  c && typeof c.id === 'string' && typeof c.name === 'string' && c.name.trim() && isWardNo(c.wardNo) && Number.isInteger(c.totalVotes) && c.totalVotes >= 0
    ? {
        id: c.id,
        name: c.name,
        party: typeof c.party === 'string' ? c.party : '',
        wardNo: c.wardNo,
        totalVotes: c.totalVotes,
        candidateCode: optionalText(c.candidateCode),
        image: typeof c.image === 'string' && c.image.startsWith('data:image/') ? c.image : null,
      }
    : null

/**
 * One-time upgrade of data saved by the earlier version, which kept candidate records
 * inside churuElectionResults. Records move to churuCandidates and their wards are added
 * to the Ward Master, so nothing already entered is lost.
 */
function migrateLegacy() {
  const results = read(KEYS.results)
  const legacyRecords = Array.isArray(results) ? results : Array.isArray(results?.records) ? results.records : null
  if (!legacyRecords || read(KEYS.candidates)) return
  const candidates = legacyRecords.map(cleanCandidate).filter(Boolean)
  const wardNos = [...new Set(candidates.map((c) => c.wardNo))]
  const existingWards = (read(KEYS.wards) ?? []).map(cleanWard).filter(Boolean)
  const known = new Set(existingWards.map((w) => w.wardNo))
  const wards = [...existingWards, ...wardNos.filter((n) => !known.has(n)).map((wardNo) => ({ wardNo, wardName: null, areas: null, totalVoters: null }))]
  write(KEYS.candidates, candidates)
  write(KEYS.wards, wards)
  write(KEYS.results, { declaredWards: Array.isArray(results?.declaredWards) ? results.declaredWards : [] })
}

/** Loads wards, candidates and declared wards, dropping anything malformed. */
export function loadData() {
  try {
    migrateLegacy()
  } catch {
    // Storage full or unavailable: continue with whatever can be read.
  }
  const seen = new Set()
  const wards = (read(KEYS.wards) ?? []).map(cleanWard).filter((w) => w && !seen.has(w.wardNo) && seen.add(w.wardNo))
  const candidates = (Array.isArray(read(KEYS.candidates)) ? read(KEYS.candidates) : []).map(cleanCandidate).filter(Boolean)
  const status = read(KEYS.results)
  const declaredWards = [...new Set(Array.isArray(status?.declaredWards) ? status.declaredWards.filter(isWardNo) : [])]
  return { wards, candidates, declaredWards }
}

export const saveWards = (wards) => write(KEYS.wards, wards)
export const saveCandidates = (candidates) => write(KEYS.candidates, candidates)
export const saveStatus = (declaredWards) => write(KEYS.results, { declaredWards })

/** Removes candidates and ward result statuses. Ward Master and the schedule are kept. */
export function clearResults() {
  localStorage.removeItem(KEYS.candidates)
  localStorage.removeItem(KEYS.results)
}

export const clearWards = () => localStorage.removeItem(KEYS.wards)

export function loadSettings() {
  const s = read(KEYS.settings)
  const valid = (v) => (typeof v === 'string' && !Number.isNaN(new Date(v).getTime()) ? v : null)
  return { electionDateTime: valid(s?.electionDateTime), resultDeclarationDateTime: valid(s?.resultDeclarationDateTime) }
}

export const saveSettings = (settings) => write(KEYS.settings, settings)

export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
