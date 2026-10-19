# Implementation Plan: Remove Notices & Fix Manual Order Creation

The user requested to:
1. Remove demo brand defaults (such as "Sashroyi Fashion" / "সাশ্রয়ী দাম") and placeholder items from forms and UI.
2. Remove the "ডেটাবেস স্টোরেজ" (Database Storage) notice card from the Admin Dashboard completely.
3. Fix the Manual Order feature in Admin Dashboard (clicking "+ ম্যানুয়াল অর্ডার" currently does not open a modal or create orders).

---

## Proposed Changes

### 1. Remove Database Storage Notice from Admin Dashboard
- In `src/components/admin/AdminDashboard.tsx`, delete the entire Database Storage status card (`ডেটাবেস স্টোরেজ: লোকাল ফাইল ডেটাবেস...`) from the Store Settings tab.

### 2. Remove Demo Brand Defaults & Hardcoded Placeholders
- In `src/components/admin/AdminDashboard.tsx`, clear default prefilled values in the Add Product modal (`brand: ''`, `images: []`, `price: 0`, `originalPrice: 0`, `stock: 0`).
- Ensure no hardcoded dummy brand names ("Sashroyi Fashion", "সাশ্রয়ী হোম", etc.) appear in forms or menus.

### 3. Implement Full Manual Order Creation (`+ ম্যানুয়াল অর্ডার`)
- In `src/server/routes/admin.ts`:
  - Add `POST /api/admin/orders` route to create manual orders with concurrency-safe stock deduction (if selecting an existing product) or custom item entry.
  - Support channels: Facebook Page, Phone Call, WhatsApp, Direct Walk-in.
  - Automatically calculate totals, apply delivery fees based on division, and record status in timeline and audit logs.
  - Sync the manual order to MongoDB Atlas if connected.
- In `src/lib/api.ts`:
  - Add `api.createAdminOrder(body)`.
- In `src/components/admin/AdminDashboard.tsx`:
  - Build the interactive `ManualOrderModal`:
    - Customer Info: Name, Phone (with validation), Address, Division.
    - Channel selector: Facebook, Phone Call, WhatsApp, Walk-in.
    - Item entry: Pick from catalog products or enter custom line items with price & quantity.
    - Financials: Subtotal, Delivery charge, Discount, Total, Payment status (Paid/Unpaid), Payment method.
    - Instant submission with toast confirmation and real-time dashboard refresh.

---

## Verification Plan
1. **Compilation & Linting**: Run `tsc --noEmit` and `vite build` to guarantee zero errors.
2. **UI Verification**: Open Admin Dashboard ➔ Store Settings: confirm the database notice is completely gone.
3. **Manual Order Creation**: Click "+ ম্যানুয়াল অর্ডার (Facebook / Phone)", fill out a manual order, submit, and verify it appears in the Orders table with order number, timeline, and customer contact.
