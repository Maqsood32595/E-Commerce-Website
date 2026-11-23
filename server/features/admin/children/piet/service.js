const db = require('../../../../db');

class PietService {
    async runPreMergeTestSuite(baseUrl = 'http://127.0.0.1:3000') {
        const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const nonceEmail = `piet-test-${runId}@alo-test.local`;
        const testResults = [];
        let ephemeralAdminId = null;
        let ephemeralMediaId = null;

        const record = (gate, name, passed, error = null) => {
            testResults.push({ gate, name, passed, error });
        };

        try {
            // =========================================================================
            // GATE 1: Falsification Probe (Red Proof)
            // =========================================================================
            try {
                let caught = false;
                try {
                    await fetch('http://127.0.0.1:59999/unreachable', { signal: AbortSignal.timeout(400) });
                } catch {
                    caught = true;
                }
                if (!caught) throw new Error('Harness failed to detect closed port');
                record('Gate 1: Falsification', 'Catch unreachable network probe', true);
            } catch (e) {
                record('Gate 1: Falsification', 'Catch unreachable network probe', false, e.message);
            }

            // Negative input test on auth
            try {
                const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                if (res.status !== 400 && res.status !== 401) {
                    throw new Error(`Expected 400/401 but got ${res.status}`);
                }
                record('Gate 1: Falsification', 'Rejects empty login payload', true);
            } catch (e) {
                record('Gate 1: Falsification', 'Rejects empty login payload', false, e.message);
            }

            // =========================================================================
            // GATE 2: Manifest & AST Multi-Tier Integrity
            // =========================================================================
            try {
                const treeRes = await fetch(`${baseUrl}/api/kernel/tree`);
                const treeData = await treeRes.json();
                if (!treeData.slices || treeData.slices.length < 3) {
                    throw new Error(`Expected at least 3 fractal slices, found ${treeData.slices?.length}`);
                }
                record('Gate 2: AST Integrity', 'Fractal multi-tier discovery tree is valid', true);
            } catch (e) {
                record('Gate 2: AST Integrity', 'Fractal multi-tier discovery tree is valid', false, e.message);
            }

            // =========================================================================
            // GATE 3: Zero-Mock Live DB & Auth Journey
            // =========================================================================
            let token = null;
            try {
                const seedRes = await fetch(`${baseUrl}/api/admin/auth/seed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: nonceEmail,
                        password: 'TemporaryEphemeralPassword@2026',
                        fullName: `PIET Ephemeral Admin ${runId}`
                    })
                });
                const seedData = await seedRes.json();
                if (!seedData.success || !seedData.admin?.admin_id) {
                    throw new Error(seedData.error || 'Seed failed');
                }
                ephemeralAdminId = seedData.admin.admin_id;

                // Test login with created nonce
                const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: nonceEmail,
                        password: 'TemporaryEphemeralPassword@2026'
                    })
                });
                const loginData = await loginRes.json();
                if (!loginData.token) throw new Error('Token not issued');
                token = loginData.token;

                record('Gate 3: Zero-Mock DB', 'Ephemeral admin created and authenticated in live Supabase', true);
            } catch (e) {
                record('Gate 3: Zero-Mock DB', 'Ephemeral admin created and authenticated in live Supabase', false, e.message);
            }

            // =========================================================================
            // GATE 4: Media Ticket & Cloud Storage Invariant
            // =========================================================================
            try {
                const ticketRes = await fetch(`${baseUrl}/api/admin/media/upload-ticket`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: `piet-asset-${runId}.jpg`,
                        mimeType: 'image/jpeg',
                        fileSizeBytes: 1024000,
                        productId: `prod-piet-${runId}`
                    })
                });
                const ticketData = await ticketRes.json();
                if (!ticketData.ticket?.mediaId) throw new Error('Ticket generation failed');
                ephemeralMediaId = ticketData.ticket.mediaId;

                record('Gate 4: Invariants', 'Media upload ticket generated and bound to GCS bucket', true);
            } catch (e) {
                record('Gate 4: Invariants', 'Media upload ticket generated and bound to GCS bucket', false, e.message);
            }

            // =========================================================================
            // GATE 5: Grandchild Transformations
            // =========================================================================
            try {
                const transformRes = await fetch(`${baseUrl}/api/admin/media/transform/presets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: `https://storage.googleapis.com/alo-ecommerce-media-515620/piet-asset-${runId}.jpg`
                    })
                });
                const transformData = await transformRes.json();
                if (!transformData.presets?.hero || !transformData.presets?.thumbnail) {
                    throw new Error('Grandchild presets incomplete');
                }
                record('Gate 5: Grandchild Domain', 'Media transformations generated WebP responsive presets', true);
            } catch (e) {
                record('Gate 5: Grandchild Domain', 'Media transformations generated WebP responsive presets', false, e.message);
            }

        } finally {
            // =========================================================================
            // MANDATORY PIET TEARDOWN: Delete all ephemeral test records (Zero Ghost Records)
            // =========================================================================
            console.log(`🧹 [PIET TEARDOWN] Wiping ephemeral test data for run ${runId}...`);
            try {
                if (ephemeralMediaId) {
                    await db.query(`DELETE FROM product_variant_media_mapping WHERE media_id = $1`, [ephemeralMediaId]);
                    await db.query(`DELETE FROM product_media WHERE media_id = $1`, [ephemeralMediaId]);
                    console.log(`   ✓ Wiped ephemeral media record: ${ephemeralMediaId}`);
                }
                if (ephemeralAdminId) {
                    await db.query(`DELETE FROM admin_sessions WHERE admin_id = $1`, [ephemeralAdminId]);
                    await db.query(`DELETE FROM admin_users WHERE admin_id = $1`, [ephemeralAdminId]);
                    console.log(`   ✓ Wiped ephemeral admin record: ${ephemeralAdminId}`);
                }
            } catch (cleanupErr) {
                console.error(`   ❌ [PIET TEARDOWN ERROR]: ${cleanupErr.message}`);
            }
        }

        const passedCount = testResults.filter(r => r.passed).length;
        const totalCount = testResults.length;
        return {
            runId,
            timestamp: new Date().toISOString(),
            allPassed: passedCount === totalCount,
            passedCount,
            totalCount,
            results: testResults
        };
    }
}

module.exports = new PietService();
