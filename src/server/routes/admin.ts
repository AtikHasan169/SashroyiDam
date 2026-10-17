import { Router } from 'express';
import { z } from 'zod';
import { getDatabase, withTransaction, recordAuditLog } from '../db.ts';
import { authenticateUser, requireAuth, requireRole, type AuthenticatedRequest } from '../auth.ts';
import type {
  Product,
  Category,
  Order,
  OrderFulfilmentStatus,
  Coupon,
  ShippingRate,
  Banner,
  StoreSettings,
  InventoryMovement
} from '../../types/index.ts';
import {
  configureSupabase,
  getSupabaseConfig,
  syncAllToSupabase,
  syncProductToSupabase,
  deleteProductFromSupabase,
  syncCategoryToSupabase,
  deleteCategoryFromSupabase
} from '../supabase.ts';

const router = Router();

// Secure all admin routes with authentication and role check
router.use(authenticateUser);
router.use(requireAuth);
router.use(
  requireRole(['super_admin', 'admin', 'order_manager', 'product_manager', 'support_agent'])
);

// 1. Dashboard Metrics
router.get('/metrics', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const totalOrders = db.orders.length;
  const ordersToday = db.orders.filter(
    (o) => new Date(o.createdAt).getTime() >= todayStart
  ).length;

  // Gross sales = total of all non-cancelled orders
  const grossSales = db.orders
    .filter((o) => o.fulfilmentStatus !== 'cancelled' && o.fulfilmentStatus !== 'returned')
    .reduce((sum, o) => sum + o.total, 0);

  // Collected payments = orders where money actually received (paid)
  const collectedPayments = db.orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  // COD pending collection
  const pendingCodAmount = db.orders
    .filter((o) => o.paymentMethod === 'cod' && o.paymentStatus === 'unpaid' && o.fulfilmentStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = db.orders.filter(
    (o) => o.fulfilmentStatus === 'pending_confirmation'
  ).length;

  const lowStockProducts = db.products.filter(
    (p) => !p.isArchived && p.stock <= 10
  );

  const bestSellers = [...db.products]
    .filter((p) => !p.isArchived)
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 5);

  const recentOrders = [...db.orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  res.json({
    ordersToday,
    totalOrders,
    grossSales,
    collectedPayments,
    pendingCodAmount,
    pendingOrders,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 5),
    bestSellers,
    recentOrders
  });
});

// 2. Order Management
router.get('/orders', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const {
    status,
    paymentStatus,
    paymentMethod,
    search,
    page = '1',
    limit = '15'
  } = req.query as Record<string, string>;

  let list = [...db.orders];

  if (status && status !== 'all') {
    list = list.filter((o) => o.fulfilmentStatus === status);
  }

  if (paymentStatus && paymentStatus !== 'all') {
    list = list.filter((o) => o.paymentStatus === paymentStatus);
  }

  if (paymentMethod && paymentMethod !== 'all') {
    list = list.filter((o) => o.paymentMethod === paymentMethod);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q))
    );
  }

  // Sort by date descending
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 15);
  const total = list.length;
  const items = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    orders: items,
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  });
});

// Update order status with timeline event and stock restoration on cancellation
router.put('/orders/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, note, paymentStatus } = req.body as {
      status: OrderFulfilmentStatus;
      note?: string;
      paymentStatus?: 'unpaid' | 'paid' | 'refunded' | 'failed';
    };

    if (!status) {
      res.status(400).json({ error: 'স্ট্যাটাস প্রয়োজন' });
      return;
    }

    const updated = await withTransaction(async (db) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new Error('অর্ডার পাওয়া যায়নি');

      const prevStatus = order.fulfilmentStatus;
      order.fulfilmentStatus = status;
      order.updatedAt = new Date().toISOString();

      if (paymentStatus) {
        order.paymentStatus = paymentStatus;
      }

      // If status changed to delivered and COD, automatically mark paid
      if (status === 'delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }

      // Restock inventory if cancelling an order that was not previously cancelled
      if (
        (status === 'cancelled' || status === 'returned') &&
        prevStatus !== 'cancelled' &&
        prevStatus !== 'returned'
      ) {
        for (const item of order.items) {
          const product = db.products.find((p) => p.id === item.productId);
          if (product) {
            const prevStock = product.stock;
            product.stock += item.quantity;
            db.inventoryMovements.push({
              id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              productId: product.id,
              productTitleBn: product.titleBn,
              changeQuantity: item.quantity,
              previousStock: prevStock,
              newStock: product.stock,
              reason: status === 'cancelled' ? 'order_cancellation' : 'return_restock',
              orderId: order.id,
              createdBy: req.user!.name,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      // Append to status timeline
      order.statusTimeline.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `স্ট্যাটাস পরিবর্তন: ${prevStatus} ➔ ${status}`,
        changedBy: `${req.user!.name} (${req.user!.role})`
      });

      return order;
    });

    await recordAuditLog(
      'ORDER_STATUS_UPDATE',
      req.user!,
      `Order ${updated.orderNumber} status changed to ${status}`
    );

    res.json({ order: updated, message: 'অর্ডার স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে' });
  }
});

