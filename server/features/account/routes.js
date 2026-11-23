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

module.exports = router;
