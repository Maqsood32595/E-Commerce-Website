const db = require('./server/db');

async function seedAll() {
    console.log("Seeding complete Mega Menu taxonomy, categories, products, and customer accounts...");

    // 1. Customer Sameera Maqsood
    await db.query(`
        INSERT INTO customer_accounts (email, password_hash, first_name, last_name, vip_status, reward_points)
        VALUES ('sameeramaq@gmail.com', 'hashed_oraib_123', 'Sameera', 'Maqsood', 'VIP', 1)
        ON CONFLICT (email) DO UPDATE SET reward_points = 1, vip_status = 'VIP';
    `);

    // 2. Sections from Screenshot
    const sections = [
        { id: 'clothing', title: 'Clothing', order: 1 },
        { id: 'new-trending', title: 'New & Trending', order: 2 },
        { id: 'shop-by-color', title: 'Shop By Color', order: 3 },
        { id: 'shop-by-activity', title: 'Shop by Activity', order: 4 },
        { id: 'accessories', title: 'Accessories', order: 5 }
    ];

    for (const s of sections) {
        await db.query(`
            INSERT INTO menu_sections (section_id, title, display_order)
            VALUES ($1, $2, $3)
            ON CONFLICT (section_id) DO UPDATE SET title = EXCLUDED.title, display_order = EXCLUDED.display_order;
        `, [s.id, s.title, s.order]);
    }

    // 3. Exact Categories from Screenshot
    const categories = [
        // Clothing
        { id: 'c-shop-all', section: 'clothing', name: 'Shop All', handle: 'womens-shop-all' },
        { id: 'c-leggings', section: 'clothing', name: 'Leggings', handle: 'womens-leggings' },
        { id: 'c-sweatshirts', section: 'clothing', name: 'Sweatshirts & Hoodies', handle: 'womens-sweatshirts-hoodies' },
        { id: 'c-jackets', section: 'clothing', name: 'Jackets & Coats', handle: 'womens-jackets' },
        { id: 'c-tops', section: 'clothing', name: 'Tops & Tanks', handle: 'tops-tanks' },
        { id: 'c-sweatpants', section: 'clothing', name: 'Sweatpants', handle: 'sweatpants' },
        { id: 'c-pants', section: 'clothing', name: 'Pants & Trousers', handle: 'pants-trousers' },
        { id: 'c-bras', section: 'clothing', name: 'Sports Bras', handle: 'sports-bras' },
        { id: 'c-shorts', section: 'clothing', name: 'Shorts', handle: 'shorts' },
        { id: 'c-sweaters', section: 'clothing', name: 'Sweaters & Knitwear', handle: 'sweaters-knitwear' },
        { id: 'c-skirts', section: 'clothing', name: 'Skirts', handle: 'skirts' },
        { id: 'c-dresses', section: 'clothing', name: 'Dresses', handle: 'dresses' },
        { id: 'c-intimates', section: 'clothing', name: 'Intimates', handle: 'intimates' },
        { id: 'c-onesies', section: 'clothing', name: 'Onesies', handle: 'onesies' },

        // New & Trending
        { id: 'nt-sets', section: 'new-trending', name: 'Matching Sets', handle: 'matching-sets' },
        { id: 'nt-new', section: 'new-trending', name: 'New Arrivals', handle: 'new-arrivals' },
        { id: 'nt-bestsellers', section: 'new-trending', name: 'Best Sellers', handle: 'best-sellers' },
        { id: 'nt-travel', section: 'new-trending', name: 'Travel in YOGA', handle: 'travel-in-yoga' },
        { id: 'nt-basics', section: 'new-trending', name: 'Everyday Basics', handle: 'everyday-basics' },
        { id: 'nt-lastfew', section: 'new-trending', name: 'Last Few Pieces', handle: 'almost-gone-1' },
        { id: 'nt-outerwear', section: 'new-trending', name: 'Outerwear Edit', handle: 'outerwear-edit' },
        { id: 'nt-leggings101', section: 'new-trending', name: 'Leggings 101', handle: 'leggings-101' },
        { id: 'nt-start', section: 'new-trending', name: 'New to YOGA? Start Here', handle: 'new-to-yoga' },

        // Shop By Color
        { id: 'col-gravel', section: 'shop-by-color', name: 'Deep Gravel', handle: 'deep-gravel' },
        { id: 'col-moonshadow', section: 'shop-by-color', name: 'Moonshadow Blue', handle: 'moonshadow-blue' },
        { id: 'col-espresso', section: 'shop-by-color', name: 'Espresso', handle: 'espresso-1' },
        { id: 'col-pearl', section: 'shop-by-color', name: 'Frosted Pearl', handle: 'frosted-pearl' },
        { id: 'col-bordeaux', section: 'shop-by-color', name: 'Rich Bordeaux', handle: 'rich-bordeaux' },
        { id: 'col-navy', section: 'shop-by-color', name: 'Navy', handle: 'navy' },
        { id: 'col-ivory', section: 'shop-by-color', name: 'Ivory', handle: 'ivory' },

        // Shop by Activity
        { id: 'act-yoga', section: 'shop-by-activity', name: 'Yoga', handle: 'yoga' },
        { id: 'act-pilates', section: 'shop-by-activity', name: 'Pilates', handle: 'pilates' },
        { id: 'act-run', section: 'shop-by-activity', name: 'Run', handle: 'run' },
        { id: 'act-lounge', section: 'shop-by-activity', name: 'Lounge', handle: 'lounge' },
        { id: 'act-train', section: 'shop-by-activity', name: 'Train', handle: 'train' },
        { id: 'act-court', section: 'shop-by-activity', name: 'Court Sports', handle: 'court-sports' },

        // Accessories
        { id: 'acc-all', section: 'accessories', name: 'Shop All', handle: 'accessories-all' },
        { id: 'acc-hair', section: 'accessories', name: 'Hair Accessories', handle: 'hair-accessories' },
        { id: 'acc-hats', section: 'accessories', name: 'Hats', handle: 'hats' },
        { id: 'acc-socks', section: 'accessories', name: 'Socks', handle: 'socks' },
        { id: 'acc-shoes', section: 'accessories', name: 'Shoes', handle: 'shoes' },
        { id: 'acc-mats', section: 'accessories', name: 'Yoga Mats & Equipment', handle: 'yoga-mats-equipment' },
        { id: 'acc-giftcards', section: 'accessories', name: 'Gift Cards', handle: 'gift-cards' }
    ];

    for (const c of categories) {
        await db.query(`
            INSERT INTO categories (category_id, section_id, name, handle)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (handle) DO UPDATE SET name = EXCLUDED.name, section_id = EXCLUDED.section_id;
        `, [c.id, c.section, c.name, c.handle]);
    }

    // 4. Products from User's Prompt List
    const products = [
        {
            id: 'w9777r-en-pointe-tank',
            title: 'Ribbed En Pointe Tank',
            handle: 'ribbed-en-pointe-tank-espresso',
            catId: 'c-tops',
            color: 'Espresso',
            colorHex: '#362B28',
            mrp: 11100,
            sale: 7650,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Seamless Rib',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w54174r-dreamscape-trouser',
            title: 'High-Waist Dreamscape Trouser (Regular)',
            handle: 'high-waist-dreamscape-trouser-regular-espresso',
            catId: 'c-pants',
            color: 'Espresso',
            colorHex: '#362B28',
            mrp: 20900,
            sale: 14600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Tailored Suiting',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w51432r-suit-up-trouser-bamboo',
            title: 'Suit Up Trouser (Regular)',
            handle: 'suit-up-trouser-regular-bamboo-green',
            catId: 'c-pants',
            color: 'Bamboo Green',
            colorHex: '#4A583B',
            mrp: 20900,
            sale: 14600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Studio Suiting',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w54162r-serenity-sweatpant',
            title: 'Serenity Wide Leg Sweatpant',
            handle: 'serenity-wide-leg-sweatpant-bamboo-green',
            catId: 'c-sweatpants',
            color: 'Bamboo Green',
            colorHex: '#4A583B',
            mrp: 18100,
            sale: 12600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Alosoft French Terry',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w3601r-crop-finesse',
            title: 'Alosoft Crop Finesse Long Sleeve',
            handle: 'alosoft-crop-finesse-long-sleeve-rich-bordeaux',
            catId: 'c-tops',
            color: 'Rich Bordeaux',
            colorHex: '#6B2D5C',
            mrp: 11100,
            sale: 7650,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Alosoft',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u5013rg-accolade-sweatpant',
            title: 'Accolade Sweatpant',
            handle: 'accolade-sweatpant-rich-bordeaux',
            catId: 'c-sweatpants',
            color: 'Rich Bordeaux',
            colorHex: '#6B2D5C',
            mrp: 19500,
            sale: 13600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'French Terry Fleece',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w5604r-airbrush-legging',
            title: '7/8 High-Waist Airbrush Legging',
            handle: '7-8-high-waist-airbrush-legging-bamboo-green',
            catId: 'c-leggings',
            color: 'Bamboo Green',
            colorHex: '#4A583B',
            mrp: 16700,
            sale: 11600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Airbrush',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w51428r-airlift-suit-up-legging',
            title: 'Airlift High-Waist Suit Up Legging',
            handle: 'airlift-high-waist-suit-up-legging-bamboo-green',
            catId: 'c-leggings',
            color: 'Bamboo Green',
            colorHex: '#4A583B',
            mrp: 20400,
            sale: 14200,
            discount: 'Save 30%',
            badge: 'almost gone',
            fabric: 'Airlift',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w4380r-gold-rush-puffer',
            title: 'Gold Rush Puffer',
            handle: 'gold-rush-puffer-espresso',
            catId: 'c-jackets',
            color: 'Espresso',
            colorHex: '#362B28',
            mrp: 28000,
            sale: 19500,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Ripstop Down',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'a1125u-yoga-malibu-boot',
            title: 'YOGA Malibu Recovery Boot',
            handle: 'yoga-recovery-boot-espresso',
            catId: 'acc-shoes',
            color: 'Espresso',
            colorHex: '#362B28',
            mrp: 41700,
            sale: 29100,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Water-Resistant Quilt',
            img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80'
        }
    ];

    for (const p of products) {
        await db.query(`
            INSERT INTO products 
            (product_id, title, handle, category_id, color_family, color_hex, mrp, sale_price, discount_label, badge_label, fabric_technology, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (product_id) DO UPDATE SET 
                title = EXCLUDED.title,
                mrp = EXCLUDED.mrp,
                sale_price = EXCLUDED.sale_price,
                discount_label = EXCLUDED.discount_label,
                badge_label = EXCLUDED.badge_label;
        `, [p.id, p.title, p.handle, p.catId, p.color, p.colorHex, p.mrp, p.sale, p.discount, p.badge, p.fabric, p.img]);
    }

    console.log("✅ Seed completed successfully! All categories & products populated.");
    process.exit(0);
}

seedAll();
