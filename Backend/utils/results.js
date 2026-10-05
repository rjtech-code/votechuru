import { Ward } from '../models/Ward.js'
import { nameKeyOf } from '../models/Candidate.js'
import { generateCandidateId } from './candidateId.js'

/**
 * `publicView` withholds result-derived values (votes polled) for wards that have not
 * been declared; ward master details are always public.
 */
export const serializeWard = (w, { publicView = false } = {}) => ({
  wardNo: w.wardNo,
  wardName: w.wardName ?? null,
  areas: w.areas ?? null,
  totalVoters: w.totalVoters ?? null,
  votesPolled: publicView && w.status !== 'declared' ? null : w.votesPolled ?? null,
  status: w.status,
  declaredAt: w.declaredAt ?? null,
})

/** Why a stored candidate has no Candidate ID (only possible for migrated older records). */
function idIssueOf(c) {
  if (c.candidateId) return null
  const generated = generateCandidateId(c.wardNo, c.party)
  return generated.code ? { code: generated.code } : { code: 'ID_CONFLICT', candidateId: generated.id }
}

/** Candidate profile, plus `totalVotes` when a result is given (null = no result data). */
export const serializeCandidate = (c, result = null, { admin = false } = {}) => ({
  id: String(c._id),
  candidateId: c.candidateId ?? null,
  name: c.name,
  party: c.party,
  wardNo: c.wardNo,
  totalVotes: result ? result.totalVotes : null,
  hasImage: Boolean(c.hasImage),
  imageVersion: c.updatedAt ? new Date(c.updatedAt).getTime() : 0,
  ...(admin ? { idIssue: idIssueOf(c) } : {}),
})

/** Results keyed by candidate _id (string). */
export const resultMap = (results) => new Map(results.map((r) => [String(r.candidate), r]))

/**
 * Ranks a ward's candidates that have result data ([{ name, totalVotes }]). Never picks a
 * winner when the top vote counts are equal.
 */
export function rankResults(entries) {
  const sorted = [...entries].sort((a, b) => b.totalVotes - a.totalVotes || a.name.localeCompare(b.name))
  const isTie = sorted.length > 1 && sorted[0].totalVotes === sorted[1].totalVotes
  return { sorted, isTie, winner: sorted.length && !isTie ? sorted[0] : null }
}

export const sortByWardNo = (a, b) => a.wardNo - b.wardNo

/**
 * Returns declared wards (among `wardNos`) to Pending. Called whenever a ward's candidates
 * or results change, so a winner is only ever public for data that was declared as it stands.
 */
export async function reopenWards(wardNos) {
  const list = [...new Set(wardNos.filter((n) => Number.isInteger(n)))]
  if (!list.length) return []
  const declared = await Ward.find({ wardNo: { $in: list }, status: 'declared' }, { wardNo: 1 }).lean()
  if (!declared.length) return []
  const reopened = declared.map((w) => w.wardNo).sort((a, b) => a - b)
  await Ward.updateMany({ wardNo: { $in: reopened } }, { $set: { status: 'pending', declaredAt: null } })
  return reopened
}

/**
 * Classifies incoming candidates (each with its generated `candidateId`) against stored
 * ones and earlier records of the same batch:
 *  - same Candidate ID and same name → duplicate (skipped),
 *  - same Candidate ID, different name → Candidate ID conflict (never saved; the ID format
 *    cannot tell two such candidates apart, so the Super Admin must resolve it),
 *  - otherwise new.
 */
export function planCandidates(existing, incoming) {
  const byId = new Map(existing.filter((c) => c.candidateId).map((c) => [c.candidateId, c]))
  const fresh = []
  const duplicates = []
  const conflicts = []
  for (const record of incoming) {
    const match = byId.get(record.candidateId)
    if (!match) {
      fresh.push(record)
      byId.set(record.candidateId, { ...record, nameKey: nameKeyOf(record.name) })
    } else if ((match.nameKey ?? nameKeyOf(match.name)) === nameKeyOf(record.name)) duplicates.push(record)
    else conflicts.push({ record, existing: { candidateId: match.candidateId, name: match.name, party: match.party, wardNo: match.wardNo } })
  }
  return { fresh, duplicates, conflicts }
}

/**
 * Classifies incoming results ({ candidateId, totalVotes, candidate: _id }) against stored
 * results: same votes → duplicate, different votes → conflict (needs an explicit decision).
 */
export function planResults(storedByCandidate, incoming) {
  const fresh = []
  const duplicates = []
  const conflicts = []
  for (const record of incoming) {
    const stored = storedByCandidate.get(String(record.candidate))
    if (!stored) fresh.push(record)
    else if (stored.totalVotes === record.totalVotes) duplicates.push(record)
    else conflicts.push({ record, existingVotes: stored.totalVotes })
  }
  return { fresh, duplicates, conflicts }
}

const sameWardDetails = (a, b) => (a.wardName ?? null) === (b.wardName ?? null) && (a.areas ?? null) === (b.areas ?? null) && (a.totalVoters ?? null) === (b.totalVoters ?? null)

/** Identical wards are skipped; wards with different details are conflicts; the rest are new. */
export function planWards(existing, incoming) {
  const byNo = new Map(existing.map((w) => [w.wardNo, w]))
  const fresh = []
  const conflicts = []
  let duplicates = 0
  for (const ward of incoming) {
    const current = byNo.get(ward.wardNo)
    if (!current) fresh.push(ward)
    else if (sameWardDetails(current, ward)) duplicates += 1
    else conflicts.push({ record: ward, existing: serializeWard(current) })
  }
  return { fresh, conflicts, duplicates }
}

/** Parses a positive integer route parameter, or returns null. */
export function wardParam(value) {
  return /^\d{1,6}$/.test(String(value)) && Number(value) >= 1 ? Number(value) : null
}

export const fail = (res, status, code, message, extra = {}) => res.status(status).json({ success: false, code, message, ...extra })
