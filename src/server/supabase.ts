import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseSchema } from './db.ts';
import type { Product, Category, Order, StoreSettings, Coupon, User } from '../types/index.ts';

const CONFIG_PATH = path.resolve(process.cwd(), 'data', 'supabase_config.json');

let runtimeUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
let runtimeKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Check if config saved on disk
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.url && parsed.key) {
      runtimeUrl = parsed.url;
      runtimeKey = parsed.key;
    }
  }
} catch (e) {
  // ignore
}

let supabase: SupabaseClient | null = null;

function initClient(url: string, key: string): boolean {
  if (!url || !key) {
    supabase = null;
    return false;
  }
  try {
    supabase = createClient(url, key, {
      auth: { persistSession: false }
    });
    runtimeUrl = url;
    runtimeKey = key;
    console.log('✅ Supabase PostgreSQL client connected successfully');
    return true;
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client:', err);
    supabase = null;
    return false;
  }
}

if (runtimeUrl && runtimeKey) {
  initClient(runtimeUrl, runtimeKey);
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export function getSupabaseConfig(): { url: string; hasKey: boolean; isConnected: boolean } {
  return {
    url: runtimeUrl,
    hasKey: Boolean(runtimeKey),
    isConnected: supabase !== null
  };
}

export async function configureSupabase(url: string, key: string): Promise<{ success: boolean; message: string }> {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (!cleanUrl || !cleanKey) {
    throw new Error('Supabase URL ও Key উভয়ই প্রদান করতে হবে');
  }

  const ok = initClient(cleanUrl, cleanKey);
  if (!ok || !supabase) {
    throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি');
  }

  // Test simple query
  try {
    const { error } = await supabase.from('categories').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase test warning:', error.message);
    }

    // Save to disk so it stays configured
    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_PATH, JSON.stringify({ url: cleanUrl, key: cleanKey }, null, 2));
    } catch (saveErr) {
      console.error('Failed to save supabase_config.json:', saveErr);
    }

    return { success: true, message: 'Supabase সফলভাবে সংযুক্ত ও সংরক্ষিত হয়েছে!' };
  } catch (err: any) {
    throw new Error(`Supabase সংযোগ পরীক্ষা ব্যর্থ হয়েছে: ${err.message}`);
  }
}

export async function fetchSupabaseData(): Promise<Partial<DatabaseSchema> | null> {
  if (!supabase) return null;

  try {
    const [productsRes, categoriesRes, ordersRes, settingsRes, couponsRes, usersRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('store_settings').select('*').limit(1),
      supabase.from('coupons').select('*'),
      Promise.resolve(supabase.from('users').select('*')).catch(() => ({ data: null }))
    ]);

    const result: Partial<DatabaseSchema> = {};

    if (usersRes.data && usersRes.data.length > 0) {
      result.users = (usersRes.data as any[]).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        passwordHash: u.password_hash,
        savedAddresses: u.saved_addresses || [],
        createdAt: u.created_at
      }));
    }

    if (productsRes.data && productsRes.data.length > 0) {
      result.products = (productsRes.data as any[]).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        titleBn: p.title_bn,
        titleEn: p.title_en,
        descriptionBn: p.description_bn,
        descriptionEn: p.description_en,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        stock: Number(p.stock),
        categoryId: p.category_id,
        categorySlug: p.category_slug,
        categoryNameBn: p.category_name_bn,
        brand: p.brand || 'সাশ্রয়ী দাম',
        sku: p.sku,
        images: Array.isArray(p.images) ? p.images : [],
        variants: p.variants || [],
        attributes: p.attributes || {},
        isFeatured: Boolean(p.is_featured),
        isPublished: p.is_published !== false,
        isArchived: Boolean(p.is_archived),
        salesCount: Number(p.sales_count || 0),
        rating: Number(p.rating || 5.0),
        reviewCount: Number(p.review_count || 0),
        tags: Array.isArray(p.tags) ? p.tags : [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    }

    if (categoriesRes.data && categoriesRes.data.length > 0) {
      result.categories = (categoriesRes.data as any[]).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        nameBn: c.name_bn,
        nameEn: c.name_en,
        descriptionBn: c.description_bn,
        image: c.image,
        displayOrder: Number(c.display_order || 0),
        isFeatured: Boolean(c.is_featured)
      }));
    }

    if (ordersRes.data && ordersRes.data.length > 0) {
      result.orders = (ordersRes.data as any[]).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        customerEmail: o.customer_email,
        division: o.division,
        district: o.district,
        upazila: o.upazila,
        fullAddress: o.full_address,
        deliveryInstructions: o.delivery_instructions,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        fulfilmentStatus: o.fulfilment_status,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        deliveryFee: Number(o.delivery_fee),
        total: Number(o.total),
        items: o.items || [],
        statusTimeline: o.timeline || o.status_timeline || [],
        createdAt: o.created_at,
        updatedAt: o.updated_at
      }));
    }

    if (settingsRes.data && settingsRes.data.length > 0) {
      const s = (settingsRes.data as any[])[0];
      result.storeSettings = {
        storeNameBn: s.store_name_bn,
        storeNameEn: s.store_name_en,
        taglineBn: s.tagline_bn,
        phone: s.phone,
        email: s.email,
        supportHoursBn: s.support_hours_bn,
        addressBn: s.address_bn,
        announcementStripBn: s.announcement_strip_bn,
        showAnnouncement: s.show_announcement,
        freeDeliveryThreshold: Number(s.free_delivery_threshold),
        defaultDeliveryFeeDhaka: Number(s.default_delivery_fee_dhaka),
        defaultDeliveryFeeOutside: Number(s.default_delivery_fee_outside),
        isCodEnabled: s.is_cod_enabled,
        isSslcommerzEnabled: s.is_sslcommerz_enabled,
        sslSandboxMode: s.ssl_sandbox_mode !== false,
        facebookPageName: s.facebook_page_name,
        facebookUsername: s.facebook_username,
        facebookUrl: s.facebook_url
      };
    }

    if (couponsRes.data && couponsRes.data.length > 0) {
      result.coupons = (couponsRes.data as any[]).map((c: any) => ({
        id: c.id,
        code: c.code,
        discountType: c.discount_type,
        discountValue: Number(c.discount_value),
        minOrderValue: Number(c.min_order_value || 0),
        maxDiscount: c.max_discount ? Number(c.max_discount) : undefined,
        expiresAt: c.expires_at,
        usageLimit: Number(c.usage_limit || 1000),
        usageCount: Number(c.usage_count || 0),
        isActive: Boolean(c.is_active)
      }));
    }

    return result;
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

