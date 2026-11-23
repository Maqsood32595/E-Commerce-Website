const express = require('express');
const router = express.Router();
const db = require('../../../../../../db');

// GET /api/catalog/products/variants?productId=alo-w-airlift-001
router.get('/', async (req, res) => {
    try {
        const { productId } = req.query;
        let query = 'SELECT * FROM product_variants WHERE is_available = true';
        const params = [];
        if (productId) {
            query += ' AND product_id = $1';
            params.push(productId);
        }
        query += ' ORDER BY color_name, size';
        const result = await db.query(query, params);
        res.json({ success: true, slice: 'catalog.products.variants', tier: 'grandchild', variants: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products.variants' });
    }
});

// POST /api/catalog/products/variants
router.post('/', async (req, res) => {
    try {
        const { variantId, productId, sku, colorName, colorHex, size, inventoryQuantity, price, currency } = req.body;
        if (!variantId || !productId || !sku || !colorName || !size) {
            return res.status(400).json({ error: 'variantId, productId, sku, colorName, and size are required', slice: 'catalog.products.variants' });
        }
        const result = await db.query(`
            INSERT INTO product_variants
            (variant_id, product_id, sku, color_name, color_hex, size, inventory_quantity, price, currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (variant_id) DO UPDATE SET 
                inventory_quantity = EXCLUDED.inventory_quantity,
                price = EXCLUDED.price
            RETURNING *;
        `, [variantId, productId, sku, colorName, colorHex || null, size, inventoryQuantity || 0, price || 0, currency || 'INR']);
        res.json({ success: true, slice: 'catalog.products.variants', tier: 'grandchild', variant: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products.variants' });
    }
});

module.exports = router;
