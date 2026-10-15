"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  Truck,
  PhoneCall,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { toBengaliNumber } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/products");
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-border shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-brand text-white text-xs sm:text-sm py-2 px-4">
        <div className="container flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium truncate">
            সাশ্রয়ী দামে সেরা পণ্য, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা!
          </p>
          <div className="hidden md:flex items-center gap-4 text-xs">
            <Link
              href="/track-order"
              className="flex items-center gap-1 hover:underline"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order / অর্ডার ট্র্যাক করুন</span>
            </Link>
            <a
              href="https://facebook.com/sashroyidaam"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-medium"
            >
              FB: @sashroyidaam
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container py-3.5 flex items-center justify-between gap-4">
        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-brand rounded-md"
          aria-label="মেনু খুলুন"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo: সাশ্রয়ী দাম | Sashroyi Daam */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-xl tracking-tight shadow-sm group-hover:bg-brand-dark transition-colors">
            সা
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold text-brand leading-none tracking-tight">
              সাশ্রয়ী দাম
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-gray-600 tracking-wide mt-0.5">
              Sashroyi Daam
            </span>
          </div>
        </Link>

        {/* Desktop Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xl mx-4 relative"
          role="search"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="পণ্য খুঁজুন (যেমন: ফ্লাস্ক, কিচেন কাটার, পোলো টি-শার্ট)..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-4 pr-12 py-2.5 text-sm focus:bg-white focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors flex items-center justify-center"
            aria-label="খুঁজুন"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/track-order"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand rounded-md hover:bg-gray-100 transition-colors"
          >
            <Truck className="w-4 h-4 text-brand" />
            <span>অর্ডার ট্র্যাক</span>
          </Link>

          <Link
            href="/account"
            className="p-2 text-gray-700 hover:text-brand rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-sm font-medium"
            aria-label="অ্যাকাউন্ট"
          >
            <User className="w-5 h-5" />
            <span className="hidden xl:inline">অ্যাকাউন্ট</span>
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 bg-brand-light text-brand px-3.5 py-2 rounded-lg font-semibold text-sm hover:bg-brand hover:text-white transition-colors"
            aria-label="শপিং কার্ট"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">কার্ট</span>
            {mounted && totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-brand-accent text-white rounded-full">
                {toBengaliNumber(totalItems)}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative flex" role="search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-3.5 pr-11 py-2 text-sm focus:bg-white focus:border-brand"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-3 bg-brand text-white rounded-md"
            aria-label="খুঁজুন"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Category Navigation Bar (Desktop) */}
      <nav
        aria-label="প্রধান ক্যাটাগরি"
        className="hidden lg:block border-t border-gray-100 bg-gray-50/70"
      >
        <div className="container flex items-center gap-6 py-2.5 text-sm font-medium text-gray-700">
          <Link href="/products" className="hover:text-brand font-semibold text-brand">
            সকল পণ্য (All Products)
          </Link>
          <Link
            href="/products?category=home-and-kitchen"
            className="hover:text-brand transition-colors"
          >
            হোম ও কিচেন
          </Link>
          <Link
            href="/products?category=gadget-accessories"
            className="hover:text-brand transition-colors"
          >
            মোবাইল ও গ্যাজেট এক্সেসরিজ
          </Link>
          <Link
            href="/products?category=everyday-fashion"
            className="hover:text-brand transition-colors"
          >
            ডেইলি ফ্যাশন
          </Link>
          <Link
            href="/products?category=home-organizers"
            className="hover:text-brand transition-colors"
          >
            হোম অর্গানাইজার
          </Link>
          <Link
            href="/products?sort=price_asc"
            className="ml-auto text-brand-accent font-semibold hover:underline"
          >
            সাশ্রয়ী অফার (Special Offers)
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white px-4 py-4 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2 text-sm font-medium text-gray-800">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-md bg-brand-light text-brand font-semibold"
            >
              সকল পণ্য (All Products)
            </Link>
            <Link
              href="/products?category=home-and-kitchen"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-md hover:bg-gray-100"
            >
              হোম ও কিচেন
            </Link>
            <Link
              href="/products?category=gadget-accessories"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-md hover:bg-gray-100"
            >
              মোবাইল ও গ্যাজেট এক্সেসরিজ
            </Link>
            <Link
              href="/products?category=everyday-fashion"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-md hover:bg-gray-100"
            >
              ডেইলি ফ্যাশন ও লাইফস্টাইল
            </Link>
            <Link
              href="/products?category=home-organizers"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-md hover:bg-gray-100"
            >
              হোম অর্গানাইজার
            </Link>
            <hr className="my-2 border-gray-200" />
            <Link
              href="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-md hover:bg-gray-100 flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-brand" />
              <span>অর্ডার ট্র্যাক করুন</span>
            </Link>
            <a
              href="https://facebook.com/sashroyidaam"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-md hover:bg-gray-100 flex items-center gap-2 text-brand font-medium"
            >
              <PhoneCall className="w-4 h-4" />
              <span>ফেসবুক পেজ: @sashroyidaam</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