// Add internal staff note to order
router.post('/orders/:id/notes', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note || !note.trim()) {
      res.status(400).json({ error: 'নোট লিখুন' });
      return;
    }

    const updated = await withTransaction((db) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new Error('অর্ডার পাওয়া যায়নি');

      if (!order.internalNotes) order.internalNotes = [];
      const entry = `[${new Date().toLocaleDateString('bn-BD')}] ${req.user!.name}: ${note.trim()}`;
      order.internalNotes.push(entry);
      return order;
    });

    res.json({ order: updated, message: 'অভ্যন্তরীণ নোট যোগ করা হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'নোট যোগ ব্যর্থ হয়েছে' });
  }
});

// 3. Product Management (CRUD + Stock Adjust)
router.get('/products', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const { search, category, status } = req.query as Record<string, string>;

  let list = [...db.products];

  if (category && category !== 'all') {
    list = list.filter((p) => p.categoryId === category);
  }

  if (status === 'archived') {
    list = list.filter((p) => p.isArchived);
  } else if (status === 'unpublished') {
    list = list.filter((p) => !p.isPublished && !p.isArchived);
  } else if (status === 'low_stock') {
    list = list.filter((p) => !p.isArchived && p.stock <= 10);
  } else {
    // Default show active (not archived)
    list = list.filter((p) => !p.isArchived);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.titleBn.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ products: list });
});

// Create product
router.post('/products', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      titleBn,
      titleEn,
      descriptionBn,
      descriptionEn,
      price,
      originalPrice,
      stock,
      categoryId,
      brand,
      sku,
      images,
      variants,
      attributes,
      isFeatured,
      isPublished,
      tags
    } = req.body;

    if (!titleBn || !price || stock === undefined || !categoryId) {
      res.status(400).json({ error: 'আবশ্যকীয় ঘরগুলো পূরণ করুন' });
      return;
    }

    const slug = (titleEn || titleBn)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60) + `-${Date.now().toString(36)}`;

    const newProduct = await withTransaction((db) => {
      const cat = db.categories.find((c) => c.id === categoryId);

      const product: Product = {
        id: `prod-${Date.now()}`,
        slug,
        titleBn: titleBn.trim(),
        titleEn: titleEn?.trim() || titleBn.trim(),
        descriptionBn: descriptionBn?.trim() || '',
        descriptionEn: descriptionEn?.trim() || '',
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        stock: Number(stock),
        categoryId,
        categorySlug: cat?.slug,
        categoryNameBn: cat?.nameBn,
        brand: brand?.trim() || 'সাশ্রয়ী দাম',
        sku: sku?.trim() || `SD-${Math.floor(1000 + Math.random() * 9000)}`,
        images: Array.isArray(images) && images.length > 0 ? images : ['/src/assets/images/category_kitchen_cookware_1792084991823.jpg'],
        variants: variants || [],
        attributes: attributes || {},
        isFeatured: Boolean(isFeatured),
        isPublished: isPublished !== false,
        isArchived: false,
        salesCount: 0,
        rating: 5.0,
        reviewCount: 0,
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.products.unshift(product);

      db.inventoryMovements.push({
        id: `inv-${Date.now()}`,
        productId: product.id,
        productTitleBn: product.titleBn,
        changeQuantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: 'manual_restock',
        createdBy: req.user!.name,
        createdAt: new Date().toISOString()
      });

      return product;
    });

    await recordAuditLog(
      'PRODUCT_CREATED',
      req.user!,
      `Product "${newProduct.titleBn}" (SKU: ${newProduct.sku}) created.`
    );

    res.status(201).json({ product: newProduct, message: 'পণ্যটি সফলভাবে যুক্ত হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'পণ্য তৈরি ব্যর্থ হয়েছে' });
  }
});

