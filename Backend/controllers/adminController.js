import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { Result } from '../models/Result.js'
import { getSettings } from '../models/ElectionSettings.js'
import { resultMap, serializeCandidate, serializeWard } from '../utils/results.js'
import { serializeSettings } from './settingsController.js'

/**
 * GET /api/admin/data — everything the admin panel needs, including pending (unpublished)
 * results. Candidates carry `totalVotes` from the Result collection (null = no result yet).
 */
export async function adminData(req, res) {
  const [wards, candidates, results, settings] = await Promise.all([
    Ward.find().sort({ wardNo: 1 }).lean(),
    Candidate.find().sort({ wardNo: 1, name: 1 }).lean(),
    Result.find().lean(),
    getSettings(),
  ])
  const byCandidate = resultMap(results)
  res.json({
    success: true,
    wards: wards.map((w) => serializeWard(w)),
    candidates: candidates.map((c) => serializeCandidate(c, byCandidate.get(String(c._id)), { admin: true })),
    settings: serializeSettings(settings),
  })
}
