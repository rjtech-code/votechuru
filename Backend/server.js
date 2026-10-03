/**
 * Churu Election Results — API (Express + MongoDB via Mongoose).
 *
 * Public (read-only, declared results only):
 *   GET  /api/wards  /api/results  /api/results/:wardNo  /api/candidates  /api/candidates/:id/image  /api/settings
 * Super Admin (Bearer token):
 *   POST /api/admin/login  POST /api/admin/logout  GET /api/admin/me  GET /api/admin/data
 *   POST /api/admin/upload-wards  POST /api/admin/upload-results  (spreadsheet previews)
 *   wards, candidates, declare/reopen, settings and resets under /api/admin (see routes/admin.js)
 *
 * All configuration comes from environment variables (see .env.example).
 * Run from the Backend folder with `npm run dev` (auto-restart) or `npm start`.
 */
import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { connectDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

// Only the configured frontend origins may call the API from a browser.
app.use(
  '/api',
  cors({
    origin: (origin, callback) => callback(null, !origin || config.frontendOrigins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }),
)
// Imports and candidate photos can be larger than ordinary requests.
app.use('/api', express.json({ limit: '6mb' }))

// Make sure MongoDB is connected before handling API requests.
app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    res.status(503).json({ success: false, code: 'DATABASE_UNAVAILABLE', message: 'The database is not available.' })
  }
})

app.use('/api/admin', authRoutes)
app.use('/api/admin', uploadRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', publicRoutes)

app.use('/api', (req, res) => res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Not found.' }))

// Malformed JSON bodies and any unexpected error return JSON, never a stack trace.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.parse.failed') return res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Request failed.' })
  if (error.type === 'entity.too.large') return res.status(413).json({ success: false, code: 'TOO_LARGE', message: 'The request is too large.' })
  console.error(error)
  return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Request failed.' })
})

// Serverless hosts import the app; elsewhere start a normal HTTP server.
if (!process.env.VERCEL) {
  connectDatabase()
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.error('MongoDB connection failed:', error.message))
  const server = app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`))
  server.on('error', (error) => {
    if (error.code !== 'EADDRINUSE') throw error
    console.error(`Port ${config.port} is already in use — another backend server is probably still running. Stop it, or set a different PORT in Backend/.env.`)
    process.exit(1)
  })
}

export default app
