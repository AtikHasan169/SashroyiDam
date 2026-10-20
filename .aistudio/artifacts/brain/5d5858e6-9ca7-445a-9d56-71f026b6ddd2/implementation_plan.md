# Implementation Plan: Professional Persistence, Photo Upload, Manual Orders & Coupon Management

This plan addresses all items raised by the user to bring the store to production-grade quality.

---

## 1. Professional Database Persistence & Anti-Disappearance Architecture
- **Problem**: On serverless platforms like Vercel, the local filesystem is ephemeral and read-only. In-memory data is wiped when serverless lambdas recycle.
- **Professional Solution**:
  - **Cloud Persistence**: MongoDB Atlas serves as the authoritative cloud document store for all products, categories, orders, coupons, and settings.
  - **Client-Side Optimistic Hydration**: Storefront and Admin maintain an automatic client-side cache (`sashroyi_catalog_cache`). On page load, products render instantly from cache without waiting for cold starts. Any newly added or edited products are immediately committed to both the local cache and the cloud database, guaranteeing that products **never disappear** on reload.
  - **Automatic Re-sync**: If the backend undergoes a cold start, it automatically re-fetches from MongoDB Atlas or client state.

---

## 2. Clean Photo Upload with Instant Preview & Remove Button
- **Problem**: Dummy photos were prefilled or stuck in the form, and there was no intuitive way to delete or replace them cleanly.
- **Solution**:
  - Remove all hardcoded default photos (`/src/assets/images/...`) from the new product modal (`editingProduct.images = []`).
  - Implement a clean, modern multi-photo uploader component:
    - Drag-and-drop zone + file picker (supports multiple image selection).
    - Optional image URL input for web images.
    - Automatic client-side canvas compression to WebP/JPEG (<250KB each) to prevent slow uploads or payload limits.
    - Instant thumbnail grid with a clear, floating **"Remove (Trash icon)"** button on each image.
    - "Set as Cover Photo" option to easily choose the main thumbnail.

---

## 3. Remove "Sashroyi Fashion" & Database Storage Notice
- **Admin Dashboard**:
  - Remove the entire "ডেটাবেস স্টোরেজ" (Database Storage: Local File...) info banner from the Store Settings tab.
  - Clear out default prefilled brands (`brand: ''`, `sku: ''`, `price: 0`, `originalPrice: 0`, `stock: 0`).
- **Storefront & Navigation**:
  - Clean out any hardcoded "Sashroyi Fashion" or dummy brand suggestions from `Header.tsx`, `SearchOverlay.tsx`, and `Hero.tsx`.

---

## 4. Full Manual Order Creation (+ ম্যানুয়াল অর্ডার)
- **Backend (`src/server/routes/admin.ts`)**:
  - Implement `POST /api/admin/orders`:
    - Validates customer name, phone, address, division.
    - Supports channel tracking: Facebook Page, Phone Call, WhatsApp, Walk-in.
    - Handles line items from existing products (with automatic stock deduction) or custom walk-in items.
    - Generates formal order number (`OSH-2026-XXXX`).
    - Syncs to database and records timeline & audit log.
- **Frontend (`src/components/admin/AdminDashboard.tsx`)**:
  - Build `ManualOrderModal`:
    - Responsive modal opening when clicking `+ ম্যানুয়াল অর্ডার (Facebook / Phone)`.
    - Customer details inputs with quick division selector (auto-calculates Dhaka vs Outside Dhaka shipping fee).
    - Searchable product selector dropdown with quantity and price overrides.
    - Financial summary: Subtotal, Delivery Fee, Discount, Grand Total.
    - Payment method & status selection (Cash on Delivery, bKash, Nagad, Paid/Unpaid).
    - Save action with toast notification and immediate refresh of the orders table.

---

## 5. Coupon Edit and Delete Management
- **Backend (`src/server/routes/admin.ts`)**:
  - Implement `PUT /api/admin/coupons/:id` to update code, discount value, type, expiry, and minimum order value.
  - Implement `DELETE /api/admin/coupons/:id` to permanently remove or deactivate coupons.
- **Frontend (`src/components/admin/AdminDashboard.tsx`)**:
  - Add **"Edit (Pencil icon)"** button to each coupon row to edit code, discount, and validity dates.
  - Add **"Delete (Trash icon)"** button with confirmation prompt to safely remove coupons.
  - In `src/lib/api.ts`, add `api.updateCoupon(id, body)` and `api.deleteCoupon(id)`.

---

## Verification Plan
1. **Compilation & Build**: Run `tsc --noEmit` and `vite build` to guarantee zero errors.
2. **Product Persistence Test**: Add a product without any dummy images, upload a photo, refresh the browser, and confirm it remains permanently.
3. **Manual Order Test**: Click `+ ম্যানুয়াল অর্ডার`, fill customer details, submit, and confirm the order is listed in the Orders tab with correct channel and timeline.
4. **Coupon Management Test**: Create, edit, and delete a coupon; verify instant table update.
5. **UI Cleanliness**: Check Settings tab and verify the Database notice is completely absent.
