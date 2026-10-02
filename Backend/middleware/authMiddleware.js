import { getSession } from '../utils/sessionStore.js'

export const bearerToken = (req) => {
  const header = req.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

/** Rejects requests without a valid admin session token. */
export function requireAdmin(req, res, next) {
  const session = getSession(bearerToken(req))
  if (!session) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Please sign in again.' })
  }
  req.admin = session.user
  next()
}
