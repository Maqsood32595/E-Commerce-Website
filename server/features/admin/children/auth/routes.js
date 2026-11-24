const express = require('express');
const router = express.Router();
const authService = require('./service');

// POST /api/admin/auth/seed
router.post('/seed', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        const admin = await authService.seedSuperAdmin(
            email || 'admin@alo.com',
            password || 'Oraib@59523',
            fullName || 'Alo Super Admin'
        );
        res.json({ success: true, slice: 'admin.auth', admin });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.auth' });
    }
});

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required', slice: 'admin.auth' });
        }
        const result = await authService.login(email, password, {
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        res.json({ success: true, slice: 'admin.auth', ...result });
    } catch (err) {
        res.status(401).json({ error: err.message, slice: 'admin.auth' });
    }
});

// GET /api/admin/auth/verify
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.query.token;
    const payload = authService.verifyToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, authenticated: false, error: 'Invalid or expired admin token' });
    }
    res.json({ success: true, slice: 'admin.auth', authenticated: true, admin: payload });
});

module.exports = router;
