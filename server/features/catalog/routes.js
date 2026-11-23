const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/catalog/menu
router.get('/menu', async (req, res) => {
    try {
        const sectionsRes = await db.query('SELECT * FROM menu_sections WHERE is_active = true ORDER BY display_order ASC');
        const categoriesRes = await db.query('SELECT * FROM categories WHERE is_active = true ORDER BY display_order ASC');

        const menu = sectionsRes.rows.map(sec => ({
            sectionId: sec.section_id,
            title: sec.title,
            categories: categoriesRes.rows.filter(c => c.section_id === sec.section_id)
        }));

        res.json({ success: true, slice: 'catalog', menu });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

// GET /api/catalog/categories
router.get('/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories WHERE is_active = true ORDER BY name ASC');
        res.json({ success: true, slice: 'catalog', categories: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

// POST /api/catalog/categories
router.post('/categories', async (req, res) => {
    try {
        const { categoryId, name, handle, description } = req.body;
        if (!categoryId || !name || !handle) {
            return res.status(400).json({ error: 'categoryId, name, and handle are required', slice: 'catalog' });
        }
        const result = await db.query(`
            INSERT INTO categories (category_id, name, handle, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (category_id) DO UPDATE SET name = EXCLUDED.name, handle = EXCLUDED.handle
            RETURNING *;
        `, [categoryId, name, handle, description || null]);
        res.json({ success: true, slice: 'catalog', category: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

module.exports = router;
