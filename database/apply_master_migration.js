const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMasterMigration() {
    try {
        await client.connect();
        console.log("Connected to Supabase. Executing YOGA Master Schema v3.0...");
        const sql = fs.readFileSync(path.resolve(__dirname, 'yoga_master_schema.sql'), 'utf8');
        await client.query(sql);
        console.log("✅ YOGA Master Database Schema applied successfully!");
        
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log("Active tables in Supabase:", tablesRes.rows.map(r => r.table_name));
        await client.end();
    } catch (err) {
        console.error("Migration error:", err);
        try { await client.end(); } catch (e) {}
    }
}

runMasterMigration();
