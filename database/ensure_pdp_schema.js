const db = require('../server/db');

async function ensurePdpSchema() {
    try {
        console.log('Ensuring PDP columns in products table...');
        await db.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS fit_details TEXT,
            ADD COLUMN IF NOT EXISTS fabrication_details TEXT,
            ADD COLUMN IF NOT EXISTS features_blueprint JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS comparison_data JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS styling_looks JSONB DEFAULT '[]'::jsonb;
        `);

        console.log('Ensuring product_reviews table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS product_reviews (
                review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id VARCHAR(64) NOT NULL,
                author_name VARCHAR(100) NOT NULL,
                rating INT NOT NULL DEFAULT 5,
                headline VARCHAR(255),
                comment TEXT,
                fit_feedback VARCHAR(100) DEFAULT 'True to size',
                size_ordered VARCHAR(50),
                usual_size VARCHAR(50),
                helpful_count INT DEFAULT 0,
                is_verified BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE product_reviews 
            ADD COLUMN IF NOT EXISTS size_ordered VARCHAR(50),
            ADD COLUMN IF NOT EXISTS usual_size VARCHAR(50),
            ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
        `);

        console.log('PDP schema migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

ensurePdpSchema();
