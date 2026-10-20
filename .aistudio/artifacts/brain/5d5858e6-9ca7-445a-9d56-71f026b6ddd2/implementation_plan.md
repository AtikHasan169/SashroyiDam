# Unified Cascading Address System, Coupon Cleanup & Resilient Admin Products

A comprehensive architectural overhaul that implements a synchronized Division -> District -> Thana/Upazila selector across all application touchpoints, fixes address list visibility in the user profile via dedicated server synchronization, purges all hardcoded promo coupons, and resolves product creation and listing in the admin inventory dashboard.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions unify address management, promotional rules, and admin catalog operations across the storefront and administrative consoles.

- **Unified Cascading Geo-Selector in All Address Panels**: Both the profile address manager, the account modal, and the checkout flow will utilize the structured dataset from `bangladeshGeo.ts` for linked Division $\to$ District $\to$ Thana/Upazila dropdowns with automatic cascade selection and manual village/street text inputs.
- **Dedicated Address API Endpoint**: Rather than relying strictly on JWT claims for deep address structures, a dedicated `/api/auth/addresses` endpoint will be provided to load and mutate addresses authoritatively with instant UI reactivity.
- **Zero Hardcoded Coupons**: All hardcoded coupon entries (`WELCOME50`, `SASHROYI10`, `OSHESH10`), hardcoded alias bypasses in cart/orders, and input placeholders are permanently removed. The coupon store will start completely clean and accept only coupons created by administrators.
- **Resilient Admin Product Creation & Real-Time Listing**: Product addition form validation will accept both Bengali and standard ASCII numerals, provide instant table feedback with resilient image fallback placeholders, and synchronously maintain inventory records across local state and MongoDB Atlas.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Profile Address Panel**: Fixes the address list so users instantly see all saved delivery locations with Default tags, contact details, and one-tap delete/edit controls.
  2. **Universal Cascading Address Form**: Unifies address entry everywhere (Profile, Account Modal, Checkout) with a cascading Division $\to$ District $\to$ Thana/Upazila selector powered by authentic Bangladesh geographic data.
  3. **Clean Coupon Engine**: Deletes legacy hardcoded coupons and references from memory, disk storage, cart calculation, order creation, and placeholders.
  4. **Admin Product Addition & Listing**: Fixes product creation failure cases, handles image-less products gracefully with high-fidelity placeholder assets, adds live search and category filtering in the admin table, and immediately refreshes the product table.
- **Target Audience**: Bangladesh retail shoppers ordering goods to specific upazilas/thanas nationwide, and store managers administering inventory and promotional rules.
- **Key Value**: Frictionless checkout and address management without typing mismatched district/thana names, guaranteed product visibility in the admin panel, and an unpolluted promotional database.

---

## 2. User Experience & Visual Design

Following the universal `frontend-design` constitution and the e-commerce retail design guidelines (`references/1_ecommerce_retail.md`):

### Key User Flows

1. **Profile Saved Delivery Addresses**:
   - User navigates to Profile $\to$ Addresses tab.
   - An active query fetches `/api/auth/addresses`.
   - Saved locations render in a 2-column grid featuring home/office labels, recipient name, phone, full street address, and district/division badges.
   - Clicking "নতুন ঠিকানা" (Add New) opens an intuitive form with linked Division $\to$ District $\to$ Thana/Upazila dropdowns. Selecting "চট্টগ্রাম" immediately populates Chittagong's 11 districts; selecting "কুমিল্লা" immediately populates Comilla's upazilas.
   - Upon submission, the address list refreshes without a page reload.

2. **Admin Product Management Flow**:
   - Store manager navigates to Admin $\to$ পণ্য ও স্টক (Products).
   - The table renders all published, unpublished, and low-stock items with image thumbnail, SKU, Bengali title, category name, tabular price (৳), and stock count.
   - If a product has no image, a clean emerald/stone SVG monogram placeholder renders instead of a broken image frame.
   - Clicking "নতুন পণ্য যোগ করুন" (Add New Product) displays a modal with category selection, price input supporting Bengali numerals, stock, and descriptions.
   - Saving immediately adds the item to the top of the table with a confirmation toast, updates the storefront catalog cache, and syncs to MongoDB.

### Visual Identity & Theme Tokens

- **Dominant Neutral Canvas (60%)**: `#FAFAF9` (Stone 50) and `#FFFFFF` (Surface).
- **Structural Surfaces & Hairlines (30%)**: `#E7E5E4` (Stone 200 hairline borders), `#F5F5F4` (Stone 100 table header backgrounds).
- **Intentional Accent Budget (10%)**: Deep heritage emerald `#0F4C3A` (Primary CTA and active navigation states) with `#135D48` hover tone.
- **Zero-Pill Discipline**: Metadata displayed as clean unboxed text separated by subtle typographic dots (`·`) or slashes.
- **Tabular Figures**: All currency values (৳), stock counts, order numbers, and phone numbers rendered with `tabular-nums font-mono` alignment.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Address Persistence & Dedicated API vs. JWT-Only Claims
- **Chosen Approach**: Introduce explicit `/api/auth/addresses` (`GET`, `POST`, `DELETE`, `PUT`) endpoints on the Express backend, while keeping standard identity claims in the JWT token.
- **Why**: JWT tokens should remain lightweight ($<1\text{KB}$) for standard authorization. Serializing arbitrary arrays of multi-field address strings with Bengali Unicode inside HTTP Authorization request headers risks header overflow (HTTP 431) and stale client-side caches.
- **Alternatives Considered**: Storing all addresses inside the JWT token was error-prone and caused out-of-sync profile views.

