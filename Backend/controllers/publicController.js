import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { fail, rankCandidates, serializeCandidate, serializeWard, sortByWardNo, wardParam } from '../utils/results.js'

/**
 * Public API. Candidate names and votes are only returned for DECLARED wards; for a
 * pending ward the public sees only the ward details and its "pending" status.
 */

async function declaredResults(filter = {}) {
  const wards = await Ward.find({ ...filter, status: 'declared' }).lean()
  if (!wards.length) return []
  const candidates = await Candidate.find({ wardNo: { $in: wards.map((w) => w.wardNo) } }).lean()
  return wards.sort(sortByWardNo).map((ward) => {
    const own = candidates.filter((c) => c.wardNo === ward.wardNo)
    const { sorted, winner } = rankCandidates(own)
    return {
      ...serializeWard(ward),
      totalVotes: own.reduce((sum, c) => sum + c.totalVotes, 0),
      winnerId: winner ? String(winner._id) : null,
      candidates: sorted.map(serializeCandidate),
    }
  })
}

/** GET /api/wards — every ward (numeric order) with its status; no votes. */
export async function listWards(req, res) {
  const wards = await Ward.find().sort({ wardNo: 1 }).lean()
  res.json({ success: true, wards: wards.map(serializeWard) })
}

/** GET /api/results — declared ward results only. */
export async function listResults(req, res) {
  res.json({ success: true, results: await declaredResults() })
}

/** GET /api/results/:wardNo — the declared result, or the ward's pending status without votes. */
export async function getResult(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  const ward = wardNo && (await Ward.findOne({ wardNo }).lean())
  if (!ward) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  if (ward.status !== 'declared') return res.json({ success: true, result: { ...serializeWard(ward), candidates: null } })
  const [result] = await declaredResults({ wardNo })
  return res.json({ success: true, result })
}

/** GET /api/candidates — candidates of declared wards only. */
export async function listCandidates(req, res) {
  const results = await declaredResults()
  res.json({ success: true, candidates: results.flatMap((r) => r.candidates) })
}
