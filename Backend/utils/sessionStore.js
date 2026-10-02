import { randomBytes } from 'node:crypto'
import { config } from '../config.js'

/**
 * In-memory session tokens (prototype). Sessions are lost when the server restarts,
 * which simply asks the admin to sign in again. Swap for JWT or a session store later.
 */
const sessions = new Map()

export function createSession(user) {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { user, expiresAt: Date.now() + config.sessionTtlMs })
  return token
}

export function getSession(token) {
  const session = token && sessions.get(token)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }
  return session
}

export function deleteSession(token) {
  sessions.delete(token)
}
