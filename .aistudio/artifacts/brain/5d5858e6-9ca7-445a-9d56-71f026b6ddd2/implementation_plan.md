# Implementation Plan: Deploy-Safe Dual-Layer Image Architecture & Performance Optimization

Eliminate sluggish page loads caused by giant Base64 strings in API payloads while guaranteeing **100% deployment safety and zero image loss** across ephemeral container restarts (Cloud Run, Docker, Vercel) through a dual-store architecture with on-demand automatic rehydration.

---

## 1. The Core Dilemma: Speed vs. Container Ephemerality

- **The Problem with Raw Base64**:
  - Base64 stored directly in product documents causes JSON responses (`/api/products`) to balloon into tens of megabytes, freezing the browser's main thread and degrading network performance.
- **The Risk with Naive Disk Storage (`/uploads`)**:
  - In cloud container environments (Google Cloud Run, Docker, Vercel, Kubernetes), the local disk is **ephemeral**. If a container scales down or a new code revision is deployed, any files saved purely to the local disk can disappear.
- **The Deploy-Safe Solution (Dual-Layer Architecture)**:
  - **Layer 1 (Fast Serving)**: Images are served as static files (`/uploads/img_....webp`) with HTTP `Cache-Control: public, max-age=31536000, immutable` and ETag caching.
  - **Layer 2 (Permanent Persistence)**: Every uploaded image is automatically mirrored to the persistent MongoDB `photos` collection (with binary data, MIME type, and safe name).
  - **Layer 3 (Auto-Rehydration on Restart)**: When a container redeploys or spins up fresh, missing files are automatically rehydrated from MongoDB both on-demand (when requested) and proactively on server boot.

---

## 2. Architecture & Data Flow

```
[ Admin / User Upload ]
           │
           ▼
[ Browser WebP Compression (Max 1200px, 0.82) ] (~60KB - 120KB)
           │
           ▼
   [ POST /api/upload ]
     ├── 1. Write file to local disk: uploads/img_<hash>.webp
     ├── 2. Save permanently to MongoDB: db.photos.updateOne(...)
     └── 3. Return clean URL: "/uploads/img_<hash>.webp"
           │
           ▼
[ Database stores only clean lightweight URL string: "/uploads/img_....webp" ]
  * Product JSON size drops from ~50MB to <50KB!

────────────────────────────────────────────────────────────────────────
CONTAINER REDEPLOYMENT / RESTART LIFECYCLE:
────────────────────────────────────────────────────────────────────────

Container starts with empty /uploads directory
           │
           ├── Background Boot: Scans MongoDB `photos` collection to pre-warm /uploads/
           │
           ▼
[ Incoming Request: GET /uploads/img_123.webp ]
           │
      File exists on disk?
     ├── YES ──► Serve immediately with 1-Year Cache-Control & ETag
     └── NO  ──► On-Demand Rehydration:
                  1. Query MongoDB `photos` for name: "img_123.webp"
                  2. Recreate file in /uploads/ directory
                  3. Pipe file to client response with Cache-Control
```

---

## 3. Detailed Implementation Steps

### Phase 1: Dual-Layer Server Storage & On-Demand Rehydration
- **File**: `src/server/app.ts`
- **Upload Handler (`POST /api/upload`)**:
  - Accept Base64 data, convert to binary buffer (`Buffer.from(data, 'base64')`).
  - Write file to `/uploads/${safeName}`.
  - Asynchronously upsert to MongoDB `photos` collection `{ name: safeName, data, contentType, size, createdAt }`.
  - Return `{ url: `/uploads/${safeName}`, message: 'ছবি স্থায়ীভাবে ও দ্রুত গতিতে সংরক্ষিত হয়েছে' }`.
- **Deploy-Safe Route (`app.get('/uploads/:filename')`)**:
  - Check if file exists on disk. If found, call `next()` to let `express.static` serve it with max-age headers.
  - If NOT found on disk (e.g. freshly deployed container):
    - Query MongoDB `photos.findOne({ name: filename })`.
    - If found in MongoDB, write the file back into `/uploads/${filename}` (self-healing local cache) and stream the image with `Cache-Control: public, max-age=31536000, immutable`.
    - If not found, return 404 or a clean fallback product SVG placeholder so the page never displays a broken icon.
- **Server Startup Pre-Warmer**:
  - When Express boots, run a non-blocking background task that checks MongoDB `photos` and rehydrates recent or featured photos into the local directory.

### Phase 2: Database Migration Utility (Base64 -> Dual-Layer URLs)
- **Files**: `src/server/db.ts` & `src/server/routes/admin.ts`
- Create `migrateExistingBase64Images()`:
  - Scans all products (`images[]`, `image`), categories (`image`), and banners (`image`) in `oshesh_db.json`.
  - Identifies any strings starting with `data:image/`.
  - Converts them to a file in `/uploads/` and mirrors them into MongoDB `photos`.
  - Updates the product/category document to point to `/uploads/img_....webp`.
  - Persists the cleaned database file.
- Automatically execute migration on server boot (idempotent, skipping items that already use `/uploads/...`).
- Add an explicit admin endpoint `POST /api/admin/migrate-images` and admin UI button so administrators can view migration metrics (number of migrated images, megabytes saved).

### Phase 3: Client-Side WebP Compression
- **File**: `src/components/admin/AdminDashboard.tsx`
- Refactor `compressAndUploadImage`:
  - Enforce maximum width/height of 1200px while maintaining aspect ratio.
  - Render to canvas and export as `image/webp` at `0.82` quality (with fallback to `image/jpeg`).
  - Compress oversized camera photos (often 5MB–10MB) down to ~80KB–150KB before upload, cutting upload time by over 90%.
  - Apply the same compressed upload flow to category and banner images.

### Phase 4: Storefront & Caching Polish
- **Files**: `src/components/ProductCard.tsx`, `src/components/ProductDetailModal.tsx`, `src/lib/api.ts`
- Add `loading="lazy"` and `decoding="async"` to all storefront `<img>` elements.
- In `src/lib/api.ts`, purge any legacy `sashroyi_catalog_cache` from `localStorage` that contains heavy Base64 strings, ensuring returning users immediately load the lightweight, cached version.

---

## 4. Deploy Safety Checklist & Verification Plan

1. **Local Disk Ephemerality Test**:
   - Delete the `/uploads/` folder while the server is running to simulate a fresh container deployment.
   - Request an existing product image URL.
   - Verify that the on-demand rehydrator restores the file from MongoDB, caches it locally, and returns HTTP 200.
2. **Payload Size Reduction Verification**:
   - Compare `/api/products` response payload before and after migration. Verify payload shrinks from tens of megabytes to <100KB.
3. **HTTP Cache Headers Verification**:
   - Inspect network headers for `/uploads/*` to confirm `Cache-Control: public, max-age=31536000, immutable`.
   - Verify subsequent page reloads return HTTP 304 or `(from disk cache)` with near 0ms load times.
4. **Applet Compilation & Linting**:
   - Run `compile_applet` and `lint_applet` to confirm clean builds and zero TypeScript errors.
