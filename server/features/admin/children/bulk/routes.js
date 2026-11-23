const express = require('express');
const router = express.Router();
const db = require('../../../../db');

// POST /api/admin/bulk/categories
router.post('/categories', async (req, res) => {
    try {
        const { categories } = req.body; // array of { sectionId, name, handle, tagline }
        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: 'categories array is required', slice: 'admin.bulk' });
        }

        const inserted = [];
        for (const c of categories) {
            const catId = c.id || ('cat-' + c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            const handle = c.handle || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const result = await db.query(`
                INSERT INTO categories (category_id, section_id, name, handle, tagline)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (handle) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    section_id = EXCLUDED.section_id,
                    tagline = EXCLUDED.tagline
                RETURNING *;
            `, [catId, c.sectionId || 'clothing', c.name, handle, c.tagline || null]);
            inserted.push(result.rows[0]);
        }

        res.json({ success: true, slice: 'admin.bulk', count: inserted.length, categories: inserted });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// POST /api/admin/bulk/products
router.post('/products', async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'products array is required', slice: 'admin.bulk' });
        }

        const inserted = [];
        for (const p of products) {
            const prodId = p.id || ('prod-' + p.title.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            const handle = p.handle || p.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const result = await db.query(`
                INSERT INTO products 
                (product_id, title, handle, category_id, color_family, color_hex, mrp, sale_price, discount_label, badge_label, fabric_technology, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (product_id) DO UPDATE SET 
                    title = EXCLUDED.title,
                    mrp = EXCLUDED.mrp,
                    sale_price = EXCLUDED.sale_price
                RETURNING *;
            `, [
                prodId, p.title, handle, p.categoryId || null, p.colorFamily || 'Espresso',
                p.colorHex || '#362B28', p.mrp || 0, p.salePrice || 0, p.discountLabel || null,
                p.badgeLabel || null, p.fabricTechnology || null, p.imageUrl || null
            ]);
            inserted.push(result.rows[0]);
        }

        res.json({ success: true, slice: 'admin.bulk', count: inserted.length, products: inserted });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// POST /api/admin/bulk/products/single (Comprehensive Single Product Ingestion)
router.post('/products/single', async (req, res) => {
    try {
        const {
            title, handle, categoryId, productType, colorFamily, colorHex,
            mrp, salePrice, discountLabel, badgeLabel, fabricTechnology, imageUrl, sizes
        } = req.body;

        if (!title || !mrp || !salePrice) {
            return res.status(400).json({ error: 'title, mrp, and salePrice are required', slice: 'admin.bulk' });
        }

        const prodHandle = handle || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const prodId = req.body.id || `prod-${prodHandle}`;
        
        // Resolve or create category
        let catId = categoryId;
        if (!catId && productType) {
            const catName = productType.trim();
            const catHandle = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const existingCat = await db.query(
                `SELECT category_id FROM categories WHERE handle = $1 OR name ILIKE $2 LIMIT 1`,
                [catHandle, catName]
            );
            if (existingCat.rows.length > 0) {
                catId = existingCat.rows[0].category_id;
            } else {
                catId = `cat-${catHandle}`;
                await db.query(`
                    INSERT INTO categories (category_id, section_id, name, handle, is_active)
                    VALUES ($1, 'clothing', $2, $3, true)
                    ON CONFLICT (handle) DO UPDATE SET name = EXCLUDED.name;
                `, [catId, catName, catHandle]);
            }
        } else if (!catId) {
            catId = 'clothing';
        }

        // Insert / Update Product
        const prodResult = await db.query(`
            INSERT INTO products 
            (product_id, title, handle, category_id, color_family, color_hex, mrp, sale_price, discount_label, badge_label, fabric_technology, image_url, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
            ON CONFLICT (handle) DO UPDATE SET 
                title = EXCLUDED.title,
                category_id = EXCLUDED.category_id,
                color_family = EXCLUDED.color_family,
                color_hex = EXCLUDED.color_hex,
                mrp = EXCLUDED.mrp,
                sale_price = EXCLUDED.sale_price,
                discount_label = EXCLUDED.discount_label,
                fabric_technology = EXCLUDED.fabric_technology,
                image_url = EXCLUDED.image_url,
                is_active = true
            RETURNING *;
        `, [
            prodId, title, prodHandle, catId, colorFamily || 'Black',
            colorHex || '#111111', mrp, salePrice, discountLabel || 'Save 30%',
            badgeLabel || null, fabricTechnology || 'Alosoft',
            imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        ]);

        const product = prodResult.rows[0];

        // Insert variants for each selected size
        const sizeList = Array.isArray(sizes) && sizes.length > 0 ? sizes : ['XXS', 'XS', 'S', 'M', 'L'];
        const variants = [];
        for (const sz of sizeList) {
            const variantId = `${product.product_id}-${sz.toLowerCase()}`;
            const sku = `SKU-${product.product_id}-${sz}`;
            const vRes = await db.query(`
                INSERT INTO product_variants 
                (variant_id, product_id, sku, color_name, color_hex, size, price, inventory_quantity, is_available)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 20, true)
                ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
                RETURNING *;
            `, [variantId, product.product_id, sku, colorFamily || 'Black', colorHex || '#111111', sz, salePrice]);
            variants.push(vRes.rows[0]);
        }

        res.json({ success: true, slice: 'admin.bulk', product, variants });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// GET /api/admin/bulk/products (List products for admin table)
router.get('/products', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, count(v.variant_id) as variant_count
            FROM products p
            LEFT JOIN product_variants v ON p.product_id = v.product_id
            GROUP BY p.product_id
            ORDER BY p.created_at DESC;
        `);
        res.json({ success: true, slice: 'admin.bulk', count: result.rows.length, products: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// DELETE /api/admin/bulk/products/:productId
router.delete('/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
        await db.query('DELETE FROM products WHERE product_id = $1', [productId]);
        res.json({ success: true, slice: 'admin.bulk', deletedProductId: productId });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

module.exports = router;
