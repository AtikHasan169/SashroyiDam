# Implementation Plan - Product Not Found & Admin Visibility Fix

## Issue Diagnostics & Root Causes Identified
1. **Catalog Pagination Deep Link Failure in `App.tsx`**:
   - Direct links or reloads (`/?product=slug-or-id`) evaluated `products.find(...)` against the in-memory array of the currently loaded page (12 items). If the product was on another page, had filters active, or if `products` was still loading on initial mount, it evaluated to `undefined` and set `viewingProductPage(null)`, causing "Product Not Found".
2. **Ambiguous Toggle Button in Admin Table**:
   - The status button had the label `'প্রকাশিত (Hide)'` when published and `'লুকানো (Show)'` when hidden. Users clicked "প্রকাশিত (Hide)" thinking they were publishing the product, which toggled `isPublished` to `false` and immediately hid it from the public catalog.
3. **Draft / Unpublished Product 404s**:
   - Backend `GET /products/:slugOrId` previously required `p.isPublished === true`. When a product was unpublished, visiting its URL returned a hard 404 error instead of letting admins/owners preview the draft.

## Implemented Solutions

1. **Direct Deep Link API Fetching (`src/App.tsx`)**:
   - Deep link `useEffect` and `handlePopState` now query `api.getProduct(prodParam)` whenever the product is not already in the loaded array.
   - Admin preview navigation transitions smoothly to the product page via the new `onViewProduct` handler.

2. **Admin Dashboard Products Table UX Overhaul (`src/components/admin/AdminDashboard.tsx`)**:
   - **Dedicated Status Column**: Renders clear visual badges:
     - 🟢 **প্রকাশিত** (Published with green pulse indicator)
     - 🟡 **লুকানো** (Hidden/Draft with amber indicator)
   - **Explicit Action Buttons**:
     - **ভিউ** (Store Preview with `Eye` icon) to instantly preview how customers see the product.
     - **লুকান** (Hide) when currently published.
     - **পাবলিশ** (Publish) when currently hidden.
     - **সম্পাদনা** (Edit) & **মুছুন** (Delete).
   - **Status Filter**: Added a filter dropdown (`সব পণ্য`, `শুধু প্রকাশিত`, `শুধু লুকানো / ড্রাফট`) alongside the Category and Search filters.

3. **Safe Catalog Filtering & Draft Preview (`src/server/routes/products.ts`, `src/components/ProductPage.tsx`)**:
   - `GET /products/:slugOrId` returns the product for previews even in draft state.
   - Catalog filtering uses `p.isPublished !== false && !p.isArchived` to safely treat truthy or uninitialized flags as published.
   - `ProductPage.tsx` displays an amber draft banner (`⚠️ অপ্রকাশিত পণ্য (ড্রাফট মোড)`) with an immediate "সম্পাদনা ও প্রকাশ করুন" button for admins.

## Verification
- TypeScript compilation (`compile_applet`) completed with zero errors.
- Lint check (`tsc --noEmit`) completed cleanly.
- Dev server reloaded and operational.