// Update product
router.put('/products/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await withTransaction((db) => {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('পণ্য পাওয়া যায়নি');

      const existing = db.products[idx];

      // Track manual stock change if changed
      if (body.stock !== undefined && Number(body.stock) !== existing.stock) {
        const diff = Number(body.stock) - existing.stock;
        db.inventoryMovements.push({
          id: `inv-${Date.now()}`,
          productId: existing.id,
          productTitleBn: existing.titleBn,
          changeQuantity: diff,
          previousStock: existing.stock,
          newStock: Number(body.stock),
          reason: 'manual_restock',
          createdBy: req.user!.name,
          createdAt: new Date().toISOString()
        });
      }

      const newCategoryId = body.categoryId || existing.categoryId;
      const matchedCat = db.categories.find((c) => c.id === newCategoryId);

      db.products[idx] = {
        ...existing,
        ...body,
        categoryId: newCategoryId,
        categorySlug: matchedCat?.slug || existing.categorySlug,
        categoryNameBn: matchedCat?.nameBn || existing.categoryNameBn,
        variants: body.variants !== undefined ? body.variants : existing.variants,
        attributes: body.attributes !== undefined ? body.attributes : existing.attributes,
        price: body.price !== undefined ? Number(body.price) : existing.price,
        originalPrice: body.originalPrice !== undefined ? Number(body.originalPrice) : existing.originalPrice,
        stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
        updatedAt: new Date().toISOString()
      };

      return db.products[idx];
    });

    await recordAuditLog(
      'PRODUCT_UPDATED',
      req.user!,
      `Product "${updated.titleBn}" updated.`
    );

    res.json({ product: updated, message: 'পণ্য সফলভাবে আপডেট হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'আপডেট ব্যর্থ হয়েছে' });
  }
});

// Toggle product visibility (Hide / Unhide)
router.patch('/products/:id/toggle-publish', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await withTransaction((db) => {
      const prod = db.products.find((p) => p.id === id);
      if (!prod) throw new Error('পণ্য পাওয়া যায়নি');
      prod.isPublished = prod.isPublished === false ? true : false;
      prod.updatedAt = new Date().toISOString();
      return prod;
    });

    await syncProductToSupabase(updated);

    res.json({
      product: updated,
      message: updated.isPublished ? 'পণ্যটি প্রদর্শন করা হচ্ছে (Visible)' : 'পণ্যটি লুকানো হয়েছে (Hidden)'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে' });
  }
});

// Delete or Archive product
router.delete('/products/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    let productTitle = '';
    await withTransaction((db) => {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('পণ্য পাওয়া যায়নি');

      productTitle = db.products[idx].titleBn;
      if (permanent) {
        db.products.splice(idx, 1);
      } else {
        db.products[idx].isArchived = true;
        db.products[idx].isPublished = false;
        db.products[idx].updatedAt = new Date().toISOString();
      }
    });

    if (permanent) {
      await deleteProductFromSupabase(id);
    }

    await recordAuditLog(
      permanent ? 'PRODUCT_DELETED' : 'PRODUCT_ARCHIVED',
      req.user!,
      `Product "${productTitle}" (ID: ${id}) ${permanent ? 'permanently deleted' : 'archived'}.`
    );

    res.json({ message: permanent ? 'পণ্যটি স্থায়ীভাবে মুছে ফেলা হয়েছে' : 'পণ্যটি মুছে/আর্কাইভ করা হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'মুছে ফেলা ব্যর্থ হয়েছে' });
  }
});

