import { verifyToken } from '../utils/token.js'

export const bearerToken = (req) => {
  const header = req.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

/** Rejects requests without a valid Super Admin session token. */
export function requireAdmin(req, res, next) {
  const payload = verifyToken(bearerToken(req))
  if (!payload || payload.role !== 'super_admin') {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Please sign in again.' })
  }
  req.admin = { email: payload.sub, role: payload.role }
  next()
}

/** Simple per-IP limit for login attempts (in memory, per instance). */
export function loginRateLimit({ max = 10, windowMs = 10 * 60 * 1000 } = {}) {
  const attempts = new Map()
  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip
    const entry = attempts.get(key)
    if (!entry || entry.reset < now) attempts.set(key, { count: 1, reset: now + windowMs })
    else if (++entry.count > max) {
      return res.status(429).json({ success: false, code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Please try again later.' })
    }
    if (attempts.size > 5000) for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k)
    next()
  }
}
