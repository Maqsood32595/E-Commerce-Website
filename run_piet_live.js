const express = require('express');
const kernel = require('./server/kernel');
const http = require('http');

const app = express();
app.use(express.json());

async function runPietLive() {
    await kernel.boot(app, './features');
    const server = http.createServer(app);
    server.listen(3002, async () => {
        console.log("⚡ [PIET Twin Runner] Server live on port 3002");
        try {
            const res = await fetch('http://localhost:3002/api/admin/piet/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseUrl: 'http://localhost:3002' })
            });
            const data = await res.json();
            console.log("\n--- PIET TEST EXECUTION REPORT ---");
            console.log(`Success: ${data.success}`);
            console.log(`Passed: ${data.report.passedCount}/${data.report.totalCount}`);
            console.log("\nGate Breakdown:");
            for (const r of data.report.results) {
                const mark = r.passed ? '✅' : '❌';
                console.log(`  ${mark} [${r.gate}] ${r.name}`);
                if (r.error) console.log(`     Error: ${r.error}`);
            }

            // Verify clean database state (Zero Ghost Records)
            const db = require('./server/db');
            const checkMedia = await db.query(`SELECT count(*) FROM product_media WHERE storage_key LIKE '%piet%'`);
            const checkAdmin = await db.query(`SELECT count(*) FROM admin_users WHERE email LIKE '%piet%'`);
            console.log(`\nTeardown Invariant Verification:`);
            console.log(`  Ghost Media Records in Supabase: ${checkMedia.rows[0].count} (Expected: 0)`);
            console.log(`  Ghost Admin Records in Supabase: ${checkAdmin.rows[0].count} (Expected: 0)`);

            if (checkMedia.rows[0].count === '0' && checkAdmin.rows[0].count === '0') {
                console.log("  ✅ ZERO GHOST RECORDS CONFIRMED!");
            }
        } catch (e) {
            console.error("PIET Run Error:", e);
        } finally {
            server.close();
            process.exit(0);
        }
    });
}

runPietLive();
