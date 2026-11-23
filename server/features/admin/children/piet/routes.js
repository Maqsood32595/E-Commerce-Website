const express = require('express');
const router = express.Router();
const pietService = require('./service');

// POST /api/admin/piet/run
router.post('/run', async (req, res) => {
    try {
        const baseUrl = req.body.baseUrl || `${req.protocol}://${req.get('host')}`;
        const report = await pietService.runPreMergeTestSuite(baseUrl);
        res.json({
            success: report.allPassed,
            slice: 'admin.piet',
            report
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.piet' });
    }
});

// GET /api/admin/piet/status
router.get('/status', (req, res) => {
    res.json({
        slice: 'admin.piet',
        status: 'ready',
        description: 'Persistent In-RAM Ephemeral Twin (PIET) Zero-Mock Test Suite'
    });
});

module.exports = router;
