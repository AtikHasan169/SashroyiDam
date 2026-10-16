import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { getDatabase, withTransaction, recordAuditLog, verifyPassword } from '../db.ts';
import { createAuthToken, authenticateUser, requireAuth, type AuthenticatedRequest } from '../auth.ts';
import type { User, Address } from '../../types/index.ts';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_oshesh_salt_2026').digest('hex');
}

const registerSchema = z.object({
  name: z.string().min(2, 'নাম অন্তত ২ অক্ষরের হতে হবে'),
  phone: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)'),
  email: z.string().email('সঠিক ইমেইল এড্রেস দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে')
});

router.post('/register', async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    const { name, phone, email, password } = parse.data;
    const cleanPhone = phone.replace(/^(\+88|88)/, '');

    const token = await withTransaction((db) => {
      const existingUser = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() || u.phone === cleanPhone
      );
      if (existingUser) {
        throw new Error('এই ইমেইল বা ফোন নম্বর দিয়ে ইতোমধ্যে একাউন্ট খোলা আছে');
      }

      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        email: email.toLowerCase(),
        phone: cleanPhone,
        role: 'customer',
        passwordHash: hashPassword(password),
        savedAddresses: [],
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      return createAuthToken(newUser);
    });

    const db = getDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const { passwordHash, ...safeUser } = user!;

    res.status(201).json({
      user: safeUser,
      token,
      message: 'রেজিস্ট্রেশন সফল হয়েছে'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' });
  }
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'ইমেইল অথবা ফোন নম্বর দিন'),
  password: z.string().min(1, 'পাসওয়ার্ড দিন')
});

router.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    const { identifier, password } = parse.data;
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.trim().replace(/^(\+88|88)/, '');

    const db = getDatabase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === cleanId || u.phone === cleanPhone
    );

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড' });
      return;
    }

    const token = createAuthToken(user);
    const { passwordHash, ...safeUser } = user;

    res.json({
      user: safeUser,
      token,
      message: 'সফলভাবে লগইন হয়েছে'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'লগইন প্রক্রিয়ায় সমস্যা হয়েছে' });
  }
});

router.get('/me', authenticateUser, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'নট অথেন্টিকেটেড' });
    return;
  }
  const { passwordHash, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

router.put('/update-profile', authenticateUser, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'সঠিক নাম লিখুন' });
      return;
    }

    const updated = await withTransaction((db) => {
      const idx = db.users.findIndex((u) => u.id === req.user!.id);
      if (idx === -1) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

      db.users[idx].name = name.trim();
      if (phone && phone.trim()) {
        db.users[idx].phone = phone.trim().replace(/^(\+88|88)/, '');
      }
      return db.users[idx];
    });

    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser, message: 'প্রোফাইল আপডেট সফল হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.post('/address', authenticateUser, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, name, phone, division, district, upazila, fullAddress, isDefault } = req.body;
    if (!name || !phone || !division || !district || !fullAddress) {
      res.status(400).json({ error: 'ঠিকানার আবশ্যকীয় তথ্য পূরণ করুন' });
      return;
    }

    const updatedUser = await withTransaction((db) => {
      const user = db.users.find((u) => u.id === req.user!.id);
      if (!user) throw new Error('ইউজার পাওয়া যায়নি');

      if (!user.savedAddresses) {
        user.savedAddresses = [];
      }

      if (isDefault) {
        user.savedAddresses.forEach((a) => (a.isDefault = false));
      }

      const newAddress: Address = {
        id: `addr-${Date.now()}`,
        title: title || 'Home',
        name,
        phone,
        division,
        district,
        upazila: upazila || '',
        fullAddress,
        isDefault: Boolean(isDefault) || user.savedAddresses.length === 0
      };

      user.savedAddresses.push(newAddress);
      return user;
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ user: safeUser, message: 'নতুন ডেলিভারি ঠিকানা সংরক্ষিত হয়েছে' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'ঠিকানা যোগ করতে ব্যর্থ হয়েছে' });
  }
});

export default router;
