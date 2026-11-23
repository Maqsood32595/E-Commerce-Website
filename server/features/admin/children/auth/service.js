const crypto = require('crypto');
const db = require('../../../../db');

class AdminAuthService {
    hashPassword(password) {
        return crypto.createHash('sha256').update(password + (process.env.JWT_SECRET || 'secret')).digest('hex');
    }

    generateToken(payload) {
        return Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })).toString('base64');
    }

    verifyToken(token) {
        try {
            const data = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
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
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING admin_id, email, full_name, role;
        `;
        const res = await db.query(query, [email, passwordHash, fullName]);
        return res.rows[0];
    }

    async login(email, password) {
        const passwordHash = this.hashPassword(password);
        const query = `
            SELECT admin_id, email, full_name, role, is_active 
            FROM admin_users 
            WHERE email = $1 AND password_hash = $2;
        `;
        const res = await db.query(query, [email, passwordHash]);
        if (res.rows.length === 0) {
            throw new Error('Invalid email or password');
        }
        const admin = res.rows[0];
        if (!admin.is_active) {
            throw new Error('Admin account is deactivated');
        }

        const token = this.generateToken({
            adminId: admin.admin_id,
            email: admin.email,
            role: admin.role
        });

        await db.query(`UPDATE admin_users SET last_login_at = NOW() WHERE admin_id = $1`, [admin.admin_id]);

        return { admin, token };
    }
}

module.exports = new AdminAuthService();
