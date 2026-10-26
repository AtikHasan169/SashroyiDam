# Implementation Plan: Fix Mobile Drawer Contact Data & Hardcode Default to +8801321949742

Resolve the contact number discrepancy where the mobile hamburger menu drawer displays legacy fallback data (`01700-000000` / `01700000000`), and ensure `+8801321949742` is permanently hardcoded and synchronized as the authoritative default across both desktop and mobile views (including phone call helplines and WhatsApp support).

---

## Root Cause Analysis
1. **Mobile Drawer Fallbacks (`LeftHamburgerDrawer.tsx`)**:
   - Line 356 has `const displayPhone = storeSettings?.phone || '01700-000000';`.
   - Line 383 has `const waNum = (storeSettings?.whatsappNumber || storeSettings?.phone || '01700000000').replace(/[^0-9]/g, '');`.
   - If `whatsappNumber` is not explicitly customized in admin settings, or if settings are loading, the mobile drawer displays or links to the old test number `01700-000000`.
2. **Server & Database Default Settings (`src/server/db.ts`)**:
   - Initial settings still initialize with `phone: '01700-000000'` and `whatsappNumber: '01700000000'`.
   - The auto-migration fallback logic on lines 193 & 197 resets empty values back to `01700000000` and `01700-000000`.
3. **App & Storefront Fallbacks (`App.tsx`, `ClassyFloatingBar.tsx`, `Footer.tsx`)**:
   - Multiple client components contain legacy fallbacks to `'01700-000000'` and `'01700000000'`.

---

## User Decisions & Clarifications
- **Identified Issue Location**: Mobile hamburger menu drawer.
- **Synchronization Rule**: Automatically use `+8801321949742` for both phone calls and WhatsApp across all views (mobile drawer, floating bar, footer, policy modal).
- **Fallback Rule**: If none is configured in Admin Settings, `+8801321949742` will always be used automatically.

---

## Proposed Changes

### 1. Mobile Drawer Component (`src/components/LeftHamburgerDrawer.tsx`)
- Update customer helpline fallback from `'01700-000000'` to `'+8801321949742'`.
- Update WhatsApp fallback number from `'01700000000'` to `'+8801321949742'`.
- Synchronize quick WhatsApp shortcut (line 227) to prioritize `storeSettings?.whatsappNumber || storeSettings?.phone || '+8801321949742'`.
- Ensure phone links use `tel:+8801321949742` (or cleaned numeric `+8801321949742`) and WhatsApp links use `https://wa.me/8801321949742`.

### 2. Server Database Defaults & Auto-Migration (`src/server/db.ts`)
- In `initialStoreSettings`, set `phone: '+8801321949742'` and `whatsappNumber: '+8801321949742'`.
- In `getDatabase()`, update migration logic:
  - If `storeSettings.phone` is missing or contains the legacy `'01700-000000'`, update to `'+8801321949742'`.
  - If `storeSettings.whatsappNumber` is missing or contains legacy `'01700000000'`, update to `'+8801321949742'`.
  - Save migrated changes to database immediately.

### 3. Storefront Components & App Layout (`App.tsx`, `ClassyFloatingBar.tsx`, `Footer.tsx`, `FloatingSocialBadge.tsx`)
- **`src/App.tsx`**:
  - Update `ClassyFloatingBar` props:
    - `phone={storeInfo?.settings?.phone || '+8801321949742'}`
    - `whatsappNumber={storeInfo?.settings?.whatsappNumber || storeInfo?.settings?.phone || '+8801321949742'}`
- **`src/components/ClassyFloatingBar.tsx`**:
  - Replace default props with `phone = '+8801321949742'`, `whatsappNumber = '+8801321949742'`.
- **`src/components/Footer.tsx`**:
  - Replace any remaining `'01700-000000'` and `'01700000000'` fallbacks with `'+8801321949742'`.
- **`src/components/FloatingSocialBadge.tsx`**:
  - Update default props to `phone = '+8801321949742'`.

### 4. Admin Settings (`src/components/admin/AdminDashboard.tsx`)
- Update placeholders for phone and WhatsApp inputs to indicate `যেমন: +8801321949742 (ডিফল্ট)`.
- If an admin clears the fields or leaves them empty, apply `+8801321949742` so the store always has valid contact details.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to ensure TypeScript compilation passes without errors.

### Manual / Device Verification
1. **Mobile Mode Verification**:
   - Resize viewport to mobile screen (< 640px).
   - Tap top-left hamburger menu to open `LeftHamburgerDrawer`.
   - Verify helpline shows `+8801321949742`.
   - Tap WhatsApp button and verify destination URL targets `wa.me/8801321949742`.
   - Tap Phone call button and verify destination `tel:+8801321949742`.
2. **Desktop Mode Verification**:
   - Check Footer helpline and WhatsApp links.
   - Click floating "সহায়তা" button to ensure phone and WhatsApp display `+8801321949742`.
3. **Admin Settings Verification**:
   - Check Admin Panel → Settings tab to confirm phone & WhatsApp default to `+8801321949742`.
