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

const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  ''
).replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  if (!res.ok) {
    let errorMsg = data.error || data.message;
    if (!errorMsg) {
      if (res.status === 404) {
        errorMsg = 'সার্ভার এরর (404 Not Found): API এন্ডপয়েন্ট পাওয়া যায়নি। ব্যাকএন্ড সার্ভার চালু আছে কি না পরীক্ষা করুন।';
      } else if (res.status === 500) {
        errorMsg = 'সার্ভার এরর (500 Internal Error): সার্ভারে সমস্যা হয়েছে।';
      } else {
        errorMsg = `সার্ভার এরর (${res.status}${res.statusText ? ': ' + res.statusText : ''})`;
      }
    }
    throw new Error(errorMsg);
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

  deleteAddress: (id: string) =>
    request<{ user: User; message: string }>(`/api/auth/address/${id}`, {
      method: 'DELETE'
    }),

  changePassword: (body: { currentPassword?: string; newPassword: string }) =>
    request<{ user: User; message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  // Products & Store
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),

  getProducts: async (params: Record<string, string | number | boolean> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });

    try {
      const res = await request<{
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

      if (res.items && res.items.length > 0) {
        // Cache for offline / serverless cold-start resilience
        try {
          localStorage.setItem('sashroyi_catalog_cache', JSON.stringify(res.items));
        } catch {}
      } else if (!params.search && (!params.category || params.category === 'all')) {
        // If server returns empty on base query, check if client has cached products
        try {
          const raw = localStorage.getItem('sashroyi_catalog_cache');
          if (raw) {
            const cached: Product[] = JSON.parse(raw);
            if (cached && cached.length > 0) {
              return {
                items: cached,
                pagination: {
                  totalItems: cached.length,
                  totalPages: 1,
                  currentPage: 1,
                  limit: cached.length,
                  hasNext: false,
                  hasPrev: false
                },
                facets: {
                  brands: Array.from(new Set(cached.map((p) => p.brand).filter(Boolean))),
                  minPrice: Math.min(...cached.map((p) => p.price)),
                  maxPrice: Math.max(...cached.map((p) => p.price))
                }
              };
            }
          }
        } catch {}
      }

      return res;
    } catch (err) {
      // Network/404 fallback: Return cached products
      try {
        const raw = localStorage.getItem('sashroyi_catalog_cache');
        if (raw) {
          const cached: Product[] = JSON.parse(raw);
          return {
            items: cached,
            pagination: {
              totalItems: cached.length,
              totalPages: 1,
              currentPage: 1,
              limit: cached.length,
              hasNext: false,
              hasPrev: false
            },
            facets: {
              brands: Array.from(new Set(cached.map((p) => p.brand).filter(Boolean))),
              minPrice: cached.length ? Math.min(...cached.map((p) => p.price)) : 0,
              maxPrice: cached.length ? Math.max(...cached.map((p) => p.price)) : 0
            }
          };
        }
      } catch {}
      throw err;
    }
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
    request<{
      order: Order;
      message: string;
      autoAuthToken?: string;
      autoUser?: any;
      isNewAccount?: boolean;
    }>('/api/orders', {
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

  createAdminOrder: (body: any) =>
    request<{ order: Order; message: string }>('/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

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

  createProduct: async (body: any) => {
    const res = await request<{ product: Product; message: string }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    try {
      const raw = localStorage.getItem('sashroyi_catalog_cache');
      const list: Product[] = raw ? JSON.parse(raw) : [];
      const updated = [res.product, ...list.filter((p) => p.id !== res.product.id)];
      localStorage.setItem('sashroyi_catalog_cache', JSON.stringify(updated));
    } catch {}
    return res;
  },

  updateProduct: async (id: string, body: any) => {
    const res = await request<{ product: Product; message: string }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    try {
      const raw = localStorage.getItem('sashroyi_catalog_cache');
      if (raw) {
        const list: Product[] = JSON.parse(raw);
        const updated = list.map((p) => (p.id === id ? res.product : p));
        localStorage.setItem('sashroyi_catalog_cache', JSON.stringify(updated));
      }
    } catch {}
    return res;
  },

  archiveProduct: (id: string) =>
    request<{ message: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE'
    }),

  deleteProduct: async (id: string, permanent: boolean = false) => {
    const res = await request<{ message: string }>(`/api/admin/products/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    });
    try {
      const raw = localStorage.getItem('sashroyi_catalog_cache');
      if (raw) {
        const list: Product[] = JSON.parse(raw);
        const updated = list.filter((p) => p.id !== id);
        localStorage.setItem('sashroyi_catalog_cache', JSON.stringify(updated));
      }
    } catch {}
    return res;
  },

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

  updateCoupon: (id: string, body: any) =>
    request<{ coupon: Coupon; message: string }>(`/api/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  deleteCoupon: (id: string) =>
    request<{ message: string }>(`/api/admin/coupons/${id}`, {
      method: 'DELETE'
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

  getAuditLogs: () => request<{ logs: AuditLog[] }>('/api/admin/audit-logs'),

  // Product & Category Visibility Toggles
  togglePublishProduct: (id: string) =>
    request<{ product: Product; message: string }>(`/api/admin/products/${id}/toggle-publish`, {
      method: 'PATCH'
    }),

  togglePublishCategory: (id: string) =>
    request<{ category: Category; message: string }>(`/api/admin/categories/${id}/toggle-publish`, {
      method: 'PATCH'
    }),

  // MongoDB Cloud Persistence (Configured via MONGODB_URI in environment)
  getMongoStatus: () =>
    request<{
      isConfigured: boolean;
      isConnected: boolean;
      dbName: string;
      collections: { products: number; categories: number; orders: number; users: number };
    }>('/api/admin/mongodb/status'),

  syncAllToMongo: () =>
    request<{ success: boolean; message: string }>('/api/admin/mongodb/sync-all', {
      method: 'POST'
    })
};

