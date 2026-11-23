const db = require('../server/db');

async function seedGiftGuide() {
    console.log('🎁 Seeding Gift Guide taxonomy into Supabase PostgreSQL...');
    try {
        // 1. Menu Section for Gift Guide
        await db.query(`
            INSERT INTO menu_sections (section_id, title, display_order, gender, is_active)
            VALUES ('gift-guide-categories', 'Gift Guide', 1, 'gift', true)
            ON CONFLICT (section_id) DO UPDATE SET title = EXCLUDED.title, gender = EXCLUDED.gender, is_active = true;
        `);
        console.log('   ✓ menu_sections row for [GIFT] created.');

        // 2. Categories for Gift Guide (5 categories)
        const giftCats = [
            { id: 'gift-shop-all', name: 'Shop All Gifts', handle: 'gift-shop-all', order: 1 },
            { id: 'gift-for-her', name: 'Gifts For Her', handle: 'gifts-for-her', order: 2 },
            { id: 'gift-for-him', name: 'Gifts For Him', handle: 'gifts-for-him', order: 3 },
            { id: 'gift-top-rated', name: 'Top Rated Gifts', handle: 'top-rated-gifts', order: 4 },
            { id: 'gift-cards-guide', name: 'Gift Cards', handle: 'gift-cards-guide', order: 5 }
        ];

        for (const c of giftCats) {
            await db.query(`
                INSERT INTO categories (category_id, section_id, name, handle, display_order, is_active)
                VALUES ($1, 'gift-guide-categories', $2, $3, $4, true)
                ON CONFLICT (category_id) DO UPDATE SET name = EXCLUDED.name, handle = EXCLUDED.handle, section_id = 'gift-guide-categories';
            `, [c.id, c.name, c.handle, c.order]);
            console.log(`   ✓ Category: ${c.name} (${c.handle})`);
        }

        console.log('✅ Gift Guide taxonomy seeding complete!\n');
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
        throw err;
    } finally {
        process.exit(0);
    }
}

seedGiftGuide();
