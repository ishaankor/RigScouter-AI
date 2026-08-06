-- ==========================================================
-- RigScouter-AI Database Schema (PostgreSQL / Supabase)
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (integrates with Supabase Auth or custom user setup)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_policy_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hardware Component Catalog
CREATE TABLE IF NOT EXISTS hardware_components (
    id UUID PRIMARY KEY DEFAULT gen_random_policy_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'GPU', 'CPU', 'RAM', 'SSD', 'Motherboard', 'PSU', 'Case', 'Cooler'
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    specs JSONB DEFAULT '{}'::jsonb,
    msrp DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    lowest_price_90d DECIMAL(10, 2),
    retailer VARCHAR(100) NOT NULL,
    product_url TEXT NOT NULL,
    image_url TEXT,
    rating DECIMAL(3, 2) DEFAULT 4.5,
    deal_score INT DEFAULT 50, -- 0 to 100
    benchmark_score INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Watchlist Items
CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_policy_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    component_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    previous_price_24h DECIMAL(10, 2),
    previous_price_7d DECIMAL(10, 2),
    previous_price_30d DECIMAL(10, 2),
    all_time_low DECIMAL(10, 2),
    retailer VARCHAR(100) NOT NULL,
    product_url TEXT NOT NULL,
    image_url TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    notify_on_flash_drop BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Price History Snapshots (For intervals & daily delta calculations)
CREATE TABLE IF NOT EXISTS price_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_policy_uuid(),
    watchlist_item_id UUID REFERENCES watchlist_items(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast interval aggregation (24h, 7d, 30d deltas)
CREATE INDEX IF NOT EXISTS idx_snapshots_item_time ON price_snapshots(watchlist_item_id, scraped_at DESC);

-- 5. User Digest Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    summary_frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'every_3_days', 'weekly', 'flash_only'
    delivery_channels JSONB DEFAULT '{"email": true, "discord_webhook": null, "telegram_chat_id": null}'::jsonb,
    comparison_intervals JSONB DEFAULT '["24h", "7d", "30d", "ATL"]'::jsonb,
    auto_recommend_alternatives BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Generated Digest Logs
CREATE TABLE IF NOT EXISTS daily_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_policy_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    executive_summary TEXT NOT NULL,
    report_data JSONB NOT NULL,
    total_saved_opportunity DECIMAL(10, 2) DEFAULT 0.00,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
