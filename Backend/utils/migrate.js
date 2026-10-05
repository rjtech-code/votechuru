import { Candidate } from '../models/Candidate.js'
import { Result } from '../models/Result.js'
import { generateCandidateId } from './candidateId.js'

const ignoreDuplicateKey = (error) => {
  if (error?.code !== 11000) throw error
}

/**
 * Brings data stored by earlier versions up to date. Safe to run on every start and from
 * several instances at once:
 *  1. Votes stored on candidate records (`totalVotes`) move to the Result collection.
 *  2. Candidates without a Candidate ID get one. When the generated ID is already used by
 *     another candidate (or cannot be generated) the ID stays empty and the admin panel
 *     shows it as a Candidate ID conflict — no other ID format is ever invented.
 *  3. Fields of the old format (`totalVotes`, `candidateCode`) are removed.
 */
export async function migrateLegacyData() {
  const collection = Candidate.collection

  const withVotes = await collection.find({ totalVotes: { $type: 'number' } }, { projection: { wardNo: 1, totalVotes: 1 } }).toArray()
  for (const c of withVotes) {
    await Result.updateOne({ candidate: c._id }, { $setOnInsert: { wardNo: c.wardNo, totalVotes: c.totalVotes } }, { upsert: true }).catch(ignoreDuplicateKey)
  }
  if (withVotes.length) await collection.updateMany({ _id: { $in: withVotes.map((c) => c._id) } }, { $unset: { totalVotes: '' } })
  await collection.updateMany({ candidateCode: { $exists: true } }, { $unset: { candidateCode: '' } })

  const withoutId = await collection.find({ $or: [{ candidateId: { $exists: false } }, { candidateId: null }] }).sort({ createdAt: 1, _id: 1 }).toArray()
  if (!withoutId.length) return
  const taken = new Set((await collection.find({ candidateId: { $type: 'string' } }, { projection: { candidateId: 1 } }).toArray()).map((c) => c.candidateId))
  for (const c of withoutId) {
    const { id } = generateCandidateId(c.wardNo, c.party)
    if (!id || taken.has(id)) continue
    taken.add(id)
    await collection.updateOne({ _id: c._id, $or: [{ candidateId: { $exists: false } }, { candidateId: null }] }, { $set: { candidateId: id } }).catch(ignoreDuplicateKey)
  }
}
