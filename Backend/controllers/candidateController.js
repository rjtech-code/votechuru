import { Ward } from '../models/Ward.js'
import { Candidate, nameKeyOf } from '../models/Candidate.js'
import { Result } from '../models/Result.js'
import { validateRecord } from '../utils/validateResults.js'
import { generateCandidateId } from '../utils/candidateId.js'
import { fail, planCandidates, reopenWards, serializeCandidate } from '../utils/results.js'
import { config } from '../config.js'

const MAX_IMPORT = 10000
const IMAGE_PATTERN = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/

const toDocument = (record) => ({ candidateId: record.candidateId, name: record.name, nameKey: nameKeyOf(record.name), party: record.party, wardNo: record.wardNo })
// The driver reports one write error as an object and several as an array.
const writeErrorsOf = (error) => [].concat(error?.writeErrors ?? [])
const isDuplicateKey = (error) => error?.code === 11000 || writeErrorsOf(error).some((e) => e.code === 11000)

/**
 * Validates candidate master records ({ name, party, wardNo }) and generates their IDs.
 * Returns { records, rejected } — a record is rejected when it is invalid, its ward is not
 * in the Ward Master or no Candidate ID can be generated for it.
 */
async function prepareCandidates(rawRecords) {
  const records = []
  const rejected = []
  const parsed = rawRecords.map((raw) => ({ raw, ...validateRecord('candidates', raw) }))
  const wardNos = [...new Set(parsed.filter((p) => p.record).map((p) => p.record.wardNo))]
  const knownWards = new Set((await Ward.find({ wardNo: { $in: wardNos } }, { wardNo: 1 }).lean()).map((w) => w.wardNo))
  for (const { raw, record, errors } of parsed) {
    const label = { name: String(raw?.name ?? ''), wardNo: raw?.wardNo ?? null }
    if (errors) {
      rejected.push({ ...label, code: 'INVALID_RECORD' })
      continue
    }
    if (!knownWards.has(record.wardNo)) {
      rejected.push({ ...label, code: 'WARD_NOT_FOUND' })
      continue
    }
    const generated = generateCandidateId(record.wardNo, record.party)
    if (generated.code) rejected.push({ ...label, code: generated.code })
    else records.push({ ...record, candidateId: generated.id })
  }
  return { records, rejected }
}

/**
 * POST /api/admin/candidates/import — { candidates: [{ name, party, wardNo }] } (after a
 * sheet preview). Existing candidates are never modified or removed; duplicates are skipped
 * and Candidate ID conflicts are reported, never saved.
 */
export async function importCandidates(req, res) {
  const { candidates } = req.body ?? {}
  if (!Array.isArray(candidates) || candidates.length > MAX_IMPORT) return fail(res, 400, 'BAD_REQUEST', 'No candidates to import.')

  const { records, rejected } = await prepareCandidates(candidates)
  const existing = await Candidate.find({ candidateId: { $in: [...new Set(records.map((r) => r.candidateId))] } }).lean()
  const plan = planCandidates(existing, records)

  let added = plan.fresh.length
  const conflicts = plan.conflicts.map((c) => ({ name: c.record.name, wardNo: c.record.wardNo, candidateId: c.record.candidateId, existing: c.existing }))
  if (plan.fresh.length) {
    try {
      await Candidate.insertMany(plan.fresh.map(toDocument), { ordered: false })
    } catch (error) {
      // Another request saved the same Candidate ID in the meantime: report, never overwrite.
      if (!isDuplicateKey(error)) throw error
      const failed = new Set(writeErrorsOf(error).map((e) => e.index ?? e.err?.index))
      added -= failed.size
      plan.fresh.filter((_, index) => failed.has(index)).forEach((r) => conflicts.push({ name: r.name, wardNo: r.wardNo, candidateId: r.candidateId, existing: null }))
    }
  }
  // A new candidate makes a declared ward's result incomplete.
  const reopened = added ? await reopenWards(plan.fresh.map((r) => r.wardNo)) : []
  return res.json({ success: true, added, duplicates: plan.duplicates.length, conflicts, rejected, reopened })
}

/** POST /api/admin/candidates — { name, party, wardNo }; the Candidate ID is generated. */
export async function createCandidate(req, res) {
  const { record, errors } = validateRecord('candidates', req.body)
  if (errors) return fail(res, 422, 'INVALID_RECORD', 'The candidate is invalid.', { errors })
  if (!(await Ward.exists({ wardNo: record.wardNo }))) return fail(res, 422, 'WARD_NOT_FOUND', 'This ward does not exist in the Ward Master Data.')
  const generated = generateCandidateId(record.wardNo, record.party)
  if (generated.code) return fail(res, 422, generated.code, 'A Candidate ID cannot be generated for this candidate.')

  const existing = await Candidate.findOne({ candidateId: generated.id }).lean()
  if (existing) {
    if (existing.nameKey === nameKeyOf(record.name)) return fail(res, 409, 'DUPLICATE_CANDIDATE', 'This candidate already exists.', { candidateId: generated.id })
    return fail(res, 409, 'CANDIDATE_ID_CONFLICT', 'The generated Candidate ID is already used by another candidate.', {
      candidateId: generated.id,
      existing: serializeCandidate(existing),
    })
  }
  let candidate
  try {
    candidate = await Candidate.create(toDocument({ ...record, candidateId: generated.id }))
  } catch (error) {
    if (isDuplicateKey(error)) return fail(res, 409, 'CANDIDATE_ID_CONFLICT', 'The generated Candidate ID is already used by another candidate.', { candidateId: generated.id })
    throw error
  }
  const reopened = await reopenWards([record.wardNo])
  return res.status(201).json({ success: true, candidate: serializeCandidate(candidate, null, { admin: true }), reopened })
}

/** DELETE /api/admin/candidates/:id — removes the candidate and its result. */
export async function deleteCandidate(req, res) {
  const candidate = await Candidate.findByIdAndDelete(req.params.id).catch(() => null)
  if (!candidate) return fail(res, 404, 'NOT_FOUND', 'Candidate not found.')
  await Result.deleteMany({ candidate: candidate._id })
  const reopened = await reopenWards([candidate.wardNo])
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
  return res.json({ success: true, candidate: serializeCandidate(candidate, null, { admin: true }) })
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

/** DELETE /api/admin/candidates — removes all candidates, their results and declarations; keeps wards and schedule. */
export async function resetCandidates(req, res) {
  const { deletedCount } = await Candidate.deleteMany({})
  await Result.deleteMany({})
  await Ward.updateMany({}, { $set: { status: 'pending', declaredAt: null } })
  return res.json({ success: true, deletedCandidates: deletedCount })
}
