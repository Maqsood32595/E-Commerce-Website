-- ==============================================================================
-- YOGA MASTER COMPREHENSIVE DATABASE SCHEMA (v3.0)
-- Target: Supabase PostgreSQL 17.12
-- Scope: Complete taxonomy, 40+ products, customer loyalty, CMS pages,
--        navigation menus, footer links, and switchable PIET test hooks.
-- ==============================================================================

-- 1. DROP / CLEANUP OBSOLETE CONSTRAINTS (IF NEEDED)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vip_tier_enum') THEN
        CREATE TYPE vip_tier_enum AS ENUM ('Member', 'VIP', 'A-List', 'All-Access');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_type_enum') THEN
        CREATE TYPE page_type_enum AS ENUM ('home', 'plp', 'pdp', 'cart', 'checkout', 'account', 'cms', 'category');
    END IF;
END $$;

-- 3. CUSTOMER ACCOUNTS & LOYALTY (Hi Sameera! | 1 PT VIP)
CREATE TABLE IF NOT EXISTS customer_accounts (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    vip_status vip_tier_enum DEFAULT 'VIP',
    reward_points INT DEFAULT 1,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. MEGA MENU SECTIONS (Clothing, New & Trending, Shop By Color, Activity, Accessories)
CREATE TABLE IF NOT EXISTS menu_sections (
    section_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    display_order INT DEFAULT 0,
    gender VARCHAR(50) DEFAULT 'women',        -- 'women', 'men', 'shoes', 'gift-guide'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CATEGORIES & TAXONOMY (Populated dynamically via Admin Bulk Upload)
CREATE TABLE IF NOT EXISTS categories (
    category_id VARCHAR(64) PRIMARY KEY,
    section_id VARCHAR(64) REFERENCES menu_sections(section_id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    handle VARCHAR(150) NOT NULL UNIQUE,
    tagline TEXT,
    banner_image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. COLOR SUITES (Deep Gravel, Moonshadow Blue, Espresso, Frosted Pearl, Rich Bordeaux, etc.)
CREATE TABLE IF NOT EXISTS color_suites (
    color_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    hex_code VARCHAR(20) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. MASTER PRODUCTS TABLE (All 40+ products from prompt)
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255) NOT NULL UNIQUE,
    category_id VARCHAR(64) REFERENCES categories(category_id) ON DELETE SET NULL,
    color_family VARCHAR(100) NOT NULL,        -- e.g. 'Espresso', 'Bamboo Green', 'Rich Bordeaux'
    color_hex VARCHAR(20) NOT NULL,
    mrp NUMERIC(10,2) NOT NULL DEFAULT 0.00,    -- e.g. 11100.00
    sale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- e.g. 7650.00
    discount_label VARCHAR(50) DEFAULT 'Save 30%',
    badge_label VARCHAR(50),                   -- 'almost gone', 'NEW', 'Last Few Pieces'
    fabric_technology VARCHAR(100),            -- 'Airlift', 'Airbrush', 'Alosoft', 'Accolade', 'Softsculpt'
    image_url TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRODUCT VARIANTS (Sizes XXS, XS, S, M, L, XL, Short, Regular, 5mm)
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    color_name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(20),
    size VARCHAR(30) NOT NULL,
    inventory_quantity INT NOT NULL DEFAULT 50,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. AS SEEN ON YOU (Community & Social Lookbook)
CREATE TABLE IF NOT EXISTS social_lookbook (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle VARCHAR(100) NOT NULL,              -- e.g. '@hippiewhohustles', '@kyliejenner'
    image_url TEXT NOT NULL,
    caption TEXT,
    tagged_product_id VARCHAR(64) REFERENCES products(product_id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. CMS & FOOTER LINKS (All links clickable with placeholders)
CREATE TABLE IF NOT EXISTS cms_pages (
    page_id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    category_group VARCHAR(100) NOT NULL,      -- 'Customer Service', 'My Account', 'Information', 'Legal'
    requires_auth BOOLEAN DEFAULT FALSE,       -- Auth gated pages (e.g. Order History, Shipping Addresses)
    headline VARCHAR(255),
    content_html TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. CLICKSTREAM TELEMETRY (Tracks Every Click)
CREATE TABLE IF NOT EXISTS click_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    visitor_id UUID,
    user_id UUID,
    page_type page_type_enum DEFAULT 'home',
    current_url TEXT NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    element_id VARCHAR(150),
    element_tag VARCHAR(50),
    element_text VARCHAR(255),
    click_x INT,
    click_y INT,
    viewport_scroll_depth_pct NUMERIC(5,2),
    action_name VARCHAR(120) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. CARTS & ORDERS (3-Step Localized Checkout)
CREATE TABLE IF NOT EXISTS carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    visitor_id UUID,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'active',
    applied_coupon_code VARCHAR(50),
    discount_total NUMERIC(10,2) DEFAULT 0.00,
    subtotal NUMERIC(10,2) DEFAULT 0.00,
    shipping_fee NUMERIC(10,2) DEFAULT 0.00,
    grand_total NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    variant_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    color_name VARCHAR(100) NOT NULL,
    size VARCHAR(30) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    line_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(cart_id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50),
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    discount_total NUMERIC(10,2) DEFAULT 0.00,
    shipping_fee NUMERIC(10,2) DEFAULT 0.00,
    grand_total NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50) DEFAULT 'upi',
    status VARCHAR(50) DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
