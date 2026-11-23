const express = require('express');
const router = express.Router();
const mediaService = require('./service');

// POST /api/admin/media/upload-ticket
router.post('/upload-ticket', async (req, res) => {
    try {
        const { filename, mimeType, fileSizeBytes, productId, variantId } = req.body;
        if (!filename || !mimeType) {
            return res.status(400).json({ error: 'filename and mimeType are required', slice: 'admin.media' });
        }
        const ticket = await mediaService.createUploadTicket(filename, mimeType, fileSizeBytes, productId, variantId);
        res.json({ success: true, slice: 'admin.media', ticket });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.media' });
    }
});

// POST /api/admin/media/confirm
router.post('/confirm', async (req, res) => {
    try {
        const { mediaId, width, height } = req.body;
        if (!mediaId) {
            return res.status(400).json({ error: 'mediaId is required', slice: 'admin.media' });
        }
        const confirmed = await mediaService.confirmUpload(mediaId, width, height);
        res.json({ success: true, slice: 'admin.media', media: confirmed });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.media' });
    }
});

module.exports = router;
