import mongoose from 'mongoose'

/** Same candidate in the same ward is matched on this key (case/space-insensitive name). */
export const nameKeyOf = (name) => String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * One candidate's result in one ward. The winner is never stored: it is derived from
 * the ward's candidates when the ward is declared and whenever results are read.
 */
const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    nameKey: { type: String, required: true },
    party: { type: String, required: true, trim: true, maxlength: 80 },
    wardNo: { type: Number, required: true, min: 1, index: true },
    totalVotes: { type: Number, required: true, min: 0 },
    candidateCode: { type: String, default: null, trim: true, maxlength: 40 },
    /** Resized photo as a data URL; served separately so lists stay small. */
    image: { type: String, default: null, select: false },
    hasImage: { type: Boolean, default: false },
  },
  { timestamps: true },
)

candidateSchema.index({ wardNo: 1, nameKey: 1 })
candidateSchema.index({ name: 1 })

export const Candidate = mongoose.models.Candidate ?? mongoose.model('Candidate', candidateSchema)
