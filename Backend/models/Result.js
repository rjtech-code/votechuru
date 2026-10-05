import mongoose from 'mongoose'

/**
 * Result data: one candidate's vote count. Kept separate from the Candidate Master so a
 * candidate profile never needs votes. `wardNo` is copied from the candidate for queries.
 */
const resultSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, unique: true },
    wardNo: { type: Number, required: true, min: 1, index: true },
    totalVotes: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

export const Result = mongoose.models.Result ?? mongoose.model('Result', resultSchema)
