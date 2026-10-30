# Implementation Plan: Convert Parenthetical Lines to Clean Full English

## 1. User Requirement
"I said () full line will be in English"
Convert every line that currently has parenthetical text `()` into a clean, standalone full line in English, without parentheses or mixed language.

---

## 2. Changes in `src/components/Footer.tsx`

### A. Customer Service Links (`গ্রাহক সেবা` column)
- **Current:**
  - `অর্ডার ট্র্যাক করুন (Track Order)`
  - `ডেলিভারি নীতিমালা (Delivery Policy)`
  - `রিটার্ন ও রিপ্লেসমেন্ট (Replacement)`
  - `সাধারণ জিজ্ঞাসা (FAQ)`
  - `যোগাযোগ ও সাপোর্ট (Support)`
- **Change to Full English:**
  - `Track Order`
  - `Delivery Policy`
  - `Return & Replacement`
  - `FAQ`
  - `Contact & Support`

### B. Company & Policy Links (`ব্র্যান্ড ও শর্তাবলী` column)
- **Current:**
  - `আমাদের সম্পর্কে (About Us)`
  - `গোপনীয়তা নীতিমালা (Privacy)`
  - `ব্যবহারের শর্তাবলী (Terms)`
- **Change to Full English:**
  - `About Us`
  - `Privacy Policy`
  - `Terms & Conditions`

### C. Policy Modal Titles
- Update popup modal header titles from `Title (English)` to clean English:
  - `About Us`
  - `Contact & Support`
  - `Delivery Policy`
  - `Return & Replacement`
  - `FAQ`
  - `Privacy Policy`
  - `Terms & Conditions`

### D. Elements Remaining in Authentic Bangla
- Brand description and tagline in the first column.
- Helpline, hours, and contact details.
- Column headers (`গ্রাহক সেবা`, `ব্র্যান্ড ও শর্তাবলী`).
- Payment method line: `পেমেন্ট মাধ্যম: ক্যাশ অন ডেলিভারি · বিকাশ · নগদ`.
- Bottom strip location and copyright.

---

## 3. Verification Plan
- Verify no parentheses `()` remain in the footer links.
- Verify each link clearly displays in full English.
- Verify policy modals open properly with English titles.
- Run `lint_applet` and `compile_applet`.
