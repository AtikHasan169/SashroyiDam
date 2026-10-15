import { z } from "zod";

// Valid Bangladeshi mobile number: 013-019 followed by 8 digits (optional +88 or 88 prefix)
export const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

export const normalizeBdPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) {
    return digits.slice(2);
  }
  return digits;
};

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন")
    .max(100, "নাম অত্যন্ত বড়"),
  customerPhone: z
    .string()
    .trim()
    .regex(bdPhoneRegex, "সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)"),
  customerEmail: z
    .string()
    .trim()
    .email("সঠিক ইমেইল এড্রেস দিন")
    .optional()
    .or(z.literal("")),
  division: z.string().min(1, "বিভাগ নির্বাচন করুন"),
  district: z.string().min(1, "জেলা নির্বাচন করুন"),
  upazila: z
    .string()
    .trim()
    .min(2, "উপজেলা বা থানার নাম লিখুন")
    .max(80),
  areaLocality: z
    .string()
    .trim()
    .min(2, "এলাকা বা মহল্লার নাম লিখুন")
    .max(120),
  fullAddress: z
    .string()
    .trim()
    .min(6, "বাসা/রোড বা বিস্তারিত ঠিকানা লিখুন")
    .max(400),
  deliveryInstructions: z.string().max(300).optional().or(z.literal("")),
  shippingZoneKey: z.enum(["inside_dhaka", "dhaka_suburbs", "outside_dhaka"], {
    required_error: "ডেলিভারি এরিয়া নির্বাচন করুন",
  }),
  paymentMethod: z.enum(["cod", "sslcommerz"], {
    required_error: "পেমেন্ট পদ্ধতি নির্বাচন করুন",
  }),
  couponCode: z.string().trim().max(32).optional().or(z.literal("")),
  confirmOrder: z.literal(true, {
    errorMap: () => ({ message: "অর্ডার নিশ্চিত করতে টিক চিহ্ন দিন" }),
  }),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const productAdminSchema = z.object({
  title_bn: z.string().trim().min(2, "বাংলা শিরোনাম আবশ্যক"),
  title_en: z.string().trim().min(2, "ইংরেজি শিরোনাম আবশ্যক"),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন হতে পারে"),
  description_bn: z.string().trim().min(10, "পণ্যের বিস্তারিত বিবরণ লিখুন"),
  description_en: z.string().optional().or(z.literal("")),
  category_id: z.string().uuid("ক্যাটাগরি নির্বাচন করুন").nullable(),
  brand: z.string().trim().optional().or(z.literal("")),
  sku: z.string().trim().min(2, "SKU আবশ্যক"),
  price_bdt: z.coerce.number().min(1, "সঠিক মূল্য দিন"),
  compare_at_price_bdt: z.coerce.number().optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0, "স্টক ০ বা তার বেশি হতে হবে"),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  track_inventory: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  image_url: z.string().url("সঠিক ইমেজ URL দিন").optional().or(z.literal("")),
});