export async function syncOrderToSupabase(order: Order): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('orders').upsert({
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail,
      division: order.division,
      district: order.district,
      upazila: order.upazila,
      full_address: order.fullAddress,
      delivery_instructions: order.deliveryInstructions,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      fulfilment_status: order.fulfilmentStatus,
      subtotal: order.subtotal,
      discount: order.discount,
      delivery_fee: order.deliveryFee,
      total: order.total,
      items: order.items,
      timeline: order.statusTimeline,
      created_at: order.createdAt,
      updated_at: order.updatedAt
    });
  } catch (err) {
    console.error('Failed to sync order to Supabase:', err);
  }
}

export async function syncCategoryToSupabase(category: Category): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('categories').upsert({
      id: category.id,
      slug: category.slug,
      name_bn: category.nameBn,
      name_en: category.nameEn,
      description_bn: category.descriptionBn,
      image: category.image,
      display_order: category.displayOrder,
      is_featured: category.isFeatured
    });
  } catch (err) {
    console.error('Failed to sync category to Supabase:', err);
  }
}

export async function deleteCategoryFromSupabase(categoryId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('categories').delete().eq('id', categoryId);
  } catch (err) {
    console.error('Failed to delete category from Supabase:', err);
  }
}

export async function syncProductToSupabase(product: Product): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('products').upsert({
      id: product.id,
      slug: product.slug,
      title_bn: product.titleBn,
      title_en: product.titleEn,
      description_bn: product.descriptionBn,
      description_en: product.descriptionEn,
      price: product.price,
      original_price: product.originalPrice,
      stock: product.stock,
      category_id: product.categoryId,
      category_slug: product.categorySlug,
      category_name_bn: product.categoryNameBn,
      brand: product.brand,
      sku: product.sku,
      images: product.images,
      variants: product.variants,
      attributes: product.attributes,
      is_featured: product.isFeatured,
      is_published: product.isPublished,
      is_archived: product.isArchived,
      sales_count: product.salesCount,
      rating: product.rating,
      review_count: product.reviewCount,
      tags: product.tags,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to sync product to Supabase:', err);
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch (err) {
    console.error('Failed to delete product from Supabase:', err);
  }
}

export async function syncUserToSupabase(user: User): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      phone: user.phone,
      role: user.role,
      password_hash: user.passwordHash,
      saved_addresses: user.savedAddresses || [],
      created_at: user.createdAt
    });
  } catch (err) {
    console.warn('Failed to sync user to Supabase:', err);
  }
}

export async function findSupabaseUser(identifier: string): Promise<User | null> {
  if (!supabase) return null;
  try {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.trim().replace(/^(\+88|88)/, '').replace(/[\s\-\(\)]/g, '');

    // Search by email or phone
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${cleanId},phone.eq.${cleanPhone},phone.eq.${cleanId}`)
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const u = data[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      passwordHash: u.password_hash,
      savedAddresses: u.saved_addresses || [],
      createdAt: u.created_at
    };
  } catch (err) {
    console.warn('findSupabaseUser error:', err);
    return null;
  }
}

export async function syncAllToSupabase(db: DatabaseSchema): Promise<{ categoriesCount: number; productsCount: number; usersCount: number }> {
  if (!supabase) {
    throw new Error('Supabase কনফিগার করা নেই');
  }

  // 1. Sync Categories
  for (const cat of db.categories) {
    await syncCategoryToSupabase(cat);
  }

  // 2. Sync Products
  for (const prod of db.products) {
    await syncProductToSupabase(prod);
  }

  // 3. Sync Users
  for (const user of db.users) {
    await syncUserToSupabase(user);
  }

  return {
    categoriesCount: db.categories.length,
    productsCount: db.products.length,
    usersCount: db.users.length
  };
}
