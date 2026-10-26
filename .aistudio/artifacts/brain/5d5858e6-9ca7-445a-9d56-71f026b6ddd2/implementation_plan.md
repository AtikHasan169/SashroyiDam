# Implementation Plan - Admin Panel Save Confirmation Toast System

Build a dedicated, high-visibility floating toast notification system in the Admin Panel that stays visible across all tabs and modals, showing specific saved item names, a green checkmark icon, smooth entry animations, and auto-dismissal.

## User Review Summary
- **Style**: Floating toast popup at top-right with icon and animation.
- **Details**: Specific saved item name (e.g., product title, category name, settings) with green checkmark and auto-dismiss.

---

## Proposed Changes

### 1. Floating Toast Component & State in `src/components/admin/AdminDashboard.tsx`
- **Toast State Architecture**:
  - Replace the top banner with an animated floating toast stack anchored at `fixed top-5 right-5 z-[9999]`.
  - State interface:
    ```ts
    interface AdminToast {
      id: string;
      type: 'success' | 'error' | 'info';
      title: string;
      message: string;
      duration?: number;
    }
    ```
- **Visual & Interactive Design**:
  - Glassmorphic card design: `bg-white/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl rounded-2xl p-4 max-w-sm`.
  - Vibrant circular icon: animated green checkmark with a subtle halo for success, rose alert icon for errors.
  - Micro-animated progress bar at the bottom showing remaining time until auto-dismiss.
  - Manual dismiss "✕" button.

### 2. Connect All Admin Save & Update Handlers
- **Store Settings (`handleSaveSettings`)**:
  - Show toast: *"স্টোর সেটিংস সংরক্ষিত"* with message: *"হেল্পলাইন, সোশ্যাল লিংক ও ডেলিভারি সেটিংস সফলভাবে আপডেট ও প্রকাশিত হয়েছে।"*
- **Product Create & Edit (`handleSaveProduct`)**:
  - Show toast: *"পণ্য সংরক্ষিত"* with message: *`"${cleanTitle}" পণ্যটি সফলভাবে আপডেট করা হয়েছে`* or *`"${cleanTitle}" নতুন পণ্য হিসেবে তালিকায় যুক্ত হয়েছে`*.
- **Category Create & Edit (`handleSaveCategory`)**:
  - Show toast: *"ক্যাটাগরি সংরক্ষিত"* with message: *`"${catName}" ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে`*.
- **Order Status Update (`handleUpdateOrderStatus`)**:
  - Show toast: *"অর্ডার আপডেট"* with message: *`অর্ডার #${orderNumber}-এর স্ট্যাটাস পরিবর্তন করা হয়েছে`*.
- **Coupon Operations (`handleSaveCoupon`, `handleDeleteCoupon`)**:
  - Show specific coupon code in the confirmation toast.
- **Manual Order Creation**:
  - Show newly created order number with direct confirmation.

---

## Verification Plan

### Automated Verification
- Run `npm run lint` / `lint_applet` to ensure TypeScript types and imports compile cleanly.
- Run `compile_applet` to confirm Vite build succeeds.

### Manual / Browser Verification
- Open Admin Panel → Settings → Click "সংরক্ষণ করুন". Verify top-right floating toast appears with green checkmark, correct message, and smoothly auto-dismisses.
- Open Admin Panel → Products → Edit a product → Click Save. Verify the toast appears above the modal or immediately after closing with the exact product title.
- Open Admin Panel → Categories → Create or edit a category. Verify toast confirmation.
- Change order status in Orders tab. Verify immediate toast feedback.
