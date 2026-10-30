# Implementation Plan: Right-Edge Vertical Sticky Cart Tab for Desktop

## 1. User Choice & Objective
- **User Selection:** `Right edge vertical sticky cart tab with item count`
- **Objective:** Add a responsive, polished desktop vertical floating cart tab pinned to the right edge of the browser viewport. When clicked, it smoothly opens the Cart Drawer.

---

## 2. Component Design (`src/components/DesktopFloatingCartTab.tsx`)
- **Positioning:**
  - `fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center`
  - Rounded left corners (`rounded-l-2xl`), premium forest green background (`#0F4C3A`), border highlight (`border-l border-t border-b border-emerald-500/50`), and deep elevation shadow (`shadow-[-4px_0_25px_rgba(15,76,58,0.3)]`).
- **Interactive States & Motion:**
  - Subtle slide-out on hover (`hover:-translate-x-1 transition-all duration-200 cursor-pointer`).
  - Gentle pulse highlight when items are newly added to the cart.
- **Content Layout (Vertical Stack):**
  1. **Cart Icon:** Shopping bag with live count bubble.
  2. **Item Count Label:** e.g., `২ টি পণ্য` / `2 Items`.
  3. **Live Price Pill:** e.g., `৳ ১,২৫০` with high-contrast amber/white typography.
- **Visibility:**
  - Visible on tablet/desktop viewports (`md:flex`).
  - Temporarily hidden when `isCartDrawerOpen` is true to prevent visual overlap.
  - Displays when items are present (or with a minimal idle badge).

---

## 3. Integration in `src/App.tsx`
- Import and render `<DesktopFloatingCartTab />` in the root storefront tree alongside existing overlays.
- Seamlessly trigger `setIsCartDrawerOpen(true)` upon click.

---

## 4. Verification Plan
- Verify sticky position on desktop screens while scrolling catalog and product pages.
- Verify real-time count and price updates when adding/removing cart items.
- Ensure proper responsiveness (hidden on mobile, where bottom dock handles cart navigation).
- Run `lint_applet` and `compile_applet`.
