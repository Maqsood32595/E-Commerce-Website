const express = require('express');
const router = express.Router();
const db = require('../../../../db');
const adminAuth = require('../../middleware');

// Protect all bulk admin routes
router.use(adminAuth);

function slugify(str) {
    return (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// GET /api/admin/bulk/overview (Real-Time PostgreSQL KPIs & Storefront Telemetry Summary)
router.get('/overview', async (req, res) => {
    try {
        const [cats, prods, vars, orders, custs, clicks, media, coupons] = await Promise.all([
            db.query('SELECT count(*)::int as c FROM categories WHERE is_active = true'),
            db.query('SELECT count(*)::int as c FROM products WHERE is_active = true'),
            db.query('SELECT count(*)::int as c FROM product_variants WHERE is_available = true'),
            db.query('SELECT count(*)::int as c, COALESCE(SUM(grand_total), 0)::numeric(12,2) as rev FROM orders'),
            db.query('SELECT count(*)::int as c FROM customer_accounts'),
            db.query('SELECT count(*)::int as c FROM click_events'),
            db.query("SELECT count(*)::int as c FROM product_media WHERE status = 'ready'"),
            db.query('SELECT count(*)::int as c FROM discount_coupons WHERE is_active = true')
        ]);

        res.json({
            success: true,
            slice: 'admin.bulk',
            metrics: {
                categories: cats.rows[0].c,
                products: prods.rows[0].c,
                variants: vars.rows[0].c,
                orders: orders.rows[0].c,
                grossRevenue: Number(orders.rows[0].rev || 0),
                customers: custs.rows[0].c,
                clickEvents: clicks.rows[0].c,
                cloudMedia: media.rows[0].c,
                activeCoupons: coupons.rows[0].c
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// GET /api/admin/bulk/categories (List all categories grouped by section)
router.get('/categories', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, ms.title as section_title, ms.gender as section_gender, count(p.product_id)::int as product_count
            FROM categories c
            LEFT JOIN menu_sections ms ON c.section_id = ms.section_id
            LEFT JOIN products p ON p.category_id = c.category_id AND p.is_active = true
            GROUP BY c.category_id, ms.title, ms.gender, ms.display_order
            ORDER BY ms.gender NULLS LAST, ms.display_order NULLS LAST, c.display_order ASC, c.name ASC;
        `);
        res.json({ success: true, slice: 'admin.bulk', categories: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// DELETE /api/admin/bulk/categories/:categoryId
router.delete('/categories/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        await db.query('UPDATE products SET category_id = NULL WHERE category_id = $1', [categoryId]);
        await db.query('DELETE FROM categories WHERE category_id = $1', [categoryId]);
        res.json({ success: true, slice: 'admin.bulk', deletedCategoryId: categoryId });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// POST /api/admin/bulk/categories
router.post('/categories', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { categories } = req.body; // array of { sectionId, name, handle, tagline }
        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: 'categories array is required', slice: 'admin.bulk' });
        }

        await client.query('BEGIN');
        const inserted = [];
        for (const c of categories) {
            const handle = c.handle || slugify(c.name);
            const catId = c.id || ('cat-' + handle);
            const result = await client.query(`
                INSERT INTO categories (category_id, section_id, name, handle, tagline, is_active)
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT (handle) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    section_id = EXCLUDED.section_id,
                    tagline = COALESCE(EXCLUDED.tagline, categories.tagline),
                    is_active = true
                RETURNING *;
            `, [catId, c.sectionId || 'clothing', c.name, handle, c.tagline || null]);
            inserted.push(result.rows[0]);
        }
        await client.query('COMMIT');

        res.json({ success: true, slice: 'admin.bulk', count: inserted.length, categories: inserted });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    } finally {
        client.release();
    }
});

// POST /api/admin/bulk/products (Transactional, Accepts Flexible CSV/JSON Keys & Generates Default Variants)
router.post('/products', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'products array is required', slice: 'admin.bulk' });
        }

        await client.query('BEGIN');
        const inserted = [];
        for (const p of products) {
            if (!p.title) continue;
            const handle = p.handle || slugify(p.title);
            const prodId = p.id || p.product_id || ('prod-' + handle);
            const mrp = Number(p.mrp || 0);
            const salePrice = Number(p.salePrice ?? p.sale_price ?? mrp);
            const discountLabel = p.discountLabel || p.discount_label || (mrp > salePrice && mrp > 0 ? `Save ${Math.round(((mrp - salePrice) / mrp) * 100)}%` : 'Save 30%');
            const colorFamily = p.colorFamily || p.color_family || 'Espresso';
            const colorHex = p.colorHex || p.color_hex || '#362B28';
            const fabricTech = p.fabricTechnology || p.fabric_technology || 'Alosoft';
            const imageUrl = p.imageUrl || p.image_url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80';
            const categoryId = p.categoryId || p.category_id || null;

            const result = await client.query(`
                INSERT INTO products 
                (product_id, title, handle, category_id, color_family, color_hex, mrp, sale_price, discount_label, badge_label, fabric_technology, image_url, description, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
                ON CONFLICT (handle) DO UPDATE SET 
                    title = EXCLUDED.title,
                    category_id = COALESCE(EXCLUDED.category_id, products.category_id),
                    color_family = EXCLUDED.color_family,
                    color_hex = EXCLUDED.color_hex,
                    mrp = EXCLUDED.mrp,
                    sale_price = EXCLUDED.sale_price,
                    discount_label = EXCLUDED.discount_label,
                    badge_label = COALESCE(EXCLUDED.badge_label, products.badge_label),
                    fabric_technology = COALESCE(EXCLUDED.fabric_technology, products.fabric_technology),
                    image_url = COALESCE(EXCLUDED.image_url, products.image_url),
                    updated_at = NOW(),
                    is_active = true
                RETURNING *;
            `, [
                prodId, p.title.trim(), handle, categoryId, colorFamily, colorHex,
                mrp, salePrice, discountLabel, p.badgeLabel || p.badge_label || null,
                fabricTech, imageUrl, p.description || null
            ]);

            const savedProd = result.rows[0];
            const sizeList = Array.isArray(p.sizes) && p.sizes.length > 0
                ? p.sizes
                : (typeof p.sizes === 'string' && p.sizes.trim() ? p.sizes.split(/[,|]/).map(s => s.trim()).filter(Boolean) : ['XXS', 'XS', 'S', 'M', 'L']);

            for (const sz of sizeList) {
                const safeSz = sz.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                const variantId = `${savedProd.product_id}-${safeSz}`;
                const sku = `SKU-${savedProd.product_id}-${sz.replace(/[^a-zA-Z0-9]/g, '')}`;
                await client.query(`
                    INSERT INTO product_variants (variant_id, product_id, sku, color_name, color_hex, size, inventory_quantity, price, is_available)
                    VALUES ($1, $2, $3, $4, $5, $6, 25, $7, true)
                    ON CONFLICT (variant_id) DO UPDATE SET price = EXCLUDED.price, is_available = true;
                `, [variantId, savedProd.product_id, sku, colorFamily, colorHex, sz, salePrice]);
            }

            inserted.push(savedProd);
        }
        await client.query('COMMIT');

        res.json({ success: true, slice: 'admin.bulk', count: inserted.length, products: inserted });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    } finally {
        client.release();
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
        
        // Resolve or create category safely (respecting foreign key constraint)
        let catId = null;
        if (categoryId) {
            const checkCat = await db.query(
                `SELECT category_id FROM categories WHERE category_id = $1 OR handle = $1 OR name ILIKE $1 LIMIT 1`,
                [categoryId]
            );
            catId = checkCat.rows[0]?.category_id || null;
        }
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
        }
        if (!catId) {
            const fallbackCat = await db.query(`SELECT category_id FROM categories WHERE is_active = true LIMIT 1`);
            catId = fallbackCat.rows[0]?.category_id || null;
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
                badge_label = COALESCE(EXCLUDED.badge_label, products.badge_label),
                fabric_technology = EXCLUDED.fabric_technology,
                image_url = EXCLUDED.image_url,
                description = COALESCE(EXCLUDED.description, products.description),
                fit_details = COALESCE(EXCLUDED.fit_details, products.fit_details),
                fabrication_details = COALESCE(EXCLUDED.fabrication_details, products.fabrication_details),
                gallery_images = COALESCE(EXCLUDED.gallery_images, products.gallery_images),
                features_blueprint = COALESCE(EXCLUDED.features_blueprint, products.features_blueprint),
                updated_at = NOW(),
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

        // Mark removed sizes unavailable & insert/activate chosen sizes
        const sizeList = Array.isArray(sizes) && sizes.length > 0 ? sizes : ['XXS', 'XS', 'S', 'M', 'L'];
        await db.query(`UPDATE product_variants SET is_available = false WHERE product_id = $1`, [product.product_id]);
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
            SELECT * FROM product_variants WHERE product_id = $1 AND is_available = true ORDER BY size ASC;
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

        // If sizes updated, mark removed sizes unavailable & upsert chosen sizes
        let variants = [];
        if (Array.isArray(sizes) && sizes.length > 0) {
            await db.query(`UPDATE product_variants SET is_available = false WHERE product_id = $1`, [product.product_id]);
            for (const sz of sizes) {
                const variantId = `${product.product_id}-${sz.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
                const sku = `SKU-${product.product_id}-${sz.replace(/[^a-zA-Z0-9]/g, '')}`;
                const vRes = await db.query(`
                    INSERT INTO product_variants 
                    (variant_id, product_id, sku, color_name, color_hex, size, price, inventory_quantity, is_available)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 25, true)
                    ON CONFLICT (variant_id) DO UPDATE SET price = EXCLUDED.price, color_name = EXCLUDED.color_name, color_hex = EXCLUDED.color_hex, is_available = true
                    RETURNING *;
                `, [variantId, product.product_id, sku, product.color_family, product.color_hex, sz, product.sale_price]);
                variants.push(vRes.rows[0]);
            }
        } else {
            const vRes = await db.query(`SELECT * FROM product_variants WHERE product_id = $1 AND is_available = true`, [product.product_id]);
            variants = vRes.rows;
        }

        res.json({ success: true, slice: 'admin.bulk', product, variants });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// GET /api/admin/bulk/products (List products for admin table with category name & available variant count)
router.get('/products', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, c.name as category_name,
                   count(v.variant_id) FILTER (WHERE v.is_available = true)::int as variant_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_variants v ON p.product_id = v.product_id
            GROUP BY p.product_id, c.name
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
        await db.query('DELETE FROM product_variant_media_mapping WHERE product_id = $1', [productId]);
        await db.query('DELETE FROM product_reviews WHERE product_id = $1', [productId]);
        await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
        await db.query('DELETE FROM products WHERE product_id = $1', [productId]);
        res.json({ success: true, slice: 'admin.bulk', deletedProductId: productId });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// GET /api/admin/bulk/orders (Customer Orders & Fulfillment Queue)
router.get('/orders', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*,
                   COALESCE(json_agg(json_build_object(
                       'title', oi.title, 'color', oi.color_name, 'size', oi.size, 'qty', oi.quantity, 'price', oi.unit_price
                   )) FILTER (WHERE oi.order_item_id IS NOT NULL), '[]') as items
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
            LIMIT 50;
        `);
        res.json({ success: true, slice: 'admin.bulk', orders: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// PATCH /api/admin/bulk/orders/:orderId/status
router.patch('/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
        }
        const upd = await db.query(`UPDATE orders SET status = $2 WHERE order_id = $1 RETURNING *;`, [orderId, status]);
        if (upd.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ success: true, slice: 'admin.bulk', order: upd.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// GET /api/admin/bulk/coupons (Promo Codes Manager)
router.get('/coupons', async (req, res) => {
    try {
        const resC = await db.query('SELECT * FROM discount_coupons ORDER BY created_at DESC');
        res.json({ success: true, slice: 'admin.bulk', coupons: resC.rows });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// POST /api/admin/bulk/coupons
router.post('/coupons', async (req, res) => {
    try {
        const { code, discountPercent, discountAmount, minOrderValue } = req.body;
        if (!code) return res.status(400).json({ error: 'Coupon code is required' });
        const cleanCode = code.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
        const ins = await db.query(`
            INSERT INTO discount_coupons (code, discount_percent, discount_amount, min_order_value, is_active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (code) DO UPDATE SET
                discount_percent = EXCLUDED.discount_percent,
                discount_amount = EXCLUDED.discount_amount,
                min_order_value = EXCLUDED.min_order_value,
                is_active = true
            RETURNING *;
        `, [cleanCode, Number(discountPercent || 0), Number(discountAmount || 0), Number(minOrderValue || 0)]);
        res.json({ success: true, slice: 'admin.bulk', coupon: ins.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

// DELETE /api/admin/bulk/coupons/:code
router.delete('/coupons/:code', async (req, res) => {
    try {
        await db.query('DELETE FROM discount_coupons WHERE UPPER(code) = UPPER($1)', [req.params.code]);
        res.json({ success: true, slice: 'admin.bulk', deletedCode: req.params.code });
    } catch (err) {
        res.status(500).json({ error: err.message, slice: 'admin.bulk' });
    }
});

module.exports = router;
