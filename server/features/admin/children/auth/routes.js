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
        const result = await authService.login(email, password);
        res.json({ success: true, slice: 'admin.auth', ...result });
    } catch (err) {
        res.status(401).json({ error: err.message, slice: 'admin.auth' });
    }
});

module.exports = router;
