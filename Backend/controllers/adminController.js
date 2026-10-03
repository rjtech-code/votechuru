import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { getSettings } from '../models/ElectionSettings.js'
import { serializeCandidate, serializeWard } from '../utils/results.js'
import { serializeSettings } from './settingsController.js'

/** GET /api/admin/data — everything the admin panel needs, including pending (unpublished) results. */
export async function adminData(req, res) {
  const [wards, candidates, settings] = await Promise.all([Ward.find().sort({ wardNo: 1 }).lean(), Candidate.find().sort({ wardNo: 1, totalVotes: -1 }).lean(), getSettings()])
  res.json({ success: true, wards: wards.map(serializeWard), candidates: candidates.map(serializeCandidate), settings: serializeSettings(settings) })
}
