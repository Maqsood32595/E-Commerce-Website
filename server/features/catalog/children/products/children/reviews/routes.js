const express = require('express');
const router = express.Router();
const db = require('../../../../../../db');

// GET /api/catalog/products/reviews?productId=alo-w-airlift-001
router.get('/', async (req, res) => {
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
        res.json({ success: true, slice: 'catalog.products.reviews', tier: 'grandchild', reviews: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products.reviews' });
    }
});

// POST /api/catalog/products/reviews
router.post('/', async (req, res) => {
    try {
        const { productId, authorName, rating, headline, comment, fitFeedback } = req.body;
        if (!productId || !authorName || !rating) {
            return res.status(400).json({ error: 'productId, authorName, and rating are required', slice: 'catalog.products.reviews' });
        }
        const result = await db.query(`
            INSERT INTO product_reviews
            (product_id, author_name, rating, headline, comment, fit_feedback)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [productId, authorName, rating, headline || null, comment || null, fitFeedback || 'True to Size']);
        res.json({ success: true, slice: 'catalog.products.reviews', tier: 'grandchild', review: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog.products.reviews' });
    }
});

module.exports = router;
