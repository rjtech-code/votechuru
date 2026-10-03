/**
 * Derived ward results. Winners, positions, margins and statistics are always computed
 * from the Ward Master, the candidate records and the set of declared wards — never
 * stored, and never dependent on upload order.
 *
 * Ward status:
 *   'declared' — declared by the Super Admin AND one candidate has the highest votes
 *   'tie'      — two or more candidates share the highest votes (no winner, result pending)
 *   'pending'  — not declared yet (includes wards with no candidates); no winner shown
 */

const byNumber = (a, b) => Number(a.wardNo) - Number(b.wardNo)

/** Ward Master entries sorted numerically (1, 2, … 9, 10, 11 — never as strings). */
export const sortWards = (wards) => [...wards].sort(byNumber)

/** Builds one result object per Ward Master entry, candidates ordered by votes. */
export function buildWards(wardMaster, candidates, declaredWards = []) {
  const declared = new Set(declaredWards.map(Number))
  const byWard = new Map()
  for (const candidate of candidates) {
    const list = byWard.get(candidate.wardNo) ?? []
    list.push(candidate)
    byWard.set(candidate.wardNo, list)
  }

  return sortWards(wardMaster).map((ward) => {
    const list = byWard.get(ward.wardNo) ?? []
    const totalVotes = list.reduce((sum, c) => sum + c.totalVotes, 0)
    const sorted = [...list].sort((a, b) => b.totalVotes - a.totalVotes || a.name.localeCompare(b.name))
    // Equal votes share a position (1, 1, 3…).
    const rows = sorted.map((candidate) => ({
      ...candidate,
      position: sorted.findIndex((c) => c.totalVotes === candidate.totalVotes) + 1,
      percent: totalVotes ? (candidate.totalVotes / totalVotes) * 100 : 0,
    }))
    const isTie = rows.length > 1 && rows[0].totalVotes === rows[1].totalVotes
    const status = isTie ? 'tie' : declared.has(ward.wardNo) && rows.length ? 'declared' : 'pending'
    const winner = status === 'declared' ? rows[0] : null
    const runnerUp = winner ? rows[1] ?? null : null
    return {
      ...ward,
      rows,
      totalVotes,
      status,
      isTie,
      canDeclare: rows.length > 0 && !isTie,
      winner,
      runnerUp,
      margin: winner && runnerUp ? winner.totalVotes - runnerUp.totalVotes : null,
    }
  })
}

export function computeStats(wards) {
  return {
    wards: wards.length,
    candidates: wards.reduce((sum, w) => sum + w.rows.length, 0),
    votes: wards.reduce((sum, w) => sum + w.totalVotes, 0),
    declared: wards.filter((w) => w.status === 'declared').length,
    pending: wards.filter((w) => w.status !== 'declared').length,
  }
}

/** Every candidate row across wards (ward ascending, votes descending), with its ward's status. */
export const allCandidateRows = (wards) =>
  wards.flatMap((w) => w.rows.map((row) => ({ ...row, wardStatus: w.status, isWinner: w.winner?.id === row.id })))

/** "12", "Ward 12", "वार्ड 12" → 12; anything else → null. */
export function parseWardQuery(query) {
  const match = String(query ?? '').trim().match(/^(?:ward|वार्ड)?\s*(\d{1,6})$/i)
  return match ? Number(match[1]) : null
}

/** Case-insensitive match on candidate name or party. */
export const matchesCandidate = (candidate, query) => {
  const q = query.trim().toLowerCase()
  return !q || candidate.name.toLowerCase().includes(q) || (candidate.party ?? '').toLowerCase().includes(q)
}

const normalizeName = (name) => name.trim().replace(/\s+/g, ' ').toLowerCase()

/** Same candidate in the same ward (case/space-insensitive name). */
export const candidateKey = (r) => `${normalizeName(r.name)}|${r.wardNo}`

/**
 * Compares incoming candidate records with stored ones (and earlier rows of the same batch):
 *  - exact duplicates (same name, ward and votes) are skipped,
 *  - same name and ward with different votes are conflicts the admin must resolve,
 *  - everything else is new.
 * Existing data is never modified here.
 */
