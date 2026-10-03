import { Ward } from '../models/Ward.js'
import { Candidate, nameKeyOf } from '../models/Candidate.js'
import { validateRecord } from '../utils/validateResults.js'
import { fail, planCandidates, reopenWards, serializeCandidate } from '../utils/results.js'
import { config } from '../config.js'

const MAX_IMPORT = 10000
const IMAGE_PATTERN = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/

const toDocument = (record) => ({ ...record, nameKey: nameKeyOf(record.name) })

/**
 * POST /api/admin/candidates/import — { candidates, conflictResolution: 'keep' | 'add' }.
 * Re-validates every record and its ward, skips exact duplicates and only adds conflicting
 * records when the admin chose 'add'. Existing records are never modified.
 */
export async function importCandidates(req, res) {
  const { candidates, conflictResolution = 'keep' } = req.body ?? {}
  if (!Array.isArray(candidates) || candidates.length > MAX_IMPORT) return fail(res, 400, 'BAD_REQUEST', 'No candidates to import.')

  const records = []
  for (const [index, raw] of candidates.entries()) {
    const { record, errors } = validateRecord('candidates', raw)
    if (errors) return fail(res, 422, 'INVALID_RECORD', `Candidate record ${index + 1} is invalid.`, { errors })
    records.push(record)
  }

  const knownWards = new Set((await Ward.find({ wardNo: { $in: [...new Set(records.map((r) => r.wardNo))] } }, { wardNo: 1 }).lean()).map((w) => w.wardNo))
  const rejected = records.filter((r) => !knownWards.has(r.wardNo)).map((r) => ({ name: r.name, wardNo: r.wardNo, code: 'WARD_NOT_FOUND' }))
  const valid = records.filter((r) => knownWards.has(r.wardNo))

  const existing = await Candidate.find({ wardNo: { $in: [...knownWards] } }).lean()
  const plan = planCandidates(existing, valid)
  const add = conflictResolution === 'add'
  const toInsert = add ? [...plan.fresh, ...plan.conflicts.map((c) => c.record)] : plan.fresh
  if (toInsert.length) await Candidate.insertMany(toInsert.map(toDocument))
  const reopened = await reopenWards(toInsert.map((r) => r.wardNo))

  return res.json({
    success: true,
    added: toInsert.length,
    duplicates: plan.duplicates,
    conflictsKept: add ? 0 : plan.conflicts.length,
    rejected,
    reopened,
  })
}

/** POST /api/admin/candidates — { ...candidate, onConflict?: 'add' }. */
export async function createCandidate(req, res) {
  const { record, errors } = validateRecord('candidates', req.body)
  if (errors) return fail(res, 422, 'INVALID_RECORD', 'The candidate is invalid.', { errors })
  if (!(await Ward.exists({ wardNo: record.wardNo }))) return fail(res, 422, 'WARD_NOT_FOUND', 'This ward does not exist in the Ward Master Data.')

  const sameCandidate = await Candidate.find({ wardNo: record.wardNo, nameKey: nameKeyOf(record.name) }).lean()
  if (sameCandidate.some((c) => c.totalVotes === record.totalVotes)) return fail(res, 409, 'DUPLICATE_RECORD', 'Duplicate record skipped.')
  if (sameCandidate.length && req.body.onConflict !== 'add') {
    return fail(res, 409, 'CONFLICT', 'This candidate already exists for the ward with a different vote count.', { existing: serializeCandidate(sameCandidate[0]) })
  }
  const candidate = await Candidate.create(toDocument(record))
  const reopened = await reopenWards([record.wardNo])
  return res.status(201).json({ success: true, candidate: serializeCandidate(candidate), reopened })
}

/** PUT /api/admin/candidates/:id */
export async function updateCandidate(req, res) {
  const candidate = await Candidate.findById(req.params.id).catch(() => null)
  if (!candidate) return fail(res, 404, 'NOT_FOUND', 'Candidate not found.')
  const { record, errors } = validateRecord('candidates', req.body)
  if (errors) return fail(res, 422, 'INVALID_RECORD', 'The candidate is invalid.', { errors })
  if (!(await Ward.exists({ wardNo: record.wardNo }))) return fail(res, 422, 'WARD_NOT_FOUND', 'This ward does not exist in the Ward Master Data.')
  const duplicate = await Candidate.exists({ _id: { $ne: candidate._id }, wardNo: record.wardNo, nameKey: nameKeyOf(record.name), totalVotes: record.totalVotes })
  if (duplicate) return fail(res, 409, 'DUPLICATE_RECORD', 'Duplicate record skipped.')

  const previousWard = candidate.wardNo
  candidate.set(toDocument(record))
  await candidate.save()
  const reopened = await reopenWards([previousWard, record.wardNo])
  return res.json({ success: true, candidate: serializeCandidate(candidate), reopened })
}

/** DELETE /api/admin/candidates/:id */
export async function deleteCandidate(req, res) {
  const candidate = await Candidate.findByIdAndDelete(req.params.id).catch(() => null)
  if (!candidate) return fail(res, 404, 'NOT_FOUND', 'Candidate not found.')
  const stillHasCandidates = await Candidate.exists({ wardNo: candidate.wardNo })
  const reopened = await reopenWards([candidate.wardNo])
  if (!stillHasCandidates) await Ward.updateOne({ wardNo: candidate.wardNo }, { $set: { status: 'pending', declaredAt: null } })
  return res.json({ success: true, reopened })
}

/** PUT /api/admin/candidates/:id/image — { image: dataURL | null }. Does not change result data. */
export async function setCandidateImage(req, res) {
  const { image } = req.body ?? {}
  let update = { image: null, hasImage: false }
  if (image !== null) {
    const match = typeof image === 'string' && image.match(IMAGE_PATTERN)
    if (!match) return fail(res, 422, 'IMAGE_INVALID', 'Only JPEG, PNG or WebP images are accepted.')
    if (Buffer.byteLength(match[2], 'base64') > config.maxImageBytes) return fail(res, 413, 'IMAGE_TOO_LARGE', 'The image is too large.')
    update = { image, hasImage: true }
  }
  const candidate = await Candidate.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).catch(() => null)
  if (!candidate) return fail(res, 404, 'NOT_FOUND', 'Candidate not found.')
  return res.json({ success: true, candidate: serializeCandidate(candidate) })
}

/** GET /api/candidates/:id/image — public photo (served separately to keep lists small). */
export async function getCandidateImage(req, res) {
  const candidate = await Candidate.findById(req.params.id, { image: 1 }).select('+image').lean().catch(() => null)
  const match = candidate?.image?.match(IMAGE_PATTERN)
  if (!match) return fail(res, 404, 'NOT_FOUND', 'Image not found.')
  res.set('Content-Type', `image/${match[1]}`)
  res.set('Cache-Control', 'public, max-age=86400') // URLs carry a version parameter
  return res.send(Buffer.from(match[2], 'base64'))
}

/** DELETE /api/admin/results — removes all candidates and declarations; keeps wards and schedule. */
export async function resetResults(req, res) {
  const { deletedCount } = await Candidate.deleteMany({})
  await Ward.updateMany({}, { $set: { status: 'pending', declaredAt: null } })
  return res.json({ success: true, deletedCandidates: deletedCount })
}
