import { MongoClient, type Db } from 'mongodb';
import type { DatabaseSchema } from './db.ts';
import type { Product, Category, Order, StoreSettings, Coupon, User } from '../types/index.ts';

let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

const mongoUri = (process.env.MONGODB_URI || '').trim();
const dbName = (process.env.MONGODB_DB_NAME || 'sashroyidaam').trim();

/**
 * Initializes connection to MongoDB Atlas or local MongoDB using MONGODB_URI from environment
 */
export async function initMongo(): Promise<boolean> {
  if (!mongoUri) {
    console.log('ℹ️ MONGODB_URI is not set in environment variables. Running in local JSON database mode.');
    mongoClient = null;
    db = null;
    isConnected = false;
    return false;
  }

  try {
    console.log(`⏳ Connecting to MongoDB (${dbName})...`);
    mongoClient = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });

    await mongoClient.connect();
    db = mongoClient.db(dbName);
    isConnected = true;

    // Ping to verify
    await db.command({ ping: 1 });
    console.log(`✅ MongoDB Atlas connected successfully to database "${dbName}"`);

    // Create unique index on 'id' for primary collections without blocking
    Promise.allSettled([
      db.collection('products').createIndex({ id: 1 }, { unique: true }),
      db.collection('categories').createIndex({ id: 1 }, { unique: true }),
      db.collection('orders').createIndex({ id: 1 }, { unique: true }),
      db.collection('users').createIndex({ id: 1 }, { unique: true }),
      db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true })
    ]).catch((err) => {
      console.warn('MongoDB index creation note:', err.message);
    });

    return true;
  } catch (err: any) {
    console.warn(`⚠️ Failed to connect to MongoDB (${err.message}). Continuing with local database.`);
    mongoClient = null;
    db = null;
    isConnected = false;
    return false;
  }
}

// Auto-initialize if MONGODB_URI is present in env
if (mongoUri) {
  initMongo().catch(() => {});
}

export function isMongoConfigured(): boolean {
  return isConnected && db !== null;
}

export function getMongoDatabase(): Db | null {
  return db;
}

export async function getMongoStatus() {
  if (!isMongoConfigured() || !db) {
    return {
      isConfigured: Boolean(mongoUri),
      isConnected: false,
      dbName: dbName || 'sashroyidaam',
      collections: { products: 0, categories: 0, orders: 0, users: 0 }
    };
  }

  try {
    const [productsCount, categoriesCount, ordersCount, usersCount] = await Promise.all([
      db.collection('products').countDocuments(),
      db.collection('categories').countDocuments(),
      db.collection('orders').countDocuments(),
      db.collection('users').countDocuments()
    ]);

    return {
      isConfigured: true,
      isConnected: true,
      dbName,
      collections: {
        products: productsCount,
        categories: categoriesCount,
        orders: ordersCount,
        users: usersCount
      }
    };
  } catch (err) {
    return {
      isConfigured: true,
      isConnected: false,
      dbName,
      collections: { products: 0, categories: 0, orders: 0, users: 0 }
    };
  }
}

/**
 * Fetches all persistent data from MongoDB on startup if available
 */
export async function fetchMongoData(): Promise<Partial<DatabaseSchema> | null> {
  if (!isMongoConfigured() || !db) return null;

  try {
    const [products, categories, orders, storeSettingsDoc, coupons, users] = await Promise.all([
      db.collection('products').find({}, { projection: { _id: 0 } }).toArray() as unknown as Promise<Product[]>,
      db.collection('categories').find({}, { projection: { _id: 0 } }).toArray() as unknown as Promise<Category[]>,
      db.collection('orders').find({}, { projection: { _id: 0 } }).toArray() as unknown as Promise<Order[]>,
      db.collection('store_settings').findOne({}, { projection: { _id: 0 } }) as unknown as Promise<StoreSettings | null>,
      db.collection('coupons').find({}, { projection: { _id: 0 } }).toArray() as unknown as Promise<Coupon[]>,
      db.collection('users').find({}, { projection: { _id: 0 } }).toArray() as unknown as Promise<User[]>
    ]);

    // If MongoDB has existing records, return them
    if (products.length > 0 || categories.length > 0 || orders.length > 0) {
      console.log(`📦 Loaded from MongoDB Atlas: ${products.length} products, ${categories.length} categories, ${orders.length} orders`);
      return {
        products: products || [],
        categories: categories || [],
        orders: orders || [],
        storeSettings: storeSettingsDoc || undefined,
        coupons: coupons || [],
        users: users || []
      };
    }

    return null;
  } catch (err: any) {
    console.error('Failed to read from MongoDB:', err.message);
    return null;
  }
}

/**
 * Upsert an Order into MongoDB
 */
