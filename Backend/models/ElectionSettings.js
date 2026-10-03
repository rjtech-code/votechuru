import mongoose from 'mongoose'

/** Single settings document holding the election schedule. */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    electionDateTime: { type: Date, default: null },
    resultDeclarationDateTime: { type: Date, default: null },
  },
  { timestamps: true },
)

export const ElectionSettings = mongoose.models.ElectionSettings ?? mongoose.model('ElectionSettings', settingsSchema)

/** Returns the settings document, creating it on first use. */
export const getSettings = () => ElectionSettings.findOneAndUpdate({ key: 'main' }, {}, { new: true, upsert: true, setDefaultsOnInsert: true })
