"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, ShieldCheck, Truck, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validations";
import { BD_DIVISIONS, formatBDT, toBengaliNumber } from "@/lib/utils";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getSubtotalBdt());

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingZoneKey: "inside_dhaka",
      paymentMethod: "cod",
      confirmOrder: true as any,
    },
  });

  const selectedDivision = watch("division");
  const selectedZone = watch("shippingZoneKey");

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && mounted) {
      router.push("/cart");
    }
  }, [items, mounted, router]);

  // Dynamic shipping fee calculation
  const shippingFee =
    selectedZone === "inside_dhaka"
      ? 60
      : selectedZone === "dhaka_suburbs"
      ? 90
      : 120;

  const payableTotal = subtotal + shippingFee;

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        ...data,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        idempotencyKey: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে।");
      }

      clearCart();

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        router.push(`/order-success/${result.orderNumber}?token=${result.trackingToken}`);
      }
    } catch (err: any) {
      setServerError(err.message || "দুঃখিত, অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  if (!mounted || items.length === 0) return null;

  return (
    <>
      <Header />

      <main className="container py-8">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            চেকআউট ও অর্ডার কনফার্মেশন (Checkout)
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            সাশ্রয়ী দাম থেকে আপনার অর্ডারটি নিশ্চিত করতে সঠিক ঠিকানা ও তথ্য দিন
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Customer Delivery Address & Payment Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-border space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand" />
                <span>ডেলিভারি ঠিকানা (Delivery Information)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("customerName")}
                    placeholder="যেমন: মো. আতিক হাসান"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    মোবাইল নাম্বার (১১ ডিজিট) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register("customerPhone")}
                    placeholder="যেমন: 01712345678"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.customerPhone.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ইমেইল এড্রেস (ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  {...register("customerEmail")}
                  placeholder="example@gmail.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    বিভাগ (Division) <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("division", {
                      onChange: (e) => {
                        const div = e.target.value;
                        const dists = BD_DIVISIONS[div];
                        if (dists && dists.length > 0) {
                          setValue("district", dists[0]);
                        }
                      },
                    })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-brand"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {Object.keys(BD_DIVISIONS).map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                  {errors.division && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.division.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    জেলা (District) <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("district")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-brand"
                  >
                    <option value="">প্রথমে বিভাগ নির্বাচন করুন</option>
                    {selectedDivision &&
                      BD_DIVISIONS[selectedDivision]?.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                  </select>
                  {errors.district && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.district.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    উপজেলা / থানা <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("upazila")}
                    placeholder="যেমন: কুষ্টিয়া সদর"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand"
                  />
                  {errors.upazila && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.upazila.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    এলাকা / মহল্লা <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("areaLocality")}
                    placeholder="যেমন: মজমপুর গেট"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand"
                  />
                  {errors.areaLocality && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.areaLocality.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বাসা বা হোল্ডিং নাম্বার ও বিস্তারিত ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("fullAddress")}
                  rows={2}
                  placeholder="যেমন: বাসা নং ১২, রোড নং ৩, মেইন রোড..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand"
                />
                {errors.fullAddress && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.fullAddress.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ডেলিভারি সংক্রান্ত বিশেষ নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  {...register("deliveryInstructions")}
                  placeholder="যেমন: বিকেলে কল করবেন..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand"
                />
              </div>
            </div>

            {/* Shipping Zone & Payment Method */}
            <div className="bg-white p-6 rounded-lg border border-border space-y-4">
              <h2 className="text-lg font-bold text-gray-900">ডেলিভারি এরিয়া ও চার্জ</h2>
              <div className="space-y-2">
                {[
                  { key: "inside_dhaka", label: "ঢাকা সিটির ভেতরে (৳৬০)", fee: 60 },
                  { key: "dhaka_suburbs", label: "ঢাকার পার্শ্ববর্তী এলাকা - সাভার, গাজীপুর, নারায়ণগঞ্জ (৳৯০)", fee: 90 },
                  { key: "outside_dhaka", label: "ঢাকার বাইরে সারা বাংলাদেশ কুরিয়ার (৳১২০)", fee: 120 },
                ].map((zone) => (
                  <label
                    key={zone.key}
                    className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedZone === zone.key
                        ? "border-brand bg-brand-light/50 font-bold"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        value={zone.key}
                        {...register("shippingZoneKey")}
                        className="text-brand focus:ring-brand"
                      />
                      <span className="text-sm">{zone.label}</span>
                    </div>
                    <span className="text-sm font-bold text-brand">{formatBDT(zone.fee)}</span>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-3">পেমেন্ট পদ্ধতি (Payment Method)</h2>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-lg border border-brand bg-brand-light/50 cursor-pointer">
                    <input
                      type="radio"
                      value="cod"
                      defaultChecked
                      {...register("paymentMethod")}
                      className="text-brand focus:ring-brand"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">ক্যাশ অন ডেলিভারি (Cash on Delivery)</p>
                      <p className="text-xs text-gray-600">পণ্য হাতে পেয়ে কুরিয়ার প্রতিনিধিকে মূল্য পরিশোধ করুন।</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-200 bg-white cursor-pointer hover:border-gray-300">
                    <input
                      type="radio"
                      value="sslcommerz"
                      {...register("paymentMethod")}
                      className="text-brand focus:ring-brand"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">অনলাইন পেমেন্ট - SSLCOMMERZ (Cards / bKash / Nagad / Rocket)</p>
                      <p className="text-xs text-gray-600">নিরাপদ অনলাইন গেটওয়ের মাধ্যমে কার্ড বা মোবাইল ব্যাংকিং পেমেন্ট।</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("confirmOrder")}
                    className="mt-1 rounded text-brand focus:ring-brand"
                  />
                  <span className="text-xs text-gray-700">
                    আমি সাশ্রয়ী দাম (Sashroyi Daam) এর শর্তাবলী ও নীতিমালা মেনে অর্ডারটি নিশ্চিত করছি। <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.confirmOrder && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.confirmOrder.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg border border-border p-6 space-y-4 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
                অর্ডার বিবরণ ({toBengaliNumber(items.length)}টি পণ্য)
              </h2>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || "none"}`}
                    className="flex items-center justify-between text-sm gap-2 border-b border-gray-100 pb-2.5"
                  >
                    <div className="truncate">
                      <p className="font-semibold text-gray-800 truncate">
                        {item.titleBn}
                      </p>
                      {item.variantNameBn && (
                        <p className="text-xs text-brand">{item.variantNameBn}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        পরিমাণ: {toBengaliNumber(item.quantity)}
                      </p>
                    </div>
                    <span className="font-bold text-brand shrink-0">
                      {formatBDT(item.unitPriceBdt * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল</span>
                  <span className="font-semibold text-gray-900">
                    {formatBDT(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="font-semibold text-brand">
                    {formatBDT(shippingFee)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-base">সর্বমোট প্রদেয়</span>
                <span className="text-2xl font-bold text-brand">
                  {formatBDT(payableTotal)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm text-base"
              >
                {isSubmitting ? (
                  <span>অর্ডার প্রসেস হচ্ছে...</span>
                ) : (
                  <>
                    <span>অর্ডার কনফার্ম করুন</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                <p>যাচাইকৃত মান ও দ্রুত হোম ডেলিভারি</p>
                <p className="font-medium text-brand mt-1">
                  ফেসবুক পেজ: @sashroyidaam
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
