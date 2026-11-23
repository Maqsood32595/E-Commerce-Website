const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// POST /api/checkout/payments/place-order
router.post('/place-order', async (req, res) => {
    try {
        const { cartId, customerEmail, customerName, customerPhone, shippingAddress, paymentMethod } = req.body;
        if (!cartId || !customerEmail || !customerName) {
            return res.status(400).json({ error: 'cartId, customerEmail, and customerName are required', slice: 'checkout.payments' });
        }

        const cartRes = await db.query('SELECT * FROM carts WHERE cart_id = $1', [cartId]);
        if (cartRes.rows.length === 0) return res.status(404).json({ error: 'Cart not found' });
        const cart = cartRes.rows[0];

        const itemsRes = await db.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId]);
        if (itemsRes.rows.length === 0) return res.status(400).json({ error: 'Cart is empty' });

        // Create Order
        const orderRes = await db.query(`
            INSERT INTO orders (
                cart_id, customer_email, customer_name, customer_phone, shipping_address,
                subtotal, discount_total, shipping_fee, grand_total, currency, payment_method, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 'INR', $10, 'paid'
            ) RETURNING *;
        `, [
            cartId, customerEmail, customerName, customerPhone || null,
            JSON.stringify(shippingAddress || { country: 'India', city: 'Mumbai', pin: '400001' }),
            cart.subtotal, cart.discount_total, cart.shipping_fee, cart.grand_total,
            paymentMethod || 'upi'
        ]);

        const order = orderRes.rows[0];

        // Insert Order Items
        for (const item of itemsRes.rows) {
            await db.query(`
                INSERT INTO order_items (order_id, product_id, variant_id, title, color_name, size, unit_price, quantity, line_total)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [order.order_id, item.product_id, item.variant_id, item.title, item.color_name, item.size, item.unit_price, item.quantity, item.line_total]);
        }

        // Mark cart converted
        await db.query(`UPDATE carts SET status = 'converted' WHERE cart_id = $1`, [cartId]);

        res.json({
            success: true,
            slice: 'checkout.payments',
            orderId: order.order_id,
            status: 'paid',
            currency: 'INR',
            amountPaid: order.grand_total,
            paymentMethod: order.payment_method
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.payments' });
    }
});

module.exports = router;
