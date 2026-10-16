# Clean Hamburger Navigation, Product Tap Quick-Action Sheet, Frictionless Add to Cart & Bilingual BN/EN Support

A targeted storefront upgrade removing login clutter from the 3-line hamburger menu, introducing a quick-action bottom sheet upon tapping products (with Add to Cart, Buy Now, and View Details), providing smooth instant Add to Cart feedback with a floating toast, and implementing full Bangla (BN) / English (EN) bilingual localization across the store.

---

### User Review & Critical Decisions

- **Confirmed Decision 1 (Streamlined 3-Line Hamburger Drawer)**:
  - Remove the prominent login promotional block and unnecessary login forms from the hamburger drawer.
  - The drawer now opens with a clean brand title and focused categories directory:
    - Clean brand header: সাশ্রয়ী দাম (Sashroyi Daam) with close button.
    - Category list with icons, subcategories, and hot deals shortcut.
    - Quick actions: Order Tracking (অর্ডার ট্র্যাক) and Customer Helpline (`০৯৬১২-৮৮৯৯০০`).
    - Bilingual toggle switch (বাংলা ⇄ English).
- **Confirmed Decision 2 (Product Tap Quick-Action Bottom Sheet)**:
  - When tapping any product card on the storefront, a sleek bottom sheet / floating sheet (`ProductQuickActionSheet.tsx`) appears:
    - Product thumbnail, title (in active language), live price, and savings badge.
    - Variant selector (if sizes/colors exist) with live price adjustment.
    - Action buttons:
      - **Add to Cart (ব্যাগে যোগ করুন)**: Instantly adds item with feedback.
      - **Buy Now (এখনই কিনুন)**: Triggers instant 1-click checkout with Cash on Delivery.
      - **View Full Page (সম্পূর্ণ বিবরণ দেখুন →)**: Navigates to the full dedicated product page.
- **Confirmed Decision 3 (User-Friendly Add to Cart Experience)**:
  - When adding to cart, an instant floating toast notification (`CartToast.tsx`) appears with an animated checkmark, the product name, and a "ব্যাগ দেখুন (View Bag)" button.
  - Prevents jarring full-screen interruptions while providing clear, satisfying visual confirmation.
- **Confirmed Decision 4 (Bilingual BN / EN Localization System)**:
  - Create `src/context/LanguageContext.tsx` with toggle function and persistent preference in `localStorage`.
  - Language toggle switches placed in:
    - **Header Announcement / Top Bar**: Clean pill switch `[বাংলা | EN]`.
    - **Hamburger Drawer**: Dedicated language toggle row.
  - Localized bilingual dictionary covering:
    - Header navigation, search placeholder, banner headlines.
    - Category names (`nameBn` / `nameEn`), product titles (`titleBn` / `titleEn`).
    - Action buttons (Add to Cart, Buy Now, Checkout, Order Tracking, Customer Care).
    - Cart drawer labels, price savings indicators, and trust guarantees.

---

### 1. Proposed Implementation Steps

1. **`src/context/LanguageContext.tsx`**:
   - Manages `language: 'bn' | 'en'`, `setLanguage`, and a comprehensive translation dictionary `t(key)`.
2. **`src/components/LeftHamburgerDrawer.tsx`**:
   - Clean up drawer header: remove the login promo box, add language toggle, keep categories, deals, order tracking, and hotline.
3. **`src/components/ProductQuickActionSheet.tsx`**:
   - Interactive bottom sheet prompted on product card tap offering "Add to Cart", "Buy Now", and "View Full Details".
4. **`src/components/CartToast.tsx`**:
   - Non-intrusive floating confirmation notification with product image, title, and quick "View Bag" trigger.
5. **`src/components/Header.tsx` & `src/components/ProductCard.tsx`**:
   - Add language switch pill to Header top bar and pass translation strings.
   - Update ProductCard tap event to trigger the Quick Action Sheet.
6. **`src/components/CartDrawer.tsx` & `src/components/ProductPage.tsx`**:
   - Translate all dynamic labels according to selected language (`bn` or `en`).

---

### 2. Verification Plan

- Run `lint_applet` and `compile_applet` to confirm zero TypeScript compilation errors.
- Verify product card tap brings up the quick action sheet with Add to Cart and Buy Now options, plus full page link.
- Verify Add to Cart triggers the smooth floating toast without disrupting browsing.
- Verify language switch between বাংলা (BN) and English (EN) instantly translates navigation, product titles, cart strings, and badges.
- Verify the 3-line hamburger drawer is clean without unnecessary login clutter.
