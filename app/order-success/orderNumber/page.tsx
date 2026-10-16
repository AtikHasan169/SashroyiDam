import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Truck, Printer, ShoppingBag } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import type { OrderRecord, OrderItemRecord } from "@/types/database";
import { formatBDT, ORDER_STATUS_LABELS_BN, PAYMENT_STATUS_LABELS_BN, toBengaliNumber } from "@/lib/utils";

interface SuccessPageProps {
  params: { orderNumber: string };
  searchParams: { token?: string };
}

export default async function OrderSuccessPage({ params, searchParams }: SuccessPageProps) {
  const supabase = createSupabaseServerClient();
  const orderNumber = params.orderNumber;
  const token = searchParams.token;

  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber);

  if (token) {
    query = query.eq("tracking_token", token);
  }

  const { data: order, error } = await query.single();

  if (error || !order) {
    notFound();
  }

  const typedOrder = order as OrderRecord & { order_items: OrderItemRecord[] };

  return (
    <>
      <Suspense fallback={<div className="h-20 bg-white border-b" />}>
        <Header />
      </Suspense>

      <main className="container py-12 max-w-3xl">
        <div className="bg-white rounded-xl border border-border p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-brand rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              অর্ডার সফলভাবে গ্রহণ করা হয়েছে!
            </h1>
            <p className="text-sm text-gray-600">
              সাশ্রয়ী দাম (Sashroyi Daam) থেকে আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">অর্ডার নম্বর</p>
              <p className="font-bold text-gray-900 mt-0.5">{typedOrder.order_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">অর্ডারের স্ট্যাটাস</p>
              <p className="font-bold text-brand mt-0.5">
                {ORDER_STATUS_LABELS_BN[typedOrder.order_status]}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">পেমেন্ট পদ্ধতি</p>
              <p className="font-bold text-gray-900 uppercase mt-0.5">
                {typedOrder.payment_method === "cod" ? "Cash on Delivery" : typedOrder.payment_method}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">সর্বমোট প্রদেয়</p>
              <p className="font-bold text-brand mt-0.5">{formatBDT(typedOrder.total_payable_bdt)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-gray-900 text-base">পণ্যের বিবরণী</h2>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {typedOrder.order_items.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between text-sm bg-white">
                  <div>
                    <p className="font-semibold text-gray-800">{item.product_title_bn}</p>
                    {item.variant_name && <p className="text-xs text-brand">{item.variant_name}</p>}
                    <p className="text-xs text-gray-500">পরিমাণ: {toBengaliNumber(item.quantity)}</p>
                  </div>
                  <span className="font-bold text-gray-900">{formatBDT(item.line_total_bdt)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-light/50 rounded-lg p-4 border border-emerald-100 text-xs sm:text-sm text-gray-700 space-y-1">
            <p className="font-bold text-brand">ডেলিভারি ঠিকানা:</p>
            <p>{typedOrder.customer_name} ({typedOrder.customer_phone})</p>
            <p>{typedOrder.full_address}, {typedOrder.upazila}, {typedOrder.district}</p>
          </div>

          <div className="pt-4 flex flex-wrap gap-3 justify-center">
            <Link
              href="/products"
              className="bg-brand text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-brand-dark transition-colors"
            >
              আরও কেনাকাটা করুন
            </Link>
            <Link
              href="/track-order"
              className="border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              অর্ডার ট্র্যাক করুন
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
