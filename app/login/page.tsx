"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড উভয়ই লিখুন।");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMsg("লগইন ব্যর্থ হয়েছে: " + error.message);
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <main className="container py-16 max-w-md">
      <div className="bg-white rounded-xl border border-border p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto font-bold text-2xl">
            সা
          </div>
          <h1 className="text-2xl font-bold text-gray-900">লগইন করুন (Login)</h1>
          <p className="text-sm text-gray-600">
            সাশ্রয়ী দাম | Sashroyi Daam অ্যাকাউন্টে প্রবেশ করুন
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ইমেইল ঠিকানা (Email)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sashroyidaam.com"
                required
                className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {loading ? (
              <span>লগইন হচ্ছে...</span>
            ) : (
              <>
                <span>প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-500">
          <p>অফিসিয়াল প্রয়োজনে বা সহায়তার জন্য যোগাযোগ করুন:</p>
          <p className="font-semibold text-brand mt-1">ফেসবুক: @sashroyidaam</p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center text-gray-500">লোড হচ্ছে...</div>}>
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  );
}
