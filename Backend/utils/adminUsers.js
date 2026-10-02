import { timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'

/**
 * Admin user lookup. Today this is a single configured Super Admin; later this module
 * becomes a database query, and verifyPassword() a bcrypt/argon2 hash comparison.
 */
export function findAdminByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (normalized !== config.admin.email) return null
  return { email: config.admin.email, name: config.admin.name, role: config.admin.role }
}

/** Constant-time comparison so response timing does not leak how much of the password matched. */
export function verifyPassword(user, password) {
  if (!user) return false
  const expected = Buffer.from(config.admin.password)
  const given = Buffer.from(String(password ?? ''))
  return given.length === expected.length && timingSafeEqual(given, expected)
}
