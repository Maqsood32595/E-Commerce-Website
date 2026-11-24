const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// POST /api/telemetry/clicks/session
router.post('/session', async (req, res) => {
    try {
        const { anonymousId, userAgent, ipAddress, deviceType, locale, currency } = req.body;
        if (!anonymousId) {
            return res.status(400).json({ error: 'anonymousId is required', slice: 'telemetry.clicks' });
        }

        // Upsert visitor
        const visRes = await db.query(`
            INSERT INTO visitors (anonymous_id)
            VALUES ($1)
            ON CONFLICT (anonymous_id) DO UPDATE SET last_seen_at = NOW()
            RETURNING visitor_id;
        `, [anonymousId]);
        const visitorId = visRes.rows[0].visitor_id;

        // Create session
        const sessRes = await db.query(`
            INSERT INTO user_sessions (visitor_id, user_agent, device_type, locale, currency)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING session_id, visitor_id, session_start_at;
        `, [visitorId, userAgent || null, deviceType || 'desktop', locale || 'en-in', currency || 'INR']);

        res.json({ success: true, slice: 'telemetry.clicks', session: sessRes.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'telemetry.clicks' });
    }
});

// POST /api/telemetry/clicks/track (Capture Every Click)
router.post('/track', async (req, res) => {
    try {
        const {
            sessionId, visitorId, pageType, currentUrl,
            componentName, componentSection, elementId, elementTag, elementText,
            clickX, clickY, viewportScrollDepthPct, interactionType, funnelStage,
            actionName, metadata
        } = req.body;

        if (!sessionId || !visitorId || !pageType || !componentName || !actionName) {
            return res.status(400).json({
                error: 'sessionId, visitorId, pageType, componentName, and actionName are required',
                slice: 'telemetry.clicks'
            });
        }

        const insertQuery = `
            INSERT INTO click_events (
                session_id, visitor_id, page_type, current_url,
                component_name, component_section, element_id, element_tag, element_text,
                click_x, click_y, viewport_scroll_depth_pct, interaction_type, funnel_stage,
                action_name, metadata
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            ) RETURNING event_id, event_timestamp;
        `;

        const result = await db.query(insertQuery, [
            sessionId, visitorId, pageType, currentUrl || '/',
            componentName, componentSection || null, elementId || null, elementTag || 'BUTTON', elementText || null,
            clickX || 0, clickY || 0, viewportScrollDepthPct || 0, interactionType || 'click', funnelStage || 'discovery',
            actionName, metadata ? JSON.stringify(metadata) : null
        ]);

        res.json({ success: true, slice: 'telemetry.clicks', event: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'telemetry.clicks' });
    }
});

// GET /api/telemetry/clicks/heatmaps
router.get('/heatmaps', async (req, res) => {
    try {
        const { pageType } = req.query;
        let query = `
            SELECT 
                component_name, 
                element_id, 
                action_name, 
                COUNT(*) as click_count,
                AVG(click_x)::int as avg_x,
                AVG(click_y)::int as avg_y,
                AVG(viewport_scroll_depth_pct)::numeric(5,2) as avg_scroll_depth
            FROM click_events
        `;
        const params = [];
        if (pageType) {
            query += ' WHERE page_type = $1';
            params.push(pageType);
        }
        query += ' GROUP BY component_name, element_id, action_name ORDER BY click_count DESC LIMIT 50';

        const result = await db.query(query, params);
        res.json({
            success: true,
            slice: 'telemetry.clicks',
            heatmaps: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'telemetry.clicks' });
    }
});

module.exports = router;
