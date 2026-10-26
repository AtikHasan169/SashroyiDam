# Implementation Plan - Support Hours Formatting (Next Line Break)

Move the store support hours `(প্রতিদিন সকাল ৯টা - রাত ১০টা)` to a clean dedicated line beneath the customer care helpline across the Storefront Footer, Contact Modal, and Support Card.

## Proposed Changes

### 1. Storefront Footer (`src/components/Footer.tsx`)
- **Helpline Section (Footer Main)**:
  - Separate `হেল্পলাইন: 01700-000000` from the timing text.
  - Render `({settings.supportHoursBn})` on the following line with subtle, clean font hierarchy (`text-[11px] text-stone-400 mt-0.5 font-normal`), avoiding clutter or awkward wrapping on narrow screens.
- **Contact & Support Policy Modal**:
  - Update the helpline row in the modal so `(প্রতিদিন সকাল ৯টা - রাত ১০টা)` sits neatly on a new line below `📞 হেল্পলাইন: {settings.phone}`.

### 2. Floating Support Card (`src/components/ClassyFloatingBar.tsx`)
- Add `supportHoursBn?: string;` to `ClassyFloatingBarProps`.
- In the hotline call row inside the Support Card popover, display `({supportHoursBn})` directly on a new line below the phone number in subtle muted typography (`text-[10px] text-stone-500 font-normal`).
- In `src/App.tsx`, pass `supportHoursBn={storeInfo?.settings?.supportHoursBn || 'প্রতিদিন সকাল ৯টা - রাত ১০টা'}` to `<ClassyFloatingBar />`.

---

## Verification Plan

### Automated Verification
- Run `npm run lint` / `lint_applet` to verify TypeScript typing and imports.
- Run `compile_applet` to verify error-free Vite compilation.

### Visual & Functional Check
- Verify that the footer displays the phone number cleanly with `(প্রতিদিন সকাল ৯টা - রাত ১০টা)` positioned directly on the next line.
- Verify that opening the "যোগাযোগ ও সাপোর্ট" modal displays the timing on a new line.
- Verify that opening the floating "সহায়তা" button displays the hotline phone number with the timing beneath it on its own line.
