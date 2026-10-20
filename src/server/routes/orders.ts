import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { getDatabase, withTransaction, recordAuditLog } from '../db.ts';
import { authenticateUser, createAuthToken, type AuthenticatedRequest } from '../auth.ts';
import {
  Order,
  OrderItemSnapshot,
  OrderFulfilmentStatus,
  InventoryMovement,
  User
} from '../../types/index.ts';
import { syncOrderToMongo } from '../mongodb.ts';

const router = Router();

const orderCreateSchema = z.object({
  customerName: z.string().min(2, 'আপনার নাম দিন'),
  customerPhone: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন'),
  customerEmail: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  division: z.string().min(1, 'বিভাগ নির্বাচন করুন'),
  district: z.string().min(1, 'জেলা নির্বাচন করুন'),
  upazila: z.string().min(1, 'উপজেলা/থানা নির্বাচন করুন'),
  fullAddress: z.string().min(5, 'বিস্তারিত ডেলিভারি ঠিকানা লিখুন'),
  deliveryInstructions: z.string().optional(),
  paymentMethod: z.enum(['cod', 'sslcommerz_sandbox']),
  couponCode: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().min(1)
    })
  ).min(1, 'কার্টে অন্তত একটি পণ্য থাকা আবশ্যক')
});

// POST /api/orders - Create Order with Transaction & Concurrency Protection
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const parse = orderCreateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      division,
      district,
      upazila,
      fullAddress,
      deliveryInstructions,
      paymentMethod,
      couponCode,
      items
    } = parse.data;

    const cleanPhone = customerPhone.replace(/^(\+88|88)/, '');

    const orderResult = await withTransaction(async (db) => {
      // 1. Concurrency Check & Item Snapshots
      const itemSnapshots: OrderItemSnapshot[] = [];
      const inventoryMovements: InventoryMovement[] = [];
      let calculatedSubtotal = 0;

      for (const reqItem of items) {
        const product = db.products.find(
          (p) => p.id === reqItem.productId && p.isPublished && !p.isArchived
        );

        if (!product) {
          throw new Error('একটি পণ্য বর্তমানে আর বিক্রয়ের জন্য উপলব্ধ নেই');
        }

        let variantNameBn: string | undefined = undefined;
        let unitPrice = product.price;
        let sku = product.sku;

        if (reqItem.variantId && product.variants) {
          const variant = product.variants.find((v) => v.id === reqItem.variantId);
          if (!variant) {
            throw new Error(`পণ্যের ভেরিয়েন্ট খুঁজে পাওয়া যায়নি`);
          }
          if (variant.stock < reqItem.quantity) {
            throw new Error(
              `"${product.titleBn} (${variant.nameBn})" এর পর্যাপ্ত স্টক নেই (মওজুদ: ${variant.stock} টি)`
            );
          }
          // Deduct variant stock
          const prevVariantStock = variant.stock;
          variant.stock -= reqItem.quantity;
          variantNameBn = variant.nameBn;
          unitPrice += variant.priceDelta;
          sku = variant.sku;

          // Track inventory movement
          inventoryMovements.push({
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: product.id,
            productTitleBn: product.titleBn,
            variantSku: sku,
            changeQuantity: -reqItem.quantity,
            previousStock: prevVariantStock,
            newStock: variant.stock,
            reason: 'order_placement',
            createdBy: 'Storefront Checkout',
            createdAt: new Date().toISOString()
          });
        }

        // Check & Deduct base product stock
        if (product.stock < reqItem.quantity) {
          throw new Error(
            `"${product.titleBn}" এর পর্যাপ্ত স্টক নেই (মওজুদ: ${product.stock} টি)`
          );
        }

        const prevProductStock = product.stock;
        product.stock -= reqItem.quantity;
        product.salesCount = (product.salesCount || 0) + reqItem.quantity;

        inventoryMovements.push({
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productTitleBn: product.titleBn,
          changeQuantity: -reqItem.quantity,
          previousStock: prevProductStock,
          newStock: product.stock,
          reason: 'order_placement',
          createdBy: 'Storefront Checkout',
          createdAt: new Date().toISOString()
        });

        const itemTotal = unitPrice * reqItem.quantity;
        calculatedSubtotal += itemTotal;

        itemSnapshots.push({
          productId: product.id,
          variantId: reqItem.variantId,
          productTitleBn: product.titleBn,
          productTitleEn: product.titleEn,
          variantNameBn,
          sku,
          unitPrice,
          quantity: reqItem.quantity,
          itemTotal,
          imageUrl: product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'
        });
      }

      // 2. Validate Coupon Server-Side
      let calculatedDiscount = 0;
      let validCouponCode: string | undefined = undefined;

      if (couponCode && couponCode.trim()) {
        const cCode = couponCode.trim().toUpperCase();
        const coupon = db.coupons.find(
          (c) => c.code === cCode && c.isActive
        );
        if (
          coupon &&
          new Date(coupon.expiresAt).getTime() >= Date.now() &&
          calculatedSubtotal >= coupon.minOrderValue &&
          (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit)
        ) {
          validCouponCode = coupon.code;
          coupon.usageCount += 1;
          if (coupon.discountType === 'percentage') {
            calculatedDiscount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
              calculatedDiscount = coupon.maxDiscount;
            }
          } else {
            calculatedDiscount = Math.min(coupon.discountValue, calculatedSubtotal);
          }
        }
      }

      // 3. Calculate Delivery Fee
      const settings = db.storeSettings;
      let calculatedDeliveryFee = settings.defaultDeliveryFeeOutside;
      if (division.toLowerCase() === 'dhaka') {
        calculatedDeliveryFee = settings.defaultDeliveryFeeDhaka;
      }
      if (calculatedSubtotal >= settings.freeDeliveryThreshold) {
        calculatedDeliveryFee = 0;
      }

      const calculatedTotal = Math.max(
        0,
        calculatedSubtotal - calculatedDiscount + calculatedDeliveryFee
      );

      // 4. Generate Unique Order Number
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `SD-${new Date().getFullYear()}-${randomSuffix}`;
      const orderId = `ord-${Date.now()}`;

      // 5. Initial Status Timeline
      const initialTimeline = [
        {
          status: 'pending_confirmation' as OrderFulfilmentStatus,
          timestamp: new Date().toISOString(),
          note:
            paymentMethod === 'cod'
              ? 'ক্যাশ অন ডেলিভারি অর্ডার গৃহীত হয়েছে। টিম থেকে যাচাই করা হবে।'
              : 'অনলাইন পেমেন্ট গেটওয়েতে নির্দেশিত করা হয়েছে।',
          changedBy: 'System'
        }
      ];

      // 5. Automatic Customer Account Association & Seamless Creation
      let resolvedCustomerId = req.user ? req.user.id : undefined;
      let autoUser: User | undefined = req.user;
      let isNewAccount = false;

      if (!resolvedCustomerId) {
        // Check if an account already exists with this phone or email
        const existing = db.users.find(
          (u) =>
            u.phone === cleanPhone ||
            (customerEmail && customerEmail.trim() && u.email.toLowerCase() === customerEmail.trim().toLowerCase())
        );

        if (existing) {
          resolvedCustomerId = existing.id;
          autoUser = existing;
          if (!existing.savedAddresses) existing.savedAddresses = [];
          const hasAddr = existing.savedAddresses.some((a) => a.fullAddress === fullAddress.trim());
          if (!hasAddr) {
            existing.savedAddresses.push({
              id: `addr-${Date.now()}`,
              title: 'ডেলিভারি ঠিকানা',
              name: customerName.trim(),
              phone: cleanPhone,
              division,
              district,
              upazila,
              fullAddress: fullAddress.trim(),
              isDefault: existing.savedAddresses.length === 0
            });
          }
        } else {
          // Auto-create customer account using phone number
          isNewAccount = true;
          const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const defaultPassword = cleanPhone;
          const passwordHash = crypto.createHash('sha256').update(defaultPassword + '_oshesh_salt_2026').digest('hex');
          const newUser: User = {
            id: newUserId,
            name: customerName.trim(),
            email: customerEmail && customerEmail.trim() ? customerEmail.trim().toLowerCase() : `${cleanPhone}@customer.sashroyidaam.com`,
            phone: cleanPhone,
            role: 'customer',
            passwordHash,
            savedAddresses: [
              {
                id: `addr-${Date.now()}`,
                title: 'হোম ডেলিভারি',
                name: customerName.trim(),
                phone: cleanPhone,
                division,
                district,
                upazila,
                fullAddress: fullAddress.trim(),
                isDefault: true
              }
            ],
            createdAt: new Date().toISOString()
          };
          db.users.push(newUser);
          resolvedCustomerId = newUserId;
          autoUser = newUser;
        }
      }

      const order: Order = {
        id: orderId,
        orderNumber,
        customerId: resolvedCustomerId,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail?.trim() || undefined,
        division,
        district,
        upazila,
        fullAddress: fullAddress.trim(),
        deliveryInstructions: deliveryInstructions?.trim() || undefined,
        paymentMethod,
        paymentStatus: 'unpaid',
        fulfilmentStatus: 'pending_confirmation',
        items: itemSnapshots,
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        deliveryFee: calculatedDeliveryFee,
        total: calculatedTotal,
        couponCode: validCouponCode,
        statusTimeline: initialTimeline,
        internalNotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to database
      db.orders.unshift(order);
      db.inventoryMovements.push(...inventoryMovements);

      return { order, autoUser, isNewAccount };
    });

    // Sync to MongoDB in background
    syncOrderToMongo(orderResult.order).catch((err) => console.warn('MongoDB order sync error:', err));

    const autoAuthToken = orderResult.autoUser ? createAuthToken(orderResult.autoUser) : undefined;

    res.status(201).json({
      order: orderResult.order,
      autoUser: orderResult.autoUser ? {
        id: orderResult.autoUser.id,
        name: orderResult.autoUser.name,
        email: orderResult.autoUser.email,
        phone: orderResult.autoUser.phone,
        role: orderResult.autoUser.role
      } : null,
      autoAuthToken,
      isNewAccount: orderResult.isNewAccount,
      message: 'অর্ডারটি সফলভাবে তৈরি হয়েছে'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে' });
  }
});

