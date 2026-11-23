const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// POST /api/admin/bulk/categories
router.post('/categories', async (req, res) => {
    try {
        const { categories } = req.body; // array of { sectionId, name, handle, tagline }
        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: 'categories array is required', slice: 'admin.bulk' });
        }

        const inserted = [];
        for (const c of categories) {
            const catId = c.id || ('cat-' + c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            const handle = c.handle || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const result = await db.query(`
                INSERT INTO categories (category_id, section_id, name, handle, tagline)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (handle) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    section_id = EXCLUDED.section_id,
                    tagline = EXCLUDED.tagline
                RETURNING *;
            `, [catId, c.sectionId || 'clothing', c.name, handle, c.tagline || null]);
            inserted.push(result.rows[0]);
        }

        res.json({ success: true, slice: 'admin.bulk', count: inserted.length, categories: inserted });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// POST /api/admin/bulk/products
router.post('/products', async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'products array is required', slice: 'admin.bulk' });
        }

        const inserted = [];
        for (const p of products) {
            const prodId = p.id || ('prod-' + p.title.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            const handle = p.handle || p.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const result = await db.query(`
                INSERT INTO products 
                (product_id, title, handle, category_id, color_family, color_hex, mrp, sale_price, discount_label, badge_label, fabric_technology, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (product_id) DO UPDATE SET 
                    title = EXCLUDED.title,
                    mrp = EXCLUDED.mrp,
                    sale_price = EXCLUDED.sale_price
                RETURNING *;
            `, [
                prodId, p.title, handle, p.categoryId || null, p.colorFamily || 'Espresso',
                p.colorHex || '#362B28', p.mrp || 0, p.salePrice || 0, p.discountLabel || null,
                p.badgeLabel || null, p.fabricTechnology || null, p.imageUrl || null
            ]);
            inserted.push(result.rows[0]);
        }

        res.json({ success: true, slice: 'admin.bulk', count: inserted.length, products: inserted });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

module.exports = router;
