const { Client } = require('pg');

const config = {
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.jpllgkcctxooauynefqp',
    password: 'Oraib@59523',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const checkoutSQL = `
-- Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cart_status_enum') THEN
        CREATE TYPE cart_status_enum AS ENUM ('active', 'converted', 'abandoned');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
        CREATE TYPE order_status_enum AS ENUM ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('upi', 'netbanking', 'card', 'cod');
    END IF;
END $$;

-- 1. DISCOUNT COUPONS
CREATE TABLE IF NOT EXISTS discount_coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,          -- e.g. 'ALOINDIA10', 'FIRSTORDER'
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    min_order_value NUMERIC(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CARTS
CREATE TABLE IF NOT EXISTS carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    visitor_id UUID,
    currency VARCHAR(10) DEFAULT 'INR',
    status cart_status_enum DEFAULT 'active',
    applied_coupon_code VARCHAR(50),
    discount_total NUMERIC(10,2) DEFAULT 0.00,
    subtotal NUMERIC(10,2) DEFAULT 0.00,
    shipping_fee NUMERIC(10,2) DEFAULT 0.00,
    grand_total NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    variant_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    color_name VARCHAR(100) NOT NULL,
    size VARCHAR(20) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    line_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, variant_id)
);

-- 4. ORDERS (Checkout Conversion)
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
    payment_method payment_method_enum DEFAULT 'upi',
    status order_status_enum DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    variant_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    color_name VARCHAR(100) NOT NULL,
    size VARCHAR(20) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL,
    line_total NUMERIC(10,2) NOT NULL
);
`;

async function applyCheckoutSchema() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Applying Checkout & Cart schemas to Supabase...");
        await client.query(checkoutSQL);
        console.log("✅ Checkout tables created successfully!");
        
        const res = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('discount_coupons', 'carts', 'cart_items', 'orders', 'order_items');
        `);
        console.log("Active tables:", res.rows.map(r => r.table_name));
        await client.end();
    } catch (e) {
        console.error("Checkout migration error:", e.message);
        try { await client.end(); } catch (err) {}
    }
}

applyCheckoutSchema();
