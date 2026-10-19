# Implementation Plan: Remove Existing Demo Products & Dummy Data

The user has requested to clear all existing demo products, dummy orders, reviews, and inventory history from the store while retaining all categories, store settings, coupons, and super admin accounts.

## User Preferences Confirmed
1. **Products & Categories**: Remove all demo products; keep categories intact for future product creation.
2. **Orders & History**: Clear all dummy orders, customer reviews, and inventory movement history.

---

## Proposed Changes

### 1. Database Seed Cleanup (`src/server/db.ts`)
- Set `initialProducts = []` in `getInitialData()`.
- Set `initialOrders = []`.
- Set `initialReviews = []`.
- Set `initialInventoryMovements = []`.
- Preserve `initialCategories`, `storeSettings`, `shippingRates`, `coupons`, and `users` (Super Admin).
- Reset the active in-memory and local disk database (`db.json`) so demo records are immediately wiped on server start.

### 2. MongoDB Sync & Migration (`src/server/mongodb.ts`)
- Ensure that if MongoDB Atlas is connected, it syncs the cleared product catalog and does not repopulate deleted demo products.
- Provide a database cleanup utility or route in Admin to purge demo records from MongoDB if previously synced.

### 3. Storefront Zero-State & Admin Prompt (`src/App.tsx`)
- Enhance the empty catalog display in the storefront so that when `products.length === 0`:
  - Visitors see a clean, professional banner: "শীঘ্রই নতুন পণ্য যুক্ত হচ্ছে (New arrivals coming soon)".
  - Store owners see a quick shortcut button: "পণ্য যোগ করুন (Add Product in Admin)" with immediate access to the product creation form.
- Ensure `Hero.tsx` smoothly displays the promotional category banners without broken product slides.

---

## Verification Plan
1. **Lint & Build Test**: Run `tsc --noEmit` and `vite build` to verify clean compilation.
2. **Catalog Verification**: Confirm `/api/products` returns `items: []` and `/api/categories` returns all preserved categories.
3. **Admin Verification**: Test adding a brand new product from the Admin Dashboard and verify it saves cleanly to the database and MongoDB Atlas.
