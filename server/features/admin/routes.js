const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        slice: 'admin',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
