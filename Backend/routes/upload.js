import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { requireAdmin } from '../middleware/authMiddleware.js'
import { uploadCandidates, uploadResults, uploadWards } from '../controllers/uploadController.js'
import { config } from '../config.js'

const EXCEL_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/octet-stream', // some browsers send this for Excel files
])

class FileTypeError extends Error {}

// Files are kept in memory only long enough to parse them; nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileBytes, files: 1, fields: 5, fieldSize: 200 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    if (!config.upload.allowedExtensions.includes(extension) || !EXCEL_MIME_TYPES.has(file.mimetype)) {
      return callback(new FileTypeError('Only Excel files (.xlsx, .xls) are accepted.'))
    }
    callback(null, true)
  },
})

function receiveFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) return next()
    if (error instanceof FileTypeError) {
      return res.status(415).json({ success: false, code: 'INVALID_FILE_TYPE', message: error.message })
    }
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, code: 'FILE_TOO_LARGE', message: 'The file is larger than 5 MB.' })
    }
    return res.status(400).json({ success: false, code: 'UPLOAD_ERROR', message: 'The file could not be uploaded.' })
  })
}

const router = Router()
router.post('/upload-wards', requireAdmin, receiveFile, uploadWards)
router.post('/upload-candidates', requireAdmin, receiveFile, uploadCandidates)
router.post('/upload-results', requireAdmin, receiveFile, uploadResults)

export default router
