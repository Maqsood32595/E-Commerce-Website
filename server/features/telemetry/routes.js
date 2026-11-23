const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        slice: 'telemetry',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
