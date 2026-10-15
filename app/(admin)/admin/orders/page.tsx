import React from "react";
import { createSupabaseAdminClient, requireStaffPermission } from "@/lib/supabase/server";
import { formatBDT, ORDER_STATUS_LABELS_BN, toBengaliNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireStaffPermission("orders.manage");
  const adminSupabase = createSupabaseAdminClient();

  const { data: orders } = await adminSupabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">অর্ডার ম্যানেজমেন্ট ও ফুলফিলমেন্ট (Orders)</h1>
        <p className="text-sm text-gray-600">কাস্টমারদের সকল অর্ডার যাচাই ও স্ট্যাটাস আপডেট করুন</p>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-700">
              <tr>
                <th className="p-3.5">অর্ডার নম্বর</th>
                <th className="p-3.5">গ্রাহক ও ঠিকানা</th>
                <th className="p-3.5">পেমেন্ট</th>
                <th className="p-3.5">সর্বমোট</th>
                <th className="p-3.5">স্ট্যাটাস</th>
                <th className="p-3.5">তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders?.map((ord: any) => (
                <tr key={ord.id} className="hover:bg-gray-50">
                  <td className="p-3.5 font-bold text-brand">{ord.order_number}</td>
                  <td className="p-3.5">
                    <p className="font-semibold text-gray-900">{ord.customer_name}</p>
                    <p className="text-xs text-gray-600">{ord.customer_phone}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{ord.full_address}, {ord.district}</p>
                  </td>
                  <td className="p-3.5">
                    <span className="uppercase text-xs font-bold text-gray-700">{ord.payment_method}</span>
                    <p className="text-xs text-brand">{ord.payment_status}</p>
                  </td>
                  <td className="p-3.5 font-bold">{formatBDT(ord.total_payable_bdt)}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-brand-light text-brand">
                      {ORDER_STATUS_LABELS_BN[ord.order_status as keyof typeof ORDER_STATUS_LABELS_BN] || ord.order_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-gray-500">
                    {new Date(ord.created_at).toLocaleDateString("bn-BD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
