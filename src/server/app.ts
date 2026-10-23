import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import authRouter from './routes/auth.ts';
import productsRouter from './routes/products.ts';
import cartRouter from './routes/cart.ts';
import ordersRouter from './routes/orders.ts';
import paymentRouter from './routes/payment.ts';
import adminRouter from './routes/admin.ts';
import { getDatabase, migrateBase64Images } from './db.ts';
import { getMongoDatabase, savePhotoToMongo, getPhotoFromMongo, getAllPhotosFromMongo } from './mongodb.ts';

export function createExpressApp() {
  // Eagerly initialize database & MongoDB sync
  getDatabase();

  // Run non-blocking Base64 migration to convert any legacy Base64 images to static files
  setTimeout(() => {
    migrateBase64Images().catch((err) => {
      console.warn('Initial Base64 migration note:', err.message);
    });
  }, 1500);

  const app = express();

  // Disable Express ETag generation to prevent 304 caching of live retail data
  app.set('etag', false);

  // CORS support
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
    res.header('Access-Control-Expose-Headers', 'Authorization, X-Auth-Token');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Strict zero-cache headers on all API endpoints so products and orders always reflect real-time live data
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Support JSON and image payloads up to 25MB
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure uploads directory exists if filesystem is writable
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {
    // Graceful fallback for read-only serverless filesystems
  }

  // Background Disk Pre-Warmer: Rehydrate all MongoDB photos into /uploads on fresh container startup
  setTimeout(async () => {
    try {
      const photos = await getAllPhotosFromMongo();
      if (photos && photos.length > 0) {
        let restoredCount = 0;
        for (const photo of photos) {
          const filePath = path.join(uploadsDir, photo.name);
          if (!fs.existsSync(filePath) && photo.data) {
            try {
              const base64Data = photo.data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
              fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
              restoredCount++;
            } catch {}
          }
        }
        if (restoredCount > 0) {
          console.log(`✅ Auto-rehydrated ${restoredCount} images from MongoDB into local /uploads cache`);
        }
      }
    } catch (err: any) {
      console.warn('Photo pre-warmer note:', err.message);
    }
  }, 2500);

  // Deploy-Safe Image Serving & On-Demand Rehydration Middleware
  // If a container redeployed and wiped local /uploads, missing images are fetched from MongoDB instantly!
  app.get('/uploads/:filename', async (req, res, next) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);

    // Fast path: file already exists in local disk cache
    if (fs.existsSync(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Pragma', 'public');
      return res.sendFile(filePath);
    }

    // Container redeployment fallback: file missing from disk, pull from permanent MongoDB photos collection
    try {
      const photoDoc = await getPhotoFromMongo(filename);
      if (photoDoc && photoDoc.data) {
        const base64Data = photoDoc.data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Self-heal: re-cache to local disk for subsequent instant hits
        try {
          fs.writeFileSync(filePath, buffer);
        } catch {}

        res.setHeader('Content-Type', photoDoc.contentType || 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Pragma', 'public');
        return res.send(buffer);
      }
    } catch (err: any) {
      console.warn(`Rehydration error for image "${filename}":`, err.message);
    }

    // If not found in MongoDB either, let express.static or 404 handler continue
    next();
  });

  // Serve static uploads with long-lived browser caching headers
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '365d',
      immutable: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    })
  );

  // Image Upload API (Dual-Store: Local Fast Disk + MongoDB Permanent Persistence)
  app.post('/api/upload', async (req, res) => {
    try {
      const { data, filename: customName } = req.body;
      if (!data || typeof data !== 'string') {
        res.status(400).json({ error: 'ছবির ডেটা প্রয়োজন (Image data required)' });
        return;
      }

      const match = data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({ error: 'সঠিক ফরম্যাটের ছবি দিন (Valid base64 image required)' });
        return;
      }

      const rawExt = match[1].toLowerCase();
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt.replace(/[^a-zA-Z0-9]/g, '') || 'webp';
      const safeName = customName && typeof customName === 'string' && /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(customName)
        ? customName
        : `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const buffer = Buffer.from(match[2], 'base64');
      const filePath = path.join(uploadsDir, safeName);

      // 1. Write file to local disk for ultra-fast static HTTP serving
      try {
        fs.writeFileSync(filePath, buffer);
      } catch (writeErr) {
        console.warn('Warning writing image file to disk:', writeErr);
      }

      // 2. Persist to MongoDB photos collection for container redeployment/restart immunity
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      savePhotoToMongo(safeName, data, contentType).catch((err) => {
        console.warn('MongoDB photo store note:', err.message);
      });

      // 3. Return lightweight static URL (few bytes instead of multi-megabyte base64 string!)
      res.json({
        url: `/uploads/${safeName}`,
        name: safeName,
        size: buffer.length,
        message: 'ছবি সফলভাবে সংরক্ষিত হয়েছে (Dual-Store Persisted)'
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'ছবি সংরক্ষণে সমস্যা হয়েছে' });
    }
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api', productsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/payment', paymentRouter);
  app.use('/api/admin', adminRouter);

  // Health check & status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      store: 'সাশ্রয়ী দাম | Sashroyi Daam',
      currency: 'BDT (৳)',
      time: new Date().toISOString()
    });
  });

  return app;
}
