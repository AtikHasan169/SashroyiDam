"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Package, LogOut, Phone, Mail, Shield, ArrowRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?next=/account");
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="container py-20 text-center text-gray-500">
          অ্যাকাউন্টের তথ্য লোড হচ্ছে...
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-10 max-w-4xl">
        <div className="bg-white rounded-xl border border-border p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Top Info Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-light text-brand rounded-full flex items-center justify-center font-bold text-2xl shadow-inner">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : "সা"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile?.full_name || "গ্রাহক / ব্যবহারকারী"}
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user?.email}</span>
                </p>
                {profile?.phone_number && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{profile.phone_number}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 font-semibold px-4 py-2 rounded-lg text-sm transition-colors border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট (Logout)</span>
            </button>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.role && profile.role !== "customer" && (
              <div className="bg-brand-light/40 border border-brand/20 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-brand font-bold text-base">
                  <Shield className="w-5 h-5" />
                  <span>অ্যাডমিন ড্যাশবোর্ড অ্যাক্সেস</span>
                </div>
                <p className="text-xs text-gray-600">
                  আপনার স্টাফ বা অ্যাডমিন রোল রয়েছে। এখান থেকে অর্ডার ম্যানেজমেন্ট ও প্রডাক্ট ম্যানেজ করুন।
                </p>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline pt-1"
                >
                  <span>অ্যাডমিন প্যানেলে যান</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                <Package className="w-5 h-5 text-brand" />
                <span>অর্ডার ট্র্যাক ও ইতিহাস</span>
              </div>
              <p className="text-xs text-gray-600">
                আপনার সাম্প্রতিক অর্ডারগুলোর বর্তমান অবস্থা ও ডেলিভারি আপডেট দেখতে ট্র্যাক করুন।
              </p>
              <Link
                href="/track-order"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline pt-1"
              >
                <span>অর্ডার ট্র্যাক করুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}