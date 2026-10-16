import React, { useState } from 'react';
import { ShoppingBag, Search, User as UserIcon, Heart, Menu, X, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  onOpenAccount: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  announcement?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAccount,
  onOpenTracking,
  onOpenAdmin,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  announcement = '🚚 ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি ডেলিভারি! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।'
}) => {
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* 1. Moving Announcement Strip */}
      <div className="bg-[#0F4C3A] text-white text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide border-b border-emerald-900/40 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Moving Marquee Ticker */}
          <div className="flex-1 overflow-hidden relative group cursor-default">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-[11px] sm:text-xs text-emerald-100">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span className="font-bold text-amber-300">সাশ্রয়ী দাম (Sashroyi Daam):</span>
                <span className="text-white font-medium">
                  {announcement || '🚚 ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি ডেলিভারি! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।'}
                </span>
              </span>
              <span className="text-emerald-400/70 font-bold">✦</span>
              <span className="flex items-center gap-1.5 text-emerald-50">
                <span>🔥 নতুন কালেকশন ও এক্সক্লুসিভ অফার চলছে!</span>
              </span>
              <span className="text-emerald-400/70 font-bold">✦</span>
              <span className="flex items-center gap-1.5 text-amber-200">
                <span>⚡ ৪৮ ঘণ্টার মধ্যে দ্রুত হোম ডেলিভারি ও মান যাচাইয়ের সুবিধা</span>
              </span>
              <span className="text-emerald-400/70 font-bold">✦</span>
              <span className="flex items-center gap-1.5 text-emerald-100">
                <span>🛡️ ১০০% আসল পণ্যের গ্যারান্টি ও ৭ দিনের সহজ রিটার্ন</span>
              </span>
              <span className="text-emerald-400/70 font-bold">✦</span>

              {/* Duplicate loop for continuous seamless moving marquee */}
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span className="font-bold text-amber-300">সাশ্রয়ী দাম (Sashroyi Daam):</span>
                <span className="text-white font-medium">
                  {announcement || '🚚 ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি ডেলিভারি! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।'}
                </span>
              </span>
              <span className="text-emerald-400/70 font-bold">✦</span>
              <span className="flex items-center gap-1.5 text-emerald-50">
                <span>🔥 নতুন কালেকশন ও এক্সক্লুসিভ অফার চলছে!</span>
              </span>
              <span className="text-emerald-400/70 font-bold">✦</span>
              <span className="flex items-center gap-1.5 text-amber-200">
                <span>⚡ ৪৮ ঘণ্টার মধ্যে দ্রুত হোম ডেলিভারি ও মান যাচাইয়ের সুবিধা</span>
              </span>
            </div>
          </div>

          {/* Quick links & Facebook Badge */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-emerald-100/90 shrink-0">
            <a
              href="https://facebook.com/sashroyidaam"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-all flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-700 px-2.5 py-0.5 rounded-full cursor-pointer text-amber-200 font-medium border border-emerald-700/60 shadow-2xs"
              title="ফেসবুক পেজ: সাশ্রয়ী দাম | Sashroyi Daam (@sashroyidaam)"
            >
              <span className="font-bold text-[#1877F2] bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px]">f</span>
              <span>@sashroyidaam</span>
            </a>
            <button
              onClick={onOpenTracking}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>অর্ডার ট্র্যাক</span>
            </button>
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hover:text-white transition-colors flex items-center gap-1 font-semibold text-amber-300 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>অ্যাডমিন প্যানেল</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Bar Contract: Zone 1 (Brand) - Zone 2 (Navigation/Search) - Zone 3 (Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                onSelectCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col text-left group cursor-pointer focus:outline-none"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F4C3A] font-sans">
                  সাশ্রয়ী দাম
                </span>
                <span className="text-xs sm:text-sm font-semibold text-stone-500 font-sans tracking-tight">
                  | Sashroyi Daam
                </span>
              </div>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span className="text-[10px] text-emerald-800 font-medium tracking-wide">
                  @sashroyidaam
                </span>
                <span className="text-[10px] text-stone-400">·</span>
                <span className="text-[10px] text-stone-400 truncate hidden sm:inline">
                  আপনার পছন্দ, অশেষ সম্ভাবনা
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Functional Search Bar & Category Navigation */}
          <div className="hidden lg:flex items-center flex-1 max-w-xl gap-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য, ক্যাটাগরি বা ব্র্যান্ড খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 bg-stone-100 hover:bg-stone-50 focus:bg-white text-sm text-stone-900 rounded-lg border border-transparent focus:border-stone-300 focus:outline-none transition-all placeholder:text-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <nav className="flex items-center gap-5 text-sm font-medium text-stone-600 shrink-0">
              <button
                onClick={() => onSelectCategory('all')}
                className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
              >
                সকল পণ্য
              </button>
              <button
                onClick={() => onSelectCategory('cat-kitchen')}
                className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
              >
                গৃহস্থালি
              </button>
              <button
                onClick={() => onSelectCategory('cat-fashion')}
                className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
              >
                ফ্যাশন
              </button>
              <button
                onClick={() => onSelectCategory('cat-gadgets')}
                className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
              >
                গ্যাজেট
              </button>
            </nav>
          </div>

          {/* Zone 3: Actions (Account, Wishlist, Cart) */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Account Link */}
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:text-[#0F4C3A] rounded-lg transition-colors cursor-pointer text-sm font-medium"
              title="আমার অ্যাকাউন্ট"
            >
              <UserIcon className="w-5 h-5" />
              <span className="hidden md:inline whitespace-nowrap">
                {user ? user.name.split(' ')[0] : 'অ্যাকাউন্ট'}
              </span>
            </button>

            {/* Wishlist Shortcut */}
            <button
              onClick={() => {
                const el = document.getElementById('products');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative p-2 text-stone-700 hover:text-[#0F4C3A] rounded-lg transition-colors cursor-pointer"
              title="পছন্দের তালিকা"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-amber-600 text-white rounded-full flex items-center justify-center tabular-nums">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#0F4C3A] text-white hover:bg-[#135D48] rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
              title="শপিং ব্যাগ"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">ব্যাগ</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded text-xs font-bold tabular-nums">
                {totalItemCount}
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-stone-900 focus:outline-none"
              aria-label="মেনু খুলুন"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 lg:hidden">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য, ক্যাটাগরি বা ব্র্যান্ড খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-stone-100 focus:bg-white text-sm text-stone-900 rounded-lg border border-transparent focus:border-stone-300 focus:outline-none placeholder:text-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-stone-200 flex flex-col gap-2 pb-2">
            <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-700 pb-2">
              <button
                onClick={() => {
                  onSelectCategory('all');
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-stone-100 rounded-md"
              >
                সকল পণ্য
              </button>
              <button
                onClick={() => {
                  onSelectCategory('cat-kitchen');
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-stone-100 rounded-md"
              >
                গৃহস্থালি ও রান্নাঘর
              </button>
              <button
                onClick={() => {
                  onSelectCategory('cat-fashion');
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-stone-100 rounded-md"
              >
                ফ্যাশন ও কারুকাজ
              </button>
              <button
                onClick={() => {
                  onSelectCategory('cat-gadgets');
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-stone-100 rounded-md"
              >
                গ্যাজেট ও টেক
              </button>
            </div>
            <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
              <a
                href="https://facebook.com/sashroyidaam"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 text-[#0F4C3A] rounded-lg text-xs font-semibold border border-emerald-200"
              >
                <span className="font-bold text-sm">f</span>
                <span>ফেসবুক পেজ: সাশ্রয়ী দাম | @sashroyidaam</span>
              </a>

              <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                <button
                  onClick={() => {
                    onOpenTracking();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-stone-800 font-medium"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#0F4C3A]" />
                  <span>অর্ডার ট্র্যাকিং</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setMobileMenuOpen(false);
                    }}
                    className="text-amber-800 font-semibold"
                  >
                    অ্যাডমিন ড্যাশবোর্ড
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
