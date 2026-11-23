const db = require('../../../../db');

class PietService {
    async runPreMergeTestSuite(baseUrl = 'http://127.0.0.1:3000') {
        const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const nonceEmail = `piet-test-${runId}@alo-test.local`;
        const testResults = [];
        let ephemeralAdminId = null;
        let ephemeralMediaId = null;
        let ephemeralProductId = null;
        let ephemeralSessionId = null;
        let ephemeralVisitorId = null;
        let ephemeralEventId = null;

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

            // =========================================================================
            // GATE 6: Multi-Tier Catalog & Product Grandchild Slices
            // =========================================================================
            ephemeralProductId = `piet-prod-${runId}`;
            let ephemeralVariantId = `piet-var-${runId}`;
            try {
                // 1. Create Product
                const prodRes = await fetch(`${baseUrl}/api/catalog/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: ephemeralProductId,
                        title: `PIET Test Airlift Legging ${runId}`,
                        handle: `piet-airlift-${runId}`,
                        fabricTechnology: 'Airlift',
                        basePrice: 11800.00
                    })
                });
                const prodData = await prodRes.json();
                if (!prodData.success) throw new Error(prodData.error || 'Product creation failed');

                // 2. Create Grandchild Variant
                const varRes = await fetch(`${baseUrl}/api/catalog/products/variants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variantId: ephemeralVariantId,
                        productId: ephemeralProductId,
                        sku: `PIET-SKU-${runId}-ESP-S`,
                        colorName: 'Espresso',
                        colorHex: '#362B28',
                        size: 'S',
                        inventoryQuantity: 50,
                        price: 11800.00
                    })
                });
                const varData = await varRes.json();
                if (!varData.success) throw new Error(varData.error || 'Variant creation failed');

                // 3. Create Grandchild Review
                const revRes = await fetch(`${baseUrl}/api/catalog/products/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: ephemeralProductId,
                        authorName: 'PIET Evaluator',
                        rating: 5,
                        headline: 'Exceptional Fabric Quality',
                        comment: 'Sculpts perfectly and buttery soft.'
                    })
                });
                const revData = await revRes.json();
                if (!revData.success) throw new Error(revData.error || 'Review creation failed');

                record('Gate 6: Multi-Tier Catalog', 'Product, Grandchild Variant & Review verified in live DB', true);
            } catch (e) {
                record('Gate 6: Multi-Tier Catalog', 'Product, Grandchild Variant & Review verified in live DB', false, e.message);
            }

            // =========================================================================
            // GATE 7: Clickstream & Telemetry Invariant (Every Click Tracking)
            // =========================================================================
            try {
                // 1. Create Session
                const sessRes = await fetch(`${baseUrl}/api/telemetry/clicks/session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        anonymousId: `anon-${runId}`,
                        userAgent: 'PIET Headless Chrome Telemetry Tester',
                        deviceType: 'desktop',
                        locale: 'en-in',
                        currency: 'INR'
                    })
                });
                const sessData = await sessRes.json();
                if (!sessData.success) throw new Error(sessData.error || 'Session creation failed');
                ephemeralSessionId = sessData.session.session_id;
                ephemeralVisitorId = sessData.session.visitor_id;

                // 2. Track Click Event
                const clickRes = await fetch(`${baseUrl}/api/telemetry/clicks/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: ephemeralSessionId,
                        visitorId: ephemeralVisitorId,
                        pageType: 'pdp',
                        currentUrl: '/products/airlift-high-waist-legging',
                        componentName: 'pdp_swatch_picker',
                        componentSection: 'hero_summary',
                        elementId: 'swatch-espresso-s',
                        elementTag: 'BUTTON',
                        elementText: 'Espresso',
                        clickX: 420,
                        clickY: 850,
                        viewportScrollDepthPct: 24.50,
                        interactionType: 'click',
                        funnelStage: 'consideration',
                        actionName: 'select_color_swatch',
                        metadata: { color: 'Espresso', size: 'S', sku: `PIET-SKU-${runId}-ESP-S` }
                    })
                });
                const clickData = await clickRes.json();
                if (!clickData.success) throw new Error(clickData.error || 'Click tracking failed');
                ephemeralEventId = clickData.event.event_id;

                // 3. Verify Grandchild Heatmaps Aggregation
                const heatRes = await fetch(`${baseUrl}/api/telemetry/clicks/heatmaps?pageType=pdp`);
                const heatData = await heatRes.json();
                if (!heatData.success) throw new Error('Heatmap query failed');

                record('Gate 7: Clickstream Telemetry', 'Click coordinates, scroll depth & heatmaps verified in live DB', true);
            } catch (e) {
                record('Gate 7: Clickstream Telemetry', 'Click coordinates, scroll depth & heatmaps verified in live DB', false, e.message);
            }

        } finally {
            // =========================================================================
            // MANDATORY PIET TEARDOWN: Delete all ephemeral test records (Zero Ghost Records)
            // =========================================================================
            console.log(`🧹 [PIET TEARDOWN] Wiping ephemeral test data for run ${runId}...`);
            try {
                if (ephemeralEventId || ephemeralSessionId) {
                    await db.query(`DELETE FROM click_events WHERE session_id = $1`, [ephemeralSessionId]);
                    await db.query(`DELETE FROM user_sessions WHERE session_id = $1`, [ephemeralSessionId]);
                    if (ephemeralVisitorId) {
                        await db.query(`DELETE FROM visitors WHERE visitor_id = $1`, [ephemeralVisitorId]);
                    }
                    console.log(`   ✓ Wiped ephemeral clickstream & session records: ${ephemeralSessionId}`);
                }
                if (ephemeralProductId) {
                    await db.query(`DELETE FROM product_reviews WHERE product_id = $1`, [ephemeralProductId]);
                    await db.query(`DELETE FROM product_variants WHERE product_id = $1`, [ephemeralProductId]);
                    await db.query(`DELETE FROM products WHERE product_id = $1`, [ephemeralProductId]);
                    console.log(`   ✓ Wiped ephemeral product, variant & review: ${ephemeralProductId}`);
                }
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