// POST /api/orders/track - Secure Public Order Tracking (Requires OrderNumber + Phone)
router.post('/track', (req, res) => {
  const { orderNumber, phone } = req.body;
  if (!orderNumber || !phone) {
    res.status(400).json({ error: 'অর্ডার নম্বর এবং মোবাইল নম্বর উভয়ই প্রয়োজন' });
    return;
  }

  const cleanNum = orderNumber.trim().toUpperCase();
  const cleanPhone = phone.trim().replace(/^(\+88|88)/, '');

  const db = getDatabase();
  const order = db.orders.find(
    (o) => o.orderNumber.toUpperCase() === cleanNum && o.customerPhone === cleanPhone
  );

  if (!order) {
    res.status(404).json({
      error: 'প্রদত্ত তথ্য অনুযায়ী কোনো অর্ডার পাওয়া যায়নি। নম্বর দুটি পুনরায় যাচাই করুন।'
    });
    return;
  }

  res.json({ order });
});

// GET /api/orders/my-orders - Customer's Own Order History
router.get('/my-orders', authenticateUser, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'লগইন প্রয়োজন' });
    return;
  }

  const db = getDatabase();
  const userOrders = db.orders
    .filter(
      (o) =>
        o.customerId === req.user!.id ||
        o.customerPhone === req.user!.phone ||
        (req.user!.email && o.customerEmail === req.user!.email)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ orders: userOrders });
});

// GET /api/orders/:id - Fetch Single Order Details (Secure)
router.get('/:id', authenticateUser, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    res.status(404).json({ error: 'অর্ডার পাওয়া যায়নি' });
    return;
  }

  // Security check: staff or order owner or phone match
  const isStaff =
    req.user && ['super_admin', 'admin', 'order_manager', 'support_agent'].includes(req.user.role);
  const isOwner =
    req.user &&
    (order.customerId === req.user.id ||
      order.customerPhone === req.user.phone ||
      order.customerEmail === req.user.email);

  // If query specifies phone (for newly placed guest order verification screen)
  const queryPhone = (req.query.phone as string)?.replace(/^(\+88|88)/, '');
  const isGuestVerified = queryPhone && queryPhone === order.customerPhone;

  if (!isStaff && !isOwner && !isGuestVerified) {
    res.status(403).json({ error: 'এই অর্ডার দেখার অনুমতি নেই' });
    return;
  }

  res.json({ order });
});

export default router;
