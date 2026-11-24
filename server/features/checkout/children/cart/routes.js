const express = require('express');
const router = express.Router();
const db = require('../../../../db');

const FREE_SHIPPING_THRESHOLD = 5000.00; // Free express shipping above ₹5,000 in India
const STANDARD_SHIPPING_FEE = 499.00;

// Helper to recalculate totals
async function recalculateCart(cartId) {
    const sumRes = await db.query('SELECT COALESCE(SUM(line_total), 0) as subtotal FROM cart_items WHERE cart_id = $1', [cartId]);
    const subtotal = Number(sumRes.rows[0].subtotal);
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0.00 : (subtotal > 0 ? STANDARD_SHIPPING_FEE : 0.00);
    const grandTotal = subtotal + shippingFee;

    const updatedCart = await db.query(`
        UPDATE carts SET subtotal = $2, shipping_fee = $3, grand_total = $4, updated_at = NOW()
        WHERE cart_id = $1
        RETURNING *;
    `, [cartId, subtotal, shippingFee, grandTotal]);
    return updatedCart.rows[0];
}

// GET /api/checkout/cart/cross-sells (Must be before /:cartId)
router.get('/cross-sells', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT product_id, title, handle, color_family, color_hex, mrp, sale_price, discount_label, image_url
            FROM products
            WHERE product_id IN (
                'u3040rg-accolade-quarter-zip-black',
                'u3040rg-accolade-quarter-zip-navy',
                'u3040rg-accolade-quarter-zip-deep-gravel',
                'u3040rg-accolade-quarter-zip-espresso',
                'u3031rg-accolade-crew-pullover-black'
            )
            ORDER BY product_id ASC;
        `);
        res.json({ success: true, slice: 'checkout.cart', crossSells: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

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

// POST /api/checkout/cart/items/update
router.post('/items/update', async (req, res) => {
    try {
        const { cartId, itemId, quantity } = req.body;
        if (!cartId || !itemId) {
            return res.status(400).json({ error: 'cartId and itemId required' });
        }
        if (Number(quantity) <= 0) {
            await db.query('DELETE FROM cart_items WHERE item_id = $1 AND cart_id = $2', [itemId, cartId]);
        } else {
            const itemRes = await db.query('SELECT unit_price FROM cart_items WHERE item_id = $1 AND cart_id = $2', [itemId, cartId]);
            if (itemRes.rows.length === 0) {
                return res.status(404).json({ error: 'Item not found in cart' });
            }
            const unitPrice = Number(itemRes.rows[0].unit_price);
            const qty = Number(quantity);
            await db.query(`
                UPDATE cart_items 
                SET quantity = $3, line_total = $4
                WHERE item_id = $1 AND cart_id = $2
            `, [itemId, cartId, qty, qty * unitPrice]);
        }
        const cart = await recalculateCart(cartId);
        res.json({ success: true, slice: 'checkout.cart', cart });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

// POST /api/checkout/cart/items/remove
router.post('/items/remove', async (req, res) => {
    try {
        const { cartId, itemId } = req.body;
        if (!cartId || !itemId) {
            return res.status(400).json({ error: 'cartId and itemId required' });
        }
        await db.query('DELETE FROM cart_items WHERE item_id = $1 AND cart_id = $2', [itemId, cartId]);
        const cart = await recalculateCart(cartId);
        res.json({ success: true, slice: 'checkout.cart', cart });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

// POST /api/checkout/cart/items/wishlist
router.post('/items/wishlist', async (req, res) => {
    try {
        const { cartId, itemId, customerEmail } = req.body;
        if (!cartId || !itemId) {
            return res.status(400).json({ error: 'cartId and itemId required' });
        }
        const itemRes = await db.query('SELECT * FROM cart_items WHERE item_id = $1 AND cart_id = $2', [itemId, cartId]);
        if (itemRes.rows.length > 0) {
            const item = itemRes.rows[0];
            await db.query(`
                INSERT INTO wishlist_items (customer_email, product_id, title, unit_price)
                VALUES ($1, $2, $3, $4)
            `, [customerEmail || 'sameeramaq@gmail.com', item.product_id, item.title, item.unit_price]);
            await db.query('DELETE FROM cart_items WHERE item_id = $1 AND cart_id = $2', [itemId, cartId]);
        }
        const cart = await recalculateCart(cartId);
        res.json({ success: true, slice: 'checkout.cart', cart, message: 'Item moved to Wishlist' });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

// POST /api/checkout/cart/items (Add or Increment Item)
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

        const cart = await recalculateCart(cartId);
        res.json({ success: true, slice: 'checkout.cart', cart });
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
        
        const itemsRes = await db.query(`
            SELECT ci.*, 
                   COALESCE(p.mrp, ci.unit_price) as mrp, 
                   p.image_url, 
                   p.discount_label, 
                   p.handle 
            FROM cart_items ci 
            LEFT JOIN products p ON ci.product_id = p.product_id 
            WHERE ci.cart_id = $1 
            ORDER BY ci.created_at ASC;
        `, [cartId]);
        const cart = cartRes.rows[0];
        
        // Progress toward free shipping
        const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - Number(cart.subtotal));
        
        // Calculate Total MRP and Total Savings
        let totalMrp = 0;
        for (const item of itemsRes.rows) {
            totalMrp += Number(item.mrp || item.unit_price) * item.quantity;
        }
        const totalSavings = Math.max(0, totalMrp - Number(cart.subtotal));
        const rewardPoints = Math.round(Number(cart.subtotal) / 93); // Alo ratio: 146 pts on ₹13,600

        // Fetch cross sells (Pairs Great With)
        const crossSellsRes = await db.query(`
            SELECT product_id, title, handle, color_family, color_hex, mrp, sale_price, discount_label, image_url
            FROM products
            WHERE product_id IN (
                'u3040rg-accolade-quarter-zip-black',
                'u3040rg-accolade-quarter-zip-navy',
                'u3040rg-accolade-quarter-zip-deep-gravel',
                'u3040rg-accolade-quarter-zip-espresso',
                'u3031rg-accolade-crew-pullover-black'
            )
            ORDER BY product_id ASC;
        `);

        res.json({
            success: true,
            slice: 'checkout.cart',
            cart: {
                ...cart,
                totalMrp,
                totalSavings,
                rewardPoints,
                freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
                freeShippingAchieved: Number(cart.subtotal) >= FREE_SHIPPING_THRESHOLD,
                remainingForFreeShipping,
                items: itemsRes.rows,
                pairsGreatWith: crossSellsRes.rows
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

// POST /api/checkout/cart/coupons/apply
router.post('/coupons/apply', async (req, res) => {
    try {
        const { cartId, couponCode } = req.body;
        if (!cartId || !couponCode) {
            return res.status(400).json({ error: 'cartId and couponCode are required', slice: 'checkout.cart' });
        }

        const coupRes = await db.query('SELECT * FROM discount_coupons WHERE code = $1 AND is_active = true', [couponCode.toUpperCase()]);
        if (coupRes.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired coupon code', slice: 'checkout.cart' });
        }
        const coupon = coupRes.rows[0];

        const cartRes = await db.query('SELECT * FROM carts WHERE cart_id = $1', [cartId]);
        if (cartRes.rows.length === 0) return res.status(404).json({ error: 'Cart not found' });
        const cart = cartRes.rows[0];

        if (Number(cart.subtotal) < Number(coupon.min_order_value)) {
            return res.status(400).json({
                error: `Minimum order value of ₹${coupon.min_order_value} required for this coupon`,
                slice: 'checkout.cart'
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
            slice: 'checkout.cart',
            cart: updated.rows[0],
            discountApplied: discountAmount
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'checkout.cart' });
    }
});

module.exports = router;
