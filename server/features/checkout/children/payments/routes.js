const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// POST /api/checkout/payments/place-order (Transactional Checkout + Inventory Sync + Points Award)
router.post('/place-order', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { cartId, customerEmail, customerName, customerPhone, shippingAddress, paymentMethod, upiId, giftMessage } = req.body;
        if (!cartId || !customerEmail || !customerName) {
            return res.status(400).json({ error: 'cartId, customerEmail, and customerName are required', slice: 'checkout.payments' });
        }

        await client.query('BEGIN');

        const cartRes = await client.query('SELECT * FROM carts WHERE cart_id = $1', [cartId]);
        if (cartRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Cart not found' });
        }
        const cart = cartRes.rows[0];

        const itemsRes = await client.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId]);
        if (itemsRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const enrichedShipping = {
            country: 'India',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            ...(typeof shippingAddress === 'object' && shippingAddress !== null ? shippingAddress : {}),
            ...(giftMessage ? { giftMessage } : {}),
            ...(upiId ? { upiId } : {})
        };

        const orderRes = await client.query(`
            INSERT INTO orders (
                cart_id, customer_email, customer_name, customer_phone, shipping_address,
                subtotal, discount_total, shipping_fee, grand_total, currency, payment_method, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 'INR', $10, 'paid'
            ) RETURNING *;
        `, [
            cartId, customerEmail.toLowerCase().trim(), customerName.trim(), customerPhone || null,
            JSON.stringify(enrichedShipping),
            cart.subtotal, cart.discount_total, cart.shipping_fee, cart.grand_total,
            paymentMethod || 'upi'
        ]);

        const order = orderRes.rows[0];

        // Insert Order Items & Decrement Inventory
        for (const item of itemsRes.rows) {
            await client.query(`
                INSERT INTO order_items (order_id, product_id, variant_id, title, color_name, size, unit_price, quantity, line_total)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [order.order_id, item.product_id, item.variant_id, item.title, item.color_name, item.size, item.unit_price, item.quantity, item.line_total]);

            await client.query(`
                UPDATE product_variants
                SET inventory_quantity = GREATEST(0, inventory_quantity - $2)
                WHERE variant_id = $1;
            `, [item.variant_id, item.quantity]);
        }

        // Award YOGA Access points for non-fixture customer accounts
        const pointsEarned = Math.round(Number(order.grand_total) / 93);
        const cleanEmail = customerEmail.toLowerCase().trim();
        if (cleanEmail !== 'sameeramaq@gmail.com' && pointsEarned > 0) {
            await client.query(`
                UPDATE customer_accounts
                SET reward_points = reward_points + $2
                WHERE LOWER(email) = $1;
            `, [cleanEmail, pointsEarned]);
        }

        await client.query(`UPDATE carts SET status = 'converted', updated_at = NOW() WHERE cart_id = $1`, [cartId]);
        await client.query('COMMIT');

        res.json({
            success: true,
            slice: 'checkout.payments',
            orderId: order.order_id,
            status: 'paid',
            currency: 'INR',
            amountPaid: order.grand_total,
            pointsEarned,
            paymentMethod: order.payment_method
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message, slice: 'checkout.payments' });
    } finally {
        client.release();
    }
});

module.exports = router;
