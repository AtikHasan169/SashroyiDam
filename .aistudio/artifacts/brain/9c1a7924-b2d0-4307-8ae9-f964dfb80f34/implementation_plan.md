# Dedicated Profile Page, Refined Mobile 2-Column Grid & Balanced Catalog Header

A dedicated, full-screen User Profile Page with side-navigation for personal information, order history, saved delivery addresses, and security, alongside a refined mobile 2-column product grid with 1:1 image ratios and a balanced catalog header keeping stock & pick on one side and the grid/list switcher on the other without mobile wrapping.

## User Review & Critical Decisions

> [!IMPORTANT]
> All primary architectural and design directions have been confirmed with your feedback in Phase 1:

- **Confirmed Decision 1: Dedicated Profile Page**: Instead of a popup modal, the profile experience is promoted to a full application page (`ProfilePage`) with desktop sidebar navigation and responsive mobile tabs. It includes Personal Info (`ব্যক্তিগত তথ্য`), Order History & Tracking (`আমার অর্ডারসমূহ`), Saved Addresses (`সংরক্ষিত ঠিকানা`), Password & Security (`নিরাপত্তা ও পাসওয়ার্ড`), Account Preferences (`পছন্দসমূহ`), and direct Admin Panel access for administrator roles.
- **Confirmed Decision 2: Refined 2-Column Mobile Product Grid**: Mobile cards adopt an optimal `1:1` (square) image aspect ratio with balanced padding (`p-2.5 sm:p-4`), balanced Bangla/English typography, and clean action buttons that prevent horizontal squishing or awkward wrapping.
- **Confirmed Decision 3: Balanced Catalog Header (Stock & Pick vs Grid Switcher)**: The catalog header is restructured into a two-sided flex container: "Stock & Pick" (In-Stock filter and Sort dropdown) sits cleanly on one side, and the Grid/List view switcher is pinned on the opposite side. On mobile screens, compact padding and `shrink-0` prevent the grid switcher from breaking onto an orphaned next line.
- **Environment Resilience**: Re-create `.env` and verify fallback credentials so super admin access remains instant and reliable.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Provides a dedicated user account experience where customers can manage their profile details (name, phone, email, avatar), inspect past order statuses with live tracking timelines, manage multi-location delivery addresses, update their credentials, and switch seamlessly back to browsing.
  - Fixes mobile product catalog ergonomics: cards look crisp, proportional, and clean in a 2-column mobile layout with no overflow.
  - Fixes control bar wrapping: the In-Stock toggle and Sort dropdown are grouped together on the left, and the Grid vs List view toggle is placed on the opposite right side, remaining on the same row on mobile devices.
- **Target Audience / Persona**: Bangladeshi shoppers and store administrators using mobile phones and desktop computers who require an intuitive account hub and a clutter-free shopping catalog.
- **Key Value**: Eliminates cramped modal views, elevates profile usability, and delivers a professional mobile shopping experience aligned with modern e-commerce standards.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Navigating to Profile**:
   - The user clicks "প্রোফাইল / লগইন" in the Header, the bottom floating dock "অ্যাকাউন্ট", or the hamburger drawer "প্রোফাইল".
   - The app transitions to the full-page `ProfilePage` with a clear "কেনাকাটায় ফিরে যান" (Return to Shopping) button and URL deep-linking support (`?view=profile`).
   - If not authenticated, the page presents a clean, centered sign-in / registration card.
   - If authenticated, the page renders the full profile dashboard with customer tier, registration date, and tabbed sections.

2. **Personal Information & Profile Management**:
   - **Personal Info Tab (`ব্যক্তিগত তথ্য`)**: View and edit full name, phone number, and email. Instant feedback with success toasts upon saving.
   - **Order History Tab (`আমার অর্ডারসমূহ`)**: Cards with order ID, date, status pills (Pending, Confirmed, Shipped, Delivered), order items, and delivery address. Includes one-click tracking modal trigger.
   - **Saved Addresses Tab (`সংরক্ষিত ঠিকানা`)**: Add, edit, or delete shipping destinations (Name, Phone, City/District, Street address, Label: Home/Office).
   - **Security Tab (`নিরাপত্তা ও পাসওয়ার্ড`)**: Update account password with confirmation.
   - **Admin Panel Shortcut**: Visible only for admin/super_admin accounts, navigating directly to the Admin Dashboard.

