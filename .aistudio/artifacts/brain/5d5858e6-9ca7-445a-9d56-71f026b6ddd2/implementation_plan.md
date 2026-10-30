# Revised Implementation Plan: Strict Guest Privacy Protection, Direct Profile Tracking & Checkout Reset

## 1. Strict Privacy Protection for Public & Guest Order Tracking
- **Security Requirement:**
  - Guests must NEVER be allowed to search orders with just a phone number, as that would leak customer names, delivery addresses, and purchase history.
- **Backend Enforcement (`src/server/routes/orders.ts`):**
  - In `POST /api/orders/track`:
    - Strictly require **both** `orderNumber` AND `phone`.
    - If either is missing, return HTTP 400 with a clear Bengali error message: `"অর্ডার নম্বর এবং মোবাইল নম্বর উভয়ই আবশ্যক"`.
    - Query only matching orders where **both** the order number and the customer phone number match exactly.
    - Remove all phone-only search branches.
- **Frontend Tracking Form (`src/components/OrderTrackingModal.tsx`):**
  - When opened publicly from header/footer, the search form enforces both fields:
    - `অর্ডার রেফারেন্স নম্বর` (Required)
    - `অর্ডারে ব্যবহৃত মোবাইল নম্বর` (Required)
  - Submit button is disabled unless both fields are provided.

---

## 2. 1-Click Direct Order Tracking from Profile (Zero Code Required)
- **User Experience Requirement:**
  - When an authenticated customer views their order history in their Profile, they have already been verified.
  - Clicking "ট্র্যাক" (Track) next to an order in `ProfilePage.tsx` or `AccountModal.tsx` must immediately display that specific order's status, items, and delivery timeline with **zero typing** and **zero prompts**.
- **Implementation:**
  - `ProfilePage.tsx` and `AccountModal.tsx` pass the order object directly to the tracking modal via `onTrackOrder(ord.orderNumber, ord)`.
  - In `src/App.tsx`, `handleOpenTrackingWithNumber` stores the order object and passes it as `initialOrder` to `<OrderTrackingModal>`.
  - `OrderTrackingModal` initializes directly in display mode, rendering:
    - Order reference number and status badge (`pending_confirmation`, `confirmed`, `shipped`, `delivered`).
    - Customer delivery address and item details.
    - Payment verification details (bKash/Nagad copyable store numbers and TrxID status).
    - Chronological status timeline.
    - No input fields, no tracking code required.

---

## 3. Subsequent Product Purchases: Clean Checkout Modal Reset
- **Problem:**
  - After completing an order, re-opening checkout for another product continues displaying the previous order success screen.
- **Implementation in `src/components/CheckoutFlow.tsx`:**
  - Reset `completedOrder` to `null` whenever `isOpen` transitions to `false` or when `onClose` is called.
  - Reset `step` to `1`, clear `orderError`, `transactionId`, and `senderNumber`.
  - Clicking "আরো কেনাকাটা করুন" (Shop More) explicitly resets `completedOrder` to `null` and calls `onClose()`.
  - Subsequent clicks on "এখনই কিনুন" (Buy Now) or cart checkout always open a fresh checkout form.

---

## 4. MongoDB as Primary Database (Zero Local File Reliance)
- All store settings, payment configs, shipping rates, products, categories, coupons, and orders persist directly to MongoDB Atlas.
- Administrative audit logging is preserved in the Admin Panel as requested.

---

## 5. Verification Steps
1. **Public Tracking Privacy:** Call `POST /api/orders/track` with only a phone number and verify it is rejected with 400.
2. **Guest Tracking Verification:** Verify that public tracking succeeds only when both order number and matching phone are provided.
3. **Profile Tracking Verification:** Go to Profile -> My Orders, click "ট্র্যাক" on an order, and verify the order timeline displays immediately with zero inputs.
4. **Checkout Reset Verification:** Complete an order, close the modal, click "এখনই কিনুন" on another product, and verify the clean checkout form displays.
5. **Code Integrity:** Run `tsc --noEmit` and `compile_applet`.
