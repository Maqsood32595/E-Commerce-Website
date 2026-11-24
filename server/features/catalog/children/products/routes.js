const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// GET /api/catalog/products
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name,
            COALESCE(
                (SELECT json_agg(DISTINCT pv.size) FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.is_available = true),
                '[]'::json
            ) as available_sizes,
            COALESCE(json_agg(DISTINCT jsonb_build_object(
                'media_id', pm.media_id,
                'cdn_url', pm.cdn_url,
                'media_type', pvm.media_type,
                'display_order', pvm.display_order
            )) FILTER (WHERE pm.media_id IS NOT NULL), '[]') as media
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

// GET /api/catalog/products/detail/:handleOrId
router.get('/detail/:handleOrId', async (req, res) => {
    try {
        const { handleOrId } = req.params;
        const prodQuery = `
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE (p.handle = $1 OR p.product_id = $1) AND p.is_active = true
            LIMIT 1;
        `;
        const prodRes = await db.query(prodQuery, [handleOrId]);
        if (prodRes.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found', slice: 'catalog.products' });
        }
        const product = prodRes.rows[0];

        // Fetch variants
        const variantsRes = await db.query(`
            SELECT * FROM product_variants
            WHERE product_id = $1 AND is_available = true
            ORDER BY size ASC;
        `, [product.product_id]);

        // Fetch reviews
        const reviewsRes = await db.query(`
            SELECT * FROM product_reviews
            WHERE product_id = $1
            ORDER BY created_at DESC;
        `, [product.product_id]);

        // Fetch similar items in category or footwear
        const similarRes = await db.query(`
            SELECT product_id, title, handle, mrp, sale_price, discount_label, image_url, color_family
            FROM products
            WHERE product_id != $1 AND (category_id = $2 OR category_id LIKE 'shoes%') AND is_active = true
            LIMIT 6;
        `, [product.product_id, product.category_id]);

        const reviewCount = reviewsRes.rows.length;
        const avgRating = reviewCount > 0
            ? Number((reviewsRes.rows.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviewCount).toFixed(1))
            : 4.8;

        res.json({
            success: true,
            slice: 'catalog.products',
            product,
            variants: variantsRes.rows,
            reviews: reviewsRes.rows,
            reviewStats: { count: reviewCount, avgRating },
            similarItems: similarRes.rows
        });
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

// GET /api/catalog/products/reviews
router.get('/reviews', async (req, res) => {
    try {
        const { productId } = req.query;
        let query = 'SELECT * FROM product_reviews';
        const params = [];
        if (productId) {
            query += ' WHERE product_id = $1';
            params.push(productId);
        }
        query += ' ORDER BY created_at DESC';
        const result = await db.query(query, params);
        res.json({ success: true, slice: 'catalog.products', reviews: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products' });
    }
});

// POST /api/catalog/products/reviews
router.post('/reviews', async (req, res) => {
    try {
        const { productId, authorName, rating, headline, comment, fitFeedback } = req.body;
        if (!productId || !authorName || !rating) {
            return res.status(400).json({ error: 'productId, authorName, and rating are required', slice: 'catalog.products' });
        }
        const result = await db.query(`
            INSERT INTO product_reviews
            (product_id, author_name, rating, headline, comment, fit_feedback)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [productId, authorName, rating, headline || null, comment || null, fitFeedback || 'True to Size']);
        res.json({ success: true, slice: 'catalog.products', review: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products' });
    }
});

// GET /api/catalog/products/variants
router.get('/variants', async (req, res) => {
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
        res.json({ success: true, slice: 'catalog.products', variants: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products' });
    }
});

// POST /api/catalog/products/variants
router.post('/variants', async (req, res) => {
    try {
        const { variantId, productId, sku, colorName, colorHex, size, inventoryQuantity, price, currency } = req.body;
        if (!variantId || !productId || !sku || !colorName || !size) {
            return res.status(400).json({ error: 'variantId, productId, sku, colorName, and size are required', slice: 'catalog.products' });
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
        res.json({ success: true, slice: 'catalog.products', variant: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products' });
    }
});

module.exports = router;
