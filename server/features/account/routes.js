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

// DELETE /api/account/wishlist/:id
router.delete('/wishlist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM wishlist_items WHERE id = $1', [id]);
        res.json({ success: true, slice: 'account', message: 'Item removed from wishlist' });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/gift-card/check
router.post('/gift-card/check', async (req, res) => {
    try {
        const { cardNumber } = req.body;
        if (!cardNumber || cardNumber.trim().length < 4) {
            return res.status(400).json({ error: 'Please enter a valid gift card number', slice: 'account' });
        }
        res.json({
            success: true,
            slice: 'account',
            cardNumber: cardNumber.replace(/\d(?=\d{4})/g, "*"),
            balance: 0.00,
            currency: 'INR',
            status: 'Active (Zero Balance)'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/preferences
router.post('/preferences', async (req, res) => {
    try {
        const { email, emailMarketing, smsAlerts, whatsappAlerts, dpdpaConsent } = req.body;
        res.json({
            success: true,
            slice: 'account',
            message: 'Preferences updated successfully',
            preferences: { emailMarketing: !!emailMarketing, smsAlerts: !!smsAlerts, whatsappAlerts: !!whatsappAlerts, dpdpaConsent: !!dpdpaConsent }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/support/chat (AI Assistant Support Endpoint)
router.post('/support/chat', async (req, res) => {
    try {
        const { message, customerEmail } = req.body;
        const msg = (message || '').toLowerCase();
        const email = customerEmail || 'sameeramaq@gmail.com';

        let reply = '';
        if (msg.includes('return') || msg.includes('exchange')) {
            reply = "We gladly accept unworn, unwashed, unaltered merchandise in sellable condition for a refund or exchange through January 10, 2027. You can initiate a prepaid courier pickup right from your Order History tab.";
        } else if (msg.includes('order') || msg.includes('track') || msg.includes('delivery')) {
            const orders = await db.query('SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
            if (orders.rows.length > 0) {
                const o = orders.rows[0];
                reply = `Your recent Order #${o.order_id.slice(0, 8)} for ₹${Number(o.total_amount).toLocaleString('en-IN')} is confirmed and scheduled for Express Delivery to Mumbai (400050) via BlueDart.`;
            } else {
                reply = "I don't see any active orders on your account yet. When you place an order, live tracking milestones will appear in your account dashboard.";
            }
        } else if (msg.includes('point') || msg.includes('reward') || msg.includes('access') || msg.includes('vip')) {
            reply = "You are currently a YOGA Access VIP Member with 1 Reward Point. You earn 1 point for every ₹93 spent, plus complimentary express shipping across India.";
        } else if (msg.includes('size') || msg.includes('fit')) {
            reply = "Our signature Airlift fabric offers a sleek compression fit (true to size), while Alosoft provides ultra-plush, four-way stretch. Check our Size Guide in the footer for detailed measurements.";
        } else {
            reply = "Thank you for contacting YOGA Concierge. Our luxury support team is available Mon-Fri 6:00AM - 6:30PM PT. How else may I assist you with your wardrobe today?";
        }

        res.json({
            success: true,
            slice: 'account',
            reply,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/auth/register (Join Now)
router.post('/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!email || !firstName) {
            return res.status(400).json({ error: 'First name and email are required', slice: 'account' });
        }
        const cleanEmail = email.toLowerCase().trim();
        const pwdHash = password ? `hash_${password}` : 'default_hash';

        const result = await db.query(`
            INSERT INTO customer_accounts (email, first_name, last_name, password_hash, phone, vip_status, reward_points, last_login_at)
            VALUES ($1, $2, $3, $4, $5, 'VIP', 1, NOW())
            ON CONFLICT (email) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                phone = COALESCE(EXCLUDED.phone, customer_accounts.phone),
                last_login_at = NOW()
            RETURNING customer_id, email, first_name, last_name, vip_status, reward_points, phone;
        `, [cleanEmail, firstName.trim(), (lastName || '').trim(), pwdHash, phone || null]);

        res.json({
            success: true,
            slice: 'account',
            customer: result.rows[0],
            message: 'Welcome to YOGA Access VIP!'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/auth/login (Sign In)
router.post('/auth/login', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required', slice: 'account' });
        }
        const cleanEmail = email.toLowerCase().trim();
        let result = await db.query('SELECT customer_id, email, first_name, last_name, vip_status, reward_points, phone FROM customer_accounts WHERE LOWER(email) = $1', [cleanEmail]);

        if (result.rows.length === 0) {
            // Auto-provision demo/customer account with VIP status
            const insertRes = await db.query(`
                INSERT INTO customer_accounts (email, first_name, last_name, password_hash, vip_status, reward_points, last_login_at)
                VALUES ($1, 'Sameera', 'Maqsood', 'hash_demo', 'VIP', 1, NOW())
                RETURNING customer_id, email, first_name, last_name, vip_status, reward_points, phone;
            `, [cleanEmail]);
            result = insertRes;
        } else {
            await db.query('UPDATE customer_accounts SET last_login_at = NOW() WHERE customer_id = $1', [result.rows[0].customer_id]);
        }

        res.json({
            success: true,
            slice: 'account',
            customer: result.rows[0],
            message: 'Signed in successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/auth/forgot-password
router.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        res.json({
            success: true,
            slice: 'account',
            message: `Password reset instructions dispatched to ${email || 'your email'}.`
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

module.exports = router;
