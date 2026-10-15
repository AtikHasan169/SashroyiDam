export type UserRole =
  | "super_admin"
  | "admin"
  | "order_manager"
  | "product_manager"
  | "support_agent"
  | "customer";

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "cod" | "sslcommerz";

export interface Category {
  id: string;
  name_bn: string;
  name_en: string;
  slug: string;
  description_bn: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name_bn: string;
  variant_name_en: string;
  sku: string;
  price_override_bdt: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  title_bn: string;
  title_en: string;
  slug: string;
  description_bn: string;
  description_en: string | null;
  category_id: string | null;
  brand: string | null;
  sku: string;
  barcode: string | null;
  price_bdt: number;
  compare_at_price_bdt: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  is_featured: boolean;
  is_published: boolean;
  is_archived: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  categories?: Category | null;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
}

export interface ShippingZone {
  id: string;
  zone_key: string;
  name_bn: string;
  name_en: string;
  charge_bdt: number;
  free_shipping_min_bdt: number | null;
  estimated_days_bn: string;
  is_active: boolean;
}

export interface CartItemClient {
  productId: string;
  variantId: string | null;
  slug: string;
  titleBn: string;
  titleEn: string;
  variantNameBn: string | null;
  sku: string;
  unitPriceBdt: number;
  compareAtPriceBdt: number | null;
  quantity: number;
  maxStock: number;
  imageUrl: string | null;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_title_bn: string;
  product_title_en: string;
  variant_name: string | null;
  sku: string;
  unit_price_bdt: number;
  quantity: number;
  line_total_bdt: number;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  tracking_token: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  division: string;
  district: string;
  upazila: string;
  area_locality: string;
  full_address: string;
  delivery_instructions: string | null;
  shipping_zone_key: string;
  subtotal_bdt: number;
  discount_bdt: number;
  coupon_code: string | null;
  shipping_fee_bdt: number;
  total_payable_bdt: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  admin_notes: string | null;
  created_at: string;
  order_items?: OrderItemRecord[];
}
