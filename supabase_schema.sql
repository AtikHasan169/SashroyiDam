-- =========================================================================
-- সাশ্রয়ী দাম (Sashroyi Daam) — Supabase PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor to initialize all tables
-- =========================================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_bn TEXT NOT NULL,
  name_en TEXT,
  description_bn TEXT,
  image TEXT, -- Base64 data URL or asset URL
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title_bn TEXT NOT NULL,
  title_en TEXT,
  description_bn TEXT,
  description_en TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  stock INT DEFAULT 0,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  category_slug TEXT,
  category_name_bn TEXT,
  brand TEXT DEFAULT 'সাশ্রয়ী দাম',
  sku TEXT UNIQUE,
  images TEXT[] DEFAULT ARRAY[]::TEXT[], -- Base64 data URLs preserved permanently
  variants JSONB DEFAULT '[]'::JSONB,
  attributes JSONB DEFAULT '{}'::JSONB,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  sales_count INT DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  full_address TEXT NOT NULL,
  delivery_instructions TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  fulfilment_status TEXT NOT NULL DEFAULT 'pending_confirmation',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  timeline JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 10,
  min_order_value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  expires_at TIMESTAMPTZ,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary_settings',
  store_name_bn TEXT DEFAULT 'সাশ্রয়ী দাম',
  store_name_en TEXT DEFAULT 'Sashroyi Daam',
  tagline_bn TEXT DEFAULT 'আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান।',
  phone TEXT DEFAULT '০৯৬১২-৮৮৯৯০০',
  email TEXT DEFAULT 'support@sashroyidaam.com',
  support_hours_bn TEXT DEFAULT 'প্রতিদিন সকাল ৯টা – রাত ১০টা',
  address_bn TEXT DEFAULT 'বাড়ি ৪২, রোড ১১, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০',
  announcement_strip_bn TEXT DEFAULT '🚚 ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি ডেলিভারি! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।',
  show_announcement BOOLEAN DEFAULT true,
  free_delivery_threshold NUMERIC DEFAULT 2000,
  default_delivery_fee_dhaka NUMERIC DEFAULT 70,
  default_delivery_fee_outside NUMERIC DEFAULT 130,
  is_cod_enabled BOOLEAN DEFAULT true,
  is_sslcommerz_enabled BOOLEAN DEFAULT true,
  facebook_page_name TEXT DEFAULT 'সাশ্রয়ী দাম | Sashroyi Daam',
  facebook_username TEXT DEFAULT '@sashroyidaam',
  facebook_url TEXT DEFAULT 'https://facebook.com/sashroyidaam',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial default coupon
INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, max_discount, is_active)
VALUES ('coup-sashroyi10', 'SASHROYI10', 'percentage', 10, 1200, 400, true)
ON CONFLICT (code) DO NOTHING;
