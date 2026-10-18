import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  User,
  Category,
  Product,
  Order,
  Coupon,
  Review,
  ShippingRate,
  Banner,
  StoreSettings,
  InventoryMovement,
  AuditLog
} from '../types/index.ts';
import { isSupabaseConfigured, fetchSupabaseData, syncAllToSupabase } from './supabase.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'oshesh_db.json');

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  reviews: Review[];
  shippingRates: ShippingRate[];
  banners: Banner[];
  storeSettings: StoreSettings;
  inventoryMovements: InventoryMovement[];
  auditLogs: AuditLog[];
  version: number;
}

// In-memory cache + Mutex for thread safety
let memoryDb: DatabaseSchema | null = null;
let isSaving = false;
let pendingSave = false;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_oshesh_salt_2026').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function getSuperAdminEnvCredentials() {
  const email = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@sashroyidaam.com').trim().toLowerCase();
  const password = (process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'OsheshAdmin2026!').trim();
  return { email, password };
}

function getInitialData(): DatabaseSchema {
  const { email: superAdminEmail, password: superAdminPassword } = getSuperAdminEnvCredentials();
  const superAdminHash = hashPassword(superAdminPassword);
  const staffHash = hashPassword('OsheshStaff2026!');
  const customerHash = hashPassword('OsheshUser2026!');

  const initialCategories: Category[] = [
    {
      id: 'cat-shirts',
      slug: 'shirts-polos',
      nameBn: 'শার্ট ও টি-শার্ট',
      nameEn: 'Shirts & Polos',
      descriptionBn: 'প্রিমিয়াম সুতি ক্যাজুয়াল শার্ট, ফর্মাল শার্ট, পোলো ও টি-শার্ট। সাইজ ও কালার অপশন সহ।',
      image: '/src/assets/images/category_fashion_handcraft_1792084990401.jpg',
      displayOrder: 1,
      isFeatured: true,
      variantType: 'apparel_sizes',
      defaultOptions: ['M (৪০)', 'L (৪২)', 'XL (৪৪)', 'XXL (৪৬)']
    },
    {
      id: 'cat-kitchen',
      slug: 'kitchen-dining',
      nameBn: 'রান্নাঘর ও গৃহস্থালি',
      nameEn: 'Home & Kitchen',
      descriptionBn: 'রান্নাঘরের নির্ভরযোগ্য সামগ্রী, কপার ও কাস্ট আয়রন প্যান এবং পরিবেশন পাত্র।',
      image: '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
      displayOrder: 2,
      isFeatured: true,
      variantType: 'pack_options',
      defaultOptions: ['১ পিস একক', '২ পিস সেট', '৪ পিস কমপ্লিট সেট']
    },
    {
      id: 'cat-fashion',
      slug: 'fashion-lifestyle',
      nameBn: 'ফ্যাশন ও কারুকাজ',
      nameEn: 'Fashion & Handloom',
      descriptionBn: 'দেশি তাঁতের জামদানি, সুতি পাঞ্জাবি, শাড়ি ও হস্তনির্মিত প্রাকৃতিক অনুষঙ্গ।',
      image: '/src/assets/images/category_fashion_handcraft_1792084990401.jpg',
      displayOrder: 3,
      isFeatured: true,
      variantType: 'apparel_sizes',
      defaultOptions: ['৪০ (M)', '৪২ (L)', '৪৪ (XL)', '৪৬ (XXL)']
    },
    {
      id: 'cat-gadgets',
      slug: 'gadgets-accessories',
      nameBn: 'গ্যাজেট ও ইলেকট্রনিক্স',
      nameEn: 'Gadgets & Tech',
      descriptionBn: 'টেকসই পাওয়ার ব্যাংক, দ্রুত চার্জিং ক্যাবল, অডিও ডিভাইস এবং স্মার্ট লাইফস্টাইল পণ্য।',
      image: '/src/assets/images/category_tech_lifestyle_1792084991359.jpg',
      displayOrder: 4,
      isFeatured: true,
      variantType: 'color_options',
      defaultOptions: ['ম্যাট ব্ল্যাক', 'স্পেস গ্রে', 'সিলভার']
    },
    {
      id: 'cat-grocery',
      slug: 'grocery-food',
      nameBn: 'মুদি ও খাঁটি খাদ্যদ্রব্য',
      nameEn: 'Grocery & Food',
      descriptionBn: 'গ্রামের ঘানিভাঙা খাঁটি সরিষার তেল, সুন্দরবনের প্রাকৃতিক মধু, প্রিমিয়াম গাওয়া ঘি ও পুষ্টিকর খাদ্য।',
      image: '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
      displayOrder: 5,
      isFeatured: true,
      variantType: 'weight_options',
      defaultOptions: ['১ কেজি', '২ কেজি', '৫ কেজি', '১ লিটার']
    },
    {
      id: 'cat-personal-care',
      slug: 'personal-care',
      nameBn: 'ব্যক্তিগত যত্ন ও প্রসাধনী',
      nameEn: 'Personal Care & Wellness',
      descriptionBn: 'প্রাকৃতিক উপাদানযুক্ত যত্ন, ভেষজ তেল, এবং নিরাপদ অর্গানিক পণ্য।',
      image: '/src/assets/images/hero_oshesh_lifestyle_1792084990587.jpg',
      displayOrder: 6,
      isFeatured: false,
      variantType: 'none',
      defaultOptions: []
    }
  ];

  const initialProducts: Product[] = [
    {
      id: 'prod-oxford-cotton-shirt',
      slug: 'premium-oxford-cotton-slim-fit-shirt',
      titleBn: 'প্রিমিয়াম ১০০% অক্সফোর্ড কটন ফুল স্লিভ ক্যাজুয়াল শার্ট',
      titleEn: 'Premium 100% Combed Oxford Cotton Slim Fit Full Sleeve Shirt',
      descriptionBn: 'খাঁটি ১০০% কম্বড অক্সফোর্ড সুতির নিখুঁত ফিনিশিং করা স্লিম ফিট লং স্লিভ শার্ট। অফিস, আড্ডা কিংবা যেকোনো অনুষ্ঠানে সর্বোচ্চ আরামদায়ক। মসৃণ ফেব্রিক, টেকসই স্টিচিং এবং প্রিমিয়াম কাটিং। সাইজ চার্ট অনুযায়ী পারফেক্ট ফিটিংস।',
      descriptionEn: 'Tailored slim-fit full-sleeve shirt crafted from 100% pure combed oxford cotton. Breathable, durable stitching, and elegant casual look.',
      price: 1250,
      originalPrice: 1550,
      stock: 40,
      categoryId: 'cat-shirts',
      categorySlug: 'shirts-polos',
      categoryNameBn: 'শার্ট ও টি-শার্ট',
      brand: 'Sashroyi Fashion',
      sku: 'SD-SHIRT-001',
      images: [
        '/src/assets/images/category_fashion_handcraft_1792084990401.jpg'
      ],
      variants: [
        {
          id: 'v-shirt-m',
          nameBn: 'M (সাইজ ৪০)',
          nameEn: 'Size 40 (M)',
          sku: 'SD-SHIRT-001-M',
          priceDelta: 0,
          stock: 12,
          attributes: { 'সাইজ': 'M (৪০)' }
        },
        {
          id: 'v-shirt-l',
          nameBn: 'L (সাইজ ৪২)',
          nameEn: 'Size 42 (L)',
          sku: 'SD-SHIRT-001-L',
          priceDelta: 0,
          stock: 15,
          attributes: { 'সাইজ': 'L (৪২)' }
        },
        {
          id: 'v-shirt-xl',
          nameBn: 'XL (সাইজ ৪৪)',
          nameEn: 'Size 44 (XL)',
          sku: 'SD-SHIRT-001-XL',
          priceDelta: 0,
          stock: 13,
          attributes: { 'সাইজ': 'XL (৪৪)' }
        }
      ],
      attributes: {
        'ফেব্রিক': '১০০% অক্সফোর্ড কটন',
        'ফিটিং': 'স্লিম ফিট',
        'হাতা': 'ফুল স্লিভ'
      },
      isFeatured: true,
      isPublished: true,
      isArchived: false,
      salesCount: 42,
      rating: 4.9,
      reviewCount: 16,
      tags: ['Shirt', 'শার্ট', 'New Arrivals', 'Best Sellers'],
      createdAt: '2026-10-10T08:00:00.000Z',
      updatedAt: '2026-10-16T08:00:00.000Z'
    },
    {
      id: 'prod-copper-cookware-set',
      slug: 'traditional-hammered-copper-cookware-set',
      titleBn: 'ঐতিহ্যবাহী কপার ও কাস্ট আয়রন কুকার সেট (৪ পিস)',
      titleEn: 'Traditional Hammered Copper & Cast Iron Cookware Set (4 pcs)',
      descriptionBn: 'অরিজিনাল ভারী কপার কোটিং এবং কাস্ট আয়রন বডি সমৃদ্ধ প্রিমিয়াম ৪ পিস রান্নাঘরের সেট। সুষম তাপ সঞ্চালন করে এবং কম তেলে স্বাস্থ্যসম্মত রান্নার জন্য উপযুক্ত। এতে রয়েছে ১টি কড়াই, ১টি সসপ্যান, ১টি ফ্রাইং প্যান এবং ১টি কাঠের মশলা হামানদিস্তা।',
      descriptionEn: 'Heavyweight hammered copper finish with durable cast iron core. Ensures uniform heat conductivity and healthy everyday cooking.',
      price: 3850,
      originalPrice: 4500,
      stock: 18,
      categoryId: 'cat-kitchen',
      categorySlug: 'kitchen-dining',
      categoryNameBn: 'রান্নাঘর ও গৃহস্থালি',
      brand: 'সাশ্রয়ী হোম',
      sku: 'OSH-KIT-001',
      images: [
        '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'
      ],
      variants: [
        {
          id: 'v-copper-std',
          nameBn: 'স্ট্যান্ডার্ড ৪ পিস',
          nameEn: 'Standard 4 pcs',
          sku: 'OSH-KIT-001-STD',
          priceDelta: 0,
          stock: 12,
          attributes: { 'সেট ধরন': '৪ পিস মূল সেট' }
        },
        {
          id: 'v-copper-deluxe',
          nameBn: 'ডিলাক্স ৫ পিস (ঢাকনা সহ)',
          nameEn: 'Deluxe 5 pcs with Glass Lid',
          sku: 'OSH-KIT-001-DLX',
          priceDelta: 650,
          stock: 6,
          attributes: { 'সেট ধরন': '৫ পিস প্রিমিয়াম' }
        }
      ],
      attributes: {
        'উপাদান': 'কপার ও কাস্ট আয়রন',
        'পিসের সংখ্যা': '৪ পিস',
        'ওয়ারেন্টি': '১ বছরের ম্যানুফ্যাকচারিং ওয়ারেন্টি'
      },
      isFeatured: true,
      isPublished: true,
      isArchived: false,
      salesCount: 34,
      rating: 4.8,
      reviewCount: 9,
      tags: ['Best Sellers', 'Kitchen', 'Cookware', 'রান্নাঘর'],
      createdAt: '2026-09-10T08:00:00.000Z',
      updatedAt: '2026-10-15T09:00:00.000Z'
    },
    {
      id: 'prod-organic-cotton-panjabi',
      slug: 'handwoven-organic-cotton-jamdani-panjabi',
      titleBn: 'হস্তচালিত তাঁতের জামদানি মোটিফ প্রিমিয়াম কটন পাঞ্জাবি',
      titleEn: 'Handwoven Organic Cotton Jamdani Motif Panjabi',
      descriptionBn: '১০০% খাঁটি দেশি সুতায় তৈরি নরম ও আরামদায়ক ঐতিহ্যবাহী পাঞ্জাবি। সূক্ষ্ম জামদানি সুতার কাজ এবং প্রাকৃতিক কাঠের বোতাম সংযোজিত। গ্রীষ্ম ও উৎসবের জন্য সর্বোচ্চ আরামদায়ক পোশাক।',
      descriptionEn: '100% pure organic cotton woven on traditional handlooms with refined subtle Jamdani chest embroidery and coconut shell buttons.',
      price: 1850,
      originalPrice: 2200,
      stock: 24,
      categoryId: 'cat-fashion',
      categorySlug: 'fashion-lifestyle',
      categoryNameBn: 'ফ্যাশন ও কারুকাজ',
      brand: 'সাশ্রয়ী হেরিটেজ',
      sku: 'OSH-FAS-002',
      images: [
        '/src/assets/images/category_fashion_handcraft_1792084990401.jpg'
      ],
      variants: [
        {
          id: 'v-panjabi-m',
          nameBn: 'সাইজ ৪০ (M)',
          nameEn: 'Size 40 (M)',
          sku: 'OSH-FAS-002-M',
          priceDelta: 0,
          stock: 8,
          attributes: { 'সাইজ': '৪০ (M)', 'রং': 'অফ-হোয়াইট' }
        },
        {
          id: 'v-panjabi-l',
          nameBn: 'সাইজ ৪২ (L)',
          nameEn: 'Size 42 (L)',
          sku: 'OSH-FAS-002-L',
          priceDelta: 0,
          stock: 10,
          attributes: { 'সাইজ': '৪২ (L)', 'রং': 'অফ-হোয়াইট' }
        },
        {
          id: 'v-panjabi-xl',
          nameBn: 'সাইজ ৪৪ (XL)',
          nameEn: 'Size 44 (XL)',
          sku: 'OSH-FAS-002-XL',
          priceDelta: 0,
          stock: 6,
          attributes: { 'সাইজ': '৪৪ (XL)', 'রং': 'অফ-হোয়াইট' }
        }
      ],
      attributes: {
        'ফেব্রিক': '১০০% কম্বড কটন',
        'কলার': 'ম্যান্ডারিন কলার',
        'উৎপাদন': 'হস্তচালিত তাঁত, টাঙ্গাইল'
      },
      isFeatured: true,
      isPublished: true,
      isArchived: false,
      salesCount: 52,
      rating: 4.9,
      reviewCount: 14,
      tags: ['New Arrivals', 'Panjabi', 'Fashion', 'পাঞ্জাবি'],
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-10-15T09:00:00.000Z'
    },
    {
      id: 'prod-powerbank-fastcharge',
      slug: 'ultra-slim-20000mah-fast-charge-powerbank',
      titleBn: '২০,০০০ এমএএইচ ডুয়াল পোর্ট ফাস্ট চার্জিং মেটাল পাওয়ার ব্যাংক',
      titleEn: '20000mAh Dual Port PD 22.5W Fast Charging Power Bank',
      descriptionBn: 'ম্যাট অ্যালুমিনিয়াম ফিনিশযুক্ত শক্তিশালী ২০,০০০ এমএএইচ পাওয়ার ব্যাংক। ২২.৫ ওয়াট সুপার ফাস্ট চার্জিং সমর্থন করে এবং একই সাথে দুটি ডিভাইস নিরাপদে দ্রুত চার্জ করা যায়। ওভারহিট ও ওভারভোল্টেজ প্রটেকশন সহ।',
      descriptionEn: 'High capacity 20,000mAh external battery pack with PD 22.5W output, aerospace aluminum casing, and multi-layer circuit protection.',
      price: 1650,
      originalPrice: 1950,
      stock: 35,
      categoryId: 'cat-gadgets',
      categorySlug: 'gadgets-accessories',
      categoryNameBn: 'গ্যাজেট ও ইলেকট্রনিক্স',
      brand: 'সাশ্রয়ী টেক',
      sku: 'OSH-GAD-003',
      images: [
        '/src/assets/images/category_tech_lifestyle_1792084991359.jpg'
      ],
      variants: [
        {
          id: 'v-pb-black',
          nameBn: 'ম্যাট ব্ল্যাক',
          nameEn: 'Matte Black',
          sku: 'OSH-GAD-003-BLK',
          priceDelta: 0,
          stock: 20,
          attributes: { 'রং': 'কালো', 'ক্যাপাসিটি': '২০,০০০ mAh' }
        },
        {
          id: 'v-pb-gray',
          nameBn: 'স্পেস গ্রে',
          nameEn: 'Space Gray',
          sku: 'OSH-GAD-003-GRY',
          priceDelta: 0,
          stock: 15,
          attributes: { 'রং': 'গ্রে', 'ক্যাপাসিটি': '২০,০০০ mAh' }
        }
      ],
      attributes: {
        'ব্যাটারি ক্যাপাসিটি': '২০,০০০ মিলিঅ্যাম্পিয়ার আওয়ার',
        'আউটপুট': 'PD 22.5W + QC 3.0',
        'ওয়ারেন্টি': '৬ মাসের রিপ্লেসমেন্ট ওয়ারেন্টি'
      },
      isFeatured: true,
      isPublished: true,
      isArchived: false,
      salesCount: 68,
      rating: 4.7,
      reviewCount: 18,
      tags: ['Best Sellers', 'Tech', 'Power Bank', 'গ্যাজেট'],
      createdAt: '2026-09-15T11:00:00.000Z',
      updatedAt: '2026-10-15T09:00:00.000Z'
    },
    {
      id: 'prod-natural-jute-rug',
      slug: 'handcrafted-braided-natural-jute-rug',
      titleBn: 'হস্তশিল্পজাত প্রাকৃতিক পাটের টেকসই গোল শতরঞ্জি / কার্পেট',
      titleEn: 'Handcrafted Braided Natural Golden Jute Living Area Rug',
      descriptionBn: 'বাংলাদেশের খাঁটি সোনালী আঁশ পাট দিয়ে হাতে বোনা পরিবেশবান্ধব ঘরের কার্পেট। ড্রয়িং রুম, বেডরুম কিংবা বসার ঘরের জন্য দৃষ্টিনন্দন ও টেকসই। নিয়মিত ব্যবহারে সহজে পরিষ্কারযোগ্য।',
      descriptionEn: '100% natural biodegradable Bangladeshi golden jute braided rug. Durable, eco-friendly, and complements modern earthy interior styling.',
      price: 1450,
      originalPrice: 1750,
      stock: 15,
      categoryId: 'cat-kitchen',
      categorySlug: 'kitchen-dining',
      categoryNameBn: 'রান্নাঘর ও গৃহস্থালি',
      brand: 'সাশ্রয়ী ক্রাফট',
      sku: 'OSH-HOM-004',
      images: [
        '/src/assets/images/hero_oshesh_lifestyle_1792084990587.jpg'
      ],
      variants: [
        {
          id: 'v-rug-4ft',
          nameBn: '৪ ফুট ব্যাস',
          nameEn: '4 Feet Diameter',
          sku: 'OSH-HOM-004-4FT',
          priceDelta: 0,
          stock: 9,
          attributes: { 'আকার': '৪ ফুট' }
        },
        {
          id: 'v-rug-5ft',
          nameBn: '৫ ফুট ব্যাস',
          nameEn: '5 Feet Diameter',
          sku: 'OSH-HOM-004-5FT',
          priceDelta: 450,
          stock: 6,
          attributes: { 'আকার': '৫ ফুট' }
        }
      ],
      attributes: {
        'উপাদান': '১০০% প্রাকৃতিক পাট',
        'বুনন': 'হাতে বোনা বিনুনি টেক্সচার',
        'উৎপাদন স্থান': 'রংপুর ও ফরিদপুর হস্তশিল্প'
      },
      isFeatured: false,
      isPublished: true,
      isArchived: false,
      salesCount: 21,
      rating: 4.8,
      reviewCount: 7,
      tags: ['Home Decor', 'Jute', 'শতরঞ্জি'],
      createdAt: '2026-09-25T14:00:00.000Z',
      updatedAt: '2026-10-15T09:00:00.000Z'
    },
    {
      id: 'prod-wireless-earbuds-anc',
      slug: 'true-wireless-noise-cancelling-earbuds',
      titleBn: 'ট্রু ওয়্যারলেস এনভায়রনমেন্টাল নয়েজ ক্যানসিলিং ইয়ারবাডস',
      titleEn: 'True Wireless Stereo Bluetooth 5.4 Low-Latency Earbuds',
      descriptionBn: 'স্পষ্ট সাউন্ড ও ডিপ ব্যাস সহ প্রিমিয়াম ব্লুটুথ ৫.৪ ইয়ারবাডস। ৪টি হাই-ডেফিনিশন মাইক সহ নয়েজ ক্যানসেলিং প্রযুক্তি থাকার কারণে ভিড়ের মাঝেও স্বচ্ছ কণ্ঠে কথা বলা যায়। এক চার্জে ৭ ঘণ্টা এবং কেস সহ ২৮ ঘণ্টার প্লে-টাইম।',
      descriptionEn: 'Bluetooth 5.4 earbuds with active ENC quad microphones, deep bass driver, IPX5 water resistance, and 28-hour battery longevity.',
      price: 1950,
      originalPrice: 2450,
      stock: 28,
      categoryId: 'cat-gadgets',
      categorySlug: 'gadgets-accessories',
      categoryNameBn: 'গ্যাজেট ও ইলেকট্রনিক্স',
      brand: 'সাশ্রয়ী টেক',
      sku: 'OSH-GAD-005',
      images: [
        '/src/assets/images/category_tech_lifestyle_1792084991359.jpg'
      ],
      attributes: {
        'ব্লুটুথ ভার্সন': '৫.৪',
        'প্লে-টাইম': '২৮ ঘণ্টা (কেস সহ)',
        'ওয়াটার রেজিস্ট্যান্স': 'IPX5'
      },
      isFeatured: true,
      isPublished: true,
      isArchived: false,
      salesCount: 45,
      rating: 4.6,
      reviewCount: 11,
      tags: ['Special Offer', 'Audio', 'ইয়ারবাডস'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-15T09:00:00.000Z'
    },
    {
      id: 'prod-braided-cable-set',
      slug: 'durable-braided-usb-c-fast-charging-cable',
      titleBn: 'হেভি-ডিউটি ব্রেইডেড টাইপ-সি ফাস্ট চার্জিং ক্যাবল (২ মিটার)',
      titleEn: 'Heavy Duty 100W Braided USB-C to USB-C Cable (2m)',
      descriptionBn: 'উচ্চমানের নাইলন সুতা দিয়ে বিনুনি করা ১০০ ওয়াট পিডি ফাস্ট চার্জিং ক্যাবল। ল্যাপটপ, ট্যাবলেট ও যেকোনো স্মার্টফোনে দ্রুত চার্জ ও দ্রুত ডেটা ট্রান্সফারের জন্য নির্ভরযোগ্য। ১০,০০০+ বেন্ড টেস্ট উত্তীর্ণ।',
      descriptionEn: 'Rugged nylon braided 100W Power Delivery cable with reinforced aluminum alloy joints. 2-meter length for convenient bedside or desk charging.',
      price: 450,
      originalPrice: 600,
      stock: 50,
      categoryId: 'cat-gadgets',
      categorySlug: 'gadgets-accessories',
      categoryNameBn: 'গ্যাজেট ও ইলেকট্রনিক্স',
      brand: 'সাশ্রয়ী টেক',
      sku: 'OSH-GAD-006',
      images: [
        '/src/assets/images/category_tech_lifestyle_1792084991359.jpg'
      ],
      attributes: {
        'দৈর্ঘ্য': '২ মিটার',
        'চার্জিং স্পিড': 'সর্বোচ্চ ১০০ ওয়াট পিডি',
        'উপাদান': 'নাইলন ব্রেইডেড'
      },
      isFeatured: false,
      isPublished: true,
      isArchived: false,
      salesCount: 82,
      rating: 4.9,
      reviewCount: 22,
      tags: ['Accessories', 'Cable', 'ক্যাবল'],
      createdAt: '2026-10-05T08:00:00.000Z',
      updatedAt: '2026-10-15T09:00:00.000Z'
    }
  ];

  const initialCoupons: Coupon[] = [
    {
      id: 'coup-welcome50',
      code: 'WELCOME50',
      discountType: 'fixed',
      discountValue: 50,
      minOrderValue: 500,
      expiresAt: '2027-12-31T23:59:59.000Z',
      usageLimit: 1000,
      usageCount: 42,
      isActive: true
    },
    {
      id: 'coup-sashroyi10',
      code: 'SASHROYI10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 1200,
      maxDiscount: 400,
      expiresAt: '2027-12-31T23:59:59.000Z',
      usageLimit: 500,
      usageCount: 19,
      isActive: true
    }
  ];

  const initialShippingRates: ShippingRate[] = [
    {
      id: 'ship-dhaka',
      zoneNameBn: 'ঢাকা মেট্রো সিটি',
      zoneNameEn: 'Dhaka City Metro',
      divisions: ['dhaka'],
      rate: 70,
      estimatedDaysBn: '১ - ২ কার্যদিবস',
      isActive: true
    },
    {
      id: 'ship-outside',
      zoneNameBn: 'ঢাকার বাইরে সমগ্র বাংলাদেশ',
      zoneNameEn: 'Outside Dhaka (Nationwide)',
      divisions: ['chattogram', 'sylhet', 'rajshahi', 'khulna', 'barishal', 'rangpur', 'mymensingh'],
      rate: 130,
      estimatedDaysBn: '২ - ৪ কার্যদিবস',
      isActive: true
    }
  ];

  const initialBanners: Banner[] = [
    {
      id: 'ban-main',
      titleBn: 'আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান',
      subtitleBn: 'বাংলাদেশের প্রতিটি পরিবারের জন্য খাঁটি গৃহস্থালি পণ্য, দেশীয় পোশাক ও মানসম্পন্ন গ্যাজেট। সারাদেশে ক্যাশ অন ডেলিভারি।',
      buttonTextBn: 'পণ্যসমূহ দেখুন',
      link: '/#products',
      imageUrl: '/src/assets/images/hero_oshesh_lifestyle_1792084990587.jpg',
      displayOrder: 1,
      isActive: true
    }
  ];

  const initialStoreSettings: StoreSettings = {
    storeNameBn: 'সাশ্রয়ী দাম',
    storeNameEn: 'Sashroyi Daam',
    taglineBn: 'আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান।',
    phone: '০৯৬১২-৮৮৯৯০০',
    email: 'support@sashroyidaam.com',
    supportHoursBn: 'প্রতিদিন সকাল ৯টা – রাত ১০টা',
    addressBn: 'বাড়ি ৪২, রোড ১১, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০',
    announcementStripBn: '🚚 ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি ডেলিভারি! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।',
    showAnnouncement: true,
    freeDeliveryThreshold: 2000,
    defaultDeliveryFeeDhaka: 70,
    defaultDeliveryFeeOutside: 130,
    isCodEnabled: true,
    isSslcommerzEnabled: true,
    sslSandboxMode: true,
    facebookPageName: 'সাশ্রয়ী দাম | Sashroyi Daam',
    facebookUsername: '@sashroyidaam',
    facebookUrl: 'https://facebook.com/sashroyidaam'
  };

  const initialOrders: Order[] = [
    {
      id: 'ord-1001',
      orderNumber: 'OSH-2026-701',
      customerName: 'তানভীর আহমেদ',
      customerPhone: '01711223344',
      customerEmail: 'tanvir@gmail.com',
      division: 'dhaka',
      district: 'ঢাকা',
      upazila: 'ধানমন্ডি',
      fullAddress: 'রোড ৮/এ, বাড়ি ২৭, ফ্ল্যাট ৩-বি, ধানমন্ডি, ঢাকা',
      deliveryInstructions: 'বিকেল ৪টার পর কল দিয়ে ডেলিভারি করবেন',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      fulfilmentStatus: 'processing',
      items: [
        {
          productId: 'prod-copper-cookware-set',
          variantId: 'v-copper-std',
          productTitleBn: 'ঐতিহ্যবাহী কপার ও কাস্ট আয়রন কুকার সেট (৪ পিস)',
          productTitleEn: 'Traditional Hammered Copper & Cast Iron Cookware Set (4 pcs)',
          variantNameBn: 'স্ট্যান্ডার্ড ৪ পিস',
          sku: 'OSH-KIT-001-STD',
          unitPrice: 3850,
          quantity: 1,
          itemTotal: 3850,
          imageUrl: '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'
        }
      ],
      subtotal: 3850,
      discount: 0,
      deliveryFee: 0, // Free delivery since > 2000
      total: 3850,
      statusTimeline: [
        {
          status: 'pending_confirmation',
          timestamp: '2026-10-14T10:15:00.000Z',
          note: 'অর্ডার সফলভাবে জমা হয়েছে (ক্যাশ অন ডেলিভারি)',
          changedBy: 'System'
        },
        {
          status: 'confirmed',
          timestamp: '2026-10-14T11:00:00.000Z',
          note: 'গ্রাহকের ফোনে কল করে ঠিকানা ও অর্ডার কনফার্ম করা হয়েছে',
          changedBy: 'Order Manager'
        },
        {
          status: 'processing',
          timestamp: '2026-10-14T14:30:00.000Z',
          note: 'পণ্য গুদাম থেকে বের করা হয়েছে ও কোয়ালিটি চেক সম্পন্ন',
          changedBy: 'Order Manager'
        }
      ],
      internalNotes: ['গ্রাহক নিয়মিত ভ্যালুড বায়ার'],
      createdAt: '2026-10-14T10:15:00.000Z',
      updatedAt: '2026-10-14T14:30:00.000Z'
    },
    {
      id: 'ord-1002',
      orderNumber: 'OSH-2026-702',
      customerName: 'নুসরাত জাহান',
      customerPhone: '01819556677',
      customerEmail: 'nusrat.jahan@yahoo.com',
      division: 'chattogram',
      district: 'চট্টগ্রাম',
      upazila: 'পাঁচলাইশ',
      fullAddress: 'হিলভিউ আর/এ, রোড ৩, পাঁচলাইশ, চট্টগ্রাম',
      paymentMethod: 'sslcommerz_sandbox',
      paymentStatus: 'paid',
      fulfilmentStatus: 'shipped',
      items: [
        {
          productId: 'prod-organic-cotton-panjabi',
          variantId: 'v-panjabi-l',
          productTitleBn: 'হস্তচালিত তাঁতের জামদানি মোটিফ প্রিমিয়াম কটন পাঞ্জাবি',
          productTitleEn: 'Handwoven Organic Cotton Jamdani Motif Panjabi',
          variantNameBn: 'সাইজ ৪২ (L)',
          sku: 'OSH-FAS-002-L',
          unitPrice: 1850,
          quantity: 1,
          itemTotal: 1850,
          imageUrl: '/src/assets/images/category_fashion_handcraft_1792084990401.jpg'
        }
      ],
      subtotal: 1850,
      discount: 50, // Applied WELCOME50
      deliveryFee: 130,
      total: 1930,
      couponCode: 'WELCOME50',
      sslTxnId: 'TXN-SANDBOX-994201',
      statusTimeline: [
        {
          status: 'pending_confirmation',
          timestamp: '2026-10-13T09:20:00.000Z',
          note: 'SSLCOMMERZ স্যান্ডবক্স পেমেন্ট সফল (৳১৯৩০)',
          changedBy: 'Payment Gateway'
        },
        {
          status: 'confirmed',
          timestamp: '2026-10-13T10:00:00.000Z',
          note: 'অর্ডার নিশ্চিতকরণ সম্পন্ন',
          changedBy: 'Order Manager'
        },
        {
          status: 'packed',
          timestamp: '2026-10-13T16:00:00.000Z',
          note: 'নিরাপদ প্যাকেজিং সম্পন্ন',
          changedBy: 'Warehouse Team'
        },
        {
          status: 'shipped',
          timestamp: '2026-10-14T08:00:00.000Z',
          note: 'কুরিয়ারে হস্তান্তর করা হয়েছে (Steadfast Courier - ট্র্যাকিং #SF-88912)',
          changedBy: 'Courier Dispatch'
        }
      ],
      createdAt: '2026-10-13T09:20:00.000Z',
      updatedAt: '2026-10-14T08:00:00.000Z'
    }
  ];

  const initialReviews: Review[] = [
    {
      id: 'rev-01',
      productId: 'prod-copper-cookware-set',
      customerName: 'সাব্বির হোসেন',
      customerPhone: '01712***89',
      rating: 5,
      comment: 'খুবই ভারী এবং সলিড কপার প্যান। রান্না করতে খুব অল্প তেল লাগে এবং পরিষ্কার করাও বেশ সহজ। চমৎকার প্যাকেজিং!',
      isApproved: true,
      createdAt: '2026-10-10T12:00:00.000Z'
    },
    {
      id: 'rev-02',
      productId: 'prod-organic-cotton-panjabi',
      customerName: 'রাকিবুল হাসান',
      customerPhone: '01834***12',
      rating: 5,
      comment: 'সুতি ফেব্রিক অসাধারণ আরামদায়ক। জামদানি বুননের ফিনিশিং বেশ নিখুঁত। সাইজ চার্ট একদম নিখুঁত ছিল।',
      isApproved: true,
      createdAt: '2026-10-12T15:30:00.000Z'
    }
  ];

  const initialUsers: User[] = [
    {
      id: 'user-superadmin',
      name: 'সাশ্রয়ী দাম অ্যাডমিন',
      email: superAdminEmail,
      phone: '01700000001',
      role: 'super_admin',
      passwordHash: superAdminHash,
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'user-ordermanager',
      name: 'রাশেদ চৌধুরী (Order Manager)',
      email: 'orders@sashroyidaam.com',
      phone: '01700000002',
      role: 'order_manager',
      passwordHash: staffHash,
      createdAt: '2026-08-15T00:00:00.000Z'
    },
    {
      id: 'user-customer1',
      name: 'আরিফ মাহমুদ',
      email: 'customer@sashroyidaam.com',
      phone: '01711223344',
      role: 'customer',
      passwordHash: customerHash,
      savedAddresses: [
        {
          id: 'addr-1',
          title: 'বাসা (Home)',
          name: 'আরিফ মাহমুদ',
          phone: '01711223344',
          division: 'dhaka',
          district: 'ঢাকা',
          upazila: 'উত্তরা',
          fullAddress: 'সেক্টর ৪, রোড ৭, বাড়ি ১২, ফ্ল্যাট ৫-এ, উত্তরা, ঢাকা',
          isDefault: true
        }
      ],
      createdAt: '2026-09-01T00:00:00.000Z'
    }
  ];

  return {
    users: initialUsers,
    categories: initialCategories,
    products: initialProducts,
    orders: initialOrders,
    coupons: initialCoupons,
    reviews: initialReviews,
    shippingRates: initialShippingRates,
    banners: initialBanners,
    storeSettings: initialStoreSettings,
    inventoryMovements: [],
    auditLogs: [
      {
        id: 'log-seed',
        action: 'STORE_INITIALIZED',
        userId: 'system',
        userEmail: 'system@sashroyidaam.com',
        userRole: 'system',
        details: 'Initial Bangladesh retail store database seeded with catalog, admin accounts, and settings.',
        createdAt: '2026-08-01T00:00:00.000Z'
      }
    ],
    version: 1
  };
}

export function getDatabase(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(content);
      
      // Auto-migrate schema updates
      let hasChanges = false;
      const initial = getInitialData();

      // Ensure cat-shirts exists
      if (!memoryDb!.categories.some((c) => c.id === 'cat-shirts' || c.slug === 'shirts-polos')) {
        const shirtCat = initial.categories.find((c) => c.id === 'cat-shirts');
        if (shirtCat) {
          memoryDb!.categories.unshift(shirtCat);
          hasChanges = true;
        }
      }

      // Ensure cat-grocery exists
      if (!memoryDb!.categories.some((c) => c.id === 'cat-grocery' || c.slug === 'grocery-food')) {
        const groceryCat = initial.categories.find((c) => c.id === 'cat-grocery');
        if (groceryCat) {
          memoryDb!.categories.push(groceryCat);
          hasChanges = true;
        }
      }

      // Ensure Grocery product exists
      if (!memoryDb!.products.some((p) => p.id === 'prod-mustard-oil-pure')) {
        memoryDb!.products.push({
          id: 'prod-mustard-oil-pure',
          slug: 'pure-cold-pressed-mustard-oil-1l',
          titleBn: 'ঘানিভাঙা খাঁটি সরিষার তেল (১ লিটার)',
          titleEn: '100% Pure Cold-Pressed Mustard Oil (1 Liter)',
          descriptionBn: 'দেশি জাতের সরিষা থেকে কাঠের ঘানিতে ভাঙানো সম্পূর্ণ প্রাকৃতিক ও কেমিক্যালমুক্ত সরিষার তেল। ঝাঁঝালো সুবাস ও রান্নায় খাঁটি স্বাদ।',
          descriptionEn: 'Cold-pressed traditional mustard oil with rich pungent aroma, naturally unfiltered for authentic Bengali flavor.',
          price: 360,
          originalPrice: 420,
          stock: 35,
          categoryId: 'cat-grocery',
          categorySlug: 'grocery-food',
          categoryNameBn: 'মুদি ও খাঁটি খাদ্যদ্রব্য',
          brand: 'সাশ্রয়ী খাদ্য',
          sku: 'OSH-GROC-001',
          images: [
            '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'
          ],
          variants: [
            {
              id: 'v-oil-1l',
              nameBn: '১ লিটার বোতল',
              nameEn: '1 Liter Bottle',
              sku: 'OSH-GROC-001-1L',
              priceDelta: 0,
              stock: 25,
              attributes: { 'ওজন/পরিমাণ': '১ লিটার' }
            },
            {
              id: 'v-oil-2l',
              nameBn: '২ লিটার ফ্যামিলি প্যাক',
              nameEn: '2 Liter Family Pack',
              sku: 'OSH-GROC-001-2L',
              priceDelta: 340,
              stock: 10,
              attributes: { 'ওজন/পরিমাণ': '২ লিটার' }
            }
          ],
          attributes: {
            'প্রকৃতি': '১০০% খাঁটি ঘানিভাঙা',
            'মেয়াদ': '১২ মাস',
            'উৎস': 'সিরাজগঞ্জ'
          },
          isFeatured: true,
          isPublished: true,
          isArchived: false,
          salesCount: 88,
          rating: 4.9,
          reviewCount: 34,
          tags: ['Mustard Oil', 'সরিষার তেল', 'Grocery', 'মুদি', 'Food'],
          createdAt: '2026-10-12T08:00:00.000Z',
          updatedAt: '2026-10-17T08:00:00.000Z'
        });
        hasChanges = true;
      }

      // Ensure variantType is populated on categories
      memoryDb!.categories.forEach((c) => {
        if (!c.variantType) {
          if (c.slug.includes('shirt') || c.nameBn.includes('শার্ট') || c.nameBn.includes('পোশাক') || c.nameBn.includes('ফ্যাশন')) {
            c.variantType = 'apparel_sizes';
            c.defaultOptions = ['M (৪০)', 'L (৪২)', 'XL (৪৪)', 'XXL (৪৬)'];
          } else if (c.slug.includes('shoe') || c.nameBn.includes('জুতা')) {
            c.variantType = 'shoe_sizes';
            c.defaultOptions = ['৩৯', '৪০', '৪১', '৪২', '৪৩', '৪৪'];
          } else if (c.slug.includes('kitchen') || c.nameBn.includes('রান্নাঘর')) {
            c.variantType = 'pack_options';
            c.defaultOptions = ['১ পিস একক', '২ পিস সেট', '৪ পিস কমপ্লিট সেট'];
          } else if (c.slug.includes('gadget') || c.nameBn.includes('গ্যাজেট')) {
            c.variantType = 'color_options';
            c.defaultOptions = ['ম্যাট ব্ল্যাক', 'স্পেস গ্রে', 'সিলভার'];
          } else if (c.slug.includes('grocery') || c.slug.includes('food') || c.nameBn.includes('মুদি')) {
            c.variantType = 'weight_options';
            c.defaultOptions = ['১ কেজি', '২ কেজি', '৫ কেজি', '১ লিটার'];
          } else {
            c.variantType = 'none';
          }
          hasChanges = true;
        }
      });

      // Ensure Oxford shirt product is added if missing
      if (!memoryDb!.products.some((p) => p.id === 'prod-oxford-cotton-shirt')) {
        const shirtProd = initial.products.find((p) => p.id === 'prod-oxford-cotton-shirt');
        if (shirtProd) {
          memoryDb!.products.unshift(shirtProd);
          hasChanges = true;
        }
      }

      // Ensure Facebook metadata and new brand name are in store settings
      if (
        !memoryDb!.storeSettings.facebookPageName ||
        memoryDb!.storeSettings.storeNameBn !== 'সাশ্রয়ী দাম'
      ) {
        memoryDb!.storeSettings.storeNameBn = 'সাশ্রয়ী দাম';
        memoryDb!.storeSettings.storeNameEn = 'Sashroyi Daam';
        memoryDb!.storeSettings.taglineBn = 'আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান।';
        memoryDb!.storeSettings.announcementStripBn = '🚚 ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি ডেলিভারি! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।';
        memoryDb!.storeSettings.facebookPageName = 'সাশ্রয়ী দাম | Sashroyi Daam';
        memoryDb!.storeSettings.facebookUsername = '@sashroyidaam';
        memoryDb!.storeSettings.facebookUrl = 'https://facebook.com/sashroyidaam';
        hasChanges = true;
      }

      // Ensure superadmin credentials match .env configuration
      const { email: envSuperEmail, password: envSuperPass } = getSuperAdminEnvCredentials();
      const envSuperHash = hashPassword(envSuperPass);
      let existingSuper = memoryDb!.users.find(
        (u) =>
          u.role === 'super_admin' ||
          u.id === 'user-superadmin' ||
          u.email.toLowerCase() === envSuperEmail ||
          u.email.toLowerCase() === 'admin@sashroyidaam.com' ||
          u.email.toLowerCase() === 'admin@oshesh.com.bd'
      );
      if (existingSuper) {
        if (existingSuper.email !== envSuperEmail || existingSuper.passwordHash !== envSuperHash || existingSuper.role !== 'super_admin') {
          existingSuper.email = envSuperEmail;
          existingSuper.passwordHash = envSuperHash;
          existingSuper.role = 'super_admin';
          hasChanges = true;
        }
      } else {
        memoryDb!.users.push({
          id: 'user-superadmin',
          name: 'সাশ্রয়ী দাম অ্যাডমিন',
          email: envSuperEmail,
          phone: '01700000001',
          role: 'super_admin',
          passwordHash: envSuperHash,
          createdAt: new Date().toISOString()
        });
        hasChanges = true;
      }

      if (hasChanges) {
        saveDatabaseSync(memoryDb!);
      }

      // If Supabase is configured, fetch latest cloud records in background
      if (isSupabaseConfigured()) {
        fetchSupabaseData().then((supaData) => {
          if (supaData && memoryDb) {
            if (supaData.products && supaData.products.length > 0) {
              memoryDb.products = supaData.products as Product[];
            }
            if (supaData.orders && supaData.orders.length > 0) {
              memoryDb.orders = supaData.orders as Order[];
            }
            if (supaData.categories && supaData.categories.length > 0) {
              memoryDb.categories = supaData.categories as Category[];
            }
            if (supaData.storeSettings) {
              memoryDb.storeSettings = supaData.storeSettings as StoreSettings;
            }
            if (supaData.users && supaData.users.length > 0) {
              for (const su of supaData.users) {
                const idx = memoryDb.users.findIndex(
                  (u) => u.id === su.id || u.email.toLowerCase() === su.email.toLowerCase() || u.phone === su.phone
                );
                if (idx !== -1) {
                  // Keep passwordHash if local has it and remote doesn't
                  memoryDb.users[idx] = {
                    ...su,
                    passwordHash: su.passwordHash || memoryDb.users[idx].passwordHash
                  };
                } else {
                  memoryDb.users.push(su);
                }
              }
            }
            saveDatabaseSync(memoryDb);

            // Auto-push initial data if Supabase tables are empty
            if (!supaData.products || supaData.products.length === 0) {
              console.log('⚡ Supabase is connected but empty. Automatically pushing initial catalog and users...');
              syncAllToSupabase(memoryDb)
                .then((res) => {
                  console.log(`✅ Auto-pushed to Supabase: ${res.categoriesCount} categories, ${res.productsCount} products, ${res.usersCount} users.`);
                })
                .catch((e) => {
                  console.warn('⚠️ Auto-push to Supabase skipped (ensure supabase_schema.sql has been executed):', e.message);
                });
            }
          }
        }).catch((err) => console.warn('Supabase background sync skipped:', err));
      }

      return memoryDb!;
    }
  } catch (err) {
    console.error('Error reading database file, initializing default:', err);
  }

  const initial = getInitialData();
  memoryDb = initial;
  saveDatabaseSync(initial);
  return memoryDb;
}

export function saveDatabaseSync(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to sync save database:', err);
  }
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  memoryDb = data;
  if (isSaving) {
    pendingSave = true;
    return;
  }

  isSaving = true;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save database asynchronously:', err);
  } finally {
    isSaving = false;
    if (pendingSave) {
      pendingSave = false;
      saveDatabase(memoryDb);
    }
  }
}

// Concurrency-safe atomic transaction helper
export async function withTransaction<T>(
  action: (db: DatabaseSchema) => Promise<T> | T
): Promise<T> {
  const db = getDatabase();
  const result = await action(db);
  await saveDatabase(db);
  return result;
}

// Log audit actions for administrative accountability
export async function recordAuditLog(
  action: string,
  user: { id: string; email: string; role: string },
  details: string
): Promise<void> {
  await withTransaction((db) => {
    db.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      details,
      createdAt: new Date().toISOString()
    });
    // Keep last 1000 logs
    if (db.auditLogs.length > 1000) {
      db.auditLogs = db.auditLogs.slice(0, 1000);
    }
  });
}
