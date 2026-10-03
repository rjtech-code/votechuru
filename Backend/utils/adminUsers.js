import { timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'

/**
 * Super Admin lookup. The single account is configured with SUPER_ADMIN_EMAIL and
 * SUPER_ADMIN_PASSWORD; later this can become a database query with hashed passwords.
 */
export function findAdminByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (normalized !== config.admin.email) return null
  return { email: config.admin.email, name: 'Super Admin', role: 'super_admin' }
}

/** Constant-time comparison so response timing does not leak how much of the password matched. */
export function verifyPassword(user, password) {
  if (!user) return false
  const expected = Buffer.from(config.admin.password)
  const given = Buffer.from(String(password ?? ''))
  return given.length === expected.length && timingSafeEqual(given, expected)
}
