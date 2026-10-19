import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import authRouter from './routes/auth.ts';
import productsRouter from './routes/products.ts';
import cartRouter from './routes/cart.ts';
import ordersRouter from './routes/orders.ts';
import paymentRouter from './routes/payment.ts';
import adminRouter from './routes/admin.ts';
import { getDatabase } from './db.ts';
import { getMongoDatabase } from './mongodb.ts';

export function createExpressApp() {
  // Eagerly initialize database & MongoDB sync
  getDatabase();

  const app = express();

  // CORS support
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Support JSON and image payloads up to 25MB
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure uploads directory exists if filesystem is writable
  try {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsDir));
  } catch (e) {
    // Graceful fallback for read-only serverless filesystems
  }

  // Image Upload API for categories and products (Stores directly as Base64 in MongoDB)
  app.post('/api/upload', (req, res) => {
    try {
      const { data } = req.body;
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
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
      const safeName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      // If MongoDB is connected, store in photos collection
      const mongoDb = getMongoDatabase();
      if (mongoDb) {
        mongoDb.collection('photos').updateOne(
          { name: safeName },
          {
            $set: {
              name: safeName,
              data,
              contentType: `image/${ext}`,
              createdAt: new Date().toISOString()
            }
          },
          { upsert: true }
        ).catch((err) => {
          console.warn('MongoDB photo store warning:', err.message);
        });
      }

      // Return full base64 data URL so it is saved directly into the database row
      res.json({
        url: data,
        message: 'ছবি স্থায়ীভাবে (Base64) সংরক্ষিত হয়েছে'
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
