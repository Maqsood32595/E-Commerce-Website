const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/account/customer
router.get('/customer', async (req, res) => {
    try {
        const email = req.query.email || 'sameeramaq@gmail.com';
        const result = await db.query('SELECT customer_id, email, first_name, last_name, vip_status, reward_points, phone FROM customer_accounts WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json({ success: true, slice: 'account', customer: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// GET /api/account/orders
router.get('/orders', async (req, res) => {
    try {
        const email = req.query.email || 'sameeramaq@gmail.com';
        const result = await db.query('SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC', [email]);
        res.json({ success: true, slice: 'account', orders: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/wishlist/add
router.post('/wishlist/add', async (req, res) => {
    try {
        const { customerEmail, productId, title, unitPrice } = req.body;
        const result = await db.query(`
            INSERT INTO wishlist_items (customer_email, product_id, title, unit_price)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, [customerEmail || 'sameeramaq@gmail.com', productId, title || 'Activewear', unitPrice || 0.00]);
        res.json({ success: true, slice: 'account', item: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// GET /api/account/wishlist
router.get('/wishlist', async (req, res) => {
    try {
        const email = req.query.email || 'sameeramaq@gmail.com';
        const result = await db.query('SELECT * FROM wishlist_items WHERE customer_email = $1 ORDER BY created_at DESC', [email]);
        res.json({ success: true, slice: 'account', wishlist: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

module.exports = router;