export function planImport(existing, incoming) {
  const known = new Map()
  for (const r of existing) {
    const list = known.get(candidateKey(r)) ?? []
    list.push(r)
    known.set(candidateKey(r), list)
  }
  const fresh = []
  const conflicts = []
  let duplicates = 0
  for (const record of incoming) {
    const matches = known.get(candidateKey(record)) ?? []
    if (matches.some((m) => m.totalVotes === record.totalVotes)) {
      duplicates += 1
      continue
    }
    if (matches.length) conflicts.push({ record, existing: matches[0] })
    else fresh.push(record)
    known.set(candidateKey(record), [...matches, record])
  }
  return { fresh, conflicts, duplicates }
}

const sameWard = (a, b) => a.wardName === b.wardName && a.areas === b.areas && a.totalVoters === b.totalVoters

/**
 * Compares an uploaded Ward Master with the stored one: identical wards are skipped,
 * wards whose details differ are conflicts (the admin keeps or replaces them), the rest are new.
 */
export function planWardImport(existing, incoming) {
  const byNo = new Map(existing.map((w) => [w.wardNo, w]))
  const fresh = []
  const conflicts = []
  let duplicates = 0
  for (const ward of incoming) {
    const current = byNo.get(ward.wardNo)
    if (!current) fresh.push(ward)
    else if (sameWard(current, ward)) duplicates += 1
    else conflicts.push({ record: ward, existing: current })
  }
  return { fresh, conflicts, duplicates }
}

const MAX = { name: 120, party: 80, candidateCode: 40, wardName: 120, areas: 500 }
const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

function parseWholeNumber(value) {
  const text = String(value ?? '').trim().replace(/,/g, '')
  return /^\d+$/.test(text) ? Number(text) : null
}

/**
 * Validates a manually entered candidate with the same rules the server applies to
 * spreadsheet rows. `knownWards` is the set of Ward Master numbers.
 * Returns { record } or { errors: { field: translationKey } }.
 */
export function validateCandidateInput(values, knownWards) {
  const errors = {}
  const name = clean(values.name)
  if (!name) errors.name = 'admin.manual.nameError'
  else if (name.length > MAX.name) errors.name = 'admin.manual.nameTooLong'

  const party = clean(values.party)
  if (!party) errors.party = 'admin.manual.partyError'
  else if (party.length > MAX.party) errors.party = 'admin.manual.partyTooLong'

  const wardNo = parseWholeNumber(values.wardNo)
  if (wardNo === null || wardNo < 1) errors.wardNo = 'admin.manual.wardError'
  else if (knownWards && !knownWards.has(wardNo)) errors.wardNo = 'admin.manual.wardUnknown'

  const totalVotes = parseWholeNumber(values.totalVotes)
  if (totalVotes === null) errors.totalVotes = 'admin.manual.votesError'

  const candidateCode = clean(values.candidateCode)
  if (candidateCode.length > MAX.candidateCode) errors.candidateCode = 'admin.manual.codeTooLong'

  return Object.keys(errors).length ? { errors } : { record: { name, party, wardNo, totalVotes, candidateCode: candidateCode || null } }
}

/** Validates a manually entered or edited Ward Master entry. */
export function validateWardInput(values) {
  const errors = {}
  const wardNo = parseWholeNumber(values.wardNo)
  if (String(values.wardNo ?? '').trim() === '') errors.wardNo = 'admin.wards.form.wardRequired'
  else if (wardNo === null || wardNo < 1) errors.wardNo = 'admin.wards.form.wardInvalid'

  const wardName = clean(values.wardName)
  if (wardName.length > MAX.wardName) errors.wardName = 'admin.wards.form.tooLong'
  const areas = clean(values.areas)
  if (areas.length > MAX.areas) errors.areas = 'admin.wards.form.tooLong'

  const votersText = String(values.totalVoters ?? '').trim()
  const totalVoters = votersText ? parseWholeNumber(votersText) : null
  if (votersText && totalVoters === null) errors.totalVoters = 'admin.wards.form.votersInvalid'

  return Object.keys(errors).length
    ? { errors }
    : { record: { wardNo, wardName: wardName || null, areas: areas || null, totalVoters } }
}
