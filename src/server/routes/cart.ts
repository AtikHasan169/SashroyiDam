import { Router } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db.ts';
import type {
  CartItem,
  PopulatedCartItem,
  CartValidationResult,
  Coupon
} from '../../types/index.ts';

const router = Router();

// Validate cart and calculate server-authoritative totals
router.post('/validate', (req, res) => {
  try {
    const { items, couponCode, division } = req.body as {
      items: CartItem[];
      couponCode?: string;
      division?: string;
    };

    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'কার্টের তথ্য সঠিক নয়' });
      return;
    }

    const db = getDatabase();
    const warnings: string[] = [];
    let subtotal = 0;

    const populatedItems: PopulatedCartItem[] = [];

    for (const item of items) {
      const product = db.products.find(
        (p) => p.id === item.productId && p.isPublished && !p.isArchived
      );

      if (!product) {
        warnings.push('একটি পণ্য আর পাওয়া যাচ্ছে না এবং কার্ট থেকে বাদ দেয়া হয়েছে');
        continue;
      }

      let selectedVariant = undefined;
      let availableStock = product.stock;
      let unitPrice = product.price;

      if (item.variantId && product.variants) {
        selectedVariant = product.variants.find((v) => v.id === item.variantId);
        if (selectedVariant) {
          availableStock = selectedVariant.stock;
          unitPrice += selectedVariant.priceDelta;
        }
      }

      const requestedQty = Math.max(1, Math.floor(item.quantity || 1));
      let isAvailable = true;
      let finalQty = requestedQty;
      let itemError: string | undefined = undefined;

      if (availableStock <= 0) {
        isAvailable = false;
        finalQty = 0;
        itemError = 'পণ্যটি বর্তমানে স্টকে নেই (Out of stock)';
        warnings.push(`"${product.titleBn}" বর্তমানে স্টকে নেই`);
      } else if (requestedQty > availableStock) {
        finalQty = availableStock;
        itemError = `সর্বোচ্চ ${availableStock} টি স্টক এভেলেবল রয়েছে`;
        warnings.push(
          `"${product.titleBn}" এর পর্যাপ্ত স্টক না থাকায় পরিমাণ ${availableStock}-এ সমন্বয় করা হয়েছে`
        );
      }

      const itemSubtotal = unitPrice * finalQty;
      if (isAvailable) {
        subtotal += itemSubtotal;
      }

      populatedItems.push({
        productId: product.id,
        variantId: item.variantId,
        quantity: finalQty,
        product,
        selectedVariant,
        unitPrice,
        itemSubtotal,
        isAvailable,
        maxAvailable: availableStock,
        error: itemError
      });
    }

    // Coupon verification
    let discount = 0;
    let appliedCoupon: Coupon | undefined = undefined;

    if (couponCode && couponCode.trim()) {
      const codeClean = couponCode.trim().toUpperCase();
      const coupon = db.coupons.find(
        (c) => c.code === codeClean && c.isActive
      );

      if (!coupon) {
        warnings.push('কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে');
      } else if (new Date(coupon.expiresAt).getTime() < Date.now()) {
        warnings.push('কুপনটির মেয়াদ শেষ হয়ে গেছে');
      } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        warnings.push('এই কুপন ব্যবহারের সর্বোচ্চ সীমা শেষ হয়েছে');
      } else if (subtotal < coupon.minOrderValue) {
        warnings.push(
          `কুপনটি প্রযোজ্য হতে অন্তত ৳${coupon.minOrderValue} টাকার অর্ডার প্রয়োজন`
        );
      } else {
        appliedCoupon = coupon;
        if (coupon.discountType === 'percentage') {
          let calcDiscount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && calcDiscount > coupon.maxDiscount) {
            calcDiscount = coupon.maxDiscount;
          }
          discount = calcDiscount;
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
      }
    }

    // Delivery fee calculation
    const settings = db.storeSettings;
    let deliveryFee = settings.defaultDeliveryFeeOutside;

    if (division && division.toLowerCase() === 'dhaka') {
      deliveryFee = settings.defaultDeliveryFeeDhaka;
    }

    // Free delivery check
    if (subtotal >= settings.freeDeliveryThreshold && subtotal > 0) {
      deliveryFee = 0;
    }

    const total = Math.max(0, subtotal - discount + (subtotal > 0 ? deliveryFee : 0));

    const result: CartValidationResult = {
      items: populatedItems,
      subtotal,
      discount,
      deliveryFee: subtotal > 0 ? deliveryFee : 0,
      total,
      appliedCoupon,
      warnings
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'কার্ট ভ্যালিডেশনে সমস্যা হয়েছে' });
  }
});

// Explicit coupon verification endpoint
router.post('/apply-coupon', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'কুপন কোড দিন' });
    return;
  }

  const db = getDatabase();
  const codeClean = code.trim().toUpperCase();
  const coupon = db.coupons.find((c) => c.code === codeClean && c.isActive);

  if (!coupon) {
    res.status(404).json({ error: 'অবৈধ কুপন কোড' });
    return;
  }

  if (new Date(coupon.expiresAt).getTime() < Date.now()) {
    res.status(400).json({ error: 'এই কুপনের মেয়াদ শেষ হয়ে গেছে' });
    return;
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    res.status(400).json({ error: 'এই কুপন ব্যবহারের সীমা উত্তীর্ণ হয়েছে' });
    return;
  }

  const currentSubtotal = Number(subtotal) || 0;
  if (currentSubtotal < coupon.minOrderValue) {
    res.status(400).json({
      error: `এই কুপনের জন্য ন্যূনতম ৳${coupon.minOrderValue} টাকার কেনাকাটা আবশ্যক`
    });
    return;
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((currentSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = Math.min(coupon.discountValue, currentSubtotal);
  }

  res.json({
    coupon,
    discount,
    message: `কুপন কোড ${coupon.code} সফলভাবে প্রয়োগ করা হয়েছে! (ছাড়: ৳${discount})`
  });
});

export default router;
