import { Router } from 'express'
import { getResult, listCandidates, listResults, listWards } from '../controllers/publicController.js'
import { getCandidateImage } from '../controllers/candidateController.js'
import { readSettings } from '../controllers/settingsController.js'

/** Public, read-only API. Only declared results are exposed. */
const router = Router()

router.get('/wards', listWards)
router.get('/results', listResults)
router.get('/results/:wardNo', getResult)
router.get('/candidates', listCandidates)
router.get('/candidates/:id/image', getCandidateImage)
router.get('/settings', readSettings)

export default router
