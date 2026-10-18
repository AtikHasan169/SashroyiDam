# Implementation Plan: Clean Address Form (No Bilingual Clutter) & Professional Cart Flow

Clean, natural address entry for Bangladesh shoppers paired with the professional non-disruptive add-to-cart experience.

---

## 1. Clean Checkout Address Form
- **File**: `src/components/CheckoutFlow.tsx`
- **Dropdown Labels**:
  - `বিভাগ *` (Division)
  - `জেলা *` (District — clean, without any `(4টি জেলা)` or numbers/brackets)
  - `উপজেলা / থানা *` (Upazila / Thana)
- **Dropdown Option Values**:
  - Remove parenthesized English names (e.g. change `খুলনা (Khulna)` ➔ `খুলনা`, `ঢাকা (Dhaka)` ➔ `ঢাকা`).
  - Keep clean, native Bengali names across Divisions, Districts, and Upazilas.

---

## 2. Professional Non-Disruptive Cart Flow
- **File**: `src/context/CartContext.tsx`
  - Remove forced `setIsCartDrawerOpen(true);` inside `addToCart`.
  - Allow shoppers to remain in their browsing flow without the full cart drawer interrupting them.
- **File**: `src/components/ClassyFloatingBar.tsx`
  - Trigger a smooth scale/bounce micro-animation on the floating cart capsule whenever an item is added.
  - Instantly reflect the updated live quantity and total in ৳.
- **File**: `src/components/CartToast.tsx`
  - Ensure the responsive toast displays product image, title, price, and "কার্ট দেখুন" with smooth auto-dismiss.
- **"Buy Now" (অর্ডার করুন)**:
  - Continues to immediately open checkout for 1-click ordering.

---

## 3. Verification & Testing
- Open checkout form: verify dropdowns display clean Bengali names (`ঢাকা`, `খুলনা`, `চট্টগ্রাম`, etc.) without English brackets.
- Verify district label is simply `জেলা *` with no count or brackets.
- Click "কার্টে যোগ করুন" on a product: verify the drawer does not force open; instead, the toast notifies the customer and the floating cart capsule pulses with the new total.
- Click "অর্ডার করুন" (Buy Now): verify checkout opens immediately.
- Run `compile_applet` and `lint_applet` to confirm a clean build.
