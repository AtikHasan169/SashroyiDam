# Implementation Plan: Dedicated MongoDB `admin_settings` Collection & Real-Time Sync

Ensure all administrative configurations created or edited in the Admin Panel—including store settings, bKash and Nagad payment numbers, delivery charges, shipping zones, coupons, and banners—are persistently saved to and loaded directly from a dedicated `admin_settings` collection in MongoDB Atlas, preventing values from ever resetting to defaults on restart, re-deployment, or container recycling.

---

## 1. Root Cause Analysis
- Currently, when an administrator edits store settings via `PUT /api/admin/settings` or shipping rates via `PUT /api/admin/shipping/:id`, the values are saved in local memory and local JSON (`oshesh_db.json`), but are never synced to MongoDB.
- On cold boots or re-deployments, `fetchMongoData()` only loaded data if `products.length > 0 || categories.length > 0 || orders.length > 0`. If those were empty or during fresh container startups, store settings reverted to the hardcoded `initialStoreSettings`.
- There is currently no dedicated `admin_settings` collection in MongoDB that aggregates and guarantees authoritative preservation of the store's core admin configurations.

---

## 2. Proposed Changes

### Step 1: Implement `admin_settings` Collection in `src/server/mongodb.ts`
- Define an authoritative schema and document structure for the `admin_settings` collection (`id: 'primary_admin_config'`).
- Document payload will store:
  - `storeSettings`: Store name, phone, WhatsApp number, bKash number & type (personal/merchant), Nagad number & type, address, delivery fees (Dhaka Metro & Nationwide), free delivery threshold, notice announcements, social links.
  - `shippingRates`: Dhaka and outside-Dhaka rates, estimated delivery days, active states.
  - `coupons`: Active discount codes, limits, rules, and usage metrics.
  - `banners`: Promotional carousel and campaign banners.
  - `updatedAt` and `updatedBy`: Timestamp and administrator identifier.
- Add `syncAdminSettingsToMongo(data: { storeSettings?: StoreSettings; shippingRates?: ShippingRate[]; coupons?: Coupon[]; banners?: Banner[] }, updatedBy?: string): Promise<boolean>` to immediately upsert to `admin_settings`.
- Add `fetchAdminSettingsFromMongo(): Promise<{ storeSettings?: StoreSettings; shippingRates?: ShippingRate[]; coupons?: Coupon[]; banners?: Banner[] } | null>` to unconditionally retrieve admin configs from MongoDB.
- Update `fetchMongoData()` to fetch `admin_settings` unconditionally on startup, even if other collections are empty.
- Update `getMongoStatus()` to monitor the `admin_settings` collection count and status.

### Step 2: Auto-Load and Seed `admin_settings` in `src/server/db.ts`
- In `getDatabase()` and `ensureDatabaseReady()`:
  - Query MongoDB's `admin_settings` upon server startup.
  - If `admin_settings` document exists in MongoDB, override initial defaults with cloud values so live database values are immediately served to the storefront and admin panel.
  - If MongoDB is connected and `admin_settings` does not yet exist, automatically seed the initial admin configuration into MongoDB so the document is created right away.
- In `syncAllToMongo()`, ensure `admin_settings` is included and updated during full catalog syncs.

### Step 3: Wire Real-Time Cloud Sync in `src/server/routes/admin.ts`
- In `PUT /api/admin/settings`:
  - After updating `db.storeSettings` locally, immediately call `syncAdminSettingsToMongo({ storeSettings: updated }, req.user?.email)` and `syncStoreSettingsToMongo(updated)`.
- In `PUT /api/admin/shipping/:id`:
  - After updating `shippingRates`, immediately call `syncAdminSettingsToMongo({ shippingRates: db.shippingRates }, req.user?.email)`.
- In `POST /api/admin/coupons`, `PUT /api/admin/coupons/:id`, and `DELETE /api/admin/coupons/:id`:
  - Immediately sync updated coupons to `admin_settings`.
- Ensure public settings endpoints (`GET /api/settings`, `GET /api/store/settings`) and checkout flow always retrieve the live persisted values from memory and MongoDB.

### Step 4: Verification & Diagnostic Checks
- Run typecheck and compilation (`npm run lint` / `tsc --noEmit`, `compile_applet`).
- Test saving store settings (e.g., custom bKash/Nagad numbers, delivery charge updates) via admin API.
- Test server restart simulation to verify values are loaded directly from MongoDB `admin_settings` without resetting to defaults.
- Verify Admin Panel UI and customer CheckoutFlow reflect the updated numbers and rates immediately.
