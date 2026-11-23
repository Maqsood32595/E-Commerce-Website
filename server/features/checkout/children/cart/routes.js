const express = require('express');
const router = express.Router();
const db = require('../../../../db');

const FREE_SHIPPING_THRESHOLD = 5000.00; // Free express shipping above ₹5,000 in India
const STANDARD_SHIPPING_FEE = 499.00;

// POST /api/checkout/cart/create
router.post('/create', async (req, res) => {
    try {
        const { sessionId, visitorId } = req.body;
        const result = await db.query(`
            INSERT INTO carts (session_id, visitor_id, currency, status)
            VALUES ($1, $2, 'INR', 'active')
            RETURNING *;
        `, [sessionId || null, visitorId || null]);
        res.json({ success: true, slice: 'checkout.cart', cart: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

// GET /api/checkout/cart/:cartId
router.get('/:cartId', async (req, res) => {
    try {
        const { cartId } = req.params;
        const cartRes = await db.query('SELECT * FROM carts WHERE cart_id = $1', [cartId]);
        if (cartRes.rows.length === 0) return res.status(404).json({ error: 'Cart not found' });
        
        const itemsRes = await db.query('SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY created_at ASC', [cartId]);
        const cart = cartRes.rows[0];
        
        // Progress toward free shipping
        const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - Number(cart.subtotal));
        
        res.json({
            success: true,
            slice: 'checkout.cart',
            cart: {
                ...cart,
                freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
                freeShippingAchieved: Number(cart.subtotal) >= FREE_SHIPPING_THRESHOLD,
                remainingForFreeShipping,
                items: itemsRes.rows
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

// POST /api/checkout/cart/items (Add or Update Item)
router.post('/items', async (req, res) => {
    try {
        const { cartId, productId, variantId, title, colorName, size, unitPrice, quantity } = req.body;
        if (!cartId || !productId || !variantId || !unitPrice) {
            return res.status(400).json({ error: 'cartId, productId, variantId, and unitPrice are required', slice: 'checkout.cart' });
        }
        const qty = quantity || 1;
        const lineTotal = Number(unitPrice) * qty;

        // Upsert cart item
        await db.query(`
            INSERT INTO cart_items (cart_id, product_id, variant_id, title, color_name, size, unit_price, quantity, line_total)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (cart_id, variant_id) DO UPDATE SET
                quantity = cart_items.quantity + EXCLUDED.quantity,
                line_total = (cart_items.quantity + EXCLUDED.quantity) * EXCLUDED.unit_price;
        `, [cartId, productId, variantId, title || 'Activewear', colorName || 'Espresso', size || 'M', unitPrice, qty, lineTotal]);

        // Recalculate cart totals
        const sumRes = await db.query('SELECT COALESCE(SUM(line_total), 0) as subtotal FROM cart_items WHERE cart_id = $1', [cartId]);
        const subtotal = Number(sumRes.rows[0].subtotal);
        const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0.00 : (subtotal > 0 ? STANDARD_SHIPPING_FEE : 0.00);
        const grandTotal = subtotal + shippingFee;

        const updatedCart = await db.query(`
            UPDATE carts SET subtotal = $2, shipping_fee = $3, grand_total = $4, updated_at = NOW()
            WHERE cart_id = $1
            RETURNING *;
        `, [cartId, subtotal, shippingFee, grandTotal]);

        res.json({ success: true, slice: 'checkout.cart', cart: updatedCart.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

module.exports = router;
