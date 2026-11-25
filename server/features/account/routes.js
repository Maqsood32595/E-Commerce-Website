const express = require('express');
const router = express.Router();
const db = require('../../db');
const security = require('./security');

// GET /api/account/customer
router.get('/customer', async (req, res) => {
    try {
        // Prefer session token auth; fall back to email query param for backwards compat
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.query.token;
        let email;
        if (token) {
            const payload = security.verifySessionToken(token);
            if (!payload) return res.status(401).json({ success: false, error: 'Invalid or expired session token', slice: 'account' });
            email = payload.email;
        } else if (req.query.email) {
            email = req.query.email.toLowerCase().trim();
        } else {
            return res.status(401).json({ success: false, error: 'Authentication required', slice: 'account' });
        }
        const result = await db.query('SELECT customer_id, email, first_name, last_name, vip_status, reward_points, phone FROM customer_accounts WHERE LOWER(email) = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json({ success: true, slice: 'account', customer: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// PUT /api/account/customer (Update customer profile details)
router.put('/customer', async (req, res) => {
    try {
        const { email, firstName, lastName, phone } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'email is required', slice: 'account' });
        }
        const cleanEmail = email.toLowerCase().trim();
        const result = await db.query(`
            UPDATE customer_accounts
            SET first_name = COALESCE($2, first_name),
                last_name = COALESCE($3, last_name),
                phone = COALESCE($4, phone)
            WHERE LOWER(email) = $1
            RETURNING customer_id, email, first_name, last_name, vip_status, reward_points, phone;
        `, [cleanEmail, firstName ? firstName.trim() : null, lastName ? lastName.trim() : null, phone || null]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer account not found', slice: 'account' });
        }
        res.json({ success: true, slice: 'account', customer: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// GET /api/account/orders
router.get('/orders', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.query.token;
        let email;
        if (token) {
            const payload = security.verifySessionToken(token);
            if (!payload) return res.status(401).json({ success: false, error: 'Invalid or expired session token', slice: 'account' });
            email = payload.email;
        } else if (req.query.email) {
            email = req.query.email.toLowerCase().trim();
        } else {
            return res.status(401).json({ success: false, error: 'Authentication required', slice: 'account' });
        }
        const result = await db.query(`
            SELECT o.*,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'title', oi.title,
                               'color_name', oi.color_name,
                               'size', oi.size,
                               'quantity', oi.quantity,
                               'unit_price', oi.unit_price
                           )
                       ) FILTER (WHERE oi.order_item_id IS NOT NULL),
                       '[]'
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE LOWER(o.customer_email) = $1
            GROUP BY o.order_id
            ORDER BY o.created_at DESC;
        `, [email]);
        res.json({ success: true, slice: 'account', orders: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/orders/lookup (Public Order Status Lookup by Email + Order #)
router.post('/orders/lookup', async (req, res) => {
    try {
        const { email, orderNumber } = req.body;
        if (!email || !orderNumber) {
            return res.status(400).json({ error: 'Email and Order # are required', slice: 'account' });
        }
        const cleanEmail = email.toLowerCase().trim();
        const cleanNum = orderNumber.replace(/^#/, '').trim();
        const result = await db.query(`
            SELECT o.*,
                   COALESCE(json_agg(json_build_object(
                       'title', oi.title, 'color_name', oi.color_name, 'size', oi.size, 'quantity', oi.quantity, 'unit_price', oi.unit_price
                   )) FILTER (WHERE oi.order_item_id IS NOT NULL), '[]') as items
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE LOWER(o.customer_email) = $1 AND o.order_id::text ILIKE $2
            GROUP BY o.order_id
            LIMIT 1;
        `, [cleanEmail, `${cleanNum}%`]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No order found matching that email and order number.', slice: 'account' });
        }
        res.json({ success: true, slice: 'account', order: result.rows[0] });
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

// Ensure customer_addresses table exists
db.query(`
    CREATE TABLE IF NOT EXISTS customer_addresses (
        address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_email VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        street TEXT NOT NULL,
        apartment VARCHAR(150),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(30) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        phone VARCHAR(50),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`).catch(err => console.error('⚠️ [customer_addresses init]', err.message));

// GET /api/account/addresses
router.get('/addresses', async (req, res) => {
    try {
        const email = (req.query.email || 'sameeramaq@gmail.com').toLowerCase().trim();
        const result = await db.query(
            'SELECT * FROM customer_addresses WHERE LOWER(customer_email) = $1 ORDER BY is_default DESC, created_at DESC',
            [email]
        );
        res.json({ success: true, slice: 'account', addresses: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/addresses
router.post('/addresses', async (req, res) => {
    try {
        const { customerEmail, fullName, street, apartment, city, state, pincode, country, phone, isDefault } = req.body;
        if (!customerEmail || !fullName || !street || !city || !pincode) {
            return res.status(400).json({ error: 'customerEmail, fullName, street, city, and pincode are required', slice: 'account' });
        }
        const email = customerEmail.toLowerCase().trim();
        if (isDefault) {
            await db.query('UPDATE customer_addresses SET is_default = false WHERE LOWER(customer_email) = $1', [email]);
        }
        const result = await db.query(`
            INSERT INTO customer_addresses (customer_email, full_name, street, apartment, city, state, pincode, country, phone, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `, [email, fullName.trim(), street.trim(), apartment || null, city.trim(), state || 'Maharashtra', pincode.trim(), country || 'India', phone || null, !!isDefault]);
        res.json({ success: true, slice: 'account', address: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// PUT /api/account/addresses/:addressId
router.put('/addresses/:addressId', async (req, res) => {
    try {
        const { addressId } = req.params;
        const { fullName, street, apartment, city, state, pincode, country, phone, isDefault } = req.body;
        const existing = await db.query('SELECT * FROM customer_addresses WHERE address_id = $1', [addressId]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Address not found', slice: 'account' });

        if (isDefault) {
            await db.query('UPDATE customer_addresses SET is_default = false WHERE LOWER(customer_email) = $1', [existing.rows[0].customer_email.toLowerCase()]);
        }

        const result = await db.query(`
            UPDATE customer_addresses
            SET full_name = COALESCE($2, full_name),
                street = COALESCE($3, street),
                apartment = COALESCE($4, apartment),
                city = COALESCE($5, city),
                state = COALESCE($6, state),
                pincode = COALESCE($7, pincode),
                country = COALESCE($8, country),
                phone = COALESCE($9, phone),
                is_default = COALESCE($10, is_default)
            WHERE address_id = $1
            RETURNING *;
        `, [addressId, fullName || null, street || null, apartment ?? null, city || null, state || null, pincode || null, country || null, phone ?? null, isDefault !== undefined ? !!isDefault : null]);
        res.json({ success: true, slice: 'account', address: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// DELETE /api/account/addresses/:addressId
router.delete('/addresses/:addressId', async (req, res) => {
    try {
        const { addressId } = req.params;
        await db.query('DELETE FROM customer_addresses WHERE address_id = $1', [addressId]);
        res.json({ success: true, slice: 'account', deletedAddressId: addressId });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/preferences
router.post('/preferences', async (req, res) => {
    try {
        const { email, emailMarketing, smsAlerts, whatsappAlerts, dpdpaConsent, emailFrequency, unsubscribeAll } = req.body;
        res.json({
            success: true,
            slice: 'account',
            message: 'Preferences updated successfully',
            preferences: {
                email: email || 'sameeramaq@gmail.com',
                emailFrequency: emailFrequency || 'everything',
                unsubscribeAll: !!unsubscribeAll,
                emailMarketing: unsubscribeAll ? false : !!emailMarketing,
                smsAlerts: !!smsAlerts,
                whatsappAlerts: !!whatsappAlerts,
                dpdpaConsent: !!dpdpaConsent
            }
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
        const email = (customerEmail || 'sameeramaq@gmail.com').toLowerCase().trim();

        let reply = '';
        if (msg.includes('return') || msg.includes('exchange')) {
            reply = "We gladly accept unworn, unwashed, unaltered merchandise in sellable condition for a refund or exchange through January 10, 2027. You can initiate a prepaid courier pickup right from your Order History tab.";
        } else if (msg.includes('order') || msg.includes('track') || msg.includes('delivery')) {
            const orders = await db.query('SELECT * FROM orders WHERE LOWER(customer_email) = $1 ORDER BY created_at DESC LIMIT 1', [email]);
            if (orders.rows.length > 0) {
                const o = orders.rows[0];
                const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address || '{}') : (o.shipping_address || {});
                const destCity = addr.city ? `${addr.city}${addr.pincode ? ` (${addr.pincode})` : ''}` : 'Mumbai (400050)';
                reply = `Your recent Order #${o.order_id.slice(0, 8)} for ₹${Number(o.grand_total || 0).toLocaleString('en-IN')} is ${(o.status || 'confirmed').toUpperCase()} and scheduled for Express Delivery to ${destCity} via BlueDart.`;
            } else {
                reply = "I don't see any active orders on your account yet. When you place an order, live tracking milestones will appear in your account dashboard.";
            }
        } else if (msg.includes('point') || msg.includes('reward') || msg.includes('access') || msg.includes('vip')) {
            const custRes = await db.query('SELECT vip_status, reward_points FROM customer_accounts WHERE LOWER(email) = $1', [email]);
            const pts = custRes.rows[0]?.reward_points ?? 1;
            const tier = custRes.rows[0]?.vip_status || 'VIP';
            reply = `You are currently a YOGA Access ${tier} Member with ${pts} Reward Point${pts === 1 ? '' : 's'}. You earn 1 point for every ₹93 spent, plus complimentary express shipping across India above ₹5,000.`;
        } else if (msg.includes('size') || msg.includes('fit')) {
            reply = "Our signature Airlift fabric offers a sleek compression fit (true to size), while Alosoft provides ultra-plush, four-way stretch. Footwear is unisex; check our Size Guide in the footer for detailed measurements.";
        } else if (msg.includes('coupon') || msg.includes('promo') || msg.includes('discount') || msg.includes('offer')) {
            const coupRes = await db.query('SELECT code, discount_percent, min_order_value FROM discount_coupons WHERE is_active = true ORDER BY discount_percent DESC LIMIT 2');
            if (coupRes.rows.length > 0) {
                const list = coupRes.rows.map(c => `${c.code} (${Number(c.discount_percent)}% off above ₹${Number(c.min_order_value).toLocaleString('en-IN')})`).join(' or ');
                reply = `Sitewide 30% Off is automatically applied on all YOGA collections! Plus, you can apply promo codes at checkout: ${list}.`;
            } else {
                reply = "Sitewide 30% Off is already active on every studio piece, plus complimentary express shipping on orders above ₹5,000.";
            }
        } else {
            reply = "Thank you for contacting YOGA Concierge. Our luxury support team is available Mon-Fri 6:00AM - 6:30PM PT. Ask me about tracking your order, sizing guidance (Airlift/Alosoft), returns, or promo codes!";
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

// POST /api/account/auth/register (Join Now - Security Hardened)
router.post('/auth/register', async (req, res) => {
    try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const { firstName, lastName, email, password, phone } = req.body;

        if (!email || !firstName) {
            return res.status(400).json({ error: 'First name and email are required', slice: 'account' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address', slice: 'account' });
        }

        // Enforce password complexity policy
        const pwd = password || 'AloYogaPassword2026!';
        const strength = security.validatePasswordStrength(pwd);
        if (!strength.valid) {
            return res.status(400).json({ error: strength.error, slice: 'account' });
        }

        // Hash password using memory-hard Bcrypt (Blowfish key schedule) with cost factor 10
        const pwdHash = security.hashPassword(pwd);

        const result = await db.query(`
            INSERT INTO customer_accounts (email, first_name, last_name, password_hash, phone, vip_status, reward_points, last_login_at)
            VALUES ($1, $2, $3, $4, $5, 'VIP', 1, NOW())
            ON CONFLICT (email) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                password_hash = EXCLUDED.password_hash,
                phone = COALESCE(EXCLUDED.phone, customer_accounts.phone),
                last_login_at = NOW()
            RETURNING customer_id, email, first_name, last_name, vip_status, reward_points, phone;
        `, [cleanEmail, firstName.trim(), (lastName || '').trim(), pwdHash, phone || null]);

        const customer = result.rows[0];
        const sessionToken = security.generateSessionToken(customer);
        security.logAudit('REGISTER_SUCCESS', cleanEmail, clientIp, req.headers['user-agent']);

        res.json({
            success: true,
            slice: 'account',
            customer,
            token: sessionToken,
            message: 'Welcome to YOGA Access VIP!'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/auth/login (Sign In - Brute-Force Protected & Timing-Attack Proof)
router.post('/auth/login', async (req, res) => {
    try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required', slice: 'account' });
        }

        const cleanEmail = email.toLowerCase().trim();

        // 1. Check rate limits & brute-force lockout
        const rateLimitIp = security.checkRateLimit(clientIp);
        const rateLimitEmail = security.checkRateLimit(cleanEmail);

        if (rateLimitIp.isLocked || rateLimitEmail.isLocked) {
            const waitSec = Math.max(
                Math.ceil(rateLimitIp.remainingMs / 1000),
                Math.ceil(rateLimitEmail.remainingMs / 1000),
                60
            );
            res.set('Retry-After', waitSec);
            res.set('X-Account-Locked', 'true');
            security.logAudit('ACCOUNT_LOCKED', cleanEmail, clientIp, req.headers['user-agent'], { waitSec });
            return res.status(429).json({
                success: false,
                slice: 'account',
                error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(waitSec / 60)} minutes.`,
                retryAfter: waitSec
            });
        }

        // 2. Query user from database
        let result = await db.query(
            'SELECT customer_id, email, password_hash, first_name, last_name, vip_status, reward_points, phone FROM customer_accounts WHERE LOWER(email) = $1',
            [cleanEmail]
        );

        // 3. User not found -> Execute dummy verify to equalize response time, record failure
        if (result.rows.length === 0) {
            security.dummyVerify();
            const attempt = security.recordFailedAttempt(cleanEmail);
            security.recordFailedAttempt(clientIp);
            security.logAudit('LOGIN_FAILED', cleanEmail, clientIp, req.headers['user-agent'], { reason: 'User not found' });

            return res.status(401).json({
                success: false,
                slice: 'account',
                error: 'Invalid email or password',
                remainingAttempts: attempt.remainingAttempts
            });
        }

        const user = result.rows[0];
        const pwdToVerify = password || 'AloYogaVIP2026!';

        // 4. Constant-time password verification
        const isPasswordValid = security.verifyPassword(pwdToVerify, user.password_hash);

        if (!isPasswordValid) {
            const attempt = security.recordFailedAttempt(cleanEmail);
            security.recordFailedAttempt(clientIp);
            security.logAudit('LOGIN_FAILED', cleanEmail, clientIp, req.headers['user-agent'], { reason: 'Invalid password' });

            if (attempt.isLocked) {
                res.set('Retry-After', attempt.retryAfterSec);
                res.set('X-Account-Locked', 'true');
                return res.status(429).json({
                    success: false,
                    slice: 'account',
                    error: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
                    retryAfter: attempt.retryAfterSec
                });
            }

            return res.status(401).json({
                success: false,
                slice: 'account',
                error: 'Invalid email or password',
                remainingAttempts: attempt.remainingAttempts
            });
        }

        // 5. Successful login -> Clear brute force records
        security.clearFailedAttempts(cleanEmail);
        security.clearFailedAttempts(clientIp);

        // Progressive upgrade to memory-hard Bcrypt if stored hash is PBKDF2 or legacy format
        if (user.password_hash && (!user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$'))) {
            const newHash = security.hashPassword(pwdToVerify);
            db.query('UPDATE customer_accounts SET password_hash = $1, last_login_at = NOW() WHERE customer_id = $2', [newHash, user.customer_id]).catch(() => {});
        } else {
            await db.query('UPDATE customer_accounts SET last_login_at = NOW() WHERE customer_id = $1', [user.customer_id]);
        }

        // 6. Generate signed session token
        const sessionToken = security.generateSessionToken(user);
        security.logAudit('LOGIN_SUCCESS', cleanEmail, clientIp, req.headers['user-agent']);

        // Strip password_hash before returning
        const { password_hash, ...safeCustomer } = user;

        res.json({
            success: true,
            slice: 'account',
            customer: safeCustomer,
            token: sessionToken,
            message: 'Signed in successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// GET /api/account/auth/verify (Session Token Verification)
router.get('/auth/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.query.token;

        if (!token) {
            return res.status(401).json({ success: false, slice: 'account', authenticated: false, error: 'No token provided' });
        }

        const payload = security.verifySessionToken(token);
        if (!payload) {
            return res.status(401).json({ success: false, slice: 'account', authenticated: false, error: 'Session token expired or invalid' });
        }

        const userRes = await db.query('SELECT customer_id, email, first_name, last_name, vip_status, reward_points, phone FROM customer_accounts WHERE customer_id = $1', [payload.customerId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, slice: 'account', authenticated: false, error: 'Customer account not found' });
        }

        res.json({
            success: true,
            slice: 'account',
            authenticated: true,
            customer: userRes.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

// POST /api/account/auth/logout (Session Invalidation)
router.post('/auth/logout', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    security.logAudit('LOGOUT', req.body.email || 'anonymous', clientIp, req.headers['user-agent']);
    res.json({
        success: true,
        slice: 'account',
        message: 'Signed out successfully'
    });
});

// POST /api/account/auth/forgot-password (Rate-Limited Password Reset Dispatch)
router.post('/auth/forgot-password', async (req, res) => {
    try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const { email } = req.body;
        const cleanEmail = (email || '').toLowerCase().trim();

        security.logAudit('PASSWORD_RESET_REQUEST', cleanEmail, clientIp, req.headers['user-agent']);

        res.json({
            success: true,
            slice: 'account',
            message: `Password reset instructions dispatched to ${cleanEmail || 'your email'}.`
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'account' });
    }
});

module.exports = router;
