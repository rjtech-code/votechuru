import { Router } from 'express'
import { requireAdmin } from '../middleware/authMiddleware.js'
import { adminData } from '../controllers/adminController.js'
import { createWard, declareWard, deleteWard, deleteWardCandidates, importWards, reopenWard, resetWards, updateWard } from '../controllers/wardController.js'
import { createCandidate, deleteCandidate, importCandidates, resetResults, setCandidateImage, updateCandidate } from '../controllers/candidateController.js'
import { clearSchedule, setElection, setResultDeclaration } from '../controllers/settingsController.js'

/** Super Admin API — every route requires a valid session token. */
const router = Router()
router.use(requireAdmin)

router.get('/data', adminData)

router.post('/wards/import', importWards)
router.post('/wards', createWard)
router.put('/wards/:wardNo', updateWard)
router.delete('/wards/:wardNo/candidates', deleteWardCandidates)
router.delete('/wards/:wardNo', deleteWard)
router.delete('/wards', resetWards)
router.post('/wards/:wardNo/declare', declareWard)
router.post('/wards/:wardNo/reopen', reopenWard)

router.post('/candidates/import', importCandidates)
router.post('/candidates', createCandidate)
router.put('/candidates/:id/image', setCandidateImage)
router.put('/candidates/:id', updateCandidate)
router.delete('/candidates/:id', deleteCandidate)
router.delete('/results', resetResults)

router.put('/settings/election', setElection)
router.put('/settings/result-declaration', setResultDeclaration)
router.delete('/settings', clearSchedule)

export default router
