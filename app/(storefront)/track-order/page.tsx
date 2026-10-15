"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Truck, Search, CheckCircle, ArrowRight } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { formatBDT, ORDER_STATUS_LABELS_BN, toBengaliNumber } from "@/lib/utils";

export default function TrackOrderPage() {
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNo.trim() || !phone.trim()) {
      setErrorMsg("অনুগ্রহ করে অর্ডার নম্বর ও মোবাইল নাম্বার দুটিই লিখুন।");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setOrderResult(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNo=${encodeURIComponent(orderNo.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "অর্ডারটি খুঁজে পাওয়া যায়নি। তথ্যগুলো যাচাই করুন।");
      }

      setOrderResult(data.order);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="container py-12 max-w-2xl">
        <div className="bg-white rounded-xl border border-border p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto">
              <Truck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">অর্ডার ট্র্যাক করুন (Track Order)</h1>
            <p className="text-sm text-gray-600">
              আপনার অর্ডার নম্বর ও অর্ডার করার সময় দেওয়া মোবাইল নাম্বার দিয়ে বর্তমান অবস্থা জানুন।
            </p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                অর্ডার নম্বর (যেমন: SD-20261016-XXXXX)
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="SD-YYYYMMDD-XXXXX"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                মোবাইল নাম্বার
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-brand"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <span>খোঁজা হচ্ছে...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>অর্ডার স্ট্যাটাস দেখুন</span>
                </>
              )}
            </button>
          </form>

          {orderResult && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="bg-brand-light/50 p-4 rounded-lg border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">অর্ডার নম্বর</p>
                  <p className="font-bold text-gray-900">{orderResult.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">বর্তমান স্ট্যাটাস</p>
                  <p className="font-bold text-brand">
                    {ORDER_STATUS_LABELS_BN[orderResult.order_status as keyof typeof ORDER_STATUS_LABELS_BN]}
                  </p>
                </div>
              </div>

              <div className="text-sm space-y-2">
                <p className="font-bold text-gray-800">প্রাপক: {orderResult.customer_name} ({orderResult.customer_phone})</p>
                <p className="text-gray-600">ঠিকানা: {orderResult.full_address}, {orderResult.district}</p>
                <p className="font-bold text-brand">সর্বমোট: {formatBDT(orderResult.total_payable_bdt)}</p>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href={`/order-success/${orderResult.order_number}?token=${orderResult.tracking_token}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                >
                  <span>বিস্তারিত ইনভয়েস দেখুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
