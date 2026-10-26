# Implementation Plan: English Dash-Separated Product URLs & Catalog Migration

Configure all product URLs and sharing links across the storefront and admin panel to use the product's English title formatted in lowercase with spaces replaced by hyphens (`-`) (e.g., `?product=premium-cotton-panjabi`), migrate all existing catalog items, and handle duplicates with counter numbers (e.g. `blue-shirt-2`).

---

## User Specifications & Core Rules

1. **URL Format**:
   - Product URLs will use the **English product name** (`titleEn`).
   - All spaces are replaced by single hyphens (`-`).
   - Converted to lowercase, non-alphanumeric characters stripped, with no leading or trailing hyphens (e.g. `"Premium Cotton Panjabi"` &rarr; `premium-cotton-panjabi`).
2. **Catalog Migration**:
   - **Update existing products now** and apply the rule automatically to all future products created or updated.
3. **Collision Handling**:
   - When multiple products have the same English title, append a sequential counter number (`-2`, `-3`, etc.).
4. **Fallback Handling**:
   - If a product only has a Bengali title, create a transliterated or clean slug fallback, ensuring valid URL characters only.

---

## Proposed Changes

### 1. English Slug Generation Utility (`src/utils/slugify.ts`)
- Implement a universal slug generator used across both frontend and backend:
  - `generateProductSlug(titleEn: string, titleBn?: string, existingSlugs?: string[], currentProductId?: string): string`
  - Normalization steps:
    1. If `titleEn` exists and contains English/alphanumeric characters, use it.
    2. Convert to lowercase and trim.
    3. Replace whitespace, underscores, and slashes with single `-`.
    4. Remove all characters except `[a-z0-9-]`.
    5. Collapse multiple consecutive hyphens (`--` &rarr; `-`).
    6. Trim hyphens from both ends.
    7. If empty, fall back to transliterated text or `product-[timestamp]`.
    8. Check against `existingSlugs`: If collision occurs with another product, append `-2`, `-3`, etc.

### 2. Auto-Migration of Existing Catalog Products (`src/server/db.ts`)
- In `ensureDatabaseReady()` / `getDatabase()`:
  - Check existing products in `memoryDb.products`.
  - Migrate any products with legacy or non-English-dash slugs (such as `product-mvplhzjd`, `--mvie7krp`, etc.) to clean English slugs derived from their `titleEn` (e.g., `deshemer-shohore-sobuj-ahammad-mursalin`, `smart-watch`).
  - Track slugs in a `Set` to enforce unique counter suffixes (`-2`, `-3`).
  - Immediately persist migrated slugs to `oshesh_db.json` and sync with MongoDB.

### 3. Server Product Creation & Update (`src/server/routes/admin.ts`)
- **`POST /api/admin/products`**:
  - Replace random hash generation (`product-xxxx-${Date.now()}`) with `generateProductSlug(titleEn, titleBn, db.products.map(p => p.slug))`.
- **`PUT /api/admin/products/:id`**:
  - When updating a product, update `product.slug` using `generateProductSlug(...)` while excluding the current product's ID to allow retaining its existing slug if the English title hasn't changed.

### 4. Admin Product Modal UI (`src/components/admin/AdminDashboard.tsx`)
- Under the "পণ্যের নাম (ইংরেজি)" input field:
  - Display a live preview of the generated URL slug:
    `🔗 পেজ লিঙ্ক: ?product=pure-cotton-shirt`
  - Updates in real-time as the administrator types.

### 5. Storefront Routing & Deep Linking (`src/App.tsx`, `ProductShareButton.tsx`)
- **`src/App.tsx`**:
  - `handleOpenProductPage`: Updates browser URL to `?product=${prod.slug}`.
  - Deep linking listener: Finds products by `p.slug === prodParam` (case-insensitive) or `p.id === prodParam`.
- **`src/components/ProductShareButton.tsx`**:
  - Generates shareable URLs using `?product=${product.slug || product.id}` so links shared to WhatsApp, Facebook, or copied to clipboard are clean and readable.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` and `lint_applet` to verify compilation and typing.

### Manual / Device Verification
1. **Catalog Auto-Migration Check**:
   - Check product list in the store:
   - Click a product (e.g. "ডিসেম্বরের শহরে" or apparel).
   - Verify the browser URL bar displays a clean English-dash format: `?product=...` without hashes or percent-encoded characters.
2. **Product Share Button Check**:
   - Click the Share button &rarr; "লিংক কপি করুন" (Copy Link).
   - Paste into address bar and verify URL has the clean English slug with hyphens.
3. **Admin New Product Creation with Live Preview**:
   - Go to Admin Panel &rarr; Add New Product.
   - Type in English name: `Executive Linen Panjabi`.
   - Verify live URL preview shows `?product=executive-linen-panjabi`.
   - Save and verify the slug is preserved.
4. **Duplicate Title Collision Check**:
   - Add another product with the same English title: `Executive Linen Panjabi`.
   - Verify the new product receives `?product=executive-linen-panjabi-2`.
