import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { validateRecord } from '../utils/validateResults.js'
import { fail, planWards, rankCandidates, serializeCandidate, serializeWard, wardParam } from '../utils/results.js'

const MAX_IMPORT = 10000

/** POST /api/admin/wards/import — { wards, conflictResolution: 'keep' | 'replace' } (after a sheet preview). */
export async function importWards(req, res) {
  const { wards, conflictResolution = 'keep' } = req.body ?? {}
  if (!Array.isArray(wards) || !wards.length || wards.length > MAX_IMPORT) return fail(res, 400, 'BAD_REQUEST', 'No wards to import.')

  const records = []
  const seen = new Set()
  for (const [index, raw] of wards.entries()) {
    const { record, errors } = validateRecord('wards', raw)
    if (errors) return fail(res, 422, 'INVALID_RECORD', `Ward record ${index + 1} is invalid.`, { errors })
    if (seen.has(record.wardNo)) return fail(res, 422, 'DUPLICATE_WARD', `Ward No. ${record.wardNo} is repeated.`)
    seen.add(record.wardNo)
    records.push(record)
  }

  // Re-plan against the database: it may have changed since the preview.
  const existing = await Ward.find({ wardNo: { $in: [...seen] } }).lean()
  const plan = planWards(existing, records)
  if (plan.fresh.length) await Ward.insertMany(plan.fresh, { ordered: false })
  const replace = conflictResolution === 'replace'
  if (replace) {
    await Promise.all(
      plan.conflicts.map(({ record }) => Ward.updateOne({ wardNo: record.wardNo }, { $set: { wardName: record.wardName, areas: record.areas, totalVoters: record.totalVoters } })),
    )
  }
  return res.json({
    success: true,
    added: plan.fresh.length,
    duplicates: plan.duplicates,
    replaced: replace ? plan.conflicts.length : 0,
    kept: replace ? 0 : plan.conflicts.length,
  })
}

/** POST /api/admin/wards — add one ward. */
export async function createWard(req, res) {
  const { record, errors } = validateRecord('wards', req.body)
  if (errors) return fail(res, 422, 'INVALID_RECORD', 'The ward is invalid.', { errors })
  if (await Ward.exists({ wardNo: record.wardNo })) return fail(res, 409, 'WARD_EXISTS', 'This ward number already exists.')
  const ward = await Ward.create(record)
  return res.status(201).json({ success: true, ward: serializeWard(ward) })
}

/** PUT /api/admin/wards/:wardNo — edit details; the ward number is the identity and cannot change. */
export async function updateWard(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  const { record, errors } = validateRecord('wards', { ...req.body, wardNo })
  if (!wardNo || errors) return fail(res, 422, 'INVALID_RECORD', 'The ward is invalid.', { errors })
  const ward = await Ward.findOneAndUpdate(
    { wardNo },
    { $set: { wardName: record.wardName, areas: record.areas, totalVoters: record.totalVoters } },
    { new: true },
  )
  if (!ward) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  return res.json({ success: true, ward: serializeWard(ward) })
}

/** DELETE /api/admin/wards/:wardNo[?withCandidates=true] — never orphans candidate records silently. */
export async function deleteWard(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  if (!wardNo || !(await Ward.exists({ wardNo }))) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  const candidateCount = await Candidate.countDocuments({ wardNo })
  if (candidateCount && req.query.withCandidates !== 'true') {
    return fail(res, 409, 'WARD_HAS_CANDIDATES', 'This ward has candidate records.', { candidateCount })
  }
  await Candidate.deleteMany({ wardNo })
  await Ward.deleteOne({ wardNo })
  return res.json({ success: true, deletedCandidates: candidateCount })
}

/** DELETE /api/admin/wards/:wardNo/candidates — "Delete Ward Result": the ward stays in the Ward Master. */
export async function deleteWardCandidates(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  if (!wardNo || !(await Ward.exists({ wardNo }))) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  const { deletedCount } = await Candidate.deleteMany({ wardNo })
  await Ward.updateOne({ wardNo }, { $set: { status: 'pending', declaredAt: null } })
  return res.json({ success: true, deletedCandidates: deletedCount })
}

/**
 * POST /api/admin/wards/:wardNo/declare — the gate between private data and public results.
 * Requires an existing ward with candidates and a unique highest vote count.
 */
export async function declareWard(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  const ward = wardNo && (await Ward.findOne({ wardNo }))
  if (!ward) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  const candidates = await Candidate.find({ wardNo }).lean()
  if (!candidates.length) return fail(res, 422, 'NO_CANDIDATES', 'Result cannot be declared because the ward has no candidates.')
  const { isTie, winner } = rankCandidates(candidates)
  if (isTie) return fail(res, 409, 'TIE', 'Result cannot be declared because the ward has a tie.')
  ward.status = 'declared'
  ward.declaredAt = new Date()
  await ward.save()
  return res.json({ success: true, ward: serializeWard(ward), winner: serializeCandidate(winner) })
}

/** POST /api/admin/wards/:wardNo/reopen — back to Pending; candidate data is kept. */
export async function reopenWard(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  const ward = wardNo && (await Ward.findOne({ wardNo }))
  if (!ward) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  if (ward.status !== 'declared') return fail(res, 409, 'NOT_DECLARED', 'This ward result is not declared.')
  ward.status = 'pending'
  ward.declaredAt = null
  await ward.save()
  return res.json({ success: true, ward: serializeWard(ward) })
}

/** DELETE /api/admin/wards — reset the Ward Master; only allowed when no candidates exist. */
export async function resetWards(req, res) {
  const candidateCount = await Candidate.countDocuments()
  if (candidateCount) return fail(res, 409, 'WARD_HAS_CANDIDATES', 'Reset results before removing the ward list.', { candidateCount })
  const { deletedCount } = await Ward.deleteMany({})
  return res.json({ success: true, deletedWards: deletedCount })
}
