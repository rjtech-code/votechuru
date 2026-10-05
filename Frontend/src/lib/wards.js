/**
 * Derived ward results. Winners, positions, margins and statistics are always computed
 * from the Ward Master, the candidate profiles, their results and the set of declared
 * wards — never stored, and never dependent on upload order.
 *
 * A candidate's `totalVotes` is null when no result data exists for it (always the case
 * for pending wards on the public site). Such candidates are listed without vote figures;
 * a missing result is never shown as 0 votes.
 *
 * Ward status:
 *   'declared' — declared by the Super Admin AND one candidate has the highest votes
 *   'tie'      — two or more candidates share the highest votes (no winner, result pending)
 *   'pending'  — not declared yet (includes wards without results); no winner shown
 */

const byNumber = (a, b) => Number(a.wardNo) - Number(b.wardNo)

/** Ward Master entries sorted numerically (1, 2, … 9, 10, 11 — never as strings). */
export const sortWards = (wards) => [...wards].sort(byNumber)

const hasVotes = (candidate) => candidate.totalVotes != null

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
    const withVotes = list.filter(hasVotes).sort((a, b) => b.totalVotes - a.totalVotes || a.name.localeCompare(b.name))
    const withoutVotes = list.filter((c) => !hasVotes(c)).sort((a, b) => a.name.localeCompare(b.name))
    const totalVotes = withVotes.reduce((sum, c) => sum + c.totalVotes, 0)
    const hasResults = withVotes.length > 0
    // Equal votes share a position (1, 1, 3…); candidates without results have none.
    const rows = [
      ...withVotes.map((candidate) => ({
        ...candidate,
        position: withVotes.findIndex((c) => c.totalVotes === candidate.totalVotes) + 1,
        percent: totalVotes ? (candidate.totalVotes / totalVotes) * 100 : 0,
      })),
      ...withoutVotes.map((candidate) => ({ ...candidate, position: null, percent: null })),
    ]
    const isTie = withVotes.length > 1 && withVotes[0].totalVotes === withVotes[1].totalVotes
    const status = isTie ? 'tie' : declared.has(ward.wardNo) && hasResults ? 'declared' : 'pending'
    const winner = status === 'declared' ? rows[0] : null
    const runnerUp = winner && rows[1]?.position != null ? rows[1] : null
    return {
      ...ward,
      rows,
      totalVotes: hasResults ? totalVotes : null,
      hasResults,
      resultCount: withVotes.length,
      resultsComplete: list.length > 0 && withVotes.length === list.length,
      /** Votes given: the ward-level figure when recorded, otherwise calculated from candidate results. */
      votesGiven: ward.votesPolled ?? (hasResults ? totalVotes : null),
      votesGivenCalculated: ward.votesPolled == null && hasResults,
      status,
      isTie,
      canDeclare: list.length > 0 && withVotes.length === list.length && !isTie,
      winner,
      runnerUp,
      margin: winner && runnerUp ? winner.totalVotes - runnerUp.totalVotes : null,
    }
  })
}

/** Candidates are profile records; votes are the sum of uploaded (or, publicly, declared) results. */
export function computeStats(wards) {
  return {
    wards: wards.length,
    candidates: wards.reduce((sum, w) => sum + w.rows.length, 0),
    votes: wards.reduce((sum, w) => sum + (w.totalVotes ?? 0), 0),
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

/** Case-insensitive match on candidate name, party or Candidate ID. */
export const matchesCandidate = (candidate, query) => {
  const q = query.trim().toLowerCase()
  return (
    !q ||
    candidate.name.toLowerCase().includes(q) ||
    (candidate.party ?? '').toLowerCase().includes(q) ||
    (candidate.candidateId ?? '').toLowerCase().includes(q)
  )
}

const MAX = { name: 120, party: 80, wardName: 120, areas: 500 }
const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

function parseWholeNumber(value) {
  const text = String(value ?? '').trim().replace(/,/g, '')
  return /^\d+$/.test(text) ? Number(text) : null
}

/**
 * Validates a manually added candidate profile (no votes, no Candidate ID — the server
 * generates the ID). `knownWards` is the set of Ward Master numbers.
 * Returns { record } or { errors: { field: translationKey } }.
 */
export function validateCandidateInput(values, knownWards) {
  const F = 'admin.candidates.form.'
  const errors = {}
  const name = clean(values.name)
  if (!name) errors.name = `${F}nameRequired`
  else if (name.length > MAX.name) errors.name = `${F}nameTooLong`

  const party = clean(values.party)
  if (!party) errors.party = `${F}partyRequired`
  else if (party.length > MAX.party) errors.party = `${F}partyTooLong`

  const wardNo = parseWholeNumber(values.wardNo)
  if (wardNo === null || wardNo < 1) errors.wardNo = `${F}wardRequired`
  else if (knownWards && !knownWards.has(wardNo)) errors.wardNo = `${F}wardUnknown`

  return Object.keys(errors).length ? { errors } : { record: { name, party, wardNo } }
}

/** Validates a vote count entered for one candidate's result. */
export function validateVotesInput(values) {
  const totalVotes = parseWholeNumber(values.totalVotes)
  return totalVotes === null ? { errors: { totalVotes: 'admin.results.votesError' } } : { record: { totalVotes } }
}

/** Validates a manually entered or edited Ward Master entry. Total Voters is required. */
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
  const totalVoters = parseWholeNumber(votersText)
  if (!votersText) errors.totalVoters = 'admin.wards.form.votersRequired'
  else if (totalVoters === null) errors.totalVoters = 'admin.wards.form.votersInvalid'

  return Object.keys(errors).length
    ? { errors }
    : { record: { wardNo, wardName: wardName || null, areas: areas || null, totalVoters } }
}