### Decision 2: Cascading Geographic Data Engine
- **Chosen Approach**: Standardize on `src/data/bangladeshGeo.ts` as the single source of truth for Bangladesh 8 divisions, 64 districts, and constituent upazilas/thanas across `CheckoutFlow.tsx`, `ProfilePage.tsx`, and `AccountModal.tsx`.
- **Why**: Eliminates user typos in upazila and district names that cause courier delivery failures with Pathao, Steadfast, and RedX.

### Decision 3: Hardcoded Coupon Deletion
- **Chosen Approach**: Purge `WELCOME50` and `SASHROYI10` from `db.ts`, `data/oshesh_db.json`, `cart.ts`, `orders.ts`, and `CheckoutFlow.tsx`. Coupons are only valid if explicitly created by an administrator via Admin $\to$ কুপন (Coupons).
- **Why**: Real retail environments cannot have undocumented discounts leaking into checkout calculations.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STOREFRONT & ADMIN CLIENT                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│    ProfilePage.tsx      │     CheckoutFlow.tsx    │   AdminDashboard.tsx    │
│  - Addresses Tab        │  - Cascading Geo Drop   │  - Product Table        │
│  - GET /addresses       │  - Live Delivery Calc   │  - Add/Edit Modal       │
│  - Add / Delete Form    │  - Order Submission     │  - Search & Filters     │
└────────────┬────────────┴────────────┬────────────┴────────────┬────────────┘
             │                         │                         │
             ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS SERVER (server.ts)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/auth/addresses    │ /api/orders             │ /api/admin/products     │
│  - GET: List addresses  │ - Verify order details  │ - GET: Filter & list    │
│  - POST: Add address    │ - Dynamic courier fee   │ - POST: Validate & add  │
│  - DELETE: Remove addr  │ - Apply active coupons  │ - PUT: Update item      │
│  - No hardcoded promos  │ - No coded discounts    │ - Sync to MongoDB       │
└────────────┬─────────────────────────┬─────────────────────────┬────────────┘
             │                         │                         │
             ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORITATIVE PERSISTENCE                           │
├─────────────────────────────────────────┬───────────────────────────────────┤
│  Local JSON DB: data/oshesh_db.json     │  Cloud DB: MongoDB Atlas          │
│  - users.savedAddresses                 │  - products, categories, orders   │
│  - empty initial coupons                │  - background sync on mutation    │
└─────────────────────────────────────────┴───────────────────────────────────┘
```

### Component & Handler Implementation Plan

1. **Server Routes (`src/server/routes/auth.ts` & `src/server/db.ts`)**:
   - Implement `GET /api/auth/addresses` to return `{ addresses: user.savedAddresses || [] }`.
   - Update `POST /api/auth/address` and `DELETE /api/auth/address/:id` to mutate user address array and return `{ addresses, message }`.
   - Purge initial coupon constants from `db.ts` and clear existing coupons in `data/oshesh_db.json`.
   - Remove legacy coupon hardcoding in `src/server/routes/cart.ts` and `src/server/routes/orders.ts`.

2. **Admin Products Router (`src/server/routes/admin.ts`)**:
   - In `POST /api/admin/products`: normalize price/stock inputs (handling Bengali and Latin numbers); ensure `images` defaults to empty array; provide fallback placeholder if empty.
   - Return newly created product immediately with 201 status and trigger MongoDB sync.

3. **API Client (`src/lib/api.ts`)**:
   - Add `getAddresses: () => request<{ addresses: Address[] }>('/api/auth/addresses')`.
   - Ensure `createProduct` and `getAdminProducts` correctly propagate state.

4. **Profile Page (`src/components/ProfilePage.tsx`)**:
   - Fetch addresses directly on mount and tab switch using `api.getAddresses()`.
   - Replace manual district/upazila text inputs with linked `BANGLADESH_DIVISIONS` cascading dropdowns.
   - Provide visual feedback and instant list mutation on add/delete.

5. **Account Modal (`src/components/AccountModal.tsx`)**:
   - Upgrade address creation to use the unified cascading Division $\to$ District $\to$ Upazila dropdown.

6. **Admin Dashboard (`src/components/admin/AdminDashboard.tsx`)**:
   - In `handleSaveProduct`: properly `await` `loadAllAdminData()`, prepend new product to state, and display notification.
   - In product table: add fallback thumbnail container for image-less products and an empty state banner with "প্রথম পণ্যটি যোগ করুন" action.
   - Add search input and category filter in the products table header.
