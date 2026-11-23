const db = require('./server/db');

async function seedCatalog() {
    console.log("Seeding luxury athleisure catalog with Indian color suites...");

    // 1. Categories
    const categories = [
        { id: 'cat-women-leggings', name: 'Leggings', handle: 'womens-leggings', desc: 'Sculpting, high-sheen & buttery-soft performance tights.' },
        { id: 'cat-women-bras', name: 'Bras & Crop Tops', handle: 'womens-bras', desc: 'Light to high-impact studio workout bras.' },
        { id: 'cat-women-sets', name: 'Co-ord Sets', handle: 'womens-sets', desc: 'Curated studio-to-street matching sets.' },
        { id: 'cat-accessories', name: 'Accessories & Mats', handle: 'accessories', desc: 'Warrior mats, recovery straps, and studio essentials.' }
    ];

    for (const c of categories) {
        await db.query(`
            INSERT INTO categories (category_id, name, handle, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (category_id) DO UPDATE SET name = EXCLUDED.name, handle = EXCLUDED.handle;
        `, [c.id, c.name, c.handle, c.desc]);
    }

    // 2. Products
    const products = [
        {
            id: 'alo-airlift-legging',
            title: 'Airlift High-Waist 7/8 Legging',
            handle: 'airlift-high-waist-legging',
            desc: 'Sleek, sculpting, and high-sheen. Designed with signature micro-performance double-knit Airlift fabric.',
            catId: 'cat-women-leggings',
            fabric: 'Airlift',
            price: 11800.00
        },
        {
            id: 'alo-airbrush-real-bra',
            title: 'Airbrush Real Bra Tank',
            handle: 'airbrush-real-bra-tank',
            desc: 'Medium-support studio essential with built-in shelf bra and soft contouring ribbed texture.',
            catId: 'cat-women-bras',
            fabric: 'Airbrush',
            price: 6800.00
        },
        {
            id: 'alo-alosoft-lounge-set',
            title: 'Alosoft Serenity Co-ord Set',
            handle: 'alosoft-serenity-coord-set',
            desc: 'Velvety-soft peach finish designed for travel, morning meditation, and high-style loungewear.',
            catId: 'cat-women-sets',
            fabric: 'Alosoft',
            price: 15400.00
        },
        {
            id: 'alo-warrior-mat',
            title: 'Warrior Non-Slip Mat (5mm)',
            handle: 'warrior-non-slip-mat',
            desc: 'Cushioned natural rubber with matte non-slip grip engineered for intense heated flow.',
            catId: 'cat-accessories',
            fabric: 'Natural Rubber',
            price: 12500.00
        }
    ];

    for (const p of products) {
        await db.query(`
            INSERT INTO products (product_id, title, handle, description, category_id, fabric_technology, base_price, currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'INR')
            ON CONFLICT (product_id) DO UPDATE SET title = EXCLUDED.title, base_price = EXCLUDED.base_price;
        `, [p.id, p.title, p.handle, p.desc, p.catId, p.fabric, p.price]);
    }

    // 3. Variants with Indian Luxury Color Palette
    const variants = [
        // Airlift Leggings
        { id: 'var-airlift-esp-s', prodId: 'alo-airlift-legging', sku: 'AL-AIR-ESP-S', color: 'Espresso', hex: '#362B28', size: 'S', qty: 35, price: 11800 },
        { id: 'var-airlift-esp-m', prodId: 'alo-airlift-legging', sku: 'AL-AIR-ESP-M', color: 'Espresso', hex: '#362B28', size: 'M', qty: 40, price: 11800 },
        { id: 'var-airlift-terra-s', prodId: 'alo-airlift-legging', sku: 'AL-AIR-TER-S', color: 'Terracotta', hex: '#9E4736', size: 'S', qty: 25, price: 11800 },
        { id: 'var-airlift-sage-s', prodId: 'alo-airlift-legging', sku: 'AL-AIR-SAG-S', color: 'Eucalyptus Sage', hex: '#5B7065', size: 'S', qty: 30, price: 11800 },
        { id: 'var-airlift-anth-s', prodId: 'alo-airlift-legging', sku: 'AL-AIR-ANT-S', color: 'Anthracite', hex: '#22252A', size: 'S', qty: 50, price: 11800 },

        // Airbrush Real Bra
        { id: 'var-bra-esp-s', prodId: 'alo-airbrush-real-bra', sku: 'AL-BRA-ESP-S', color: 'Espresso', hex: '#362B28', size: 'S', qty: 20, price: 6800 },
        { id: 'var-bra-terra-s', prodId: 'alo-airbrush-real-bra', sku: 'AL-BRA-TER-S', color: 'Terracotta', hex: '#9E4736', size: 'S', qty: 15, price: 6800 },
        { id: 'var-bra-sage-s', prodId: 'alo-airbrush-real-bra', sku: 'AL-BRA-SAG-S', color: 'Eucalyptus Sage', hex: '#5B7065', size: 'S', qty: 25, price: 6800 },

        // Alosoft Set
        { id: 'var-set-chalk-s', prodId: 'alo-alosoft-lounge-set', sku: 'AL-SET-CHK-S', color: 'Chalk Off-White', hex: '#EAE6DF', size: 'S', qty: 18, price: 15400 },
        { id: 'var-set-card-s', prodId: 'alo-alosoft-lounge-set', sku: 'AL-SET-CRD-S', color: 'Spiced Cardamom', hex: '#8C6D53', size: 'S', qty: 22, price: 15400 },

        // Warrior Mat
        { id: 'var-mat-indi-std', prodId: 'alo-warrior-mat', sku: 'AL-MAT-IND-STD', color: 'Deep Indigo', hex: '#1D2D44', size: '5mm', qty: 30, price: 12500 },
        { id: 'var-mat-esp-std', prodId: 'alo-warrior-mat', sku: 'AL-MAT-ESP-STD', color: 'Espresso', hex: '#362B28', size: '5mm', qty: 45, price: 12500 }
    ];

    for (const v of variants) {
        await db.query(`
            INSERT INTO product_variants (variant_id, product_id, sku, color_name, color_hex, size, inventory_quantity, price, currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INR')
            ON CONFLICT (variant_id) DO UPDATE SET inventory_quantity = EXCLUDED.inventory_quantity;
        `, [v.id, v.prodId, v.sku, v.color, v.hex, v.size, v.qty, v.price]);
    }

    // 4. Coupons
    await db.query(`
        INSERT INTO discount_coupons (code, discount_percent, min_order_value)
        VALUES ('ALOINDIA15', 15.00, 5000.00), ('NAMASTE10', 10.00, 3000.00)
        ON CONFLICT (code) DO NOTHING;
    `);

    console.log("✅ Catalog successfully seeded with Indian luxury colors and products!");
    process.exit(0);
}

seedCatalog();
