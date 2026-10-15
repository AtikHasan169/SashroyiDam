import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus, PaymentStatus, UserRole } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliNumber(input: number | string): string {
  return String(input).replace(/\d/g, (d) => bnDigits[Number(d)]);
}

export function formatBDT(amount: number, useBengaliDigits = true): string {
  const rounded = Math.round(Number(amount) || 0);
  const formatted = rounded.toLocaleString("en-IN");
  return `৳${useBengaliDigits ? toBengaliNumber(formatted) : formatted}`;
}

export function calculateSavingsPercent(
  price: number,
  compareAtPrice?: number | null
): number | null {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) {
    return null;
  }
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export const ORDER_STATUS_LABELS_BN: Record<OrderStatus, string> = {
  pending_confirmation: "অর্ডার কনফার্মেশনের অপেক্ষায়",
  confirmed: "কনফার্ম করা হয়েছে",
  processing: "প্রসেসিং চলছে",
  packed: "প্যাকিং সম্পন্ন",
  shipped: "কুরিয়ারে দেওয়া হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল করা হয়েছে",
  return_requested: "রিটার্ন রিকোয়েস্ট",
  returned: "ফেরত এসেছে",
  refunded: "রিফান্ড সম্পন্ন",
};

export const PAYMENT_STATUS_LABELS_BN: Record<PaymentStatus, string> = {
  unpaid: "অপরিশোধিত (ক্যাশ অন ডেলিভারি/বাকি)",
  pending: "পেমেন্ট যাচাই চলছে",
  paid: "পরিশোধিত",
  failed: "পেমেন্ট ব্যর্থ",
  cancelled: "পেমেন্ট বাতিল",
  refunded: "রিফান্ডকৃত",
};

// Role-Based Access Control Matrix
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ["*"],
  admin: [
    "dashboard.view",
    "products.manage",
    "categories.manage",
    "orders.manage",
    "customers.view",
    "coupons.manage",
    "settings.manage",
    "reviews.moderate",
  ],
  order_manager: ["dashboard.view", "orders.manage", "customers.view"],
  product_manager: ["dashboard.view", "products.manage", "categories.manage"],
  support_agent: ["dashboard.view", "orders.view", "customers.view", "reviews.moderate"],
  customer: [],
};

export function hasPermission(role: UserRole | null | undefined, permission: string): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

export const BD_DIVISIONS: Record<string, string[]> = {
  "ঢাকা (Dhaka)": [
    "ঢাকা (Dhaka)",
    "গাজীপুর (Gazipur)",
    "নারায়ণগঞ্জ (Narayanganj)",
    "টাঙ্গাইল (Tangail)",
    "নরসিংদী (Narsingdi)",
    "মানিকগঞ্জ (Manikganj)",
    "মুন্সিগঞ্জ (Munshiganj)",
    "ফরিদপুর (Faridpur)",
    "কিশোরগঞ্জ (Kishoreganj)",
    "মাদারীপুর (Madaripur)",
    "রাজবাড়ী (Rajbari)",
    "শরীয়তপুর (Shariatpur)",
    "গোপালগঞ্জ (Gopalganj)",
  ],
  "চট্টগ্রাম (Chattogram)": [
    "চট্টগ্রাম (Chattogram)",
    "কুমিল্লা (Cumilla)",
    "ফেনী (Feni)",
    "ব্রাহ্মণবাড়িয়া (Brahmanbaria)",
    "নোয়াখালী (Noakhali)",
    "চাঁদপুর (Chandpur)",
    "লক্ষ্মীপুর (Lakshmipur)",
    "কক্সবাজার (Cox's Bazar)",
    "রাঙ্গামাটি (Rangamati)",
    "বান্দরবান (Bandarban)",
    "খাগড়াছড়ি (Khagrachhari)",
  ],
  "খুলনা (Khulna)": [
    "খুলনা (Khulna)",
    "কুষ্টিয়া (Kushtia)",
    "যশোর (Jashore)",
    "সাতক্ষীরা (Satkhira)",
    "ঝিনাইদহ (Jhenaidah)",
    "বাগেরহাট (Bagerhat)",
    "চুয়াডাঙ্গা (Chuadanga)",
    "মেহেরপুর (Meherpur)",
    "মাগুরা (Magura)",
    "নড়াইল (Narail)",
  ],
  "রাজশাহী (Rajshahi)": [
    "রাজশাহী (Rajshahi)",
    "বগুড়া (Bogura)",
    "পাবনা (Pabna)",
    "সিরাজগঞ্জ (Sirajganj)",
    "নাটোর (Natore)",
    "নওগাঁ (Naogaon)",
    "চাঁপাইনবাবগঞ্জ (Chapainawabganj)",
    "জয়পুরহাট (Joypurhat)",
  ],
  "রংপুর (Rangpur)": [
    "রংপুর (Rangpur)",
    "দিনাজপুর (Dinajpur)",
    "কুড়িগ্রাম (Kurigram)",
    "গাইবান্ধা (Gaibandha)",
    "নীলফামারী (Nilphamari)",
    "পঞ্চগড় (Panchagarh)",
    "ঠাকুরগাঁও (Thakurgaon)",
    "লালমনিরহাট (Lalmonirhat)",
  ],
  "সিলেট (Sylhet)": [
    "সিলেট (Sylhet)",
    "মৌলভীবাজার (Moulvibazar)",
    "হবিগঞ্জ (Habiganj)",
    "সুনামগঞ্জ (Sunamganj)",
  ],
  "বরিশাল (Barishal)": [
    "বরিশাল (Barishal)",
    "পটুয়াখালী (Patuakhali)",
    "ভোলা (Bhola)",
    "পিরোজপুর (Pirojpur)",
    "বরগুনা (Barguna)",
    "ঝালকাঠি (Jhalokati)",
  ],
  "ময়মনসিংহ (Mymensingh)": [
    "ময়মনসিংহ (Mymensingh)",
    "জামালপুর (Jamalpur)",
    "শেরপুর (Sherpur)",
    "নেত্রকোণা (Netrokona)",
  ],
};
