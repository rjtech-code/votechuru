/**
 * Backend configuration.
 *
 * LOCAL PROTOTYPE ONLY: there is no user database yet, so the single Super Admin
 * account is read from environment variables (Backend/.env: ADMIN_EMAIL, ADMIN_PASSWORD, PORT), falling
 * back to the agreed prototype credentials. These values live only on the server and
 * are never sent to the browser. Replace with database users + hashed passwords
 * (see utils/adminUsers.js) before any real deployment.
 */
export const config = {
  port: Number(process.env.PORT) || 4000,
  admin: {
    email: (process.env.ADMIN_EMAIL || 'churu@admin.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'admin@123',
    name: 'Super Admin',
    role: 'super_admin',
  },
  sessionTtlMs: 8 * 60 * 60 * 1000, // 8 hours
  upload: {
    maxFileBytes: 5 * 1024 * 1024, // 5 MB
    maxRows: 10000,
    allowedExtensions: ['.xlsx', '.xls'],
  },
}
