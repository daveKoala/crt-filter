import { Router } from 'express'
import * as scanService from './scan.service'
import { testGoogleScan, testEndpoints } from './scan.service'

const router = Router()

router.post('/scan', scanService.all)

router.get('/test-scan', async (_req, res) => {
    console.log('Test scan endpoint hit - calling googleScan directly')
    testGoogleScan()
        .then(() => console.log('Test scan completed'))
        .catch((err: unknown) => console.error('Test scan error:', err))
    res.json({ message: 'Test scan started' })
})

router.get('/test-endpoints', testEndpoints)

export default router
