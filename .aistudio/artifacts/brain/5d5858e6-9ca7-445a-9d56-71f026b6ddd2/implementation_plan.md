# Implementation Plan: Pure MongoDB Environment Integration (Zero Supabase, Base64 Photos)

## 1. User Directives & Scope
Based on the revised requirements:
1. **Completely Remove Supabase**: Remove `@supabase/supabase-js`, `src/server/supabase.ts`, `src/lib/clientSupabase.ts`, `supabase_schema.sql`, all Supabase API routes, and the Supabase configuration tab from `AdminDashboard.tsx`.
2. **MongoDB ONLY in ENV (Not in Admin UI)**:
   - MongoDB connection is configured **strictly via environment variable** (`MONGODB_URI` and optional `MONGODB_DB_NAME` in `.env` / environment).
   - **No database configuration form or input fields in the Admin Dashboard**.
   - The server reads `process.env.MONGODB_URI` on startup. If present, it connects to MongoDB Atlas; if absent, it safely falls back to local storage.
3. **Product Photos Stored in MongoDB as Base64**:
   - Product photos uploaded through the admin panel or store are saved and stored directly inside the MongoDB `products` documents (and dedicated `photos` collection if needed) as Base64 data URLs (`data:image/...;base64,...`), requiring no external S3/Supabase storage buckets.

---

## 2. Architecture & File Strategy

### A. Environment Configuration (`.env.example` & `server.ts`)
- Update `.env.example` to define:
  ```env
  # MONGODB CLOUD DATABASE PERSISTENCE (Zero SQL)
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sashroyidaam?retryWrites=true&w=majority
  MONGODB_DB_NAME=sashroyidaam
  ```
- No UI inputs in Admin for database credentials. The app owner manages connection via environment variables.

### B. Core MongoDB Service (`src/server/mongodb.ts`)
- Install `mongodb` driver.
- Create a clean singleton `MongoDBManager`:
  - Reads `process.env.MONGODB_URI` and `process.env.MONGODB_DB_NAME`.
  - Connects on server boot without blocking server startup.
  - Exposes collections: `products`, `categories`, `orders`, `users`, `store_settings`, `coupons`, `reviews`.
  - Helper functions for document queries, upserts, and deletions.
  - Ensures photos in `images` array are safely validated and stored as Base64 strings.

### C. Unified Server Database Engine (`src/server/db.ts`)
- Remove all Supabase imports and references (`isSupabaseConfigured`, `syncAllToSupabase`, `fetchSupabaseData`).
- When `MONGODB_URI` is provided:
  - On server start: loads initial state from MongoDB collections (products, categories, orders, users, settings).
  - On write: syncs updates directly to MongoDB collections.
  - Stores all image uploads directly as Base64 strings in documents.

### D. Complete Supabase Cleanup
- **Delete**: `src/server/supabase.ts`, `src/lib/clientSupabase.ts`, `supabase_schema.sql`, `data/supabase_config.json`.
- **Remove from `package.json`**: `@supabase/supabase-js`.
- **Remove from routes**:
  - `src/server/routes/admin.ts`: Remove `/supabase/*` routes.
  - `src/server/routes/auth.ts`: Remove Supabase sync.
  - `src/server/routes/orders.ts`: Remove Supabase sync.
- **Remove from frontend**:
  - `src/lib/api.ts`: Remove `getSupabaseStatus`, `configureSupabase`, `syncAllToSupabase`.
  - `src/components/admin/AdminDashboard.tsx`: Completely remove Supabase tab, inputs, state, and buttons. Display only a subtle badge in the header ("Database: MongoDB Cloud" or "Database: Local File").

---

## 3. Step-by-Step Implementation

### Step 1: Install MongoDB & Remove Supabase Dependency
- Install `mongodb` driver via `install_applet_package`.
- Remove `@supabase/supabase-js` from `package.json`.

### Step 2: Delete Supabase Files & Clean Routes
- Remove `src/server/supabase.ts`, `src/lib/clientSupabase.ts`, and `supabase_schema.sql`.
- Clean up `src/server/routes/admin.ts`, `auth.ts`, `orders.ts` to remove all Supabase calls.

### Step 3: Implement MongoDB Client (`src/server/mongodb.ts`)
- Create `src/server/mongodb.ts` reading `process.env.MONGODB_URI`.
- Implement collection sync and Base64 product photo handling.

### Step 4: Update Database Core (`src/server/db.ts`)
- Wire `src/server/db.ts` to sync with `mongodb.ts`.
- Ensure base64 product photos are preserved and stored directly in MongoDB.

### Step 5: Clean Admin Dashboard UI (`src/components/admin/AdminDashboard.tsx` & `src/lib/api.ts`)
- Remove Supabase tab and all database input fields.
- Keep the Admin UI clean and focused on products, orders, categories, coupons, and store settings.

### Step 6: Update Environment Example
- Update `.env.example` with `MONGODB_URI` and remove Supabase keys.

---

## 4. Verification & Testing Plan
1. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to verify no remaining Supabase imports or type errors.
2. **Environment Variable Boot**: Verify server starts cleanly with or without `MONGODB_URI`.
3. **Base64 Photo Upload**: Verify creating/updating a product with an uploaded photo stores the image as a Base64 string in MongoDB without external file dependencies.
