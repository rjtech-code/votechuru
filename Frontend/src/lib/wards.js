/**
 * Derived ward results. Nothing here is stored: winners, positions, margins and
 * statistics are always computed from the raw candidate records.
 */

/**
 * Groups records by ward and ranks candidates by votes (highest first).
 * Equal votes share a position (1, 1, 3…). If the top two are equal the ward is a
 * tie and no winner is shown.
 */
export function buildWards(records) {
  const groups = new Map()
  records.forEach((record, index) => {
    const ward = groups.get(record.wardNo) ?? { wardNo: record.wardNo, candidates: [], lastIndex: -1 }
    ward.candidates.push(record)
    ward.lastIndex = index
    groups.set(record.wardNo, ward)
  })

  return [...groups.values()]
    .map(({ wardNo, candidates, lastIndex }) => {
      const totalVotes = candidates.reduce((sum, c) => sum + c.totalVotes, 0)
      const sorted = [...candidates].sort((a, b) => b.totalVotes - a.totalVotes || a.name.localeCompare(b.name))
      const rows = sorted.map((candidate, i) => ({
        ...candidate,
        position: sorted.findIndex((c) => c.totalVotes === candidate.totalVotes) + 1,
        percent: totalVotes ? (candidate.totalVotes / totalVotes) * 100 : 0,
        rank: i,
      }))
      const isTie = rows.length > 1 && rows[0].totalVotes === rows[1].totalVotes
      const winner = isTie ? null : rows[0]
      const runnerUp = rows[1] ?? null
      return {
        wardNo,
        rows,
        totalVotes,
        winner,
        runnerUp,
        isTie,
        margin: winner && runnerUp ? winner.totalVotes - runnerUp.totalVotes : null,
        lastIndex,
      }
    })
    .sort((a, b) => a.wardNo - b.wardNo)
}

/** Portal statistics. "Declared results" = wards that have result data. */
export function computeStats(records, wards) {
  return {
    wards: wards.length,
    candidates: records.length,
    votes: records.reduce((sum, r) => sum + r.totalVotes, 0),
    declared: wards.length,
  }
}

/** Wards ordered by when their records were most recently added or changed. */
export const recentWards = (wards, limit) => [...wards].sort((a, b) => b.lastIndex - a.lastIndex).slice(0, limit)

/** Every candidate row across wards, with its ward-level position. */
export const allCandidateRows = (wards) => wards.flatMap((w) => w.rows.map((row) => ({ ...row, isWinner: w.winner?.id === row.id })))

/** "12", "Ward 12", "वार्ड 12" → 12; anything else → null. */
export function parseWardQuery(query) {
  const match = String(query ?? '').trim().match(/^(?:ward|वार्ड)?\s*(\d{1,6})$/i)
  return match ? Number(match[1]) : null
}

/** Duplicate detection key: same name (case/space-insensitive), ward and votes. */
export const recordKey = (r) => `${r.name.trim().replace(/\s+/g, ' ').toLowerCase()}|${r.wardNo}|${r.totalVotes}`

const MAX_NAME_LENGTH = 120

function parseWholeNumber(value) {
  const text = String(value ?? '').trim().replace(/,/g, '')
  return /^\d+$/.test(text) ? Number(text) : null
}

/**
 * Validates manual input with the same rules the server applies to Excel rows.
 * Returns { record } or { errors: { field: translationKey } }.
 */
export function validateResultInput(values) {
  const errors = {}
  const name = String(values.name ?? '').trim().replace(/\s+/g, ' ')
  if (!name) errors.name = 'admin.manual.nameError'
  else if (name.length > MAX_NAME_LENGTH) errors.name = 'admin.manual.nameTooLong'

  const wardNo = parseWholeNumber(values.wardNo)
  if (wardNo === null || wardNo < 1) errors.wardNo = 'admin.manual.wardError'

  const totalVotes = parseWholeNumber(values.totalVotes)
  if (totalVotes === null) errors.totalVotes = 'admin.manual.votesError'

  return Object.keys(errors).length ? { errors } : { record: { name, wardNo, totalVotes } }
}
