import { Ward } from '../models/Ward.js'
import { nameKeyOf } from '../models/Candidate.js'

export const serializeWard = (w) => ({
  wardNo: w.wardNo,
  wardName: w.wardName ?? null,
  areas: w.areas ?? null,
  totalVoters: w.totalVoters ?? null,
  status: w.status,
  declaredAt: w.declaredAt ?? null,
})

export const serializeCandidate = (c) => ({
  id: String(c._id),
  name: c.name,
  party: c.party,
  wardNo: c.wardNo,
  totalVotes: c.totalVotes,
  candidateCode: c.candidateCode ?? null,
  hasImage: Boolean(c.hasImage),
  imageVersion: c.updatedAt ? new Date(c.updatedAt).getTime() : 0,
})

/** Highest-vote candidate, or a tie. Never picks a winner when the top votes are equal. */
export function rankCandidates(candidates) {
  const sorted = [...candidates].sort((a, b) => b.totalVotes - a.totalVotes || a.name.localeCompare(b.name))
  const isTie = sorted.length > 1 && sorted[0].totalVotes === sorted[1].totalVotes
  return { sorted, isTie, winner: sorted.length && !isTie ? sorted[0] : null }
}

export const sortByWardNo = (a, b) => a.wardNo - b.wardNo

/**
 * Returns declared wards (among `wardNos`) to Pending. Called whenever a ward's candidate
 * data changes, so a winner is only ever public for data that was declared as it stands.
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
 * Classifies incoming candidate records against stored ones (and earlier rows of the batch):
 *  - exact duplicates (same name, ward and votes) are skipped,
 *  - same name and ward with different votes are conflicts needing an explicit decision,
 *  - everything else is new. Stored data is never modified here.
 */
export function planCandidates(existing, incoming) {
  const known = new Map()
  const add = (r) => {
    const key = `${r.wardNo}|${nameKeyOf(r.name)}`
    known.set(key, [...(known.get(key) ?? []), r])
  }
  existing.forEach(add)
  const fresh = []
  const conflicts = []
  let duplicates = 0
  for (const record of incoming) {
    const matches = known.get(`${record.wardNo}|${nameKeyOf(record.name)}`) ?? []
    if (matches.some((m) => m.totalVotes === record.totalVotes)) {
      duplicates += 1
      continue
    }
    if (matches.length) conflicts.push({ record, existing: matches[0] })
    else fresh.push(record)
    add(record)
  }
  return { fresh, conflicts, duplicates }
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
