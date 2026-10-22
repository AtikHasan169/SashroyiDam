export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'order_manager'
  | 'product_manager'
  | 'support_agent'
  | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash?: string;
  avatarUrl?: string;
  savedAddresses?: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  title: string; // e.g. "Home", "Office"
  name: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  fullAddress: string;
  isDefault?: boolean;
}

export type CategoryVariantType =
  | 'apparel_sizes'   // e.g. Shirt, Panjabi, T-shirt: M, L, XL, XXL, 38, 40, 42, 44
  | 'shoe_sizes'      // e.g. Shoes: 39, 40, 41, 42, 43, 44
  | 'weight_options'  // e.g. Groceries, Spices, Honey: 250g, 500g, 1kg, 2kg, 5kg
  | 'pack_options'    // e.g. Cookware, Sets: ১ পিস, ২ পিস, ৪ পিস সেট
  | 'color_options'   // e.g. Gadgets, Accessories: Black, White, Silver
  | 'custom'
  | 'none';

export interface Category {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn?: string;
  image: string;
  displayOrder: number;
  isFeatured: boolean;
  productCount?: number;
  variantType?: CategoryVariantType;
  defaultOptions?: string[];
}

export interface ProductVariant {
  id: string;
  nameBn: string;
  nameEn: string;
  sku: string;
  priceDelta: number; // e.g., +100 or 0
  stock: number;
  attributes: Record<string, string>; // e.g. { size: 'XL', color: 'Deep Green' }
}

export interface Product {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  price: number; // in BDT
  originalPrice?: number; // for showing genuine savings
  stock: number;
  inStock?: boolean;
  categoryId: string;
  categorySlug?: string;
  categoryNameBn?: string;
  brand: string;
  sku: string;
  barcode?: string;
  images: string[];
  variants?: ProductVariant[];
  attributes?: Record<string, string>; // e.g. { "উপাদান": "১০০% অর্গানিক সুতি", "ওজন": "৫০০ গ্রাম" }
  isFeatured: boolean;
  isHotDeal?: boolean;
  isPublished: boolean;
  isUnavailable?: boolean; // Currently not available for sale (অর্ডার বন্ধ)
  unavailableReason?: string;
  isArchived: boolean;
  salesCount: number;
  rating: number;
  reviewCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface PopulatedCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product: Product;
  selectedVariant?: ProductVariant;
  unitPrice: number;
  itemSubtotal: number;
  isAvailable: boolean;
  maxAvailable: number;
  error?: string;
}

export interface CartValidationResult {
  items: PopulatedCartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  appliedCoupon?: Coupon;
  warnings: string[];
  purgedItemIds?: string[];
  purgedItems?: {
    productId: string;
    variantId?: string;
    titleBn?: string;
    reason: string;
  }[];
}

export type OrderFulfilmentStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'cod' | 'sslcommerz_sandbox';

export interface OrderItemSnapshot {
  productId: string;
  variantId?: string;
  productTitleBn: string;
  productTitleEn: string;
  variantNameBn?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  itemTotal: number;
  imageUrl: string;
}

export interface OrderTimelineEvent {
  status: OrderFulfilmentStatus;
  timestamp: string;
  note: string;
  changedBy: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. OSH-2026-8812
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  division: string;
  district: string;
  upazila: string;
  areaLocality?: string;
  fullAddress: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfilmentStatus: OrderFulfilmentStatus;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  statusTimeline: OrderTimelineEvent[];
  internalNotes?: string[];
  assignedStaff?: string;
  sslTxnId?: string;
  valId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

export interface ShippingRate {
  id: string;
  zoneNameBn: string;
  zoneNameEn: string;
  divisions: string[];
  rate: number;
  estimatedDaysBn: string;
  isActive: boolean;
}

export interface Banner {
  id: string;
  titleBn: string;
  subtitleBn: string;
  buttonTextBn: string;
  link: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeNameBn: string;
  storeNameEn: string;
  taglineBn: string;
  phone: string;
  email: string;
  supportHoursBn: string;
  addressBn: string;
  announcementStripBn: string;
  showAnnouncement: boolean;
  freeDeliveryThreshold: number;
  defaultDeliveryFeeDhaka: number;
  defaultDeliveryFeeOutside: number;
  isCodEnabled: boolean;
  isSslcommerzEnabled: boolean;
  sslSandboxMode: boolean;
  facebookPageName?: string;
  facebookUsername?: string;
  facebookUrl?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productTitleBn: string;
  variantSku?: string;
  changeQuantity: number; // e.g. -2 or +20
  previousStock: number;
  newStock: number;
  reason: 'order_placement' | 'order_cancellation' | 'manual_restock' | 'damage_adjustment' | 'return_restock';
  orderId?: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  userRole: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}
