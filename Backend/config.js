import { createHash } from 'node:crypto'

/**
 * Configuration comes only from environment variables (Backend/.env locally, the
 * hosting provider's settings in production). Nothing secret is written in source code.
 */
const REQUIRED = ['MONGODB_URI', 'SUPER_ADMIN_EMAIL', 'SUPER_ADMIN_PASSWORD', 'FRONTEND_URL']

const missing = REQUIRED.filter((name) => !process.env[name]?.trim())
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}. See Backend/.env.example.`)
  process.exit(1)
}

const adminPassword = process.env.SUPER_ADMIN_PASSWORD

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI.trim(),
  /** Allowed browser origins (comma-separated in FRONTEND_URL). */
  frontendOrigins: process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, '')).filter(Boolean),
  admin: {
    email: process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase(),
    password: adminPassword,
  },
  /**
   * Signs admin session tokens. SESSION_SECRET is optional; without it a secret is
   * derived from the admin password, so changing the password signs everyone out.
   */
  sessionSecret: process.env.SESSION_SECRET?.trim() || createHash('sha256').update(`churu-session:${adminPassword}`).digest('hex'),
  sessionTtlMs: 8 * 60 * 60 * 1000, // 8 hours
  upload: {
    maxFileBytes: 5 * 1024 * 1024,
    maxRows: 10000,
    allowedExtensions: ['.xlsx', '.xls'],
  },
  maxImageBytes: 300 * 1024,
}
