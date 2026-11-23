const db = require('../server/db');

async function seedAccoladeItems() {
    console.log("Seeding Accolade products and cross-sell catalog...");

    const items = [
        {
            id: 'u5012rg-accolade-straight-leg-deep-gravel',
            title: 'Accolade Straight Leg Sweatpant',
            handle: 'accolade-straight-leg-sweatpant-deep-gravel',
            category_id: 'c-sweatpants',
            fabric: 'French Terry Fleece',
            color: 'Deep Gravel',
            color_hex: '#5A5856',
            mrp: 19500.00,
            sale_price: 13600.00,
            discount: 'Save 30%',
            image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u3040rg-accolade-quarter-zip-black',
            title: 'Accolade 1/4 Zip Pullover',
            handle: 'accolade-1-4-zip-pullover-black',
            category_id: 'c-sweatshirts',
            fabric: 'French Terry Fleece',
            color: 'Black',
            color_hex: '#111111',
            mrp: 20900.00,
            sale_price: 14600.00,
            discount: 'Save 30%',
            image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u3040rg-accolade-quarter-zip-navy',
            title: 'Accolade 1/4 Zip Pullover',
            handle: 'accolade-1-4-zip-pullover-navy',
            category_id: 'c-sweatshirts',
            fabric: 'French Terry Fleece',
            color: 'Navy',
            color_hex: '#1B263B',
            mrp: 20900.00,
            sale_price: 14600.00,
            discount: 'Save 30%',
            image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u3040rg-accolade-quarter-zip-deep-gravel',
            title: 'Accolade 1/4 Zip Pullover',
            handle: 'accolade-1-4-zip-pullover-deep-gravel',
            category_id: 'c-sweatshirts',
            fabric: 'French Terry Fleece',
            color: 'Deep Gravel',
            color_hex: '#5A5856',
            mrp: 20900.00,
            sale_price: 14600.00,
            discount: 'Save 30%',
            image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u3040rg-accolade-quarter-zip-espresso',
            title: 'Accolade 1/4 Zip Pullover',
            handle: 'accolade-1-4-zip-pullover-espresso',
            category_id: 'c-sweatshirts',
            fabric: 'French Terry Fleece',
            color: 'Espresso',
            color_hex: '#362B28',
            mrp: 20900.00,
            sale_price: 14600.00,
            discount: 'Save 30%',
            image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u3031rg-accolade-crew-pullover-black',
            title: 'Accolade Crew Neck Pullover',
            handle: 'accolade-crew-neck-pullover-black',
            category_id: 'c-sweatshirts',
            fabric: 'French Terry Fleece',
            color: 'Black',
            color_hex: '#111111',
            mrp: 19500.00,
            sale_price: 13600.00,
            discount: 'Save 30%',
            image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        }
    ];

    for (const item of items) {
        await db.query(`
            INSERT INTO products (
                product_id, title, handle, category_id, fabric_technology, 
                color_family, color_hex, mrp, sale_price, discount_label, image_url, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
            ON CONFLICT (handle) DO UPDATE SET
                title = EXCLUDED.title,
                color_family = EXCLUDED.color_family,
                color_hex = EXCLUDED.color_hex,
                mrp = EXCLUDED.mrp,
                sale_price = EXCLUDED.sale_price,
                discount_label = EXCLUDED.discount_label,
                image_url = EXCLUDED.image_url;
        `, [
            item.id, item.title, item.handle, item.category_id, item.fabric,
            item.color, item.color_hex, item.mrp, item.sale_price, item.discount, item.image_url
        ]);

        // Insert variants (XS, S, M, L, XL)
        const sizes = ['XS', 'S', 'M', 'L', 'XL'];
        for (const sz of sizes) {
            await db.query(`
                INSERT INTO product_variants (variant_id, product_id, sku, color_name, color_hex, size, price, inventory_quantity)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 10)
                ON CONFLICT (sku) DO NOTHING;
            `, [
                `${item.id}-${sz.toLowerCase()}`,
                item.id,
                `SKU-${item.id}-${sz}`,
                item.color,
                item.color_hex,
                sz,
                item.sale_price
            ]);
        }
    }

    console.log("✅ All Accolade items and cross-sells seeded successfully!");
    process.exit(0);
}

seedAccoladeItems().catch(err => {
    console.error(err);
    process.exit(1);
});
