-- ============================================================================
-- SEED DATA FOR সাশ্রয়ী দাম | Sashroyi Daam (LOCAL DEVELOPMENT ONLY)
-- Run `DELETE FROM public.products WHERE sku LIKE 'SD-SAMPLE-%';` before launch
-- ============================================================================

-- 1. Store Settings
INSERT INTO public.store_settings (key, value) VALUES
('general', '{
  "brand_name_bn": "সাশ্রয়ী দাম",
  "brand_name_en": "Sashroyi Daam",
  "full_display_name": "সাশ্রয়ী দাম | Sashroyi Daam",
  "short_brand": "SashroyiDam",
  "tagline_bn": "সাশ্রয়ী দামে সেরা পণ্য, প্রতিদিন আপনার ঘরে।",
  "facebook_page": "https://facebook.com/sashroyidaam",
  "facebook_handle": "@sashroyidaam",
  "support_phone": "09600-000000",
  "support_email": "support@sashroyidaam.com",
  "announcement_bn": "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা! যেকোনো প্রয়োজনে মেসেজ করুন আমাদের ফেসবুক পেজে: @sashroyidaam",
  "cod_enabled": true,
  "sslcommerz_enabled": true
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Shipping Zones (Configurable by Admin)
INSERT INTO public.shipping_zones (zone_key, name_bn, name_en, charge_bdt, free_shipping_min_bdt, estimated_days_bn) VALUES
('inside_dhaka', 'ঢাকা সিটির ভেতরে', 'Inside Dhaka City', 60.00, 2000.00, '১ থেকে ২ কার্যদিবস'),
('dhaka_suburbs', 'ঢাকার পার্শ্ববর্তী এলাকা (সাভার, গাজীপুর, নারায়ণগঞ্জ, কেরানীগঞ্জ)', 'Dhaka Suburbs', 90.00, 2500.00, '২ থেকে ৩ কার্যদিবস'),
('outside_dhaka', 'ঢাকার বাইরে (সারা বাংলাদেশ)', 'Outside Dhaka (Nationwide)', 120.00, 3000.00, '২ থেকে ৪ কার্যদিবস')
ON CONFLICT (zone_key) DO UPDATE SET charge_bdt = EXCLUDED.charge_bdt;

-- 3. Hero Banner
INSERT INTO public.banners (title_bn, subtitle_bn, cta_text_bn, cta_link, badge_text_bn, display_order, is_active) VALUES
(
  'আপনার সংসারের প্রতিদিনের প্রয়োজন, এখন আরও সাশ্রয়ী দামে',
  'যাচাইকৃত মান, সঠিক বিবরণ এবং দ্রুত ডেলিভারির নিশ্চয়তায় সাশ্রয়ী দাম (SashroyiDam) আছে আপনার পাশে।',
  'সকল পণ্য দেখুন',
  '/products',
  'সাশ্রয়ী দাম স্পেশাল',
  1,
  TRUE
);

-- 4. Categories
INSERT INTO public.categories (id, name_bn, name_en, slug, description_bn, display_order, is_featured) VALUES
('11111111-1111-1111-1111-111111111101', 'হোম ও কিচেন', 'Home & Kitchen', 'home-and-kitchen', 'রান্নাঘর ও ঘরের প্রতিদিনের দরকারি সামগ্রী', 1, TRUE),
('11111111-1111-1111-1111-111111111102', 'মোবাইল ও গ্যাজেট এক্সেসরিজ', 'Gadget Accessories', 'gadget-accessories', 'চার্জার, ক্যাবল, স্ট্যান্ড ও প্রয়োজনীয় টেক এক্সেসরিজ', 2, TRUE),
('11111111-1111-1111-1111-111111111103', 'ডেইলি ফ্যাশন ও লাইফস্টাইল', 'Everyday Fashion', 'everyday-fashion', 'আরামদায়ক পোশাক, ব্যাগ ও লাইফস্টাইল পণ্য', 3, TRUE),
('11111111-1111-1111-1111-111111111104', 'হোম অর্গানাইজার', 'Home Organizers', 'home-organizers', 'ঘর গুছিয়ে রাখার স্মার্ট স্টোরেজ ও র‍্যাক', 4, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 5. Sample Products (Clearly marked as sample SKU SD-SAMPLE-*)
INSERT INTO public.products (
  id, title_bn, title_en, slug, description_bn, description_en,
  category_id, brand, sku, price_bdt, compare_at_price_bdt,
  stock_quantity, is_featured, is_published
) VALUES
(
  '22222222-2222-2222-2222-222222222201',
  'স্টেইনলেস স্টিল ইনসুলেটেড ফ্লাস্ক বোতল (৫০০ মিলি)',
  'Stainless Steel Vacuum Insulated Flask 500ml',
  'stainless-steel-vacuum-flask-500ml',
  'উচ্চমানের ফুড-গ্রেড ৩০৪ স্টেইনলেস স্টিল দিয়ে তৈরি। গরম পানি বা চা-কফি ৮ ঘণ্টা পর্যন্ত গরম এবং ঠান্ডা পানি ১২ ঘণ্টা পর্যন্ত ঠান্ডা রাখে। লিক-প্রুফ ঢাকনা থাকায় ব্যাগে সহজেই বহনযোগ্য।',
  'Food-grade 304 stainless steel vacuum flask. Keeps beverages hot for up to 8 hours and cold for up to 12 hours.',
  '11111111-1111-1111-1111-111111111101',
  'Sashroyi Basic',
  'SD-SAMPLE-001',
  490.00,
  650.00,
  45,
  TRUE,
  TRUE
),
(
  '22222222-2222-2222-2222-222222222202',
  'মাল্টি-ফাংশনাল ভেজিটেবল ও সালাদ কাটার (৬ ব্লেড সেট)',
  'Multi-Functional Vegetable Chopper & Slicer Set',
  'multi-functional-vegetable-chopper-set',
  'রান্নার সময় বাঁচাতে দারুণ কার্যকরী সবজি ও সালাদ কাটার। সাথে থাকছে ৬টি ভিন্ন স্টেইনলেস স্টিল ব্লেড, হ্যান্ড গার্ড এবং স্ট্রেনার বাস্কেট। সহজেই পরিষ্কার করা যায়।',
  'Time-saving kitchen slicer and dicer with 6 interchangeable stainless steel blades and drain basket.',
  '11111111-1111-1111-1111-111111111101',
  'Sashroyi Home',
  'SD-SAMPLE-002',
  580.00,
  750.00,
  30,
  TRUE,
  TRUE
),
(
  '22222222-2222-2222-2222-222222222203',
  'অ্যালুমিনিয়াম ফোল্ডেবল ডেস্কটপ মোবাইল ও ট্যাব স্ট্যান্ড',
  'Heavy Duty Foldable Aluminum Phone & Tablet Stand',
  'foldable-aluminum-desk-phone-stand',
  'মজবুত অ্যালুমিনিয়াম অ্যালয় বডি এবং নন-স্লিপ সিলিকন প্যাড। অনলাইন ক্লাস, ভিডিও কল বা ডেস্কের কাজের জন্য যেকোনো অ্যাঙ্গেলে সহজেই অ্যাডজাস্ট করা যায়।',
  'Sturdy aluminum alloy foldable desk stand compatible with smartphones and tablets up to 11 inches.',
  '11111111-1111-1111-1111-111111111102',
  'Sashroyi Tech',
  'SD-SAMPLE-003',
  320.00,
  420.00,
  60,
  TRUE,
  TRUE
),
(
  '22222222-2222-2222-2222-222222222204',
  'প্রিমিয়াম কটন সলিড পোলো টি-শার্ট (মেনজ)',
  'Premium Combed Cotton Pique Polo Shirt',
  'premium-cotton-pique-polo-shirt',
  '১০০% কম্বেড কটন পিকে ফেব্রিক (২২০ জিএসএম)। গরমে পরার জন্য অত্যন্ত আরামদায়ক ও বাতাস চলাচল উপযোগী। কালার ও সাইজ গ্যারান্টিড।',
  '100% combed cotton pique 220 GSM polo shirt tailored for Bangladeshi weather.',
  '11111111-1111-1111-1111-111111111103',
  'Sashroyi Wear',
  'SD-SAMPLE-004',
  550.00,
  690.00,
  50,
  TRUE,
  TRUE
),
(
  '22222222-2222-2222-2222-222222222205',
  'ওয়াটারপ্রুফ ট্রাভেল ও লন্ড্রি অর্গানাইজার পাউচ (৬ পিসের সেট)',
  'Waterproof Travel Luggage Organizer Cubes 6-Piece Set',
  'waterproof-travel-organizer-6pcs-set',
  'ভ্রমণ বা আলমারির কাপড় গুছিয়ে রাখার জন্য ৬টি ভিন্ন সাইজের ওয়াটারপ্রুফ জিপার পাউচ সেট।',
  '6-piece waterproof nylon packing cubes for travel and wardrobe organization.',
  '11111111-1111-1111-1111-111111111104',
  'Sashroyi Home',
  'SD-SAMPLE-005',
  450.00,
  590.00,
  25,
  FALSE,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- 6. Sample Variants for the Polo Shirt
INSERT INTO public.product_variants (product_id, variant_name_bn, variant_name_en, sku, stock_quantity) VALUES
('22222222-2222-2222-2222-222222222204', 'সাইজ: M | কালার: নেভি ব্লু', 'Size: M | Color: Navy Blue', 'SD-SAMPLE-004-M-NV', 15),
('22222222-2222-2222-2222-222222222204', 'সাইজ: L | কালার: নেভি ব্লু', 'Size: L | Color: Navy Blue', 'SD-SAMPLE-004-L-NV', 20),
('22222222-2222-2222-2222-222222222204', 'সাইজ: XL | কালার: বটল গ্রিন', 'Size: XL | Color: Bottle Green', 'SD-SAMPLE-004-XL-BG', 15)
ON CONFLICT (sku) DO NOTHING;

-- 7. Sample Coupon
INSERT INTO public.coupons (code, description_bn, discount_type, discount_value, min_order_amount_bdt, max_discount_bdt, usage_limit, is_active) VALUES
('SASHROYI50', '১০০০ টাকার বেশি অর্ডারে ৫০ টাকা ছাড়', 'fixed', 50.00, 1000.00, 50.00, 500, TRUE)
ON CONFLICT (code) DO NOTHING;
