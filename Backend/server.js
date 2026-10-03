/**
 * Churu Election Results — prototype API.
 *
 *   POST /api/admin/login            { email, password } → { token, user }
 *   POST /api/admin/logout           revokes the session token
 *   POST /api/admin/upload-results   multipart "file" + "wardNos" → validated candidate records
 *   POST /api/admin/upload-wards     multipart "file" → validated Ward Master rows
 *
 * No database: validated records are returned to the admin panel, which stores them.
 * Run from the Backend folder with `npm run dev` (auto-restart) or `npm start`.
 */
import express from 'express'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import { config } from './config.js'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))

app.use('/api/admin', authRoutes)
app.use('/api/admin', uploadRoutes)

app.use('/api', (req, res) => res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Not found.' }))

// Malformed JSON bodies and any unexpected error return JSON, never a stack trace.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error.type === 'entity.parse.failed' ? 400 : 500
  if (status === 500) console.error(error)
  res.status(status).json({ success: false, code: status === 400 ? 'BAD_REQUEST' : 'SERVER_ERROR', message: 'Request failed.' })
})

app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`))
