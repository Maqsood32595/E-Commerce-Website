const express = require('express');
const router = express.Router();
const db = require('../../../../../../db');

// GET /api/telemetry/clicks/heatmaps?pageType=pdp
router.get('/', async (req, res) => {
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
            slice: 'telemetry.clicks.heatmaps',
            tier: 'grandchild',
            heatmaps: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'telemetry.clicks.heatmaps' });
    }
});

module.exports = router;
