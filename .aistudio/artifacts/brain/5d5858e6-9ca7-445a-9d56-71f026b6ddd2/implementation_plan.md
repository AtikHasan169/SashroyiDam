# Implementation Plan: Product Share Button & Category-Based Automatic SKU Generation

Add a cross-platform **Product Share Button** to both product cards and the product details modal, and implement **Category-Based Automatic SKU Generation** in the admin product management dashboard with manual editing and instant regeneration.

---

## User Specifications & Clarifications

1. **Product Share Button Locations**:
   - **Product Cards** (`ProductCard.tsx`): On both grid and list views (alongside existing wishlist/cart quick actions).
   - **Product Details Modal** (`ProductDetailModal.tsx`): Prominent share button in the modal header/action group.
   - **Share Capabilities**:
     - Native Web Share API (`navigator.share`) on mobile devices and modern desktop browsers for seamless sharing.
     - Fallback / quick-action popover with:
       - **Copy Link (লিংক কপি করুন)**: One-click clipboard copy with instant toast confirmation.
       - **WhatsApp**: Direct message share with product title, price, and link (`https://api.whatsapp.com/send?text=...`).
       - **Facebook**: Share dialog link (`https://www.facebook.com/sharer/sharer.php?u=...`).
       - **Telegram / Email**: Quick copy/share options.

2. **Category-Based SKU Generation**:
   - **Format**: 3-letter category prefix followed by a hyphen and a 4-digit unique random number (e.g. `KIT-4821`, `ELE-9204`, `MEN-3015`, `HOM-7812`).
   - **Category Mapping Logic**:
     - Extract clean uppercase 3-letter code from the category `slug` or English name (e.g. `kitchen-dining` -> `KIT`, `electronics` -> `ELE`, `fashion-clothing` -> `FAS`, `health-beauty` -> `BEA` or `HEA`, `organic-groceries` -> `GRO`, `home-living` -> `HOM`).
     - Fallback for custom or unrecognized categories: first 3 valid ASCII alphanumeric characters from the name or slug, uppercase.
   - **Admin Product Editor Behavior**:
     - When an admin selects or changes the Category dropdown in the Add/Edit Product modal, automatically generate a new SKU if the field is empty or if creating a new product.
     - Keep the field fully editable for custom SKUs.
     - Add an interactive **"Generate New SKU" (রিফ্রেশ / নতুন কোড)** button with a refresh icon directly next to the SKU input field so admins can generate a new one with a single tap anytime.
     - For variant management: Ensure child variants inherit the base SKU with unique variant suffixes (e.g., `KIT-4821-RED-XL` or `KIT-4821-V1`).

---

## Proposed Changes

### 1. SKU Generation Utility (`src/utils/skuGenerator.ts`)
- Create a dedicated utility `generateCategorySku(category?: Category | string, existingProducts?: Product[])`:
  - Determine 3-character uppercase prefix based on category slug/name mapping.
  - Generate a 4-digit random number (1000–9999).
  - Verify uniqueness against existing product SKUs (regenerate digits if duplicate found).
  - Also provide variant SKU generator helper: `generateVariantSku(baseSku: string, variantKey: string)`.

### 2. Share Component & Functionality (`src/components/ProductShareButton.tsx`)
- Create a reusable, lightweight `ProductShareButton` component:
  - Props: `product: Product`, `variant?: 'card' | 'modal' | 'icon'`, `className?: string`.
  - Feature detection for `navigator.share`:
    - On mobile/supported browsers: Triggers native share sheet with `title: product.nameEn || product.nameBn`, `text: Check out this product on [Store]`, and canonical product URL.
    - Floating popover dropdown for instant sharing options:
      - Copy link with feedback toast (`লিংক কপি হয়েছে!`).
      - WhatsApp Share (`wa.me/?text=...`).
      - Facebook Share (`facebook.com/sharer...`).
  - Event propagation stopping (`e.stopPropagation()`) so clicking share on product cards does not inadvertently open the product details modal.

### 3. Integrate Share Button into Storefront
- **`src/components/ProductCard.tsx`**:
  - Add `ProductShareButton` to the card action overlay / top-right icon buttons (next to wishlist heart icon) with clear tooltip.
  - Also render smoothly on list view cards.
- **`src/components/ProductDetailModal.tsx`**:
  - Place `ProductShareButton` in the modal top action row or next to the wishlist and product code display for high visibility.

### 4. Admin Product Modal SKU Auto-Creation (`src/components/admin/AdminDashboard.tsx`)
- In the Add/Edit Product Modal:
  - Import `generateCategorySku`.
  - In `handleCategoryChange`: When category is selected or changed:
    - If it's a new product or the SKU is empty or matches previous auto-generated format, automatically generate and update `currentProduct.sku`.
  - Beside the "SKU / প্রোডাক্ট কোড" input field:
    - Add a sleek "Generate / Refresh" (`রিফ্রেশ`) button with a reload icon.
    - On click, generate a new SKU matching the currently selected category with an animated spin.
  - Update variant creation logic so generated variants automatically receive format-aligned SKUs (e.g. `${baseSku}-S`, `${baseSku}-M`).

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to verify TypeScript typing and bundle integrity across all touched files.

### Manual / Device Verification
1. **Product Share Verification**:
   - Navigate to the storefront.
   - Hover / view a product card; click the Share button.
   - Test "লিংক কপি করুন" and verify the clipboard has the product URL + toast notification appears.
   - Click WhatsApp share and verify it opens WhatsApp with the product name and URL formatted.
   - Open Product Details Modal; click the Share button inside the modal and verify all share actions function smoothly.
2. **Category SKU Auto-Generation Verification**:
   - Go to Admin Panel → Products → Click "নতুন প্রোডাক্ট যোগ করুন" (Add New Product).
   - Select a category (e.g., Electronics, Kitchen, Fashion).
   - Verify the SKU input automatically populates with a 3-letter prefix + 4-digit code (e.g. `ELE-4892`).
   - Click the "রিফ্রেশ" (regenerate) icon button next to the SKU input; verify a new unique 4-digit code is generated under the same category prefix.
   - Switch category to another (e.g., Kitchen); verify prefix changes to `KIT-xxxx`.
   - Manually edit the SKU to confirm custom text can still be entered without interruption.
   - Save the product and verify the SKU is saved and displayed in the product list table.
