const express = require('express');
const router = express.Router();
const transformService = require('./service');

// POST /api/admin/media/transform/presets
router.post('/presets', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'url is required', slice: 'admin.media.transformations' });
    }
    const presets = transformService.getPresets(url);
    res.json({
        success: true,
        slice: 'admin.media.transformations',
        tier: 'grandchild',
        presets
    });
});

module.exports = router;
