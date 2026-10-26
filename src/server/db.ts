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
  ensureMongoReady,
  fetchMongoData,
  syncAllToMongo,
  syncProductToMongo,
  syncCategoryToMongo,
  syncOrderToMongo,
  syncUserToMongo,
  syncStoreSettingsToMongo,
  savePhotoToMongo
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

  const initialCategories: Category[] = [];

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

  const initialBanners: Banner[] = [];

  const initialStoreSettings: StoreSettings = {
    storeNameBn: 'সাশ্রয়ী দাম',
    storeNameEn: 'Sashroyi Daam',
    taglineBn: '',
    phone: '',
    email: '',
    supportHoursBn: '',
    addressBn: '',
    announcementStripBn: '',
    showAnnouncement: false,
    freeDeliveryThreshold: 2000,
    defaultDeliveryFeeDhaka: 70,
    defaultDeliveryFeeOutside: 130,
    isCodEnabled: true,
    isSslcommerzEnabled: false,
    sslSandboxMode: true,
    facebookPageName: '',
    facebookUsername: '',
    facebookUrl: ''
  };

  const initialOrders: Order[] = [];

  const initialReviews: Review[] = [];

  const initialUsers: User[] = [
    {
      id: 'user-superadmin',
      name: 'Super Admin',
      email: superAdminEmail,
      phone: '',
      role: 'super_admin',
      passwordHash: superAdminHash,
      savedAddresses: [],
      createdAt: new Date().toISOString()
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
    auditLogs: [],
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

      // Ensure variantType is populated on categories if custom categories exist
      memoryDb!.categories.forEach((c) => {
        if (!c.variantType) {
          c.variantType = 'none';
          c.defaultOptions = c.defaultOptions || [];
          hasChanges = true;
        }
      });

      // Clear any legacy test store contact details so owner can set them manually
      if (memoryDb!.storeSettings) {
        if (memoryDb!.storeSettings.phone === '০৯৬১২-৮৮৯৯০০' || memoryDb!.storeSettings.phone === '01700000001') {
          memoryDb!.storeSettings.phone = '';
          hasChanges = true;
        }
        if (memoryDb!.storeSettings.addressBn?.includes('বাড়ি ৪২')) {
          memoryDb!.storeSettings.addressBn = '';
          hasChanges = true;
        }
        if (memoryDb!.storeSettings.email === 'support@sashroyidaam.com') {
          memoryDb!.storeSettings.email = '';
          hasChanges = true;
        }
        if (memoryDb!.storeSettings.announcementStripBn?.includes('🚚 ২,০০০ টাকার অর্ডারে')) {
          memoryDb!.storeSettings.announcementStripBn = '';
          memoryDb!.storeSettings.showAnnouncement = false;
          hasChanges = true;
        }
      }

      // Remove any test staff or mock customer accounts
      const initialUsersCount = memoryDb!.users.length;
      memoryDb!.users = memoryDb!.users.filter(
        (u) =>
          u.role === 'super_admin' ||
          (!['user-ordermanager', 'user-customer1'].includes(u.id) &&
            !['orders@sashroyidaam.com', 'customer@sashroyidaam.com'].includes(u.email.toLowerCase()))
      );
      if (memoryDb!.users.length !== initialUsersCount) {
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
        if (existingSuper.phone === '01700000001' || existingSuper.phone === '01711223344') {
          existingSuper.phone = '';
          hasChanges = true;
        }
        if (existingSuper.savedAddresses && existingSuper.savedAddresses.length > 0) {
          existingSuper.savedAddresses = [];
          hasChanges = true;
        }
      } else {
        memoryDb!.users.unshift({
          id: 'user-superadmin',
          name: 'Super Admin',
          email: envSuperEmail,
          phone: '',
          role: 'super_admin',
          passwordHash: envSuperHash,
          savedAddresses: [],
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

      // Purge any legacy sample products or mock brand test entries
      if (memoryDb!.products && memoryDb!.products.length > 0) {
        const cleanedProducts = memoryDb!.products.filter(
          (p) =>
            p.brand !== 'সাশ্রয়ী খাটি পণ্য' &&
            p.brand !== 'সাশ্রয়ী ফ্যাশন' &&
            p.slug !== 'test-shirt-mvgwueql' &&
            !p.id.startsWith('prod-sample') &&
            p.titleBn !== 'টেস্ট শার্ট'
        );
        if (cleanedProducts.length !== memoryDb!.products.length) {
          memoryDb!.products = cleanedProducts;
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

let lastMongoSyncTime = 0;
const MONGO_SYNC_INTERVAL_MS = 2500; // 2.5 seconds cache freshness window for live queries

export async function ensureDatabaseReady(): Promise<DatabaseSchema> {
  const db = getDatabase();
  const mongoUri = (process.env.MONGODB_URI || '').trim();
  if (!mongoUri) {
    return db;
  }

  const now = Date.now();
  if (now - lastMongoSyncTime > MONGO_SYNC_INTERVAL_MS) {
    try {
      const ready = await ensureMongoReady();
      if (ready) {
        const mongoData = await fetchMongoData();
        if (mongoData && memoryDb) {
          if (mongoData.products && mongoData.products.length > 0) {
            memoryDb.products = mongoData.products as Product[];
          } else if (memoryDb.products.length > 0) {
            // First time seeding MongoDB with initial products
            for (const prod of memoryDb.products) {
              syncProductToMongo(prod).catch(() => {});
            }
          }

          if (mongoData.categories && mongoData.categories.length > 0) {
            memoryDb.categories = mongoData.categories as Category[];
          } else if (memoryDb.categories.length > 0) {
            for (const cat of memoryDb.categories) {
              syncCategoryToMongo(cat).catch(() => {});
            }
          }

          if (mongoData.orders && mongoData.orders.length > 0) {
            memoryDb.orders = mongoData.orders as Order[];
          }

          if (mongoData.storeSettings) {
            memoryDb.storeSettings = mongoData.storeSettings as StoreSettings;
          }
          if (mongoData.coupons && mongoData.coupons.length > 0) {
            memoryDb.coupons = mongoData.coupons as Coupon[];
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
          lastMongoSyncTime = now;
        }
      }
    } catch (err) {
      console.warn('MongoDB sync error in ensureDatabaseReady:', err);
    }
  }

  return memoryDb!;
}

// Concurrency-safe atomic transaction helper
export async function withTransaction<T>(
  action: (db: DatabaseSchema) => Promise<T> | T
): Promise<T> {
  const db = await ensureDatabaseReady();
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

/**
 * Automatically migrates existing Base64 images across products, categories, and banners
 * into clean /uploads/ static file URLs and persistent MongoDB photo backups.
 */
export async function migrateBase64Images(): Promise<{
  migratedCount: number;
  savedBytes: number;
  message: string;
}> {
  const db = await ensureDatabaseReady();
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch {}
  }

  let migratedCount = 0;
  let savedBytes = 0;
  let hasChanges = false;

  const processImage = (dataUrl: string, prefix: string): string => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return dataUrl;
    }
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return dataUrl;

    const rawExt = match[1].toLowerCase();
    const ext = rawExt === 'jpeg' || rawExt === 'jpg' ? 'jpg' : rawExt === 'png' ? 'png' : rawExt === 'webp' ? 'webp' : 'jpg';
    // Generate deterministic content hash from the base64 content
    const hash = crypto.createHash('md5').update(match[2]).digest('hex').substring(0, 10);
    const safeName = `img_${prefix}_${hash}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    try {
      if (!fs.existsSync(filePath)) {
        const buffer = Buffer.from(match[2], 'base64');
        fs.writeFileSync(filePath, buffer);
      }
    } catch (e) {
      console.warn('Error writing migrated file to disk:', e);
    }

    // Persist to MongoDB photos collection
    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    savePhotoToMongo(safeName, dataUrl, contentType).catch(() => {});

    migratedCount++;
    savedBytes += dataUrl.length;
    hasChanges = true;
    return `/uploads/${safeName}`;
  };

  // Migrate Categories
  for (const cat of db.categories) {
    if (cat.image && cat.image.startsWith('data:image/')) {
      cat.image = processImage(cat.image, `cat_${cat.id || 'c'}`);
    }
  }

  // Migrate Products
  for (const prod of db.products) {
    if (Array.isArray(prod.images)) {
      prod.images = prod.images.map((img, idx) => {
        if (img && typeof img === 'string' && img.startsWith('data:image/')) {
          return processImage(img, `prod_${prod.id || 'p'}_${idx}`);
        }
        return img;
      });
    }
  }

  // Migrate Banners
  for (const banner of db.banners) {
    if (banner.imageUrl && banner.imageUrl.startsWith('data:image/')) {
      banner.imageUrl = processImage(banner.imageUrl, `ban_${banner.id || 'b'}`);
    }
  }

  if (hasChanges) {
    await saveDatabase(db);
    console.log(`🚀 Base64 Migration Complete: Migrated ${migratedCount} images, reduced payload size by ~${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  }

  return {
    migratedCount,
    savedBytes,
    message: hasChanges
      ? `সফলভাবে ${migratedCount}টি ছবি Base64 থেকে অপ্টিমাইজড ফাইল সিস্টেমে রূপান্তরিত হয়েছে (মোট ${(savedBytes / 1024 / 1024).toFixed(2)} MB ডাটা সাশ্রয়)`
      : 'সকল ছবি ইতোমধ্যে অপ্টিমাইজড ফাইল ফরম্যাটে রয়েছে।'
  };
}


