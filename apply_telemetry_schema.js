const { Client } = require('pg');

const config = {
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.jpllgkcctxooauynefqp',
    password: 'Oraib@59523',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const telemetrySQL = `
-- Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_type_enum') THEN
        CREATE TYPE device_type_enum AS ENUM ('desktop', 'mobile', 'tablet', 'bot', 'unknown');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_type_enum') THEN
        CREATE TYPE page_type_enum AS ENUM ('home', 'plp', 'pdp', 'cart', 'checkout', 'account', 'search', 'editorial', 'auth');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_type_enum') THEN
        CREATE TYPE interaction_type_enum AS ENUM ('click', 'hover', 'scroll', 'form_submit', 'swipe', 'tab_switch', 'modal_open', 'modal_close');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'funnel_stage_enum') THEN
        CREATE TYPE funnel_stage_enum AS ENUM ('discovery', 'consideration', 'intent', 'conversion', 'post_purchase', 'loyalty');
    END IF;
END $$;

-- 1. VISITORS
CREATE TABLE IF NOT EXISTS visitors (
    visitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id VARCHAR(128) NOT NULL UNIQUE,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID,
    initial_referrer_url TEXT,
    initial_utm_source VARCHAR(100),
    initial_utm_medium VARCHAR(100),
    initial_utm_campaign VARCHAR(100),
    initial_country_code VARCHAR(10) DEFAULT 'IN'
);

-- 2. USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES visitors(visitor_id) ON DELETE CASCADE,
    user_id UUID,
    session_start_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    device_type device_type_enum DEFAULT 'desktop',
    os VARCHAR(50),
    browser VARCHAR(50),
    viewport_width INT,
    viewport_height INT,
    locale VARCHAR(20) DEFAULT 'en-in',
    currency VARCHAR(10) DEFAULT 'INR',
    is_bounce BOOLEAN DEFAULT TRUE,
    session_page_views INT DEFAULT 1,
    session_cart_count INT DEFAULT 0
);

-- 3. MASTER CLICK EVENTS (Every click)
CREATE TABLE IF NOT EXISTS click_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES visitors(visitor_id) ON DELETE CASCADE,
    user_id UUID,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    page_type page_type_enum NOT NULL,
    current_url TEXT NOT NULL,
    referrer_url TEXT,
    page_title VARCHAR(255),
    component_name VARCHAR(100) NOT NULL,
    component_section VARCHAR(100),
    element_id VARCHAR(150),
    element_tag VARCHAR(50),
    element_text VARCHAR(255),
    element_classes TEXT,
    click_x INT,
    click_y INT,
    viewport_scroll_depth_pct NUMERIC(5,2),
    interaction_type interaction_type_enum DEFAULT 'click',
    funnel_stage funnel_stage_enum DEFAULT 'discovery',
    action_name VARCHAR(120) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_click_events_session ON click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_click_events_timestamp ON click_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_click_events_action ON click_events(action_name);
`;

async function applyTelemetry() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Applying Telemetry & Clickstream schema to Supabase...");
        await client.query(telemetrySQL);
        console.log("✅ Telemetry tables created successfully!");
        
        const res = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('visitors', 'user_sessions', 'click_events');
        `);
        console.log("Active tables:", res.rows.map(r => r.table_name));
        await client.end();
    } catch (e) {
        console.error("Telemetry migration error:", e.message);
        try { await client.end(); } catch (err) {}
    }
}

applyTelemetry();
