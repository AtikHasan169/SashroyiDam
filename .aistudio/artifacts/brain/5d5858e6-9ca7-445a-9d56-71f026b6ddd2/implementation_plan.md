# Unified Address Language & Admin Manual Order Cascading Dropdowns

Standardize customer profile address selectors to dynamically match the active site language (Bangla or English), and equip Admin Manual Orders with full cascading Division, District, and Upazila dropdowns for seamless order management across all 64 districts.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed with the user via clarifying questions:

- **Profile Address Language**: Address dropdown options will dynamically display in the active language selected by the user (`Bangla` when Bengali is active, `English` when English is active), replacing static bilingual labels (`ঢাকা (Dhaka)`).
- **Admin Manual Order Address Selection**: The manual order modal in the Admin Dashboard will feature full cascading Division $\rightarrow$ District $\rightarrow$ Upazila dropdowns with automatic delivery fee assignment (70 BDT inside Dhaka, 130 BDT outside Dhaka, free over 2,000 BDT) and support for manual thana typing.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Dynamic Language Presentation**: Cleans up address dropdowns in `ProfilePage.tsx` and `AccountModal.tsx` so district and division names display in the current active UI language rather than cumbersome dual-language strings.
  2. **Admin Cascading Address Picker**: Upgrades `src/components/admin/ManualOrderModal.tsx` from an unvalidated text input for upazilas and duplicate hardcoded districts to an intelligent cascading selector powered by `src/data/bangladeshGeo.ts`.
- **Target Persona**: Store managers taking phone/social media orders in the admin dashboard, and registered customers editing saved delivery addresses in their profile.
- **Key Value**: Eliminates administrative ordering errors, prevents delivery dispatch delays, and maintains clean, consistent typography across storefront and backoffice interfaces.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[Admin Manual Order Flow]
1. Admin opens "ম্যানুয়াল অর্ডার তৈরি করুন" in Dashboard
   │
2. Division Selector: Dhaka / Chattogram / Rajshahi / Khulna / ... (Auto-filters Districts)
   │
3. District Selector: Populated with canonical districts of selected division
   │                  └─ Auto updates Delivery Fee: Dhaka (৳70), Outside Dhaka (৳130)
   │
4. Upazila / Thana Selector: Lists all canonical upazilas + "অন্যান্য (ম্যানুয়ালি লিখুন)"
   │                         └─ If "অন্যান্য", renders inline text field for custom thana
   │
5. Submit: Order saved with precise division, district, and upazila tags
```

### Visual Styling & Tone
- **Profile Forms**: Clean single-language typography matching site mode (`ঢাকা` in Bangla mode, `Dhaka` in English mode).
- **Admin Manual Order Modal**: Balanced 3-column cascading grid (`বিভাগ`, `জেলা`, `উপজেলা / থানা`) styled with Tailwind UI standards, emerald focus borders (`focus:border-[#0F4C3A]`), and subtle hint text for custom thanas.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Active Language Mapping vs Static Dual Labels**
  - *Chosen Approach*: Inspect `useLanguage().language` and render `language === 'en' ? dist.nameEn : dist.nameBn`. When saving, preserve standard Bengali names for database consistency and courier integration while rendering localized labels to the user.
  - *Why*: Reduces visual clutter and respects the user's explicit language preference.
- **Decision 2: Reusing `bangladeshGeo.ts` in Admin Dashboard**
  - *Chosen Approach*: Replace ad-hoc array mappings in `ManualOrderModal.tsx` with canonical `BANGLADESH_DIVISIONS` and `getUpazilasForDistrict()` helpers.
  - *Why*: Guarantees 100% parity between storefront customer checkouts and admin phone/WhatsApp orders.

---

## 4. Technical Architecture & Component Mapping

```
┌─────────────────────────────────────────────────────────────┐
│                   bangladeshGeo.ts                         │
│  (64 Districts, Canonical Upazilas, Normalization Helpers)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌───────────────────────────────┐  ┌───────────────────────────────┐
│         Storefront UI         │  │           Admin UI            │
│  - CheckoutFlow.tsx           │  │  - ManualOrderModal.tsx       │
│  - ProfilePage.tsx            │  │     * Cascading Div/Dist/Upz  │
│  - AccountModal.tsx           │  │     * Auto Delivery Fee       │
│    * Dynamic single-lang label│  │     * Custom Thana Fallback   │
└───────────────────────────────┘  └───────────────────────────────┘
```

### Component Changes
1. **`src/components/ProfilePage.tsx`**:
   - Update division and district `<option>` labels to render `language === 'en' ? div.nameEn : div.nameBn` and `dist.nameEn : dist.nameBn`.
2. **`src/components/AccountModal.tsx`**:
   - Ensure district and division options respect active language and clean presentation.
3. **`src/components/admin/ManualOrderModal.tsx`**:
   - Import `BANGLADESH_DIVISIONS`, `getUpazilasForDistrict`, `CUSTOM_UPAZILA_OPTION_BN`, and `CUSTOM_UPAZILA_OPTION_EN`.
   - Add state: `selectedDivision`, `customUpazilaText`, `isCustomUpazila`.
   - Render 3-column cascading dropdowns: Division $\rightarrow$ District $\rightarrow$ Upazila/Thana.
   - Automatically sync `deliveryFee` based on selected district (Dhaka: ৳70, Outside: ৳130).
   - Resolve `finalUpazila` upon submission to ensure clean order creation.

---

## 5. Verification Plan
- Build check: `compile_applet` & `lint_applet` passing with 0 errors.
- Verify Profile address form toggles correctly between English and Bengali when site language changes.
- Verify Admin Manual Order modal allows selecting all 64 districts and their upazilas, with working custom thana input and automatic delivery fee calculation.
