const crypto = require('crypto');
const authService = require('./children/auth/service');

/**
 * Admin auth middleware — checks Bearer token on every request.
 * Skips: GET /api/admin/health, POST /api/admin/auth/login, POST /api/admin/auth/seed
 * Also skips: GET /api/admin/media/file/:mediaId (public CDN proxy — images are now public GCS anyway)
 */
function adminAuth(req, res, next) {
    // Public paths — no token required
    const pub = ['/health'];
    if (pub.some(p => req.path === p)) return next();

    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.cookies?.adminToken || req.query?.adminToken;

    if (!token) {
        return res.status(401).json({ success: false, error: 'Admin authentication required', slice: 'admin' });
    }
    const payload = authService.verifyToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, error: 'Invalid or expired admin token', slice: 'admin' });
    }
    req.admin = payload;
    next();
}

module.exports = adminAuth;
