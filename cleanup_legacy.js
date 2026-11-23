const db = require('./server/db');

async function cleanAll() {
    await db.query(`DELETE FROM product_reviews WHERE product_id LIKE '%piet%'`);
    await db.query(`DELETE FROM product_variants WHERE product_id LIKE '%piet%'`);
    await db.query(`DELETE FROM product_variant_media_mapping WHERE product_id LIKE '%piet%'`);
    await db.query(`DELETE FROM product_media WHERE storage_key LIKE '%piet%'`);
    await db.query(`DELETE FROM products WHERE product_id LIKE '%piet%'`);
    await db.query(`DELETE FROM admin_sessions WHERE admin_id IN (SELECT admin_id FROM admin_users WHERE email LIKE '%piet%')`);
    await db.query(`DELETE FROM admin_users WHERE email LIKE '%piet%'`);
    console.log("All legacy test entries wiped clean.");
    process.exit(0);
}

cleanAll();