3. **Catalog Header Ergonomics**:
   - Left side: "In-Stock Only" toggle and "Sort By" dropdown ("Featured Picks", "Best Selling", "Price").
   - Right side: Grid vs List view mode switcher with active highlight (`#0F4C3A`).
   - On mobile screens ($<640\text{px}$): Compact sizing (`text-[11px]`, compact padding, `shrink-0`) ensures all controls sit neatly in one row without dropping the grid icon to a secondary line.

4. **Refined 2-Column Mobile Grid**:
   - Product image: `aspect-square` with subtle `rounded-xl` corners and soft background.
   - Content: Category kicker in muted 11px text, product title in 2-line clamp, tabular rating with gold star, and clean price display with strike-through original price.
   - Mobile buttons: Compact thumb-accessible "কার্ট" (Cart) icon button and high-contrast "এখনই কিনুন" (Buy Now) button formatted specifically to never clip in narrow 2-column widths.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|---|---|---|---|
| **Profile Architecture** | Dedicated Full Page (`ProfilePage.tsx`) | The user explicitly requested a full page over a modal for personal info and options. Provides ample space for order tracking and address books. | Expanding the existing `AccountModal.tsx` modal (rejected by user request). |
| **Mobile Grid Aspect Ratio** | `aspect-square` (1:1) with `p-2.5 sm:p-4` | Prevents the vertical squishing and card elongation seen in `aspect-4/3` on narrow mobile screens. Standard in leading e-commerce apps. | Keeping `aspect-4/3` (causes disproportionate card heights). |
| **Catalog Bar Structure** | Dual-cluster flex layout with `justify-between` and `shrink-0` | Keeps "stock and pick" on one side and "grid/list" on the other, while eliminating mobile wrapping. | Wrapping into multi-line chips (created the clumsy orphaned grid button). |
| **Super Admin Environment** | Restored `.env` + resilient fallback logic | Guarantees instant login even if `.env` is temporarily deleted or missing. | Relying solely on `.env` (breaks if file deleted). |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                                App.tsx                                 │
│  State: currentView ('home' | 'product' | 'category' | 'profile' |    │
│                      'admin')                                          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │   Catalog Header Bar   │       │   ProfilePage.tsx      │
       │                        │       │                        │
       │ ┌────────────────────┐ │       │ ┌────────────────────┐ │
       │ │ Side 1: Stock&Pick │ │       │ │ Top Profile Banner │ │
       │ │ [x] In Stock       │ │       │ └────────────────────┘ │
       │ │ [v] Featured Pick  │ │       │ ┌─────────┬──────────┐ │
       │ └────────────────────┘ │       │ │ SideNav │ Active   │ │
       │ ┌────────────────────┐ │       │ │ · Info  │ Tab View │ │
       │ │ Side 2: View Mode  │ │       │ │ · Orders│          │ │
       │ │ [Grid] [List]      │ │       │ │ · Addrs │          │ │
       │ └────────────────────┘ │       │ │ · Secur.│          │ │
       └────────────────────────┘       │ └─────────┴──────────┘ │
                    │                   └────────────────────────┘
                    ▼
       ┌────────────────────────┐
       │   ProductCard.tsx      │
       │   - 1:1 Square Media   │
       │   - p-2.5 sm:p-4 Pad   │
       │   - 2-Col Mobile Safe  │
       └────────────────────────┘
```

### Proposed Source Changes & Deliverables

1. **`src/components/ProfilePage.tsx`** (New Component):
   - Full-page layout with banner, customer information, and responsive tabbed navigation.
   - Tabs: Personal Info (editable name & phone), Order History (cards with tracking trigger), Delivery Addresses (add/delete shipping addresses), Password Security, and Admin shortcut.
   - Clean back button to return to catalog.

2. **`src/App.tsx`**:
   - Support `viewingProfilePage` state or `'profile'` view mode.
   - Update header, dock, and drawer handlers to open the `ProfilePage`.
   - Update catalog header layout: flex container with Stock & Pick on the left and Grid/List view switcher on the right, configured to fit cleanly in one row on mobile without wrapping.
   - Update `CategoryPage.tsx` with the identical clean header layout.

3. **`src/components/ProductCard.tsx`**:
   - Refine 2-column mobile grid view: `aspect-square`, `p-2.5 sm:p-4`, balanced font sizes and line heights.
   - Ensure "Buy Now" and "Add to Cart" buttons fit comfortably on mobile cards without horizontal overflow.

4. **`.env` and `src/server/db.ts`**:
   - Re-populate `.env` with `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.
   - Ensure the server continues to handle authentication seamlessly.

5. **Verification**:
   - Verify TypeScript compilation via `compile_applet` and `lint_applet`.
   - Test login and API endpoints to confirm zero regressions.
