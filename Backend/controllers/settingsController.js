import { ElectionSettings, getSettings } from '../models/ElectionSettings.js'
import { fail } from '../utils/results.js'

export const serializeSettings = (s) => ({
  electionDateTime: s?.electionDateTime ?? null,
  resultDeclarationDateTime: s?.resultDeclarationDateTime ?? null,
})

/** GET /api/settings (public) */
export async function readSettings(req, res) {
  res.json({ success: true, settings: serializeSettings(await getSettings()) })
}

/** Accepts { dateTime: ISO string | null }. */
const setField = (field) => async (req, res) => {
  const { dateTime } = req.body ?? {}
  let value = null
  if (dateTime !== null) {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : null
    if (!date || Number.isNaN(date.getTime())) return fail(res, 422, 'INVALID_DATE', 'Enter a valid date and time.')
    value = date
  }
  const settings = await ElectionSettings.findOneAndUpdate({ key: 'main' }, { $set: { [field]: value } }, { new: true, upsert: true })
  return res.json({ success: true, settings: serializeSettings(settings) })
}

/** PUT /api/admin/settings/election */
export const setElection = setField('electionDateTime')
/** PUT /api/admin/settings/result-declaration */
export const setResultDeclaration = setField('resultDeclarationDateTime')

/** DELETE /api/admin/settings — clears the election schedule. */
export async function clearSchedule(req, res) {
  const settings = await ElectionSettings.findOneAndUpdate(
    { key: 'main' },
    { $set: { electionDateTime: null, resultDeclarationDateTime: null } },
    { new: true, upsert: true },
  )
  return res.json({ success: true, settings: serializeSettings(settings) })
}
