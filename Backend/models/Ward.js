import mongoose from 'mongoose'

/**
 * Ward Master entry. `status` is the publication gate: candidate votes for a ward are
 * only exposed by the public API once the Super Admin has declared it.
 */
const wardSchema = new mongoose.Schema(
  {
    wardNo: { type: Number, required: true, min: 1, unique: true },
    wardName: { type: String, default: null, trim: true, maxlength: 120 },
    areas: { type: String, default: null, trim: true, maxlength: 500 },
    totalVoters: { type: Number, default: null, min: 0 },
    status: { type: String, enum: ['pending', 'declared'], default: 'pending', index: true },
    declaredAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export const Ward = mongoose.models.Ward ?? mongoose.model('Ward', wardSchema)
