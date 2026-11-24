const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/catalog/lookbook
router.get('/lookbook', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM social_lookbook ORDER BY display_order ASC');
        res.json({ success: true, slice: 'catalog', lookbook: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

// GET /api/catalog/menu
router.get('/menu', async (req, res) => {
    try {
        const { gender } = req.query;
        let query = 'SELECT * FROM menu_sections WHERE is_active = true';
        const params = [];
        if (gender && gender !== 'all') {
            params.push(gender);
            query += ` AND gender = $${params.length}`;
        }
        query += ' ORDER BY display_order ASC';

        const sectionsRes = await db.query(query, params);
        const categoriesRes = await db.query('SELECT * FROM categories WHERE is_active = true ORDER BY display_order ASC');

        const menu = sectionsRes.rows.map(sec => ({
            sectionId: sec.section_id,
            title: sec.title,
            gender: sec.gender,
            categories: categoriesRes.rows.filter(c => c.section_id === sec.section_id)
        }));

        // Featured footwear for Shoes mega menu
        const shoesRes = await db.query(`
            SELECT product_id, title, handle, mrp, sale_price, image_url, discount_label
            FROM products
            WHERE category_id LIKE 'shoes%' OR category_id = 'acc-shoes' OR title ILIKE '%sneaker%' OR title ILIKE '%boot%' OR title ILIKE '%runner%'
            ORDER BY created_at DESC
            LIMIT 3;
        `);

        // Featured Holiday Visual Cards for Gift Guide mega menu (Exact Alo Yoga Spec)
        const featuredGifts = [
            {
                title: 'Holiday Après-Ski Edit',
                handle: 'holiday-apres-ski',
                subtitle: 'Alpine warmth & luxury tailoring',
                image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
                link_filter: 'c-jackets',
                filter_label: 'Jackets & Outerwear'
            },
            {
                title: 'Cozy Lounge Sets',
                handle: 'cozy-lounge-sets',
                subtitle: 'Peach-finish Alosoft fleece',
                image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
                link_filter: 'act-lounge',
                filter_label: 'Lounge'
            },
            {
                title: 'Performance Studio Gifts',
                handle: 'performance-studio-gifts',
                subtitle: 'Double-knit Airlift essentials',
                image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
                link_filter: 'act-yoga',
                filter_label: 'Yoga'
            }
        ];

        res.json({ success: true, slice: 'catalog', menu, featuredShoes: shoesRes.rows, featuredGifts });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

// GET /api/catalog/categories
router.get('/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories WHERE is_active = true ORDER BY name ASC');
        res.json({ success: true, slice: 'catalog', categories: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

// POST /api/catalog/categories
router.post('/categories', async (req, res) => {
    try {
        const { categoryId, name, handle, description } = req.body;
        if (!categoryId || !name || !handle) {
            return res.status(400).json({ error: 'categoryId, name, and handle are required', slice: 'catalog' });
        }
        const result = await db.query(`
            INSERT INTO categories (category_id, name, handle, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (category_id) DO UPDATE SET name = EXCLUDED.name, handle = EXCLUDED.handle
            RETURNING *;
        `, [categoryId, name, handle, description || null]);
        res.json({ success: true, slice: 'catalog', category: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

// GET /api/catalog/filters (Dynamic Facets from Products & Categories)
router.get('/filters', async (req, res) => {
    try {
        const colorsRes = await db.query(`
            SELECT DISTINCT color_family, color_hex 
            FROM products 
            WHERE color_family IS NOT NULL AND is_active = true 
            ORDER BY color_family ASC;
        `);

        const fabricsRes = await db.query(`
            SELECT DISTINCT fabric_technology 
            FROM products 
            WHERE fabric_technology IS NOT NULL AND is_active = true 
            ORDER BY fabric_technology ASC;
        `);

        // Dynamic Product Types extracted from categories
        const typesRes = await db.query(`
            SELECT DISTINCT name, handle, category_id 
            FROM categories 
            WHERE is_active = true 
            ORDER BY name ASC;
        `);

        const clothingSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL'];
        const shoeSizes = [
            '3.5m/5w', '4m/5.5w', '4.5m/6w', '5m/6.5w',
            '5.5m/7w', '6m/7.5w', '6.5m/8w', '7m/8.5w',
            '7.5m/9w', '8m/9.5w', '8.5m/10w', '9m/10.5w',
            '9.5m/11w', '10m/11.5w', '10.5m/12w', '11m/12.5w',
            '11.5m/13w', '12m/13.5w', '12.5m/14w', '13m/14.5w',
            '13.5m/15w', '14m/15.5w', '14.5m/16w', '15m/16.5w',
            '15.5m/17w', '16m/17.5w', '3m/4.5w', '10m/12w',
            '11m/13w', '12m/14w', '13m/15w', '14m/16w',
            '15m/17w', '4m/6w', '5m/7w', '6m/8w'
        ];

        // Dynamic + Standard Colors matching User Spec (Image 2) & Admin Ingestion
        const standardColors = [
            { name: 'Beige', hex: '#D8BC9D' },
            { name: 'Black', hex: '#111111' },
            { name: 'Blue', hex: '#1E3A8A' },
            { name: 'Brown', hex: '#704214' },
            { name: 'Green', hex: '#005C29' },
            { name: 'Grey', hex: '#CCCCCC' },
            { name: 'Orange', hex: '#EA580C' },
            { name: 'Pink', hex: '#FFB6C1' },
            { name: 'Purple', hex: '#800080' },
            { name: 'Red', hex: '#E74C3C' },
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Yellow', hex: '#FFD700' }
        ];

        const dbColors = (colorsRes.rows || []).map(r => ({ name: r.color_family, hex: r.color_hex || '#333333' }));
        const mergedColors = [...standardColors];
        for (const c of dbColors) {
            if (!mergedColors.some(sc => sc.name.toLowerCase() === c.name.toLowerCase())) {
                mergedColors.push(c);
            }
        }

        // Dynamic + Standard Fabrics matching User Spec (Image 4) & Admin Ingestion
        const standardFabrics = [
            'Airbrush',
            'Airlift',
            'Alo Softsculpt',
            'Alolux',
            'Alosoft',
            'Cashmere',
            'Double Take',
            'Faux Fur',
            'Fleece',
            'Ribbed',
            'Seamless',
            'Sherpa',
            'Waffle'
        ];

        const dbFabrics = (fabricsRes.rows || []).map(r => r.fabric_technology);
        const mergedFabrics = [...standardFabrics];
        for (const f of dbFabrics) {
            if (!mergedFabrics.some(sf => sf.toLowerCase() === f.toLowerCase())) {
                mergedFabrics.push(f);
            }
        }

        const percentOff = ['30% Off', '40% Off', '50% Off'];

        res.json({
            success: true,
            slice: 'catalog',
            filters: {
                productTypes: typesRes.rows,
                clothingSizes,
                shoeSizes,
                sizes: [...clothingSizes, ...shoeSizes],
                colors: mergedColors,
                fabrics: mergedFabrics,
                percentOff
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

module.exports = router;
