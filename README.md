# Oshesh (অশেষ) — Complete Bangladesh E-Commerce & Secure Admin Platform

“আপনার পছন্দ, অশেষ সম্ভাবনা।”

Oshesh is a production-oriented e-commerce platform built for the Bangladeshi retail market. It features authentic Bengali typography, responsive mobile-first shopping flows, concurrency-safe inventory and order processing, Cash on Delivery (COD) and SSLCOMMERZ payment integrations, and a role-based admin dashboard.

---

## 1. Quick Start & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start full-stack development server
npm run dev
```
The application will be live at `http://localhost:3000`.

---

## 2. Super Admin & Staff Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@oshesh.com.bd` | `OsheshAdmin2026!` | Universal Control (Metrics, Orders, Catalog, Coupons, Settings, Audit Logs) |
| **Order Manager** | `orders@oshesh.com.bd` | `OsheshStaff2026!` | Order Processing, Status Transitions, Internal Notes, Packing Slips |
| **Demo Customer** | `customer@oshesh.com.bd` | `OsheshUser2026!` | Storefront browsing, Cart, Order History, Saved Addresses |

To access the admin dashboard:
1. Click **অ্যাডমিন প্যানেল** in the top announcement bar or navigate to the admin section.
2. Enter the Super Admin credentials.

---

## 3. Key Architecture & Features

### A. Storefront & Catalog
- **Bangla Typography**: Powered by *Hind Siliguri* with fallback to *Noto Sans Bengali* and *Plus Jakarta Sans*.
- **Categories**:
  - রান্নাঘর ও গৃহস্থালি (Home & Kitchen Essentials)
  - ফ্যাশন ও কারুকাজ (Traditional Handloom & Cotton Panjabi)
  - গ্যাজেট ও ইলেকট্রনিক্স (Durable Tech, Power Banks & Cables)
  - ব্যক্তিগত যত্ন ও সুস্থতা (Personal Care & Wellness)
- **Product Variants**: Size (M, L, XL), color, and bundle options with dynamic stock and pricing adjustments.
- **Ratings & Reviews**: Real customer review submission with 1-5 star ratings.

### B. Cart & Checkout (Bangladesh Context)
- **Server-Authoritative Pricing**: Subtotals, coupon discounts, and delivery fees are strictly computed on the server.
- **Geographic Hierarchy**: Native cascading Division $\to$ District $\to$ Upazila / Thana selector covering all 64 districts.
- **Shipping Rates**:
  - Dhaka City Metro: ৳70 (1–2 days delivery)
  - Outside Dhaka (Nationwide): ৳130 (2–4 days delivery)
  - Free delivery threshold: Orders of ৳2,000 or more receive free delivery nationwide.
- **Active Coupon Codes**:
  - `WELCOME50`: ৳50 flat discount on orders over ৳500.
  - `OSHESH10`: 10% discount on orders over ৳1,200 (capped at ৳400).

### C. Payment Integration
- **Cash on Delivery (COD)**: Available nationwide. Order placed with `pending_confirmation` and `unpaid` status. Marked `paid` upon verified delivery.
- **SSLCOMMERZ Hosted Checkout**:
  - Secure server-to-server initiation (`/api/payment/sslcommerz/init`).
  - Validation API (`/api/payment/sslcommerz/validate`) ensuring transaction reference, amount, and order ID match.
  - Idempotent callback and IPN handler.
  - Sandbox simulation enabled by default.

### D. Secure Admin Dashboard
- **Live Metrics**: Orders Today, Gross Sales, Collected Payments, Pending Orders, Low-Stock items.
- **Order Management**: Status transitions (`pending_confirmation` $\to$ `confirmed` $\to$ `processing` $\to$ `packed` $\to$ `shipped` $\to$ `delivered`), automatic inventory restoration on cancellation/return, printable packing slips/invoices.
- **Product CRUD**: Edit prices, stocks, descriptions, and variants; safely archive items without breaking historical orders; export catalog as UTF-8 CSV.
- **Settings & Audit Logs**: Manage delivery thresholds, emergency notices, and inspect chronological administrative actions.

---

## 4. Production Build & Deployment

```bash
# Build client bundle
npm run build

# Start production server
npm start
```