export async function syncOrderToMongo(order: Order): Promise<void> {
  if (!isMongoConfigured() || !db) return;
  try {
    await db.collection('orders').updateOne(
      { id: order.id },
      { $set: { ...order, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (err: any) {
    console.warn(`Failed to sync order ${order.id} to MongoDB:`, err.message);
  }
}

/**
 * Upsert a Category into MongoDB
 */
export async function syncCategoryToMongo(category: Category): Promise<void> {
  if (!isMongoConfigured() || !db) return;
  try {
    await db.collection('categories').updateOne(
      { id: category.id },
      { $set: { ...category } },
      { upsert: true }
    );
  } catch (err: any) {
    console.warn(`Failed to sync category ${category.id} to MongoDB:`, err.message);
  }
}

/**
 * Delete a Category from MongoDB
 */
export async function deleteCategoryFromMongo(categoryId: string): Promise<void> {
  if (!isMongoConfigured() || !db) return;
  try {
    await db.collection('categories').deleteOne({ id: categoryId });
  } catch (err: any) {
    console.warn(`Failed to delete category ${categoryId} from MongoDB:`, err.message);
  }
}

/**
 * Upsert a Product into MongoDB (stores Base64 photos directly in the product document's images array)
 */
export async function syncProductToMongo(product: Product): Promise<void> {
  if (!isMongoConfigured() || !db) return;
  try {
    // Ensure images are preserved in product document
    const productDoc = {
      ...product,
      updatedAt: new Date().toISOString()
    };
    await db.collection('products').updateOne(
      { id: product.id },
      { $set: productDoc },
      { upsert: true }
    );
  } catch (err: any) {
    console.warn(`Failed to sync product ${product.id} to MongoDB:`, err.message);
  }
}

/**
 * Delete a Product from MongoDB
 */
export async function deleteProductFromMongo(productId: string): Promise<void> {
  if (!isMongoConfigured() || !db) return;
  try {
    await db.collection('products').deleteOne({ id: productId });
  } catch (err: any) {
    console.warn(`Failed to delete product ${productId} from MongoDB:`, err.message);
  }
}

/**
 * Upsert a User into MongoDB
 */
export async function syncUserToMongo(user: User): Promise<void> {
  if (!isMongoConfigured() || !db) return;
  try {
    await db.collection('users').updateOne(
      { id: user.id },
      { $set: { ...user, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (err: any) {
    console.warn(`Failed to sync user ${user.id} to MongoDB:`, err.message);
  }
}

/**
 * Find user by email in MongoDB
 */
export async function findMongoUser(email: string): Promise<User | null> {
  if (!isMongoConfigured() || !db) return null;
  try {
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() }, { projection: { _id: 0 } });
    return (user as unknown as User) || null;
  } catch (err) {
    return null;
  }
}

/**
 * Sync Store Settings into MongoDB
 */
export async function syncStoreSettingsToMongo(settings: StoreSettings): Promise<void> {
  if (!isMongoConfigured() || !db) return;
  try {
    await db.collection('store_settings').updateOne(
      { id: 'primary_settings' },
      { $set: { ...settings, id: 'primary_settings', updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (err: any) {
    console.warn('Failed to sync store settings to MongoDB:', err.message);
  }
}

/**
 * Push all local data into MongoDB
 */
export async function syncAllToMongo(data: DatabaseSchema): Promise<{ success: boolean; message: string }> {
  if (!isMongoConfigured() || !db) {
    throw new Error('MongoDB Atlas সংযুক্ত নয়। অনুগ্রহ করে এনভায়রনমেন্ট ভ্যারিয়েবলে MONGODB_URI প্রদান করুন।');
  }

  try {
    // Clean up products and orders removed locally
    const currentProdIds = data.products.map((p) => p.id);
    if (currentProdIds.length === 0) {
      await db.collection('products').deleteMany({});
    } else {
      await db.collection('products').deleteMany({ id: { $nin: currentProdIds } });
    }

    const currentOrderIds = data.orders.map((o) => o.id);
    if (currentOrderIds.length === 0) {
      await db.collection('orders').deleteMany({});
    } else {
      await db.collection('orders').deleteMany({ id: { $nin: currentOrderIds } });
    }

    // Upsert categories
    for (const cat of data.categories) {
      await db.collection('categories').updateOne({ id: cat.id }, { $set: cat }, { upsert: true });
    }

    // Upsert products (with base64 photos)
    for (const prod of data.products) {
      await db.collection('products').updateOne({ id: prod.id }, { $set: prod }, { upsert: true });
    }

    // Upsert orders
    for (const ord of data.orders) {
      await db.collection('orders').updateOne({ id: ord.id }, { $set: ord }, { upsert: true });
    }

    // Upsert settings
    if (data.storeSettings) {
      await db.collection('store_settings').updateOne(
        { id: 'primary_settings' },
        { $set: { ...data.storeSettings, id: 'primary_settings' } },
        { upsert: true }
      );
    }

    // Upsert coupons
    for (const coup of data.coupons) {
      await db.collection('coupons').updateOne({ id: coup.id }, { $set: coup }, { upsert: true });
    }

    return {
      success: true,
      message: `সফলভাবে MongoDB-তে সিঙ্ক হয়েছে (${data.products.length}টি পণ্য, ${data.categories.length}টি ক্যাটাগরি, ${data.orders.length}টি অর্ডার)`
    };
  } catch (err: any) {
    throw new Error(`MongoDB সিঙ্ক করতে সমস্যা হয়েছে: ${err.message}`);
  }
}
