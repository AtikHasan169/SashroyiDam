-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'order_manager',
  'product_manager',
  'support_agent',
  'customer'
);

CREATE TYPE order_status AS ENUM (
  'pending_confirmation',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'unpaid',
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'cod',
  'sslcommerz'
);

CREATE TYPE stock_movement_type AS ENUM (
  'initial_stock',
  'order_deduction',
  'order_cancellation_restore',
  'order_return_restore',
  'manual_adjustment'
);

-- 2. PROFILES & ROLES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  email TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check user role safely in RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_bn TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_bn TEXT NOT NULL DEFAULT '',
  description_en TEXT DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  -- Prices stored in BDT (integer or exact numeric up to 2 decimal places, never float)
  price_bdt NUMERIC(12, 2) NOT NULL CHECK (price_bdt >= 0),
  compare_at_price_bdt NUMERIC(12, 2) CHECK (compare_at_price_bdt IS NULL OR compare_at_price_bdt >= price_bdt),
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_published ON public.products(is_published, is_archived);

-- 5. PRODUCT IMAGES
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PRODUCT VARIANTS
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name_bn TEXT NOT NULL, -- e.g. "সাইজ: XL | কালার: কালো"
  variant_name_en TEXT NOT NULL, -- e.g. "Size: XL | Color: Black"
  sku TEXT UNIQUE NOT NULL,
  price_override_bdt NUMERIC(12, 2) CHECK (price_override_bdt IS NULL OR price_override_bdt >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INVENTORY MOVEMENTS (AUDIT TRAIL)
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  movement_type stock_movement_type NOT NULL,
  quantity_change INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reference_order_id UUID,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CUSTOMER ADDRESSES
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  area_locality TEXT NOT NULL,
  full_address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. WISHLISTS
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 10. SHIPPING ZONES
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_key TEXT UNIQUE NOT NULL, -- e.g., 'inside_dhaka', 'dhaka_suburbs', 'outside_dhaka'
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  charge_bdt NUMERIC(12, 2) NOT NULL CHECK (charge_bdt >= 0),
  free_shipping_min_bdt NUMERIC(12, 2),
  estimated_days_bn TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description_bn TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount_bdt NUMERIC(12, 2),
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  tracking_token UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  area_locality TEXT NOT NULL,
  full_address TEXT NOT NULL,
  delivery_instructions TEXT,
  shipping_zone_key TEXT NOT NULL,
  subtotal_bdt NUMERIC(12, 2) NOT NULL CHECK (subtotal_bdt >= 0),
  discount_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_bdt >= 0),
  coupon_code TEXT,
  shipping_fee_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee_bdt >= 0),
  total_payable_bdt NUMERIC(12, 2) NOT NULL CHECK (total_payable_bdt >= 0),
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  order_status order_status NOT NULL DEFAULT 'pending_confirmation',
  admin_notes TEXT,
  assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX idx_orders_user ON public.orders(user_id);

-- 13. ORDER ITEMS (IMMUTABLE SNAPSHOT)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_title_bn TEXT NOT NULL,
  product_title_en TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT NOT NULL,
  unit_price_bdt NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total_bdt NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ORDER STATUS HISTORY
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status order_status,
  new_status order_status NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PAYMENT TRANSACTIONS
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'cod', 'sslcommerz'
  transaction_id TEXT UNIQUE NOT NULL,
  val_id TEXT,
  amount_bdt NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status payment_status NOT NULL DEFAULT 'pending',
  bank_tran_id TEXT,
  card_type TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. GENUINE CUSTOMER REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);

