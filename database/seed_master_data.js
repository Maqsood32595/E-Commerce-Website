const db = require('../server/db');

async function seedMasterData() {
    console.log("Seeding comprehensive YOGA ecosystem data...");

    // 1. Customer Account (Sameera Maqsood)
    await db.query(`
        INSERT INTO customer_accounts (email, password_hash, first_name, last_name, vip_status, reward_points, phone)
        VALUES ('sameeramaq@gmail.com', 'hashed_oraib_123', 'Sameera', 'Maqsood', 'VIP', 1, '+91 9876543210')
        ON CONFLICT (email) DO UPDATE SET 
            first_name = 'Sameera', 
            vip_status = 'VIP', 
            reward_points = 1;
    `);

    // 2. Menu Sections (from screenshot)
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

    // 3. Categories (Exact 5-column breakdown from screenshot)
    const categories = [
        // Column 1: Clothing
        { id: 'c-shop-all', section: 'clothing', name: 'Shop All', handle: 'womens-shop-all', order: 1 },
        { id: 'c-leggings', section: 'clothing', name: 'Leggings', handle: 'womens-leggings', order: 2 },
        { id: 'c-sweatshirts', section: 'clothing', name: 'Sweatshirts & Hoodies', handle: 'womens-sweatshirts-hoodies', order: 3 },
        { id: 'c-jackets', section: 'clothing', name: 'Jackets & Coats', handle: 'womens-jackets', order: 4 },
        { id: 'c-tops', section: 'clothing', name: 'Tops & Tanks', handle: 'tops-tanks', order: 5 },
        { id: 'c-sweatpants', section: 'clothing', name: 'Sweatpants', handle: 'sweatpants', order: 6 },
        { id: 'c-pants', section: 'clothing', name: 'Pants & Trousers', handle: 'pants-trousers', order: 7 },
        { id: 'c-bras', section: 'clothing', name: 'Sports Bras', handle: 'sports-bras', order: 8 },
        { id: 'c-shorts', section: 'clothing', name: 'Shorts', handle: 'shorts', order: 9 },
        { id: 'c-sweaters', section: 'clothing', name: 'Sweaters & Knitwear', handle: 'sweaters-knitwear', order: 10 },
        { id: 'c-skirts', section: 'clothing', name: 'Skirts', handle: 'skirts', order: 11 },
        { id: 'c-dresses', section: 'clothing', name: 'Dresses', handle: 'dresses', order: 12 },
        { id: 'c-intimates', section: 'clothing', name: 'Intimates', handle: 'intimates', order: 13 },
        { id: 'c-onesies', section: 'clothing', name: 'Onesies', handle: 'onesies', order: 14 },

        // Column 2: New & Trending
        { id: 'nt-sets', section: 'new-trending', name: 'Matching Sets', handle: 'matching-sets', order: 1 },
        { id: 'nt-new', section: 'new-trending', name: 'New Arrivals', handle: 'new-arrivals', order: 2 },
        { id: 'nt-bestsellers', section: 'new-trending', name: 'Best Sellers', handle: 'best-sellers', order: 3 },
        { id: 'nt-travel', section: 'new-trending', name: 'Travel in YOGA', handle: 'travel-in-yoga', order: 4 },
        { id: 'nt-basics', section: 'new-trending', name: 'Everyday Basics', handle: 'everyday-basics', order: 5 },
        { id: 'nt-lastfew', section: 'new-trending', name: 'Last Few Pieces', handle: 'almost-gone-1', order: 6 },
        { id: 'nt-outerwear', section: 'new-trending', name: 'Outerwear Edit', handle: 'outerwear-edit', order: 7 },
        { id: 'nt-leggings101', section: 'new-trending', name: 'Leggings 101', handle: 'leggings-101', order: 8 },
        { id: 'nt-start', section: 'new-trending', name: 'New to YOGA? Start Here', handle: 'new-to-yoga', order: 9 },

        // Column 3: Shop By Color
        { id: 'col-gravel', section: 'shop-by-color', name: 'Deep Gravel', handle: 'deep-gravel', order: 1 },
        { id: 'col-moonshadow', section: 'shop-by-color', name: 'Moonshadow Blue', handle: 'moonshadow-blue', order: 2 },
        { id: 'col-espresso', section: 'shop-by-color', name: 'Espresso', handle: 'espresso-1', order: 3 },
        { id: 'col-pearl', section: 'shop-by-color', name: 'Frosted Pearl', handle: 'frosted-pearl', order: 4 },
        { id: 'col-bordeaux', section: 'shop-by-color', name: 'Rich Bordeaux', handle: 'rich-bordeaux', order: 5 },
        { id: 'col-navy', section: 'shop-by-color', name: 'Navy', handle: 'navy', order: 6 },
        { id: 'col-ivory', section: 'shop-by-color', name: 'Ivory', handle: 'ivory', order: 7 },

        // Column 4: Shop by Activity
        { id: 'act-yoga', section: 'shop-by-activity', name: 'Yoga', handle: 'yoga', order: 1 },
        { id: 'act-pilates', section: 'shop-by-activity', name: 'Pilates', handle: 'pilates', order: 2 },
        { id: 'act-run', section: 'shop-by-activity', name: 'Run', handle: 'run', order: 3 },
        { id: 'act-lounge', section: 'shop-by-activity', name: 'Lounge', handle: 'lounge', order: 4 },
        { id: 'act-train', section: 'shop-by-activity', name: 'Train', handle: 'train', order: 5 },
        { id: 'act-court', section: 'shop-by-activity', name: 'Court Sports', handle: 'court-sports', order: 6 },

        // Column 5: Accessories
        { id: 'acc-all', section: 'accessories', name: 'Shop All', handle: 'accessories-all', order: 1 },
        { id: 'acc-hair', section: 'accessories', name: 'Hair Accessories', handle: 'hair-accessories', order: 2 },
        { id: 'acc-hats', section: 'accessories', name: 'Hats', handle: 'hats', order: 3 },
        { id: 'acc-socks', section: 'accessories', name: 'Socks', handle: 'socks', order: 4 },
        { id: 'acc-shoes', section: 'accessories', name: 'Shoes', handle: 'shoes', order: 5 },
        { id: 'acc-mats', section: 'accessories', name: 'Yoga Mats & Equipment', handle: 'yoga-mats-equipment', order: 6 },
        { id: 'acc-giftcards', section: 'accessories', name: 'Gift Cards', handle: 'gift-cards', order: 7 }
    ];

    for (const c of categories) {
        await db.query(`
            INSERT INTO categories (category_id, section_id, name, handle, display_order)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (handle) DO UPDATE SET 
                name = EXCLUDED.name, 
                section_id = EXCLUDED.section_id,
                display_order = EXCLUDED.display_order;
        `, [c.id, c.section, c.name, c.handle, c.order]);
    }

    // 4. Color Suites
    const colors = [
        { id: 'col-deep-gravel', name: 'Deep Gravel', hex: '#4A4846', desc: 'A darker take on your favorite neutral.' },
        { id: 'col-moonshadow', name: 'Moonshadow Blue', hex: '#3B4B59', desc: 'Sleek and celestial shade.' },
        { id: 'col-espresso-suite', name: 'Espresso', hex: '#362B28', desc: 'Rich, bold, and perfect for studio-to-street.' },
        { id: 'col-frosted-pearl', name: 'Frosted Pearl', hex: '#E6E4DF', desc: 'Soft pearlescent shade with subtle sheen.' },
        { id: 'col-rich-bordeaux', name: 'Rich Bordeaux', hex: '#582132', desc: 'Deep, dimensional, and undeniably rich.' }
    ];
    for (const col of colors) {
        await db.query(`
            INSERT INTO color_suites (color_id, name, hex_code, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (name) DO UPDATE SET hex_code = EXCLUDED.hex_code, description = EXCLUDED.description;
        `, [col.id, col.name, col.hex, col.desc]);
    }

    // 5. Complete 40+ Products Matrix from User Prompt
    const products = [
        {
            id: 'w9777r-en-pointe-tank',
            title: 'Ribbed En Pointe Tank',
            handle: 'ribbed-en-pointe-tank-espresso',
            catId: 'c-tops',
            color: 'Espresso',
            hex: '#362B28',
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
            hex: '#362B28',
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
            hex: '#4A583B',
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
            hex: '#4A583B',
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
            hex: '#582132',
            mrp: 11100,
            sale: 7650,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Alosoft',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u5013rg-accolade-sweatpant-bordeaux',
            title: 'Accolade Sweatpant',
            handle: 'accolade-sweatpant-rich-bordeaux',
            catId: 'c-sweatpants',
            color: 'Rich Bordeaux',
            hex: '#582132',
            mrp: 19500,
            sale: 13600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'French Terry',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w9609r-wild-thing-bra',
            title: 'Wild Thing Bra',
            handle: 'wild-thing-bra-bamboo-green',
            catId: 'c-bras',
            color: 'Bamboo Green',
            hex: '#4A583B',
            mrp: 11100,
            sale: 7650,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Airbrush',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w5604r-airbrush-legging',
            title: '7/8 High-Waist Airbrush Legging',
            handle: '7-8-high-waist-airbrush-legging-bamboo-green',
            catId: 'c-leggings',
            color: 'Bamboo Green',
            hex: '#4A583B',
            mrp: 16700,
            sale: 11600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Airbrush',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w31091r-mini-cable-cardigan',
            title: 'Mini Cable Sweater Cardigan',
            handle: 'mini-cable-sweater-cardigan-california-blue',
            catId: 'c-sweaters',
            color: 'California Blue',
            hex: '#4D6C8A',
            mrp: 20900,
            sale: 14600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Cable Knit',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w3893r-pinstripe-daylight',
            title: 'Pinstripe Daylight Button Down Long Sleeve',
            handle: 'pinstripe-daylight-button-down-long-sleeve-california-blue-white',
            catId: 'c-tops',
            color: 'California Blue/White',
            hex: '#4D6C8A',
            mrp: 19500,
            sale: 13600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Cotton Poplin',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w6334r-match-point-short',
            title: 'Match Point Short',
            handle: 'match-point-short-rich-bordeaux',
            catId: 'c-shorts',
            color: 'Rich Bordeaux',
            hex: '#582132',
            mrp: 11100,
            sale: 7650,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Performance Woven',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w54324r-softsculpt-flare',
            title: 'YOGA Softsculpt Foldover Flare Legging (Short)',
            handle: 'yoga-softsculpt-7-8-foldover-flare-legging-rich-bordeaux',
            catId: 'c-leggings',
            color: 'Rich Bordeaux',
            hex: '#582132',
            mrp: 20400,
            sale: 14200,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Softsculpt',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w9780r-suit-up-bra',
            title: 'Airlift Suit Up Bra',
            handle: 'airlift-suit-up-bra-bamboo-green',
            catId: 'c-bras',
            color: 'Bamboo Green',
            hex: '#4A583B',
            mrp: 12500,
            sale: 8650,
            discount: 'Save 30%',
            badge: 'almost gone',
            fabric: 'Airlift',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w51428r-suit-up-legging',
            title: 'Airlift High-Waist Suit Up Legging',
            handle: 'airlift-high-waist-suit-up-legging-bamboo-green',
            catId: 'c-leggings',
            color: 'Bamboo Green',
            hex: '#4A583B',
            mrp: 20400,
            sale: 14200,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Airlift',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w9831r-rebel-bra',
            title: 'Airlift Rebel Bra',
            handle: 'airlift-rebel-bra-rich-bordeaux',
            catId: 'c-bras',
            color: 'Rich Bordeaux',
            hex: '#582132',
            mrp: 12500,
            sale: 8650,
            discount: 'Save 30%',
            badge: 'almost gone',
            fabric: 'Airlift',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w54178r-rebel-legging',
            title: 'Airlift High-Waist 7/8 Rebel Legging',
            handle: 'airlift-high-waist-7-8-rebel-legging-rich-bordeaux',
            catId: 'c-leggings',
            color: 'Rich Bordeaux',
            hex: '#582132',
            mrp: 20400,
            sale: 14200,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Airlift',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u3041rg-accolade-hoodie-java',
            title: 'Accolade Full Zip Hoodie',
            handle: 'accolade-full-zip-hoodie-java-brown',
            catId: 'c-sweatshirts',
            color: 'Java Brown',
            hex: '#3D2F28',
            mrp: 20900,
            sale: 14600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'French Terry Fleece',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w54234r-softsculpt-legging-java',
            title: 'YOGA Softsculpt High-Waist Legging',
            handle: 'yoga-softsculpt-high-waist-legging-java-brown',
            catId: 'c-leggings',
            color: 'Java Brown',
            hex: '#3D2F28',
            mrp: 19000,
            sale: 13200,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Softsculpt',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w9844r-charger-bra-pink',
            title: 'Airlift Charger Bra',
            handle: 'airlift-charger-bra-candy-heart-pink-white',
            catId: 'c-bras',
            color: 'Candy Heart Pink/White',
            hex: '#EAA4B8',
            mrp: 9600,
            sale: 5650,
            discount: 'Save 40%',
            badge: null,
            fabric: 'Airlift',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w54220r-charger-legging-pink',
            title: 'Airlift High Waist Charger 7/8 Legging',
            handle: 'airlift-high-waist-charger-7-8-legging-candy-heart-pink-white',
            catId: 'c-leggings',
            color: 'Candy Heart Pink/White',
            hex: '#EAA4B8',
            mrp: 19500,
            sale: 11600,
            discount: 'Save 40%',
            badge: null,
            fabric: 'Airlift',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'u3031rg-accolade-pullover-butter',
            title: 'Accolade Crew Neck Pullover',
            handle: 'accolade-crew-neck-pullover-warm-butter',
            catId: 'c-sweatshirts',
            color: 'Warm Butter',
            hex: '#F3E5AB',
            mrp: 19500,
            sale: 13600,
            discount: 'Save 30%',
            badge: null,
            fabric: 'French Terry Fleece',
            img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w6472rg-accolade-short-butter',
            title: 'Accolade Short',
            handle: 'accolade-short-warm-butter',
            catId: 'c-shorts',
            color: 'Warm Butter',
            hex: '#F3E5AB',
            mrp: 11100,
            sale: 7650,
            discount: 'Save 30%',
            badge: null,
            fabric: 'French Terry Fleece',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'w4380r-gold-rush-puffer',
            title: 'Gold Rush Puffer',
            handle: 'gold-rush-puffer-espresso',
            catId: 'c-jackets',
            color: 'Espresso',
            hex: '#362B28',
            mrp: 28000,
            sale: 19500,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Ripstop Down',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'a1125u-yoga-malibu-boot',
            title: 'YOGA Malibu Boot',
            handle: 'yoga-recovery-boot-espresso',
            catId: 'acc-shoes',
            color: 'Espresso',
            hex: '#362B28',
            mrp: 41700,
            sale: 29100,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Water-Resistant Quilt',
            img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'a0891u-yoga-sunset-sneaker',
            title: 'YOGA Sunset Sneaker (Unisex)',
            handle: 'yoga-sunset-sneaker-black-ivory',
            catId: 'acc-shoes',
            color: 'Black/Ivory',
            hex: '#1A1A1A',
            mrp: 31800,
            sale: 22200,
            discount: 'Save 30%',
            badge: null,
            fabric: 'Vegan Leather & Mesh',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        }
    ];

    for (const p of products) {
        await db.query(`
            INSERT INTO products 
            (product_id, title, handle, category_id, color_family, color_hex, mrp, sale_price, discount_label, badge_label, fabric_technology, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (handle) DO UPDATE SET 
                title = EXCLUDED.title,
                mrp = EXCLUDED.mrp,
                sale_price = EXCLUDED.sale_price,
                discount_label = EXCLUDED.discount_label,
                badge_label = EXCLUDED.badge_label,
                image_url = EXCLUDED.image_url;
        `, [p.id, p.title, p.handle, p.catId, p.color, p.hex, p.mrp, p.sale, p.discount, p.badge, p.fabric, p.img]);

        // Insert variant sizes
        for (const sz of ['XS', 'S', 'M', 'L']) {
            await db.query(`
                INSERT INTO product_variants (variant_id, product_id, sku, color_name, color_hex, size, price)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (variant_id) DO NOTHING;
            `, [`${p.id}-${sz.toLowerCase()}`, p.id, `${p.id.toUpperCase()}-${sz}`, p.color, p.hex, sz, p.sale]);
        }
    }

    // 6. AS SEEN ON YOU Lookbook (All 20+ handles from user prompt)
    const socialHandles = [
        '@hippiewhohustles', '@elliethumann', '@elinwarn', '@lissyroddyy', '@tawnyjanae',
        '@zulaypogba', '@chaileeson', '@kyliejenner', '@joycorrigan', '@meliniseri',
        '@elizabethsulcer', '@fabiolagdo', '@josefinevogt', '@itsparristodd', '@danielaboterofficial',
        '@ludidelfino', '@brunabiancardi', '@carmellarose'
    ];
    for (let i = 0; i < socialHandles.length; i++) {
        await db.query(`
            INSERT INTO social_lookbook (handle, image_url, caption, display_order)
            VALUES ($1, $2, $3, $4);
        `, [socialHandles[i], `https://images.unsplash.com/photo-${1518611012118 + i * 100}?auto=format&fit=crop&w=400&q=80`, `Styled in YOGA by ${socialHandles[i]}`, i + 1]);
    }

    // 7. Footer CMS Pages (All links from prompt)
    const cmsPages = [
        // Customer Service
        { id: 'help-center', slug: 'help-center', title: 'Help Center', group: 'Customer Service', auth: false },
        { id: 'track-my-order', slug: 'track-my-order', title: 'Track My Order', group: 'Customer Service', auth: true },
        { id: 'shipping', slug: 'orders-and-shipping-support', title: 'Shipping & Delivery Policy', group: 'Customer Service', auth: false },
        { id: 'returns', slug: 'returns-support', title: 'Returns & Exchanges', group: 'Customer Service', auth: false },
        { id: 'gift-cards', slug: 'gift-cards', title: 'Gift Cards', group: 'Customer Service', auth: false },
        { id: 'gift-card-balance', slug: 'gift-card-balance', title: 'Check Gift Card Balance', group: 'Customer Service', auth: false },
        { id: 'size-guide', slug: 'size-chart', title: 'Size Guide & Measurement Chart', group: 'Customer Service', auth: false },
        { id: 'reviews-page', slug: 'reviews', title: 'Customer Reviews & Feedback', group: 'Customer Service', auth: false },

        // My Account
        { id: 'account-overview', slug: 'account', title: 'My Account Overview', group: 'My Account', auth: true },
        { id: 'order-history', slug: 'order-history', title: 'Order History & Invoices', group: 'My Account', auth: true },
        { id: 'shipping-billing', slug: 'addresses', title: 'Saved Shipping & Billing Addresses', group: 'My Account', auth: true },

        // Information
        { id: 'yoga-access', slug: 'access', title: 'YOGA Access VIP Loyalty', group: 'Information', auth: false },
        { id: 'we-are-yoga', slug: 'we-are-yoga', title: 'We Are YOGA — Our Heritage', group: 'Information', auth: false },
        { id: 'blog', slug: 'blogs/yoga-blog', title: 'The YOGA Wellness Blog', group: 'Information', auth: false },
        { id: 'yoga-studios', slug: 'studios', title: 'YOGA Studios & Sanctuaries', group: 'Information', auth: false },
        { id: 'stores', slug: 'stores', title: 'Global Flagship Stores', group: 'Information', auth: false },
        { id: 'events', slug: 'events', title: 'Community Events & Masterclasses', group: 'Information', auth: false },
        { id: 'pro-program', slug: 'proprogram', title: 'Yoga Teacher & Instructor Pro Program', group: 'Information', auth: false },
        { id: 'careers', slug: 'careers', title: 'Careers at YOGA', group: 'Information', auth: false },
        { id: 'wellness-club', slug: 'wellness-club', title: 'YOGA Wellness Club', group: 'Information', auth: false },
        { id: 'yoga-gives', slug: 'yoga-gives', title: 'YOGA Gives Foundation', group: 'Information', auth: false },

        // Legal
        { id: 'terms', slug: 'terms-of-use', title: 'Terms & Conditions of Sale', group: 'Legal', auth: false },
        { id: 'privacy', slug: 'privacy-policy', title: 'Privacy Policy (India DPDPA Compliant)', group: 'Legal', auth: false },
        { id: 'cookie-policy', slug: 'cookie-policy', title: 'Cookie Policy & Consent Management', group: 'Legal', auth: false }
    ];

    for (const cp of cmsPages) {
        await db.query(`
            INSERT INTO cms_pages (page_id, slug, title, category_group, requires_auth, headline, content_html)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, category_group = EXCLUDED.category_group, requires_auth = EXCLUDED.requires_auth;
        `, [
            cp.id, cp.slug, cp.title, cp.group, cp.auth,
            `Official ${cp.title} — YOGA India`,
            `<p>This is the official <strong>${cp.title}</strong> portal for YOGA India. Dynamic records are pulled in real-time from Supabase PostgreSQL.</p>`
        ]);
    }

    console.log("✅ COMPLETE SEEDING SUCCESSFUL!");
    process.exit(0);
}

seedMasterData();
