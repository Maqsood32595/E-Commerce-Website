const express = require('express');
const router = express.Router();
const mediaService = require('./service');

// POST /api/admin/media/upload-file (Direct Binary Stream to GCS — CORS & Browser Friendly)
router.post(
    '/upload-file',
    express.raw({ type: ['image/*', 'application/octet-stream'], limit: '20mb' }),
    async (req, res) => {
        try {
            const filename = req.query.filename || `upload_${Date.now()}.jpg`;
            const productId = req.query.productId || null;
            const variantId = req.query.variantId || null;
            const mimeType = req.headers['content-type'] || 'image/jpeg';

            if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
                return res.status(400).json({ error: 'Empty image payload. Send binary file data with image/* Content-Type.', slice: 'admin.media' });
            }

            const media = await mediaService.uploadBuffer(filename, mimeType, req.body, productId, variantId);
            res.json({ success: true, slice: 'admin.media', media });
        } catch (err) {
            res.status(500).json({ error: err.message, slice: 'admin.media' });
        }
    }
);

// GET /api/admin/media/library (List uploaded GCS assets)
router.get('/library', async (req, res) => {
    try {
        const assets = await mediaService.listMedia(Number(req.query.limit) || 60);
        res.json({ success: true, slice: 'admin.media', assets });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.media' });
    }
});

// GET /api/admin/media/file/:mediaId (Authenticated GCS Stream Proxy for Storefront & Admin Previews)
router.get('/file/:mediaId', async (req, res) => {
    try {
        const mediaStream = await mediaService.getMediaStream(req.params.mediaId);
        if (!mediaStream) {
            return res.status(404).json({ error: 'Media asset not found' });
        }
        res.setHeader('Content-Type', mediaStream.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        mediaStream.stream.on('error', (err) => {
            if (!res.headersSent) res.status(404).json({ error: 'Object unavailable in GCS: ' + err.message });
        });
        mediaStream.stream.pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.media' });
    }
});

// DELETE /api/admin/media/:mediaId (Remove from GCS & DB)
router.delete('/:mediaId', async (req, res) => {
    try {
        const result = await mediaService.deleteMedia(req.params.mediaId);
        res.json({ success: true, slice: 'admin.media', ...result });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.media' });
    }
});

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

// POST /api/admin/media/transform/presets
router.post('/transform/presets', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'url is required', slice: 'admin.media' });
    }
    const presets = {
        original: url,
        hero: `${url}?w=1200&h=1600&fmt=webp&q=85`,
        catalogCard: `${url}?w=600&h=800&fmt=webp&q=80`,
        thumbnail: `${url}?w=120&h=160&fmt=webp&q=75`,
        swatch: `${url}?w=64&h=64&fmt=webp&q=70`
    };
    res.json({
        success: true,
        slice: 'admin.media',
        presets
    });
});

module.exports = router;
