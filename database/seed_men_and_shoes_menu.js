const db = require('../server/db');

async function seedMenAndShoesMenu() {
    console.log("Seeding MEN & SHOES mega-menu sections and categories into Supabase...");

    // 1. Menu Sections
    const sections = [
        // Men's 4 columns
        { section_id: 'men-clothing', title: 'Clothing', display_order: 1, gender: 'men' },
        { section_id: 'men-highlights', title: 'Highlights', display_order: 2, gender: 'men' },
        { section_id: 'men-activity', title: 'Shop by Activity', display_order: 3, gender: 'men' },
        { section_id: 'men-accessories', title: 'Accessories', display_order: 4, gender: 'men' },
        // Shoes
        { section_id: 'shoes-categories', title: 'Shop Shoes', display_order: 1, gender: 'shoes' }
    ];

    for (const sec of sections) {
        await db.query(`
            INSERT INTO menu_sections (section_id, title, display_order, gender, is_active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (section_id) DO UPDATE SET title = EXCLUDED.title, display_order = EXCLUDED.display_order, gender = EXCLUDED.gender;
        `, [sec.section_id, sec.title, sec.display_order, sec.gender]);
    }

    // 2. Categories
    const categories = [
        // Men -> Clothing
        { category_id: 'men-shop-all', name: 'Shop All', handle: 'mens-shop-all', section_id: 'men-clothing', display_order: 1 },
        { category_id: 'men-sweatshirts-hoodies', name: 'Sweatshirts & Hoodies', handle: 'mens-sweatshirts-hoodies', section_id: 'men-clothing', display_order: 2 },
        { category_id: 'men-shirts', name: 'Shirts', handle: 'mens-shirts', section_id: 'men-clothing', display_order: 3 },
        { category_id: 'men-sweatpants', name: 'Sweatpants', handle: 'mens-sweatpants', section_id: 'men-clothing', display_order: 4 },
        { category_id: 'men-pants', name: 'Pants', handle: 'mens-pants', section_id: 'men-clothing', display_order: 5 },
        { category_id: 'men-jackets', name: 'Jackets', handle: 'mens-jackets', section_id: 'men-clothing', display_order: 6 },
        { category_id: 'men-shorts', name: 'Shorts', handle: 'mens-shorts', section_id: 'men-clothing', display_order: 7 },
        { category_id: 'men-sweaters', name: 'Sweaters', handle: 'mens-sweaters', section_id: 'men-clothing', display_order: 8 },
        { category_id: 'men-boxers', name: 'Boxers', handle: 'mens-boxers', section_id: 'men-clothing', display_order: 9 },

        // Men -> Highlights
        { category_id: 'men-best-sellers', name: 'Best Sellers', handle: 'mens-bestsellers', section_id: 'men-highlights', display_order: 1 },
        { category_id: 'men-new-arrivals', name: 'New Arrivals', handle: 'mens-new-arrivals', section_id: 'men-highlights', display_order: 2 },
        { category_id: 'men-explore-mens', name: 'Explore Men\'s', handle: 'explore-mens', section_id: 'men-highlights', display_order: 3 },
        { category_id: 'men-almost-gone', name: 'Almost Gone', handle: 'mens-almost-gone', section_id: 'men-highlights', display_order: 4 },
        { category_id: 'men-new-to-yoga', name: 'New to YOGA? Start Here', handle: 'new-to-yoga-men', section_id: 'men-highlights', display_order: 5 },

        // Men -> Shop by Activity
        { category_id: 'men-activity-train', name: 'Train', handle: 'mens-train', section_id: 'men-activity', display_order: 1 },
        { category_id: 'men-activity-run', name: 'Run', handle: 'mens-run', section_id: 'men-activity', display_order: 2 },
        { category_id: 'men-activity-tennis', name: 'Tennis', handle: 'mens-tennis', section_id: 'men-activity', display_order: 3 },
        { category_id: 'men-activity-yoga', name: 'Yoga', handle: 'mens-yoga', section_id: 'men-activity', display_order: 4 },
        { category_id: 'men-activity-recovery', name: 'Recovery', handle: 'mens-recovery', section_id: 'men-activity', display_order: 5 },

        // Men -> Accessories
        { category_id: 'men-acc-shop-all', name: 'Shop All', handle: 'mens-accessories-all', section_id: 'men-accessories', display_order: 1 },
        { category_id: 'men-acc-hats', name: 'Hats', handle: 'mens-hats', section_id: 'men-accessories', display_order: 2 },
        { category_id: 'men-acc-shoes', name: 'Shoes', handle: 'mens-shoes', section_id: 'men-accessories', display_order: 3 },
        { category_id: 'men-acc-socks', name: 'Socks', handle: 'mens-socks', section_id: 'men-accessories', display_order: 4 },
        { category_id: 'men-acc-mats-equipment', name: 'Yoga Mats & Equipment', handle: 'mens-yoga-mats', section_id: 'men-accessories', display_order: 5 },
        { category_id: 'men-acc-gift-cards', name: 'Gift Cards', handle: 'mens-gift-cards', section_id: 'men-accessories', display_order: 6 },

        // Shoes -> Categories
        { category_id: 'shoes-shop-all', name: 'Shop All', handle: 'shoes-shop-all', section_id: 'shoes-categories', display_order: 1 },
        { category_id: 'shoes-sneakers', name: 'Sneakers', handle: 'shoes-sneakers', section_id: 'shoes-categories', display_order: 2 },
        { category_id: 'shoes-slippers-slides', name: 'Slippers & Slides', handle: 'shoes-slippers-slides', section_id: 'shoes-categories', display_order: 3 },
        { category_id: 'shoes-boots', name: 'Boots', handle: 'shoes-boots', section_id: 'shoes-categories', display_order: 4 },
        { category_id: 'shoes-explore-collection', name: 'Explore The Collection', handle: 'shoes-explore-collection', section_id: 'shoes-categories', display_order: 5 }
    ];

    for (const cat of categories) {
        await db.query(`
            INSERT INTO categories (category_id, name, handle, section_id, display_order, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (category_id) DO UPDATE SET
                name = EXCLUDED.name,
                handle = EXCLUDED.handle,
                section_id = EXCLUDED.section_id,
                display_order = EXCLUDED.display_order;
        `, [cat.category_id, cat.name, cat.handle, cat.section_id, cat.display_order]);
    }

    // 3. Featured Shoes Products
    const shoeProducts = [
        {
            id: 'a0892u-yoga-sherpa-sunset-mule',
            title: 'YOGA Sherpa Sunset Sneaker Mule',
            handle: 'yoga-sherpa-sunset-sneaker-mule',
            category_id: 'shoes-slippers-slides',
            color: 'Tan / Warm Sherpa',
            color_hex: '#C5A880',
            mrp: 31800.00,
            sale_price: 22200.00,
            image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'a1126u-yoga-aspen-lace-up-boot',
            title: 'YOGA Aspen Lace-Up Boot',
            handle: 'yoga-aspen-lace-up-boot',
            category_id: 'shoes-boots',
            color: 'Alpine White / Shearling',
            color_hex: '#F9F8F6',
            mrp: 41700.00,
            sale_price: 29100.00,
            image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'a0893u-yoga-runner-white',
            title: 'YOGA Runner',
            handle: 'yoga-runner',
            category_id: 'shoes-sneakers',
            color: 'Crisp White',
            color_hex: '#FFFFFF',
            mrp: 24900.00,
            sale_price: 17400.00,
            image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
        }
    ];

    for (const p of shoeProducts) {
        await db.query(`
            INSERT INTO products (
                product_id, title, handle, category_id, fabric_technology,
                color_family, color_hex, mrp, sale_price, discount_label, image_url, is_active
            ) VALUES ($1, $2, $3, $4, 'Performance Rubber & Sherpa', $5, $6, $7, $8, 'Save 30%', $9, true)
            ON CONFLICT (handle) DO UPDATE SET
                title = EXCLUDED.title,
                color_family = EXCLUDED.color_family,
                color_hex = EXCLUDED.color_hex,
                mrp = EXCLUDED.mrp,
                sale_price = EXCLUDED.sale_price,
                image_url = EXCLUDED.image_url;
        `, [p.id, p.title, p.handle, p.category_id, p.color, p.color_hex, p.mrp, p.sale_price, p.image_url]);
    }

    console.log("✅ MEN and SHOES mega-menu sections, categories, and featured shoes seeded successfully!");
    process.exit(0);
}

seedMenAndShoesMenu().catch(err => {
    console.error(err);
    process.exit(1);
});
