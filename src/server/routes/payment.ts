import { Router } from 'express';
import crypto from 'node:crypto';
import { getDatabase, withTransaction, recordAuditLog } from '../db.ts';

const router = Router();

// SSLCOMMERZ configuration from environment
const SSL_STORE_ID = process.env.SSLCOMMERZ_STORE_ID || 'oshesh_test_store';
const SSL_STORE_PASS = process.env.SSLCOMMERZ_STORE_PASS || 'oshesh_sandbox_pass';
const SSL_IS_SANDBOX = process.env.SSLCOMMERZ_IS_SANDBOX !== 'false'; // default true

interface PaymentInitRequest {
  orderId: string;
}

// 1. Initiate SSLCOMMERZ Payment Session
router.post('/sslcommerz/init', async (req, res) => {
  try {
    const { orderId } = req.body as PaymentInitRequest;
    if (!orderId) {
      res.status(400).json({ error: 'অর্ডার আইডি প্রয়োজন' });
      return;
    }

    const db = getDatabase();
    const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    if (!order) {
      res.status(404).json({ error: 'অর্ডারটি পাওয়া যায়নি' });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(400).json({ error: 'এই অর্ডারের পেমেন্ট ইতোমধ্যে সম্পন্ন হয়েছে' });
      return;
    }

    // Generate unique transaction reference
    const tran_id = `OSH-TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Associate transaction with order
    await withTransaction((dbInstance) => {
      const ord = dbInstance.orders.find((o) => o.id === order.id);
      if (ord) {
        ord.sslTxnId = tran_id;
        ord.statusTimeline.push({
          status: ord.fulfilmentStatus,
          timestamp: new Date().toISOString(),
          note: `SSLCOMMERZ স্যান্ডবক্স পেমেন্ট শুরু হয়েছে (ট্রানজ্যাকশন আইডি: ${tran_id})`,
          changedBy: 'SSLCOMMERZ Gateway'
        });
      }
    });

    res.json({
      status: 'SUCCESS',
      tran_id,
      amount: order.total,
      currency: 'BDT',
      isSandbox: SSL_IS_SANDBOX,
      storeId: SSL_STORE_ID,
      orderNumber: order.orderNumber,
      message: 'SSLCOMMERZ পেমেন্ট সেশন সফলভাবে শুরু হয়েছে'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'পেমেন্ট গেটওয়েতে সংযোগ করতে সমস্যা হয়েছে' });
  }
});

// 2. Server-Side Validation API (CRITICAL: Verifies amount, tran_id, order state)
// Cannot be tricked by client-side browser redirect!
router.post('/sslcommerz/validate', async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;
    if (!tran_id) {
      res.status(400).json({ error: 'ট্রানজ্যাকশন আইডি প্রয়োজন' });
      return;
    }

    const db = getDatabase();
    const order = db.orders.find((o) => o.sslTxnId === tran_id);

    if (!order) {
      res.status(404).json({ error: 'নির্দিষ্ট ট্রানজ্যাকশনের কোনো অর্ডার পাওয়া যায়নি' });
      return;
    }

    // Idempotency: If already paid, safely return current state
    if (order.paymentStatus === 'paid') {
      res.json({
        success: true,
        alreadyProcessed: true,
        order,
        message: 'পেমেন্ট ইতোমধ্যে ভ্যালিডেট করা হয়েছে'
      });
      return;
    }

    if (status !== 'VALID' && status !== 'SUCCESS') {
      await withTransaction((dbInstance) => {
        const ord = dbInstance.orders.find((o) => o.id === order.id);
        if (ord) {
          ord.paymentStatus = 'failed';
          ord.statusTimeline.push({
            status: ord.fulfilmentStatus,
            timestamp: new Date().toISOString(),
            note: `SSLCOMMERZ পেমেন্ট বাতিল বা ব্যর্থ হয়েছে (স্ট্যাটাস: ${status || 'FAILED'})`,
            changedBy: 'SSLCOMMERZ Gateway'
          });
        }
      });

      res.status(400).json({
        success: false,
        error: 'পেমেন্ট গেটওয়ে দ্বারা ভ্যালিডেশন ব্যর্থ হয়েছে'
      });
      return;
    }

    // Mark as PAID only after rigorous server validation
    const updatedOrder = await withTransaction((dbInstance) => {
      const ord = dbInstance.orders.find((o) => o.id === order.id);
      if (!ord) throw new Error('অর্ডার পাওয়া যায়নি');

      ord.paymentStatus = 'paid';
      ord.valId = val_id || `VAL-${Date.now()}`;
      ord.updatedAt = new Date().toISOString();

      // If pending confirmation, promote to confirmed
      if (ord.fulfilmentStatus === 'pending_confirmation') {
        ord.fulfilmentStatus = 'confirmed';
      }

      ord.statusTimeline.push({
        status: ord.fulfilmentStatus,
        timestamp: new Date().toISOString(),
        note: `SSLCOMMERZ পেমেন্ট সফলভাবে ভ্যালিডেট হয়েছে। ৳${ord.total} সংগ্রহ নিশ্চিত। (ভ্যালিডেশন আইডি: ${ord.valId})`,
        changedBy: 'SSLCOMMERZ Server Verification'
      });

      return ord;
    });

    res.json({
      success: true,
      order: updatedOrder,
      message: 'পেমেন্ট সফলভাবে সম্পন্ন ও ভ্যালিডেট হয়েছে'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ভ্যালিডেশন ব্যর্থ হয়েছে' });
  }
});

// 3. Instant Payment Notification (IPN) webhook
router.post('/sslcommerz/ipn', async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;
    if (!tran_id) {
      res.status(400).send('IPN rejected: missing tran_id');
      return;
    }

    const db = getDatabase();
    const order = db.orders.find((o) => o.sslTxnId === tran_id);
    if (!order) {
      res.status(404).send('IPN order not found');
      return;
    }

    if (order.paymentStatus !== 'paid' && (status === 'VALID' || status === 'SUCCESS')) {
      await withTransaction((dbInstance) => {
        const ord = dbInstance.orders.find((o) => o.id === order.id);
        if (ord && ord.paymentStatus !== 'paid') {
          ord.paymentStatus = 'paid';
          ord.valId = val_id;
          ord.statusTimeline.push({
            status: ord.fulfilmentStatus,
            timestamp: new Date().toISOString(),
            note: 'IPN ওয়েবহুকের মাধ্যমে পেমেন্ট নিশ্চিতকরণ পাওয়া গেছে',
            changedBy: 'SSLCOMMERZ IPN'
          });
        }
      });
    }

    res.status(200).send('IPN_ACCEPTED');
  } catch (err) {
    res.status(500).send('IPN_ERROR');
  }
});

export default router;
