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
            mrp, salePrice, discountLabel, badgeLabel, fabricTechnology, imageUrl, sizes,
            description, fitDetails, fabricationDetails, galleryImages, featuresBlueprint
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

        const gallery = Array.isArray(galleryImages) ? galleryImages : (imageUrl ? [imageUrl] : []);

        // Insert / Update Product
        const prodResult = await db.query(`
            INSERT INTO products 
            (product_id, title, handle, category_id, color_family, color_hex, mrp, sale_price, discount_label, badge_label, fabric_technology, image_url, description, fit_details, fabrication_details, gallery_images, features_blueprint, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true)
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
                description = COALESCE(EXCLUDED.description, products.description),
                fit_details = COALESCE(EXCLUDED.fit_details, products.fit_details),
                fabrication_details = COALESCE(EXCLUDED.fabrication_details, products.fabrication_details),
                gallery_images = COALESCE(EXCLUDED.gallery_images, products.gallery_images),
                features_blueprint = COALESCE(EXCLUDED.features_blueprint, products.features_blueprint),
                is_active = true
            RETURNING *;
        `, [
            prodId, title, prodHandle, catId, colorFamily || 'Black',
            colorHex || '#111111', mrp, salePrice, discountLabel || 'Save 30%',
            badgeLabel || null, fabricTechnology || 'Alosoft',
            imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
            description || null, fitDetails || null, fabricationDetails || null,
            JSON.stringify(gallery), JSON.stringify(featuresBlueprint || [])
        ]);

        const product = prodResult.rows[0];

        // Insert variants for each selected size
        const sizeList = Array.isArray(sizes) && sizes.length > 0 ? sizes : ['XXS', 'XS', 'S', 'M', 'L'];
        const variants = [];
        for (const sz of sizeList) {
            const variantId = `${product.product_id}-${sz.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
            const sku = `SKU-${product.product_id}-${sz.replace(/[^a-zA-Z0-9]/g, '')}`;
            const vRes = await db.query(`
                INSERT INTO product_variants 
                (variant_id, product_id, sku, color_name, color_hex, size, price, inventory_quantity, is_available)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 20, true)
                ON CONFLICT (variant_id) DO UPDATE SET price = EXCLUDED.price, is_available = true
                RETURNING *;
            `, [variantId, product.product_id, sku, colorFamily || 'Black', colorHex || '#111111', sz, salePrice]);
            variants.push(vRes.rows[0]);
        }

        res.json({ success: true, slice: 'admin.bulk', product, variants });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// GET /api/admin/bulk/products/:productId (Fetch full product details for admin editor)
router.get('/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const prodRes = await db.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = $1 OR p.handle = $1;
        `, [productId]);

        if (prodRes.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found', slice: 'admin.bulk' });
        }

        const product = prodRes.rows[0];
        const variantsRes = await db.query(`
            SELECT * FROM product_variants WHERE product_id = $1 ORDER BY size ASC;
        `, [product.product_id]);

        res.json({ success: true, slice: 'admin.bulk', product, variants: variantsRes.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// PUT /api/admin/bulk/products/:productId (Update product and immediately sync with PDP)
router.put('/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const {
            title, handle, categoryId, colorFamily, colorHex,
            mrp, salePrice, discountLabel, badgeLabel, fabricTechnology,
            imageUrl, description, fitDetails, fabricationDetails,
            galleryImages, featuresBlueprint, sizes
        } = req.body;

        const updateRes = await db.query(`
            UPDATE products
            SET title = COALESCE($1, title),
                handle = COALESCE($2, handle),
                category_id = COALESCE($3, category_id),
                color_family = COALESCE($4, color_family),
                color_hex = COALESCE($5, color_hex),
                mrp = COALESCE($6, mrp),
                sale_price = COALESCE($7, sale_price),
                discount_label = COALESCE($8, discount_label),
                badge_label = COALESCE($9, badge_label),
                fabric_technology = COALESCE($10, fabric_technology),
                image_url = COALESCE($11, image_url),
                description = COALESCE($12, description),
                fit_details = COALESCE($13, fit_details),
                fabrication_details = COALESCE($14, fabrication_details),
                gallery_images = COALESCE($15, gallery_images),
                features_blueprint = COALESCE($16, features_blueprint),
                updated_at = NOW()
            WHERE product_id = $17 OR handle = $17
            RETURNING *;
        `, [
            title, handle, categoryId, colorFamily, colorHex,
            mrp, salePrice, discountLabel, badgeLabel, fabricTechnology,
            imageUrl, description, fitDetails, fabricationDetails,
            galleryImages ? JSON.stringify(galleryImages) : null,
            featuresBlueprint ? JSON.stringify(featuresBlueprint) : null,
            productId
        ]);

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found', slice: 'admin.bulk' });
        }

        const product = updateRes.rows[0];

        // If sizes updated, update variants
        let variants = [];
        if (Array.isArray(sizes) && sizes.length > 0) {
            for (const sz of sizes) {
                const variantId = `${product.product_id}-${sz.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
                const sku = `SKU-${product.product_id}-${sz.replace(/[^a-zA-Z0-9]/g, '')}`;
                const vRes = await db.query(`
                    INSERT INTO product_variants 
                    (variant_id, product_id, sku, color_name, color_hex, size, price, inventory_quantity, is_available)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 25, true)
                    ON CONFLICT (variant_id) DO UPDATE SET price = EXCLUDED.price, is_available = true
                    RETURNING *;
                `, [variantId, product.product_id, sku, product.color_family, product.color_hex, sz, product.sale_price]);
                variants.push(vRes.rows[0]);
            }
        } else {
            const vRes = await db.query(`SELECT * FROM product_variants WHERE product_id = $1`, [product.product_id]);
            variants = vRes.rows;
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
