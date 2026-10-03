import { findAdminByEmail, verifyPassword } from '../utils/adminUsers.js'
import { createToken, revokeToken } from '../utils/token.js'
import { bearerToken } from '../middleware/authMiddleware.js'

/** POST /api/admin/login — { email, password } → { success, token, user } */
export function login(req, res) {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    return res.status(400).json({ success: false, code: 'MISSING_CREDENTIALS', message: 'Email and password are required.' })
  }
  const user = findAdminByEmail(email)
  // Same response for unknown email and wrong password.
  if (!verifyPassword(user, password)) {
    return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' })
  }
  return res.json({ success: true, token: createToken(user), user })
}

/** POST /api/admin/logout — revokes the current token. */
export function logout(req, res) {
  revokeToken(bearerToken(req))
  res.json({ success: true })
}

/** GET /api/admin/me — confirms the session is still valid. */
export function me(req, res) {
  res.json({ success: true, user: { email: req.admin.email, name: 'Super Admin', role: req.admin.role } })
}
