const { Client } = require('pg');

const config = {
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.jpllgkcctxooauynefqp',
    password: 'Oraib@59523',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const catalogSQL = `
-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    category_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    handle VARCHAR(150) NOT NULL UNIQUE,       -- e.g. 'womens-leggings'
    parent_category_id VARCHAR(64) REFERENCES categories(category_id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255) NOT NULL UNIQUE,       -- e.g. 'airlift-high-waist-legging'
    description TEXT,
    category_id VARCHAR(64) REFERENCES categories(category_id) ON DELETE SET NULL,
    fabric_technology VARCHAR(100),            -- e.g. 'Airlift', 'Airbrush', 'Alosoft'
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCT VARIANTS (Color + Size combinations)
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    color_name VARCHAR(100) NOT NULL,          -- e.g. 'Espresso', 'Ballet Pink', 'Black'
    color_hex VARCHAR(20),                     -- e.g. '#362B28'
    size VARCHAR(20) NOT NULL,                 -- e.g. 'XXS', 'XS', 'S', 'M', 'L', 'XL'
    inventory_quantity INT NOT NULL DEFAULT 0,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, color_name, size)
);

-- 4. PRODUCT REVIEWS
CREATE TABLE IF NOT EXISTS product_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(64) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    author_name VARCHAR(150) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    headline VARCHAR(255),
    comment TEXT,
    verified_buyer BOOLEAN DEFAULT TRUE,
    fit_feedback VARCHAR(50),                  -- e.g. 'True to Size', 'Runs Small'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function applyCatalogSchema() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Applying Catalog, Product, Variant, and Review schemas to Supabase...");
        await client.query(catalogSQL);
        console.log("✅ Catalog tables created successfully!");
        
        const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('categories', 'products', 'product_variants', 'product_reviews');
        `);
        console.log("Active tables:", tables.rows.map(r => r.table_name));
        await client.end();
    } catch (e) {
        console.error("Catalog migration error:", e.message);
        try { await client.end(); } catch (err) {}
    }
}

applyCatalogSchema();
