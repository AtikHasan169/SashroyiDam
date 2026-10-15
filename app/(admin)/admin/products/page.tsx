import React from "react";
import Link from "next/link";
import { Plus, Package, Edit, Trash } from "lucide-react";
import { createSupabaseAdminClient, requireStaffPermission } from "@/lib/supabase/server";
import { formatBDT, toBengaliNumber } from "@/lib/utils";
import type { Product } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireStaffPermission("products.manage");
  const adminSupabase = createSupabaseAdminClient();

  const { data: products } = await adminSupabase
    .from("products")
    .select("*, categories(*), product_images(*)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">পণ্য ম্যানেজমেন্ট (Products)</h1>
          <p className="text-sm text-gray-600">নতুন পণ্য যুক্ত করুন, দাম ও স্টক পরিবর্তন করুন</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-brand text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন পণ্য যুক্ত করুন</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-700">
              <tr>
                <th className="p-3.5">পণ্য</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">দাম</th>
                <th className="p-3.5">স্টক</th>
                <th className="p-3.5">স্ট্যাটাস</th>
                <th className="p-3.5 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(products as Product[] | null)?.map((p) => {
                const img = p.product_images?.[0]?.image_url;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0 border">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={p.title_bn} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 m-3 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{p.title_bn}</p>
                        <p className="text-xs text-gray-500">{p.title_en}</p>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-xs">{p.sku}</td>
                    <td className="p-3.5 font-bold text-brand">{formatBDT(p.price_bdt)}</td>
                    <td className="p-3.5 font-semibold">
                      {p.track_inventory ? toBengaliNumber(p.stock_quantity) : "আনলিমিটেড"}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${p.is_published ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}`}>
                        {p.is_published ? "পাবলিশড" : "ড্রাফট"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 hover:bg-brand hover:text-white px-3 py-1.5 rounded transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
