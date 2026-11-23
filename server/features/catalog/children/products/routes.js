const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// GET /api/catalog/products
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name,
            COALESCE(json_agg(
                json_build_object(
                    'media_id', pm.media_id,
                    'cdn_url', pm.cdn_url,
                    'media_type', pvm.media_type,
                    'display_order', pvm.display_order
                )
            ) FILTER (WHERE pm.media_id IS NOT NULL), '[]') as media
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_variant_media_mapping pvm ON p.product_id = pvm.product_id
            LEFT JOIN product_media pm ON pvm.media_id = pm.media_id
            WHERE p.is_active = true
            GROUP BY p.product_id, c.name
            ORDER BY p.created_at DESC;
        `;
        const result = await db.query(query);
        res.json({ success: true, slice: 'catalog.products', products: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products' });
    }
});

// POST /api/catalog/products
router.post('/', async (req, res) => {
    try {
        const { productId, title, handle, description, categoryId, fabricTechnology, basePrice, currency } = req.body;
        if (!productId || !title || !handle) {
            return res.status(400).json({ error: 'productId, title, and handle are required', slice: 'catalog.products' });
        }
        const result = await db.query(`
            INSERT INTO products 
            (product_id, title, handle, description, category_id, fabric_technology, base_price, currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (product_id) DO UPDATE SET 
                title = EXCLUDED.title,
                handle = EXCLUDED.handle,
                base_price = EXCLUDED.base_price,
                updated_at = NOW()
            RETURNING *;
        `, [productId, title, handle, description || null, categoryId || null, fabricTechnology || null, basePrice || 0, currency || 'INR']);
        res.json({ success: true, slice: 'catalog.products', product: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products' });
    }
});

module.exports = router;
