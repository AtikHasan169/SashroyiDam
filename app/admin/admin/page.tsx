import React from "react";
import { ShoppingBag, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { createSupabaseAdminClient, requireStaffPermission } from "@/lib/supabase/server";
import { formatBDT, toBengaliNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireStaffPermission("dashboard.view");
  const adminSupabase = createSupabaseAdminClient();

  const [
    { count: totalOrders },
    { count: totalProducts },
    { data: recentOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    adminSupabase.from("orders").select("*", { count: "exact", head: true }),
    adminSupabase.from("products").select("*", { count: "exact", head: true }).eq("is_archived", false),
    adminSupabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total_payable_bdt, order_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    adminSupabase
      .from("products")
      .select("id, title_bn, stock_quantity, low_stock_threshold, sku")
      .eq("track_inventory", true)
      .lte("stock_quantity", 5)
      .limit(5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ড্যাশবোর্ড ওভারভিউ</h1>
        <p className="text-sm text-gray-600">সাশ্রয়ী দাম (SashroyiDam) স্টোরের সার্বিক অবস্থা</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">মোট অর্ডার</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {toBengaliNumber(totalOrders || 0)}
            </p>
          </div>
          <div className="p-3 bg-brand-light text-brand rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">মোট পণ্য</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {toBengaliNumber(totalProducts || 0)}
            </p>
          </div>
          <div className="p-3 bg-brand-light text-brand rounded-lg">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">সাম্প্রতিক অর্ডারসমূহ</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="p-3">অর্ডার নম্বর</th>
                  <th className="p-3">গ্রাহক</th>
                  <th className="p-3">টাকা</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders?.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-brand">{ord.order_number}</td>
                    <td className="p-3">
                      <p className="font-semibold text-gray-800">{ord.customer_name}</p>
                      <p className="text-xs text-gray-500">{ord.customer_phone}</p>
                    </td>
                    <td className="p-3 font-bold">{formatBDT(ord.total_payable_bdt)}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-light text-brand">
                        {ord.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">কম স্টক সতর্কতা</h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts && lowStockProducts.length > 0 ? (
              lowStockProducts.map((p: any) => (
                <div key={p.id} className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs">
                  <p className="font-bold text-gray-900">{p.title_bn}</p>
                  <p className="text-gray-600 mt-0.5">SKU: {p.sku} | বর্তমান স্টক: <span className="font-bold text-red-600">{toBengaliNumber(p.stock_quantity)}টি</span></p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">সকল পণ্যের পর্যাপ্ত স্টক রয়েছে।</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
