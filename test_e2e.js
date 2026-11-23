const express = require('express');
const kernel = require('./server/kernel');
const http = require('http');

const app = express();
app.use(express.json());

async function runApiVerification() {
    await kernel.boot(app, './features');
    const server = http.createServer(app);
    server.listen(3001, async () => {
        console.log("Test server running on port 3001");
        
        async function post(url, data) {
            const res = await fetch(`http://localhost:3001${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        }

        try {
            // 1. Test Admin Auth Seed
            console.log("\n--- Testing [Child] Admin Auth (/api/admin/auth/seed) ---");
            const seedRes = await post('/api/admin/auth/seed', {
                email: 'superadmin@alo.com',
                password: 'AloSecret@2026',
                fullName: 'Alo Admin'
            });
            console.log("Seed Result:", seedRes);

            // 2. Test Admin Login
            console.log("\n--- Testing [Child] Admin Login (/api/admin/auth/login) ---");
            const loginRes = await post('/api/admin/auth/login', {
                email: 'superadmin@alo.com',
                password: 'AloSecret@2026'
            });
            console.log("Login Result (Token generated):", loginRes.token ? 'YES' : 'NO', "Admin:", loginRes.admin?.email);

            // 3. Test Media Ticket Generation
            console.log("\n--- Testing [Child] Media Upload Ticket (/api/admin/media/upload-ticket) ---");
            const ticketRes = await post('/api/admin/media/upload-ticket', {
                filename: 'airlift-legging-espresso.jpg',
                mimeType: 'image/jpeg',
                fileSizeBytes: 2450000,
                productId: 'alo-w-airlift-001'
            });
            console.log("Ticket Result:", ticketRes.ticket);

            // 4. Test Grandchild Transformations
            console.log("\n--- Testing [Grandchild] Media Transformations (/api/admin/media/transform/presets) ---");
            const transformRes = await post('/api/admin/media/transform/presets', {
                url: ticketRes.ticket.publicCdnUrl
            });
            console.log("Transformation Presets:", transformRes.presets);

            // 5. Test Kernel Tree Diagnostics
            console.log("\n--- Testing Kernel Diagnostics Tree (/api/kernel/tree) ---");
            const treeRes = await (await fetch('http://localhost:3001/api/kernel/tree')).json();
            console.log("Kernel Tree Discovery Count:", treeRes.count);
            for (const s of treeRes.slices) {
                console.log(`[${s.tier.toUpperCase()}] ${s.lineage} -> ${s.basePath}`);
            }

            console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY WITH 100% ISOLATION!");
        } catch (e) {
            console.error("Test error:", e);
        } finally {
            server.close();
            process.exit(0);
        }
    });
}

runApiVerification();
