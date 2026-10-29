# Implementation Plan: Admin MFS Payment Review, Address Validation Popup & Secure TrxID Management

Implement a dedicated review section in the Admin Dashboard for bKash/Nagad pending orders with missing or unverified TrxIDs, remove customer-side TrxID editing to prevent fraudulent tampering, and add an address validation modal popup to checkout.

## User Review Required

> [!IMPORTANT]
> - **Customer TrxID Edit Removal**: As confirmed, customers will no longer be able to edit or modify TrxIDs after checkout from the Order Confirmation or Tracking modals. All edits and manual payment verifications will be strictly handled by administrators in the Admin Dashboard.
> - **Address Validation Modal Popup**: When clicking "পরবর্তী ধাপ (পেমেন্ট)" in Checkout Step 1, if any required address fields are missing (e.g. invalid phone number, empty detailed address, or missing upazila), a focused modal dialog pops up listing the missing items, with a single tap to focus directly on the missing field.

---

## Proposed Changes

### 1. Admin Dashboard: Dedicated 'পেন্ডিং TrxID রিভিউ' Section
#### `src/components/AdminDashboard.tsx`
- In the **Orders** section:
  - Add a dedicated sub-filter / tab: **"পেন্ডিং পেমেন্ট রিভিউ (bKash/Nagad)"** with a live counter badge showing the number of orders requiring review.
  - Specifically filter for orders where:
    - `paymentMethod` is `'bkash'` or `'nagad'`
    - AND (`paymentStatus !== 'paid'` OR `!transactionId` OR transactionId is flagged)
  - Display review cards / table rows equipped with:
    - **Customer Info**: Name, 11-digit phone number with quick copy/call.
    - **Payment Details**: bKash (10-char TrxID) or Nagad (8-char TrxID), sender phone number, total payable amount.
    - **TrxID Status**: Clearly styled badge (e.g., "১০ অক্ষরের TrxID যুক্ত", "TrxID অনুপস্থিত", "অসম্পূর্ণ TrxID").
    - **Admin One-Click Actions**:
      - **"পেমেন্ট নিশ্চিত করুন (Mark as Paid)"**: Instantly updates order payment status to `'paid'`, adds a timeline entry with admin signature, and logs an audit record.
      - **"TrxID সংশোধন করুন (Admin Edit TrxID)"**: Modal dialog allowing authorized staff to record or correct the TrxID with strict length validation (10 chars for bKash, 8 chars for Nagad).
      - **"বিস্তারিত দেখুন"**: Opens full order modal.

---

### 2. Checkout Flow: Address Validation Modal Popup
#### `src/components/CheckoutFlow.tsx`
- Create an **AddressValidationModal** component:
  - If a customer clicks **"পরবর্তী ধাপ (পেমেন্ট)"** with missing/invalid fields (e.g., 11-digit mobile number incomplete, detailed address empty, or upazila unselected):
    - Prevent step transition.
    - Open an attention-focused modal dialog with an alert icon, clear Bangla bullet points of what needs correction (e.g., "১১ ডিজিটের সঠিক মোবাইল নম্বর দিন", "সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা) লিখুন").
    - Provide a primary button: **"ঠিকানা ঠিক করুন"** that closes the modal and immediately smooth-scrolls and focuses the first invalid input.
    - Eliminates the need to look at distant top alerts or get confused about form status.

---

### 3. Restricting Customer-Side TrxID Editing to Prevent Misuse
#### `src/components/CheckoutFlow.tsx`
- In the `completedOrder` confirmation view:
  - Retain the display of the store's payment number with copy button and the submitted TrxID with copy button.
  - Remove the inline customer edit/modify form for TrxID post-checkout to prevent fraudulent submissions or tampering. Show a clear badge: *"পেমেন্ট তথ্য যাচাইয়ের জন্য অ্যাডমিন প্যানেলে অপেক্ষমাণ"* (Awaiting admin verification).

#### `src/components/OrderTrackingModal.tsx`
- Remove the customer-facing `isEditingPayment` form and edit button.
- Display the verified/submitted TrxID with a copy button, payment status badge, and store contact info if payment verification is needed.

---

### 4. Backend Admin Endpoint
#### `src/server/routes/admin.ts`
- Ensure `PUT /api/admin/orders/:id/status` and a dedicated `PUT /api/admin/orders/:id/payment` allows admins to update TrxID and confirm payment status simultaneously, recording the admin's name and timestamp in `statusTimeline` and the system `AuditLog`.

---

## Verification Plan

### Automated Tests & Type Checking
- Run `lint_applet` (`tsc --noEmit`) to verify zero TypeScript errors.
- Run `compile_applet` to confirm successful Vite production compilation.

### Manual / API Tests via `curl`
1. **Address Validation Modal Test**:
   - In Checkout Step 1, click next with empty address -> Confirm modal popup renders with detailed error breakdown and action button.
2. **Admin MFS Review Tab Test**:
   - Place a test bKash order with TrxID.
   - Open Admin Dashboard -> Orders -> 'পেন্ডিং পেমেন্ট রিভিউ' tab.
   - Confirm the order appears in the review queue with customer phone, TrxID, and quick action buttons.
   - Click "পেমেন্ট নিশ্চিত করুন" -> Verify paymentStatus transitions to `paid` and statusTimeline records the verification.
   - Test Admin TrxID correction with 10-char bKash and 8-char Nagad validators.
3. **Customer Tamper Protection Test**:
   - Track order via `OrderTrackingModal` -> Verify no edit button or input field is present for customers to change the TrxID.
