const express = require('express');
const router = express.Router();
const db = require('../../../../../../db');

// POST /api/checkout/cart/coupons/apply
router.post('/apply', async (req, res) => {
    try {
        const { cartId, couponCode } = req.body;
        if (!cartId || !couponCode) {
            return res.status(400).json({ error: 'cartId and couponCode are required', slice: 'checkout.cart.coupons' });
        }

        const coupRes = await db.query('SELECT * FROM discount_coupons WHERE code = $1 AND is_active = true', [couponCode.toUpperCase()]);
        if (coupRes.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired coupon code', slice: 'checkout.cart.coupons' });
        }
        const coupon = coupRes.rows[0];

        const cartRes = await db.query('SELECT * FROM carts WHERE cart_id = $1', [cartId]);
        if (cartRes.rows.length === 0) return res.status(404).json({ error: 'Cart not found' });
        const cart = cartRes.rows[0];

        if (Number(cart.subtotal) < Number(coupon.min_order_value)) {
            return res.status(400).json({
                error: `Minimum order value of ₹${coupon.min_order_value} required for this coupon`,
                slice: 'checkout.cart.coupons'
            });
        }

        // Calculate discount
        let discountAmount = 0.00;
        if (coupon.discount_percent > 0) {
            discountAmount = (Number(cart.subtotal) * Number(coupon.discount_percent)) / 100;
        } else if (coupon.discount_amount > 0) {
            discountAmount = Math.min(Number(cart.subtotal), Number(coupon.discount_amount));
        }

        const discountedSubtotal = Math.max(0, Number(cart.subtotal) - discountAmount);
        const grandTotal = discountedSubtotal + Number(cart.shipping_fee);

        const updated = await db.query(`
            UPDATE carts SET applied_coupon_code = $2, discount_total = $3, grand_total = $4, updated_at = NOW()
            WHERE cart_id = $1
            RETURNING *;
        `, [cartId, coupon.code, discountAmount, grandTotal]);

        res.json({
            success: true,
            slice: 'checkout.cart.coupons',
            tier: 'grandchild',
            cart: updated.rows[0],
            discountApplied: discountAmount
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart.coupons' });
    }
});

module.exports = router;
