import { Router } from 'express';
import { z } from 'zod';
import { getDatabase, withTransaction } from '../db.ts';
import { authenticateUser, type AuthenticatedRequest } from '../auth.ts';
import type { Product, Review } from '../../types/index.ts';

const router = Router();

// GET all categories
router.get('/categories', (req, res) => {
  const db = getDatabase();
  const categories = db.categories
    .map((c) => {
      const productCount = db.products.filter(
        (p) => p.categoryId === c.id && p.isPublished && !p.isArchived
      ).length;
      return { ...c, productCount };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  res.json({ categories });
});

// GET products with rich filtering, search, and pagination
router.get('/products', (req, res) => {
  const db = getDatabase();
  const {
    category,
    search,
    minPrice,
    maxPrice,
    inStock,
    brand,
    sort = 'featured',
    page = '1',
    limit = '12',
    featured
  } = req.query as Record<string, string>;

  let filtered = db.products.filter((p) => p.isPublished !== false && !p.isArchived);

  // Category filter by ID or slug
  if (category && category !== 'all') {
    filtered = filtered.filter(
      (p) => p.categoryId === category || p.categorySlug === category
    );
  }

  // Featured only
  if (featured === 'true') {
    filtered = filtered.filter((p) => p.isFeatured);
  }

  // Stock filter
  if (inStock === 'true') {
    filtered = filtered.filter((p) => p.stock > 0);
  }

  // Brand filter
  if (brand && brand !== 'all') {
    filtered = filtered.filter(
      (p) => p.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  // Price range filter
  if (minPrice && !isNaN(Number(minPrice))) {
    filtered = filtered.filter((p) => p.price >= Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    filtered = filtered.filter((p) => p.price <= Number(maxPrice));
  }

  // Search filter (Bengali + English sensible search)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      return (
        p.titleBn.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.descriptionBn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }

  // Sorting
  switch (sort) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'price_asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'best_selling':
      filtered.sort((a, b) => b.salesCount - a.salesCount);
      break;
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case 'featured':
    default:
      filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      break;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limitNum);
  const offset = (pageNum - 1) * limitNum;
  const items = filtered.slice(offset, offset + limitNum);

  // Available brands for filter sidebar
  const availableBrands = Array.from(
    new Set(db.products.filter((p) => p.isPublished && !p.isArchived).map((p) => p.brand))
  );

  res.json({
    items,
    pagination: {
      totalItems,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    },
    facets: {
      brands: availableBrands,
      minPrice: Math.min(...db.products.map((p) => p.price)),
      maxPrice: Math.max(...db.products.map((p) => p.price))
    }
  });
});

// GET single product by slug or ID
router.get('/products/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const db = getDatabase();

  const product = db.products.find(
    (p) => (p.slug === slugOrId || p.id === slugOrId) && !p.isArchived
  );

  if (!product) {
    res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি (Product not found)' });
    return;
  }

  // Fetch approved customer reviews
  const reviews = db.reviews
    .filter((r) => r.productId === product.id && r.isApproved)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fetch related products in the same category
  const related = db.products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categoryId === product.categoryId &&
        p.isPublished !== false &&
        !p.isArchived
    )
    .slice(0, 4);

  res.json({
    product,
    reviews,
    related
  });
});

// POST submit a review
const reviewSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().min(2, 'আপনার নাম দিন'),
  customerPhone: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'সঠিক মোবাইল নম্বর দিন'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, 'মতামত অন্তত ৫ অক্ষরের হতে হবে')
});

router.post('/reviews', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const parse = reviewSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    const { productId, customerName, customerPhone, rating, comment } = parse.data;
    const cleanPhone = customerPhone.replace(/^(\+88|88)/, '').trim();

    const newReview = await withTransaction((db) => {
      const product = db.products.find((p) => p.id === productId);
      if (!product) throw new Error('পণ্য পাওয়া যায়নি');

      // CRITICAL POLICY: ONLY CUSTOMERS WHO PURCHASED THIS PRODUCT CAN REVIEW
      const hasPurchased = db.orders.some((order) => {
        // Exclude cancelled or returned/refunded orders
        if (
          order.fulfilmentStatus === 'cancelled' ||
          order.fulfilmentStatus === 'returned' ||
          order.fulfilmentStatus === 'refunded'
        ) {
          return false;
        }

        // Match customer phone (ignoring any +88 or 88 prefix)
        const orderPhone = (order.customerPhone || '').replace(/^(\+88|88)/, '').trim();
        const phoneMatches = orderPhone === cleanPhone;

        // Match logged in user if available
        const userMatches = Boolean(
          req.user &&
          (order.customerId === req.user.id ||
            (req.user.phone &&
              orderPhone === req.user.phone.replace(/^(\+88|88)/, '').trim()))
        );

        if (!phoneMatches && !userMatches) {
          return false;
        }

        // Check if the order contains this specific product
        return order.items && order.items.some((item) => item.productId === productId);
      });

      if (!hasPurchased) {
        throw new Error(
          'শুধুমাত্র এই পণ্যটি ক্রয়কৃত ভেরিফায়েড ক্রেতারা রিভিউ দিতে পারবেন। আপনি যদি পণ্যটি ক্রয় করে থাকেন, তবে অর্ডার করার সময় ব্যবহৃত সঠিক মোবাইল নম্বরটি লিখুন।'
        );
      }

      // Check if this customer has already reviewed this product
      const maskedPhone = `${cleanPhone.slice(0, 5)}***${cleanPhone.slice(-2)}`;
      const alreadyReviewed = db.reviews.some(
        (r) =>
          r.productId === productId &&
          (r.customerPhone === maskedPhone || (req.user && r.customerName === req.user.name))
      );
      if (alreadyReviewed) {
        throw new Error('আপনি ইতিপূর্বে এই পণ্যে রিভিউ জমা দিয়েছেন। ধন্যবাদ!');
      }

      const review: Review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId,
        customerName: customerName.trim(),
        customerPhone: maskedPhone,
        rating,
        comment: comment.trim(),
        isApproved: true,
        isVerifiedPurchase: true,
        createdAt: new Date().toISOString()
      };

      db.reviews.unshift(review);

      // Re-calculate product rating and review count
      const productReviews = db.reviews.filter(
        (r) => r.productId === productId && r.isApproved
      );
      const avgRating =
        productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length;

      product.rating = Math.round(avgRating * 10) / 10;
      product.reviewCount = productReviews.length;

      return review;
    });

    res.status(201).json({
      review: newReview,
      message: 'আপনার ভেরিফায়েড ক্রেতা রিভিউ সফলভাবে যুক্ত হয়েছে। ধন্যবাদ!'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'রিভিউ যুক্ত করা সম্ভব হয়নি' });
  }
});

// GET banners and store config
router.get('/store-info', (req, res) => {
  const db = getDatabase();
  const activeBanners = db.banners
    .filter((b) => b.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  res.json({
    banners: activeBanners,
    settings: db.storeSettings,
    shippingRates: db.shippingRates.filter((s) => s.isActive)
  });
});

export default router;
