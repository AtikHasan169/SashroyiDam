import React from "react";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Settings, ShieldAlert, LogOut } from "lucide-react";
import { requireStaffPermission } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStaffPermission("dashboard.view");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-64 bg-brand-dark text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-white/10">
            <p className="text-xs text-emerald-300 font-semibold tracking-wider">
              ADMIN DASHBOARD
            </p>
            <h1 className="text-lg font-bold mt-0.5">সাশ্রয়ী দাম (SashroyiDam)</h1>
            <p className="text-xs text-emerald-100 mt-1">অ্যাক্টিভ রোল: {profile.role}</p>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5 text-sm font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-emerald-300" />
              <span>ড্যাশবোর্ড ওভারভিউ</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Package className="w-5 h-5 text-emerald-300" />
              <span>পণ্য ম্যানেজমেন্ট (Products)</span>
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-300" />
              <span>অর্ডার ও ফুলফিলমেন্ট (Orders)</span>
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-5 h-5 text-emerald-300" />
              <span>স্টোর সেটিংস</span>
            </Link>
          </nav>
        </div>

        {/* Footer / Back to Storefront */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="block text-center py-2 px-3 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            স্টোরফ্রন্টে ফিরে যান →
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
