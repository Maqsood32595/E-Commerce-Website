const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// GET /api/catalog/cms (All pages for footer index)
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT page_id, slug, title, category_group, requires_auth FROM cms_pages WHERE is_active = true ORDER BY category_group, title');
        res.json({ success: true, slice: 'catalog.cms', pages: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.cms' });
    }
});

// GET /api/catalog/cms/page/:slug
router.get('/page/:slug(*)', async (req, res) => {
    try {
        const { slug } = req.params;
        const pageRes = await db.query('SELECT * FROM cms_pages WHERE slug = $1 AND is_active = true', [slug]);
        if (pageRes.rows.length === 0) {
            return res.status(404).json({ error: 'Page not found', slice: 'catalog.cms' });
        }
        res.json({ success: true, slice: 'catalog.cms', page: pageRes.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.cms' });
    }
});

// GET /api/catalog/cms/:slug
router.get('/:slug(*)', async (req, res) => {
    try {
        const { slug } = req.params;
        const pageRes = await db.query('SELECT * FROM cms_pages WHERE slug = $1 AND is_active = true', [slug]);
        if (pageRes.rows.length === 0) {
            return res.status(404).json({ error: 'Page not found', slice: 'catalog.cms' });
        }
        res.json({ success: true, slice: 'catalog.cms', page: pageRes.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.cms' });
    }
});

module.exports = router;