// 4. Category Management
router.post('/categories', async (req: AuthenticatedRequest, res) => {
  try {
    const { nameBn, nameEn, descriptionBn, image, isFeatured, variantType, defaultOptions } = req.body;
    if (!nameBn) {
      res.status(400).json({ error: 'ক্যাটাগরির নাম দিন' });
      return;
    }

    const slug = (nameEn || nameBn)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const newCat = await withTransaction((db) => {
      const cat: Category = {
        id: `cat-${Date.now()}`,
        slug,
        nameBn: nameBn.trim(),
        nameEn: nameEn?.trim() || nameBn.trim(),
        descriptionBn: descriptionBn?.trim() || '',
        image: image || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
        displayOrder: db.categories.length + 1,
        isFeatured: Boolean(isFeatured),
        variantType: variantType || 'none',
        defaultOptions: Array.isArray(defaultOptions) ? defaultOptions : []
      };
      db.categories.push(cat);
      return cat;
    });

    await recordAuditLog(
      'CATEGORY_CREATED',
      req.user!,
      `Category "${newCat.nameBn}" created.`
    );

    res.status(201).json({ category: newCat, message: 'ক্যাটাগরি সফলভাবে যুক্ত হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/categories/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { nameBn, nameEn, descriptionBn, image, isFeatured, variantType, defaultOptions, displayOrder } = req.body;

    const updated = await withTransaction((db) => {
      const cat = db.categories.find((c) => c.id === id);
      if (!cat) throw new Error('ক্যাটাগরি পাওয়া যায়নি');

      if (nameBn) cat.nameBn = nameBn.trim();
      if (nameEn) cat.nameEn = nameEn.trim();
      if (descriptionBn !== undefined) cat.descriptionBn = descriptionBn.trim();
      if (image) cat.image = image;
      if (isFeatured !== undefined) cat.isFeatured = Boolean(isFeatured);
      if (variantType !== undefined) cat.variantType = variantType;
      if (defaultOptions !== undefined) cat.defaultOptions = Array.isArray(defaultOptions) ? defaultOptions : [];
      if (displayOrder !== undefined) cat.displayOrder = Number(displayOrder);

      return cat;
    });

    await recordAuditLog(
      'CATEGORY_UPDATED',
      req.user!,
      `Category "${updated.nameBn}" updated.`
    );

    res.json({ category: updated, message: 'ক্যাটাগরি আপডেট সম্পন্ন হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'ক্যাটাগরি আপডেট ব্যর্থ হয়েছে' });
  }
});

// Toggle category visibility (Featured / Hide)
router.patch('/categories/:id/toggle-publish', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await withTransaction((db) => {
      const cat = db.categories.find((c) => c.id === id);
      if (!cat) throw new Error('ক্যাটাগরি পাওয়া যায়নি');
      cat.isFeatured = !cat.isFeatured;
      return cat;
    });

    await syncCategoryToSupabase(updated);

    res.json({
      category: updated,
      message: updated.isFeatured ? 'ক্যাটাগরি দৃশ্যমান করা হয়েছে' : 'ক্যাটাগরি লুকানো হয়েছে'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে' });
  }
});

router.delete('/categories/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    let deletedName = '';
    await withTransaction((db) => {
      const idx = db.categories.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('ক্যাটাগরি পাওয়া যায়নি');

      deletedName = db.categories[idx].nameBn;

      // Safely unlink products from this category to general category so deletion never fails
      db.products.forEach((p) => {
        if (p.categoryId === id) {
          p.categoryId = 'cat-general';
          p.categorySlug = 'general';
          p.categoryNameBn = 'সাধারণ';
        }
      });

      db.categories.splice(idx, 1);
    });

    await deleteCategoryFromSupabase(id);

    await recordAuditLog(
      'CATEGORY_DELETED',
      req.user!,
      `Category "${deletedName}" (ID: ${id}) deleted.`
    );

    res.json({ message: 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'মুছে ফেলা সম্ভব হয়নি' });
  }
});

// 5. Coupon Management
router.get('/coupons', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  res.json({ coupons: db.coupons });
});

router.post('/coupons', async (req: AuthenticatedRequest, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiresAt, usageLimit } = req.body;
    if (!code || !discountValue || !minOrderValue) {
      res.status(400).json({ error: 'কুপনের সব প্রয়োজনীয় তথ্য দিন' });
      return;
    }

    const newCoupon = await withTransaction((db) => {
      const c: Coupon = {
        id: `coup-${Date.now()}`,
        code: code.trim().toUpperCase(),
        discountType: discountType || 'fixed',
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue),
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: Number(usageLimit) || 100,
        usageCount: 0,
        isActive: true
      };
      db.coupons.push(c);
      return c;
    });

    res.status(201).json({ coupon: newCoupon, message: 'কুপন তৈরি সম্পন্ন হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/coupons/:id/toggle', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await withTransaction((db) => {
      const c = db.coupons.find((item) => item.id === id);
      if (!c) throw new Error('কুপন পাওয়া যায়নি');
      c.isActive = !c.isActive;
      return c;
    });
    res.json({ coupon: updated, message: `কুপন স্ট্যাটাস পরিবর্তিত হয়েছে` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Store Settings & Shipping Rates
router.get('/settings', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  res.json({
    settings: db.storeSettings,
    shippingRates: db.shippingRates,
    banners: db.banners
  });
});

router.put('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await withTransaction((db) => {
      db.storeSettings = {
        ...db.storeSettings,
        ...req.body
      };
      return db.storeSettings;
    });
    res.json({ settings: updated, message: 'স্টোর সেটিংস সফলভাবে আপডেট হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/shipping/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { rate, estimatedDaysBn, isActive } = req.body;

    const updated = await withTransaction((db) => {
      const s = db.shippingRates.find((item) => item.id === id);
      if (!s) throw new Error('শিপিং জোন পাওয়া যায়নি');
      if (rate !== undefined) s.rate = Number(rate);
      if (estimatedDaysBn) s.estimatedDaysBn = estimatedDaysBn;
      if (isActive !== undefined) s.isActive = Boolean(isActive);
      return s;
    });

    res.json({ shippingRate: updated, message: 'শিপিং রেট আপডেট হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Inventory Movements & Audit Logs
router.get('/inventory-movements', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  res.json({
    movements: db.inventoryMovements.slice(-100).reverse()
  });
});

router.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  res.json({
    logs: db.auditLogs.slice(0, 100)
  });
});

// 8. CSV Product Export & Import
router.get('/products/export-csv', (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const headers = ['ID', 'SKU', 'Title Bn', 'Title En', 'Price', 'Original Price', 'Stock', 'Category', 'Sales Count'];
  const rows = db.products
    .filter((p) => !p.isArchived)
    .map((p) => [
      `"${p.id}"`,
      `"${p.sku}"`,
      `"${p.titleBn.replace(/"/g, '""')}"`,
      `"${p.titleEn.replace(/"/g, '""')}"`,
      p.price,
      p.originalPrice || '',
      p.stock,
      `"${p.categoryNameBn || ''}"`,
      p.salesCount || 0
    ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sashroyi_products.csv"');
  res.send('\uFEFF' + csv); // Byte order mark for UTF-8 in Excel
});

// 9. Supabase Cloud Database Management
router.get('/supabase/status', (req: AuthenticatedRequest, res) => {
  const config = getSupabaseConfig();
  res.json(config);
});

router.post('/supabase/configure', async (req: AuthenticatedRequest, res) => {
  try {
    const { url, key } = req.body;
    const result = await configureSupabase(url, key);
    await recordAuditLog(
      'SUPABASE_CONFIGURED',
      req.user!,
      `Supabase cloud database connected (${url}).`
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Supabase কনফিগারেশন ব্যর্থ হয়েছে' });
  }
});

router.post('/supabase/sync-all', async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const result = await syncAllToSupabase(db);
    await recordAuditLog(
      'SUPABASE_SYNCED',
      req.user!,
      `Synchronized ${result.categoriesCount} categories and ${result.productsCount} products to Supabase cloud.`
    );
    res.json({
      message: `Supabase-এ ${result.categoriesCount} টি ক্যাটাগরি ও ${result.productsCount} টি পণ্য সফলভাবে সিঙ্ক হয়েছে`,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'সিঙ্ক ব্যর্থ হয়েছে' });
  }
});

export default router;