-- 17. STORE SETTINGS & BANNERS
CREATE TABLE public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn TEXT NOT NULL,
  subtitle_bn TEXT,
  cta_text_bn TEXT NOT NULL DEFAULT 'এখনই কিনুন',
  cta_link TEXT NOT NULL DEFAULT '/products',
  image_url TEXT,
  badge_text_bn TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. ADMIN AUDIT LOGS
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 19. CONCURRENCY-SAFE ATOMIC ORDER CREATION RPC
-- Prevents race-condition overselling and guarantees server-side pricing
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_division TEXT,
  p_district TEXT,
  p_upazila TEXT,
  p_area_locality TEXT,
  p_full_address TEXT,
  p_delivery_instructions TEXT,
  p_shipping_zone_key TEXT,
  p_payment_method payment_method,
  p_coupon_code TEXT,
  p_idempotency_key TEXT,
  p_items JSONB -- Array of {product_id, variant_id, quantity}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_tracking_token UUID;
  v_subtotal NUMERIC(12, 2) := 0;
  v_discount NUMERIC(12, 2) := 0;
  v_shipping_fee NUMERIC(12, 2) := 0;
  v_total NUMERIC(12, 2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_variant RECORD;
  v_unit_price NUMERIC(12, 2);
  v_line_total NUMERIC(12, 2);
  v_zone RECORD;
  v_coupon RECORD;
  v_existing_order RECORD;
BEGIN
  -- 1. Check idempotency key to prevent duplicate submissions
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, order_number, tracking_token, total_payable_bdt
    INTO v_existing_order
    FROM public.orders
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'tracking_token', v_existing_order.tracking_token,
        'total_payable_bdt', v_existing_order.total_payable_bdt,
        'duplicate_prevented', true
      );
    END IF;
  END IF;

  -- 2. Validate Shipping Zone
  SELECT * INTO v_zone
  FROM public.shipping_zones
  WHERE zone_key = p_shipping_zone_key AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive shipping zone: %', p_shipping_zone_key;
  END IF;

  -- 3. Generate unique readable Order Number (SD-YYYYMMDD-XXXX)
  v_order_number := 'SD-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 5));

  -- 4. First pass: Lock rows, verify stock, calculate server-trusted subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID
      AND is_published = TRUE
      AND is_archived = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'পণ্যটি বর্তমানে পাওয়া যাচ্ছে না (Product unavailable)';
    END IF;

    v_unit_price := v_product.price_bdt;

    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      SELECT * INTO v_variant
      FROM public.product_variants
      WHERE id = (v_item->>'variant_id')::UUID
        AND product_id = v_product.id
        AND is_active = TRUE
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'নির্বাচিত ভ্যারিয়েন্টটি পাওয়া যাচ্ছে না';
      END IF;

      IF v_product.track_inventory AND v_variant.stock_quantity < (v_item->>'quantity')::INT THEN
        RAISE EXCEPTION 'স্টকে পর্যাপ্ত পণ্য নেই: % (%)', v_product.title_bn, v_variant.variant_name_bn;
      END IF;

      IF v_variant.price_override_bdt IS NOT NULL THEN
        v_unit_price := v_variant.price_override_bdt;
      END IF;
    ELSE
      IF v_product.track_inventory AND v_product.stock_quantity < (v_item->>'quantity')::INT THEN
        RAISE EXCEPTION 'স্টকে পর্যাপ্ত পণ্য নেই: %', v_product.title_bn;
      END IF;
    END IF;

    v_line_total := v_unit_price * ((v_item->>'quantity')::INT);
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- 5. Validate & Calculate Coupon Discount
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(trim(p_coupon_code))
      AND is_active = TRUE
      AND starts_at <= NOW()
      AND (expires_at IS NULL OR expires_at >= NOW())
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'কুপন কোডটি সঠিক নয় অথবা মেয়াদ শেষ হয়েছে';
    END IF;

    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'এই কুপন কোডের ব্যবহারের সীমা শেষ হয়ে গেছে';
    END IF;

    IF v_subtotal < v_coupon.min_order_amount_bdt THEN
      RAISE EXCEPTION 'এই কুপন ব্যবহার করতে সর্বনিম্ন ৳% টাকার অর্ডার করতে হবে', v_coupon.min_order_amount_bdt;
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := round((v_subtotal * v_coupon.discount_value) / 100.0, 2);
      IF v_coupon.max_discount_bdt IS NOT NULL AND v_discount > v_coupon.max_discount_bdt THEN
        v_discount := v_coupon.max_discount_bdt;
      END IF;
    ELSE
      v_discount := v_coupon.discount_value;
    END IF;

    IF v_discount > v_subtotal THEN
      v_discount := v_subtotal;
    END IF;

    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
  END IF;

  -- 6. Calculate Shipping Fee
  IF v_zone.free_shipping_min_bdt IS NOT NULL AND (v_subtotal - v_discount) >= v_zone.free_shipping_min_bdt THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := v_zone.charge_bdt;
  END IF;

  v_total := (v_subtotal - v_discount) + v_shipping_fee;

  -- 7. Insert Order
  INSERT INTO public.orders (
    order_number, user_id, customer_name, customer_phone, customer_email,
    division, district, upazila, area_locality, full_address, delivery_instructions,
    shipping_zone_key, subtotal_bdt, discount_bdt, coupon_code, shipping_fee_bdt,
    total_payable_bdt, payment_method, payment_status, order_status, idempotency_key
  ) VALUES (
    v_order_number, p_user_id, p_customer_name, p_customer_phone, p_customer_email,
    p_division, p_district, p_upazila, p_area_locality, p_full_address, p_delivery_instructions,
    p_shipping_zone_key, v_subtotal, v_discount, upper(trim(p_coupon_code)), v_shipping_fee,
    v_total, p_payment_method, 'unpaid', 'pending_confirmation', p_idempotency_key
  )
  RETURNING id, tracking_token INTO v_order_id, v_tracking_token;

  -- 8. Second pass: Insert immutable order_items & deduct inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID;
    v_unit_price := v_product.price_bdt;
    v_variant := NULL;

    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      SELECT * INTO v_variant FROM public.product_variants WHERE id = (v_item->>'variant_id')::UUID;
      IF v_variant.price_override_bdt IS NOT NULL THEN
        v_unit_price := v_variant.price_override_bdt;
      END IF;
    END IF;

    v_line_total := v_unit_price * ((v_item->>'quantity')::INT);

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, product_title_bn, product_title_en,
      variant_name, sku, unit_price_bdt, quantity, line_total_bdt
    ) VALUES (
      v_order_id, v_product.id, v_variant.id, v_product.title_bn, v_product.title_en,
      v_variant.variant_name_bn, COALESCE(v_variant.sku, v_product.sku),
      v_unit_price, (v_item->>'quantity')::INT, v_line_total
    );

    -- Deduct stock & log movement
    IF v_product.track_inventory THEN
      IF v_variant.id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT
        WHERE id = v_variant.id;
      END IF;

      UPDATE public.products
      SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT
      WHERE id = v_product.id;

      INSERT INTO public.inventory_movements (
        product_id, variant_id, movement_type, quantity_change,
        previous_stock, new_stock, reference_order_id, note
      ) VALUES (
        v_product.id, v_variant.id, 'order_deduction', -((v_item->>'quantity')::INT),
        v_product.stock_quantity, v_product.stock_quantity - (v_item->>'quantity')::INT,
        v_order_id, 'Order ' || v_order_number
      );
    END IF;
  END LOOP;

  -- 9. Record Initial Order Status History
  INSERT INTO public.order_status_history (order_id, previous_status, new_status, note)
  VALUES (v_order_id, NULL, 'pending_confirmation', 'অর্ডার গ্রহণ করা হয়েছে');

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'tracking_token', v_tracking_token,
    'total_payable_bdt', v_total,
    'duplicate_prevented', false
  );
END;
$$;

-- ============================================================================
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Storefront
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view published products" ON public.products FOR SELECT USING (is_published = TRUE AND is_archived = FALSE);
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (TRUE);
CREATE POLICY "Public can view active variants" ON public.product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view active shipping zones" ON public.shipping_zones FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view store settings" ON public.store_settings FOR SELECT USING (TRUE);

-- Customer Self-Access Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);
