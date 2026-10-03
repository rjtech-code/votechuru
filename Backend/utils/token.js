import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'

/**
 * Stateless signed session tokens: base64url(payload).base64url(HMAC-SHA256).
 * They survive restarts and work across multiple server instances. Logged-out tokens
 * are remembered until they expire (best effort, per instance).
 */
const revoked = new Map() // token id → expiry

const encode = (value) => Buffer.from(value).toString('base64url')
const sign = (data) => createHmac('sha256', config.sessionSecret).update(data).digest('base64url')

export function createToken(user) {
  const payload = { sub: user.email, role: user.role, jti: randomBytes(12).toString('hex'), exp: Date.now() + config.sessionTtlMs }
  const data = encode(JSON.stringify(payload))
  return `${data}.${sign(data)}`
}

/** Returns the payload of a valid, unexpired, unrevoked token, or null. */
export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [data, signature] = token.split('.')
  const expected = Buffer.from(sign(data))
  const given = Buffer.from(signature ?? '')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  let payload
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!payload?.exp || payload.exp < Date.now() || revoked.has(payload.jti)) return null
  return payload
}

export function revokeToken(token) {
  const payload = verifyToken(token)
  if (!payload) return
  revoked.set(payload.jti, payload.exp)
  for (const [id, exp] of revoked) if (exp < Date.now()) revoked.delete(id)
}
