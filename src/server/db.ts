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
import {
  isMongoConfigured,
  fetchMongoData,
  syncAllToMongo,
  syncProductToMongo,
  syncCategoryToMongo,
  syncOrderToMongo,
  syncUserToMongo,
  syncStoreSettingsToMongo
} from './mongodb.ts';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const SEED_DB_FILE = path.resolve(process.cwd(), 'data', 'oshesh_db.json');
const DB_DIR = isServerless ? '/tmp/sashroyi_data' : path.resolve(process.cwd(), 'data');
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

  const initialProducts: Product[] = [];

  const initialCoupons: Coupon[] = [];

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

  const initialOrders: Order[] = [];

  const initialReviews: Review[] = [];

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

    if (!fs.existsSync(DB_FILE) && isServerless && fs.existsSync(SEED_DB_FILE)) {
      try {
        fs.copyFileSync(SEED_DB_FILE, DB_FILE);
      } catch {}
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

      // Removed demo product injection

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

      // Removed demo product injection

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

      // Purge any legacy hardcoded coupons
      if (memoryDb!.coupons && memoryDb!.coupons.length > 0) {
        const filteredCoupons = memoryDb!.coupons.filter(
          (c) => c.code !== 'WELCOME50' && c.code !== 'SASHROYI10' && c.code !== 'OSHESH10'
        );
        if (filteredCoupons.length !== memoryDb!.coupons.length) {
          memoryDb!.coupons = filteredCoupons;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        saveDatabaseSync(memoryDb!);
      }

      // If MongoDB is configured in environment, fetch latest cloud records in background
      if (isMongoConfigured()) {
        fetchMongoData().then((mongoData) => {
          if (mongoData && memoryDb) {
            if (mongoData.products && mongoData.products.length > 0) {
              // Merge products keeping any newly created local ones
              const localMap = new Map(memoryDb.products.map((p) => [p.id, p]));
              for (const mp of mongoData.products as Product[]) {
                if (!localMap.has(mp.id)) {
                  memoryDb.products.push(mp);
                }
              }
            }
            if (mongoData.orders && mongoData.orders.length > 0) {
              memoryDb.orders = mongoData.orders as Order[];
            }
            if (mongoData.categories && mongoData.categories.length > 0) {
              memoryDb.categories = mongoData.categories as Category[];
            }
            if (mongoData.storeSettings) {
              memoryDb.storeSettings = mongoData.storeSettings as StoreSettings;
            }
            if (mongoData.users && mongoData.users.length > 0) {
              for (const mu of mongoData.users) {
                const idx = memoryDb.users.findIndex(
                  (u) => u.id === mu.id || u.email.toLowerCase() === mu.email.toLowerCase() || u.phone === mu.phone
                );
                if (idx !== -1) {
                  // Keep passwordHash if local has it and remote doesn't
                  memoryDb.users[idx] = {
                    ...mu,
                    passwordHash: mu.passwordHash || memoryDb.users[idx].passwordHash
                  };
                } else {
                  memoryDb.users.push(mu);
                }
              }
            }
            saveDatabaseSync(memoryDb);
          }
        }).catch((err) => console.warn('MongoDB background sync note:', err));
      }

      return memoryDb!;
    }
  } catch (err) {
    console.error('Error reading database file, initializing default:', err);
  }

  const initial = getInitialData();
  memoryDb = initial;
  saveDatabaseSync(initial);

  // If MongoDB is configured on fresh container boot, fetch cloud records immediately
  if (isMongoConfigured()) {
    fetchMongoData().then((mongoData) => {
      if (mongoData && memoryDb) {
        if (mongoData.products && mongoData.products.length > 0) {
          memoryDb.products = mongoData.products as Product[];
        }
        if (mongoData.orders && mongoData.orders.length > 0) {
          memoryDb.orders = mongoData.orders as Order[];
        }
        if (mongoData.categories && mongoData.categories.length > 0) {
          memoryDb.categories = mongoData.categories as Category[];
        }
        if (mongoData.storeSettings) {
          memoryDb.storeSettings = mongoData.storeSettings as StoreSettings;
        }
        if (mongoData.users && mongoData.users.length > 0) {
          for (const mu of mongoData.users) {
            const idx = memoryDb.users.findIndex(
              (u) => u.id === mu.id || u.email.toLowerCase() === mu.email.toLowerCase() || u.phone === mu.phone
            );
            if (idx !== -1) {
              memoryDb.users[idx] = {
                ...mu,
                passwordHash: mu.passwordHash || memoryDb.users[idx].passwordHash
              };
            } else {
              memoryDb.users.push(mu);
            }
          }
        }
        saveDatabaseSync(memoryDb);
      }
    }).catch((err) => console.warn('MongoDB fresh boot sync note:', err));
  }

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
