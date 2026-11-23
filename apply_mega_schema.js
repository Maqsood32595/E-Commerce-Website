const { Client } = require('pg');

const config = {
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.jpllgkcctxooauynefqp',
    password: 'Oraib@59523',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const megaSchemaSQL = `
-- ==============================================================================
-- YOGA LUXURY E-COMMERCE COMPREHENSIVE RESTRUCTURED SCHEMA
-- ==============================================================================

-- 1. MEGA MENU GROUPS & TAXONOMY (Clothing, New & Trending, Shop By Color, Activity, Accessories)
CREATE TABLE IF NOT EXISTS menu_sections (
    section_id VARCHAR(64) PRIMARY KEY,        -- e.g. 'clothing', 'new-trending', 'shop-by-color', 'shop-by-activity', 'accessories'
    title VARCHAR(150) NOT NULL,
    display_order INT DEFAULT 0,
    gender VARCHAR(20) DEFAULT 'women',        -- 'women', 'men', 'shoes', 'gift-guide'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DYNAMIC CATEGORIES (Populated via Admin Bulk Upload & Shown in Mega Menu)
CREATE TABLE IF NOT EXISTS categories (
    category_id VARCHAR(64) PRIMARY KEY,
    section_id VARCHAR(64) REFERENCES menu_sections(section_id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    handle VARCHAR(150) NOT NULL UNIQUE,       -- e.g. 'leggings', 'matching-sets', 'espresso', 'yoga'
    tagline TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CUSTOMER ACCOUNTS (Loyalty: Points & VIP Status)
CREATE TABLE IF NOT EXISTS customer_accounts (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    vip_status VARCHAR(50) DEFAULT 'VIP',      -- e.g. 'VIP', 'A-List', 'All-Access'
    reward_points INT DEFAULT 1,               -- Matches '1 PT' in screenshot
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 4. PRODUCTS MATRIX (Over 30+ products from live Alo audit)
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255) NOT NULL UNIQUE,
    category_id VARCHAR(64) REFERENCES categories(category_id) ON DELETE SET NULL,
    color_family VARCHAR(100),                 -- 'Espresso', 'Bamboo Green', 'Rich Bordeaux', 'California Blue', 'Warm Butter', etc.
    color_hex VARCHAR(20),
    mrp NUMERIC(10,2) NOT NULL DEFAULT 0.00,    -- Strike-through price e.g. ₹11,100
    sale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Discounted price e.g. ₹7,650
    discount_label VARCHAR(50) DEFAULT 'Save 30%',
    badge_label VARCHAR(50),                   -- 'almost gone', 'NEW', 'Last Few Pieces'
    fabric_technology VARCHAR(100),            -- 'Airlift', 'Airbrush', 'Alosoft', 'Accolade', 'Softsculpt'
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CONTENT PAGES (For empty placeholder views that fill dynamically)
CREATE TABLE IF NOT EXISTS cms_pages (
    page_id VARCHAR(64) PRIMARY KEY,           -- e.g. 'size-guide', 'help-center', 'reviews', 'studios', 'careers'
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category_group VARCHAR(100),               -- 'Customer Service', 'My Account', 'Information'
    content_html TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function applyMegaSchema() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Applying Mega Menu, Categories, Customers & Product schemas to Supabase...");
        await client.query(megaSchemaSQL);
        console.log("✅ Schemas applied successfully!");
        await client.end();
    } catch (e) {
        console.error("Schema migration error:", e.message);
        try { await client.end(); } catch (err) {}
    }
}

applyMegaSchema();
