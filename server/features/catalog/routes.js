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

        const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL'];
        const percentOff = ['30% Off', '40% Off', '50% Off'];

        res.json({
            success: true,
            slice: 'catalog',
            filters: {
                productTypes: typesRes.rows,
                sizes,
                colors: colorsRes.rows.map(r => ({ name: r.color_family, hex: r.color_hex || '#333333' })),
                fabrics: fabricsRes.rows.map(r => r.fabric_technology),
                percentOff
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'catalog' });
    }
});

module.exports = router;
