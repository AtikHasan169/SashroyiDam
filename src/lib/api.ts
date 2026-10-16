import type {
  User,
  Product,
  Category,
  Order,
  CartItem,
  CartValidationResult,
  Coupon,
  Review,
  ShippingRate,
  Banner,
  StoreSettings,
  InventoryMovement,
  AuditLog
} from '../types/index.ts';

const TOKEN_KEY = 'oshesh_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `সার্ভার এরর: ${res.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { name: string; phone: string; email: string; password: string }) =>
    request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  login: (body: { identifier: string; password: string }) =>
    request<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (body: { name: string; phone?: string }) =>
    request<{ user: User; message: string }>('/api/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  addAddress: (body: any) =>
    request<{ user: User; message: string }>('/api/auth/address', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  // Products & Store
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),

  getProducts: (params: Record<string, string | number | boolean> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<{
      items: Product[];
      pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        limit: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      facets: {
        brands: string[];
        minPrice: number;
        maxPrice: number;
      };
    }>(`/api/products?${searchParams.toString()}`);
  },

  getProduct: (slugOrId: string) =>
    request<{ product: Product; reviews: Review[]; related: Product[] }>(
      `/api/products/${slugOrId}`
    ),

  submitReview: (body: {
    productId: string;
    customerName: string;
    customerPhone: string;
    rating: number;
    comment: string;
  }) =>
    request<{ review: Review; message: string }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  getStoreInfo: () =>
    request<{
      banners: Banner[];
      settings: StoreSettings;
      shippingRates: ShippingRate[];
    }>('/api/store-info'),

  // Cart & Coupons
  validateCart: (body: {
    items: CartItem[];
    couponCode?: string;
    division?: string;
  }) =>
    request<CartValidationResult>('/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  applyCoupon: (body: { code: string; subtotal: number }) =>
    request<{ coupon: Coupon; discount: number; message: string }>(
      '/api/cart/apply-coupon',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    ),

  // Orders
  createOrder: (body: any) =>
    request<{ order: Order; message: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  trackOrder: (body: { orderNumber: string; phone: string }) =>
    request<{ order: Order }>('/api/orders/track', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  getMyOrders: () => request<{ orders: Order[] }>('/api/orders/my-orders'),

  getOrder: (id: string, phone?: string) => {
    const url = phone ? `/api/orders/${id}?phone=${encodeURIComponent(phone)}` : `/api/orders/${id}`;
    return request<{ order: Order }>(url);
  },

  // Payment
  initSslPayment: (orderId: string) =>
    request<{
      status: string;
      tran_id: string;
      amount: number;
      currency: string;
      isSandbox: boolean;
      orderNumber: string;
    }>('/api/payment/sslcommerz/init', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    }),

  validateSslPayment: (body: { tran_id: string; val_id: string; status: string }) =>
    request<{ success: boolean; order: Order; message: string }>(
      '/api/payment/sslcommerz/validate',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    ),

  // Admin APIs
  getAdminMetrics: () =>
    request<{
      ordersToday: number;
      totalOrders: number;
      grossSales: number;
      collectedPayments: number;
      pendingCodAmount: number;
      pendingOrders: number;
      lowStockCount: number;
      lowStockProducts: Product[];
      bestSellers: Product[];
      recentOrders: Order[];
    }>('/api/admin/metrics'),

  getAdminOrders: (params: Record<string, string> = {}) => {
    const sp = new URLSearchParams(params);
    return request<{
      orders: Order[];
      pagination: { total: number; totalPages: number; currentPage: number; limit: number };
    }>(`/api/admin/orders?${sp.toString()}`);
  },

  updateOrderStatus: (id: string, body: { status: string; note?: string; paymentStatus?: string }) =>
    request<{ order: Order; message: string }>(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  addOrderNote: (id: string, note: string) =>
    request<{ order: Order; message: string }>(`/api/admin/orders/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    }),

  getAdminProducts: (params: Record<string, string> = {}) => {
    const sp = new URLSearchParams(params);
    return request<{ products: Product[] }>(`/api/admin/products?${sp.toString()}`);
  },

  createProduct: (body: any) =>
    request<{ product: Product; message: string }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  updateProduct: (id: string, body: any) =>
    request<{ product: Product; message: string }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  archiveProduct: (id: string) =>
    request<{ message: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE'
    }),

  deleteProduct: (id: string, permanent: boolean = false) =>
    request<{ message: string }>(`/api/admin/products/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    }),

  uploadImage: (base64Data: string) =>
    request<{ url: string; message: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ data: base64Data })
    }),

  createCategory: (body: any) =>
    request<{ category: Category; message: string }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  updateCategory: (id: string, body: any) =>
    request<{ category: Category; message: string }>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/api/admin/categories/${id}`, {
      method: 'DELETE'
    }),

  getAdminCoupons: () => request<{ coupons: Coupon[] }>('/api/admin/coupons'),

  createCoupon: (body: any) =>
    request<{ coupon: Coupon; message: string }>('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  toggleCoupon: (id: string) =>
    request<{ coupon: Coupon; message: string }>(`/api/admin/coupons/${id}/toggle`, {
      method: 'PUT'
    }),

  getAdminSettings: () =>
    request<{
      settings: StoreSettings;
      shippingRates: ShippingRate[];
      banners: Banner[];
    }>('/api/admin/settings'),

  updateSettings: (body: any) =>
    request<{ settings: StoreSettings; message: string }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  updateShippingRate: (id: string, body: any) =>
    request<{ shippingRate: ShippingRate; message: string }>(`/api/admin/shipping/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  getInventoryMovements: () =>
    request<{ movements: InventoryMovement[] }>('/api/admin/inventory-movements'),

  getAuditLogs: () => request<{ logs: AuditLog[] }>('/api/admin/audit-logs')
};
