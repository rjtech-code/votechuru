import { Ward } from '../models/Ward.js'
import { Candidate } from '../models/Candidate.js'
import { Result } from '../models/Result.js'
import { checkResultRecord, validateRecord } from '../utils/validateResults.js'
import { fail, planResults, reopenWards, resultMap, wardParam } from '../utils/results.js'

const MAX_IMPORT = 10000

/**
 * POST /api/admin/results/import — { results: [{ candidateId, wardNo, totalVotes }], scopeWard?,
 * conflictResolution: 'keep' | 'replace' } (after a sheet preview).
 *
 * Every record is validated again against the database. New results are added; a candidate
 * whose stored votes differ is only changed when the Super Admin explicitly chose 'replace'.
 * Changing a declared ward's results returns it to Pending.
 */
export async function importResults(req, res) {
  const { results, conflictResolution = 'keep' } = req.body ?? {}
  const scopeWard = req.body?.scopeWard != null ? wardParam(req.body.scopeWard) : null
  if (!Array.isArray(results) || !results.length || results.length > MAX_IMPORT) return fail(res, 400, 'BAD_REQUEST', 'No results to import.')
  if (req.body?.scopeWard != null && !scopeWard) return fail(res, 422, 'WARD_NOT_FOUND', 'This ward does not exist.')

  const knownWards = new Set((await Ward.find({}, { wardNo: 1 }).lean()).map((w) => w.wardNo))
  const stored = await Candidate.find({ candidateId: { $type: 'string' } }, { candidateId: 1, name: 1, party: 1, wardNo: 1 }).lean()
  const candidates = new Map(stored.map((c) => [c.candidateId, c]))

  const records = []
  const rejected = []
  const seen = new Set()
  for (const raw of results) {
    const { record, errors } = validateRecord('results', raw)
    if (errors) {
      rejected.push({ candidateId: String(raw?.candidateId ?? ''), code: 'INVALID_RECORD' })
      continue
    }
    const problem = checkResultRecord(record, { candidates, knownWards, scopeWard })
    if (problem) rejected.push({ candidateId: record.candidateId, ...problem })
    else if (seen.has(record.candidateId)) rejected.push({ candidateId: record.candidateId, code: 'DUPLICATE_CANDIDATE' })
    else {
      seen.add(record.candidateId)
      records.push(record)
    }
  }

  // Re-plan against the database: it may have changed since the preview.
  const plan = planResults(resultMap(await Result.find({ candidate: { $in: records.map((r) => r.candidate) } }).lean()), records)
  const replace = conflictResolution === 'replace'
  const operations = [
    // $setOnInsert: a result created in the meantime is never overwritten.
    ...plan.fresh.map((r) => ({ updateOne: { filter: { candidate: r.candidate }, update: { $setOnInsert: { wardNo: r.wardNo, totalVotes: r.totalVotes } }, upsert: true } })),
    ...(replace ? plan.conflicts.map(({ record: r }) => ({ updateOne: { filter: { candidate: r.candidate }, update: { $set: { wardNo: r.wardNo, totalVotes: r.totalVotes } } } })) : []),
  ]
  if (operations.length) await Result.bulkWrite(operations, { ordered: true })

  const changedWards = [...plan.fresh, ...(replace ? plan.conflicts.map((c) => c.record) : [])].map((r) => r.wardNo)
  const reopened = await reopenWards(changedWards)
  return res.json({
    success: true,
    added: plan.fresh.length,
    replaced: replace ? plan.conflicts.length : 0,
    kept: replace ? 0 : plan.conflicts.length,
    duplicates: plan.duplicates.length,
    rejected,
    reopened,
  })
}

/** PUT /api/admin/results/:id — { totalVotes } for one candidate (an explicit edit). */
export async function setResult(req, res) {
  const candidate = await Candidate.findById(req.params.id).lean().catch(() => null)
  if (!candidate) return fail(res, 404, 'NOT_FOUND', 'Candidate not found.')
  const text = String(req.body?.totalVotes ?? '').trim().replace(/,/g, '')
  if (!/^\d+$/.test(text)) return fail(res, 422, 'INVALID_RECORD', 'Total Votes must be a whole number, 0 or more.')
  await Result.updateOne({ candidate: candidate._id }, { $set: { wardNo: candidate.wardNo, totalVotes: Number(text) } }, { upsert: true })
  const reopened = await reopenWards([candidate.wardNo])
  return res.json({ success: true, reopened })
}

/** DELETE /api/admin/results/:id — removes one candidate's result (the candidate stays). */
export async function deleteResult(req, res) {
  const result = await Result.findOneAndDelete({ candidate: req.params.id }).catch(() => null)
  if (!result) return fail(res, 404, 'NOT_FOUND', 'Result not found.')
  const reopened = await reopenWards([result.wardNo])
  return res.json({ success: true, reopened })
}

/** DELETE /api/admin/wards/:wardNo/results — "Delete Ward Result": candidates and the ward stay. */
export async function deleteWardResults(req, res) {
  const wardNo = wardParam(req.params.wardNo)
  if (!wardNo || !(await Ward.exists({ wardNo }))) return fail(res, 404, 'WARD_NOT_FOUND', 'This ward does not exist.')
  const { deletedCount } = await Result.deleteMany({ wardNo })
  await Ward.updateOne({ wardNo }, { $set: { status: 'pending', declaredAt: null } })
  return res.json({ success: true, deletedResults: deletedCount })
}

/** DELETE /api/admin/results — removes all results and declarations; keeps wards, candidates and schedule. */
export async function resetResults(req, res) {
  const { deletedCount } = await Result.deleteMany({})
  await Ward.updateMany({}, { $set: { status: 'pending', declaredAt: null } })
  return res.json({ success: true, deletedResults: deletedCount })
}
