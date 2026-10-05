import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { Result } from '../models/Result.js'
import { fail, rankResults, resultMap, serializeCandidate, serializeWard, wardParam } from '../utils/results.js'

/**
 * Public API. Ward details and candidate profiles are public as soon as they are uploaded.
 * Votes (and anything derived from them) are only returned for DECLARED wards; for a
 * pending ward the public sees the candidates without any result data.
 */

/** Candidates of the given wards; votes only where the ward is declared. */
async function candidatesFor(wards) {
  const wardNos = wards.map((w) => w.wardNo)
  const declared = new Set(wards.filter((w) => w.status === 'declared').map((w) => w.wardNo))
  const candidates = await Candidate.find({ wardNo: { $in: wardNos } }).lean()
  const declaredIds = candidates.filter((c) => declared.has(c.wardNo)).map((c) => c._id)
  const results = resultMap(declaredIds.length ? await Result.find({ candidate: { $in: declaredIds } }).lean() : [])
  return candidates.map((c) => serializeCandidate(c, declared.has(c.wardNo) ? results.get(String(c._id)) : null))
}

function wardResult(ward, candidates) {
  const own = candidates.filter((c) => c.wardNo === ward.wardNo)
  const withVotes = own.filter((c) => c.totalVotes != null)
  const { sorted, winner } = rankResults(withVotes)
  return {
    ...serializeWard(ward, { publicView: true }),
    candidateCount: own.length,
    totalVotes: ward.status === 'declared' ? withVotes.reduce((sum, c) => sum + c.totalVotes, 0) : null,
    winnerId: ward.status === 'declared' && winner ? winner.id : null,
    candidates: ward.status === 'declared' ? sorted : own.sort((a, b) => a.name.localeCompare(b.name)),
  }
}

/** GET /api/wards — every ward (numeric order) with its status and candidate count; no votes. */
export async function listWards(req, res) {
  const [wards, counts] = await Promise.all([Ward.find().sort({ wardNo: 1 }).lean(), Candidate.aggregate([{ $group: { _id: '$wardNo', count: { $sum: 1 } } }])])
  const countByWard = new Map(counts.map((c) => [c._id, c.count]))
  res.json({ success: true, wards: wards.map((w) => ({ ...serializeWard(w, { publicView: true }), candidateCount: countByWard.get(w.wardNo) ?? 0 })) })
}

/** GET /api/results — declared ward results only. */
export async function listResults(req, res) {
  const wards = await Ward.find({ status: 'declared' }).sort({ wardNo: 1 }).lean()
  const candidates = await candidatesFor(wards)
  res.json({ success: true, results: wards.map((w) => wardResult(w, candidates)) })
}

/** GET /api/results/:wardNo — ward details and candidates; votes and winner only once declared. */
export async function getResult(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  const ward = wardNo && (await Ward.findOne({ wardNo }).lean())
  if (!ward) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  return res.json({ success: true, result: wardResult(ward, await candidatesFor([ward])) })
}

/** GET /api/candidates — every candidate profile; `totalVotes` is null unless the ward is declared. */
export async function listCandidates(req, res) {
  const wards = await Ward.find({}, { wardNo: 1, status: 1 }).lean()
  const candidates = await candidatesFor(wards)
  candidates.sort((a, b) => a.wardNo - b.wardNo || a.name.localeCompare(b.name))
  res.json({ success: true, candidates })
}
