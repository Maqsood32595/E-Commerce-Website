const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../../../../db');

class AdminAuthService {
    constructor() {
        this.TOKEN_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hashes admin passwords with memory-hard Bcrypt (cost factor 10).
     */
    hashPassword(password) {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    /**
     * Verifies Bcrypt hashes or legacy SHA-256 seed hashes with constant-time comparison.
     */
    verifyPassword(password, storedHash) {
        if (!password || !storedHash) return false;
        if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
            return bcrypt.compareSync(password, storedHash);
        }
        // Legacy SHA-256 verification (auto-upgraded on login)
        const legacyHash = crypto.createHash('sha256').update(password + (process.env.JWT_SECRET || 'secret')).digest('hex');
        const a = Buffer.from(legacyHash, 'utf8');
        const b = Buffer.from(storedHash, 'utf8');
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    }

    generateToken(payload) {
        const fullPayload = { ...payload, iat: Date.now(), exp: Date.now() + 86400000 };
        const dataB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
        const signature = crypto.createHmac('sha256', this.TOKEN_SECRET).update(dataB64).digest('base64url');
        return `${dataB64}.${signature}`;
    }

    verifyToken(token) {
        try {
            if (!token || typeof token !== 'string') return null;
            const parts = token.split('.');
            if (parts.length !== 2) return null;
            const [dataB64, sig] = parts;
            const expectedSig = crypto.createHmac('sha256', this.TOKEN_SECRET).update(dataB64).digest('base64url');
            const sigBuf = Buffer.from(sig);
            const expBuf = Buffer.from(expectedSig);
            if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

            const data = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));
            if (data.exp && data.exp < Date.now()) return null;
            return data;
        } catch {
            return null;
        }
    }

    async seedSuperAdmin(email, password, fullName) {
        const passwordHash = this.hashPassword(password);
        const query = `
            INSERT INTO admin_users (email, password_hash, full_name, role)
            VALUES ($1, $2, $3, 'super_admin')
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = COALESCE(EXCLUDED.full_name, admin_users.full_name)
            RETURNING admin_id, email, full_name, role;
        `;
        const res = await db.query(query, [email.toLowerCase().trim(), passwordHash, fullName]);
        return res.rows[0];
    }

    async login(email, password, metadata = {}) {
        const cleanEmail = email.toLowerCase().trim();
        const query = `
            SELECT admin_id, email, password_hash, full_name, role, is_active 
            FROM admin_users 
            WHERE LOWER(email) = $1;
        `;
        const res = await db.query(query, [cleanEmail]);
        if (res.rows.length === 0) {
            throw new Error('Invalid email or password');
        }
        const adminRow = res.rows[0];
        if (!this.verifyPassword(password, adminRow.password_hash)) {
            throw new Error('Invalid email or password');
        }
        if (!adminRow.is_active) {
            throw new Error('Admin account is deactivated');
        }

        // Progressive upgrade from legacy SHA-256 to Bcrypt
        if (!adminRow.password_hash.startsWith('$2a$') && !adminRow.password_hash.startsWith('$2b$')) {
            const upgradedHash = this.hashPassword(password);
            await db.query(`UPDATE admin_users SET password_hash = $1, last_login_at = NOW() WHERE admin_id = $2`, [upgradedHash, adminRow.admin_id]);
        } else {
            await db.query(`UPDATE admin_users SET last_login_at = NOW() WHERE admin_id = $1`, [adminRow.admin_id]);
        }

        const token = this.generateToken({
            adminId: adminRow.admin_id,
            email: adminRow.email,
            role: adminRow.role
        });

        // Persist admin session audit trail cleanly
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await db.query(`
            INSERT INTO admin_sessions (admin_id, refresh_token_hash, user_agent, ip_address, expires_at)
            VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours');
        `, [adminRow.admin_id, tokenHash, metadata.userAgent || 'YOGA-Admin', metadata.ip || '127.0.0.1']).catch(() => {});

        const { password_hash, ...admin } = adminRow;
        return { admin, token };
    }
}

module.exports = new AdminAuthService();
