"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight, Tag, Check, AlertCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { formatBDT, toBengaliNumber } from "@/lib/utils";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getSubtotalBdt());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="container py-12 text-center">
          <p className="text-gray-500">কার্ট লোড হচ্ছে...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="container py-16 text-center space-y-4">
          <div className="w-20 h-20 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">আপনার কার্টটি খালি</h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            আপনার পছন্দের পণ্যগুলো কার্টে যোগ করে সাশ্রয়ী দামে কেনাকাটা সম্পন্ন করুন।
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-brand text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-dark transition-colors shadow-sm text-sm"
            >
              <span>পণ্যগুলো দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="container py-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              শপিং কার্ট ({toBengaliNumber(items.length)}টি পণ্য)
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              আপনার নির্বাচিত পণ্যসমূহের তালিকা ও পরিমাণ যাচাই করুন
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-md border border-red-200 transition-colors"
          >
            সব ডিলিট করুন (Clear)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const lineTotal = item.unitPriceBdt * item.quantity;
              return (
                <div
                  key={`${item.productId}-${item.variantId || "none"}`}
                  className="bg-white rounded-lg border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-md bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.titleBn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-brand bg-brand-light p-2 text-center">
                          সাশ্রয়ী দাম
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-bold text-gray-900 text-base hover:text-brand line-clamp-1"
                      >
                        {item.titleBn}
                      </Link>
                      {item.variantNameBn && (
                        <p className="text-xs font-medium text-brand mt-0.5">
                          {item.variantNameBn}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        SKU: {item.sku}
                      </p>
                      <p className="text-sm font-bold text-brand mt-1 sm:hidden">
                        {formatBDT(item.unitPriceBdt)} × {toBengaliNumber(item.quantity)} ={" "}
                        {formatBDT(lineTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controller & Price */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="flex items-center border border-gray-300 rounded-md bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1
                          )
                        }
                        className="px-3 py-1 text-base font-bold text-gray-700 hover:bg-gray-100"
                        aria-label="কমান"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm font-bold min-w-[36px] text-center">
                        {toBengaliNumber(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1
                          )
                        }
                        className="px-3 py-1 text-base font-bold text-gray-700 hover:bg-gray-100"
                        aria-label="বাড়ান"
                      >
                        +
                      </button>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p className="text-base font-bold text-brand">
                        {formatBDT(lineTotal)}
                      </p>
                      <p className="text-xs text-gray-400">
                        ({formatBDT(item.unitPriceBdt)} প্রতি পিস)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      aria-label="পণ্যটি মুছে ফেলুন"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary & Checkout Trigger */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg border border-border p-6 space-y-4 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
                অর্ডার সামারি (Summary)
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল (Subtotal)</span>
                  <span className="font-semibold text-gray-900">
                    {formatBDT(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-xs text-brand font-medium">
                    চেকআউটে নির্ধারিত হবে
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-gray-900">প্রাক্কলিত মোট</span>
                <span className="text-xl font-bold text-brand">
                  {formatBDT(subtotal)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm text-center"
              >
                <span>অর্ডার সম্পন্ন করতে এগিয়ে যান</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="pt-2 text-xs text-gray-500 text-center space-y-1">
                <p>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি ও নিরাপদ পেমেন্ট</p>
                <p className="font-medium text-brand">
                  সাহায্য প্রয়োজন? ফেসবুক পেজ: @sashroyidaam
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
