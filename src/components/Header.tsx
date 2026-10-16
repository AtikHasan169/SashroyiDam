import React, { useState } from 'react';
import { ShoppingBag, Search, User as UserIcon, Heart, Menu, ShieldCheck, MapPin, Globe } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LeftHamburgerDrawer } from './LeftHamburgerDrawer.tsx';
import type { Category } from '../types/index.ts';

interface HeaderProps {
  onOpenAccount: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  announcement?: string;
  categories?: Category[];
  isDrawerOpen?: boolean;
  setIsDrawerOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAccount,
  onOpenTracking,
  onOpenAdmin,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  announcement,
  categories = [],
  isDrawerOpen: controlledDrawerOpen,
  setIsDrawerOpen: controlledSetDrawerOpen
}) => {
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);

  const isDrawerOpen = controlledDrawerOpen !== undefined ? controlledDrawerOpen : internalDrawerOpen;
  const setIsDrawerOpen = controlledSetDrawerOpen || setInternalDrawerOpen;

  const displayAnnouncement = announcement || t('freeDeliveryNotice');

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        {/* 1. Moving Announcement Strip with Language Switcher */}
        <div className="bg-[#0F4C3A] text-white text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide border-b border-emerald-900/40 overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Moving Marquee Ticker */}
            <div className="flex-1 overflow-hidden relative group cursor-default">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-[11px] sm:text-xs text-emerald-100">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  <span className="font-bold text-amber-300">{t('brandName')}:</span>
                  <span className="text-white font-medium">{displayAnnouncement}</span>
                </span>
                <span className="text-emerald-400/70 font-bold">✦</span>
                <span className="flex items-center gap-1.5 text-emerald-50">
                  <span>🔥 {language === 'bn' ? 'নতুন কালেকশন ও স্পেশাল অফার চলছে!' : 'New Collection & Special Deals Live!'}</span>
                </span>
                <span className="text-emerald-400/70 font-bold">✦</span>
                <span className="flex items-center gap-1.5 text-amber-200">
                  <span>⚡ {language === 'bn' ? '৪৮ ঘণ্টার মধ্যে দ্রুত হোম ডেলিভারি ও যাচাইয়ের সুবিধা' : 'Fast 48-Hour Home Delivery with Open-Box Verification'}</span>
                </span>
                <span className="text-emerald-400/70 font-bold">✦</span>
                <span className="flex items-center gap-1.5 text-emerald-100">
                  <span>🛡️ {t('replacementPromise')}</span>
                </span>
                <span className="text-emerald-400/70 font-bold">✦</span>

                {/* Duplicate loop */}
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  <span className="font-bold text-amber-300">{t('brandName')}:</span>
                  <span className="text-white font-medium">{displayAnnouncement}</span>
                </span>
                <span className="text-emerald-400/70 font-bold">✦</span>
                <span className="flex items-center gap-1.5 text-emerald-50">
                  <span>🔥 {language === 'bn' ? 'নতুন কালেকশন ও স্পেশাল অফার চলছে!' : 'New Collection & Special Deals Live!'}</span>
                </span>
              </div>
            </div>

            {/* Top Bar Quick Links & Language Switcher */}
            <div className="flex items-center gap-2.5 text-[11px] text-emerald-100/90 shrink-0">
              {/* Language Switcher Pill */}
              <div className="flex items-center bg-emerald-950/40 p-0.5 rounded-full border border-emerald-700/60 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    language === 'bn'
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                  title="বাংলা ভাষায় দেখুন"
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2.5">
                <a
                  href="https://facebook.com/sashroyidaam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all flex items-center gap-1 bg-emerald-800/80 hover:bg-emerald-700 px-2 py-0.5 rounded-full cursor-pointer text-amber-200 font-medium border border-emerald-700/60 shadow-2xs"
                  title="Facebook Page"
                >
                  <span className="font-bold text-[#1877F2] bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px]">f</span>
                  <span>{t('facebookPage')}</span>
                </a>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{t('trackOrder')}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="hover:text-white transition-colors flex items-center gap-1 font-semibold text-amber-300 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('adminPanel')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* DESKTOP LAYOUT (lg:flex) */}
          <div className="hidden lg:flex items-center justify-between gap-8">
            {/* Desktop Zone 1: Hamburger Menu Drawer Trigger + Brand Wordmark */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 -ml-2 text-stone-700 hover:text-[#0F4C3A] rounded-xl hover:bg-stone-100 transition-colors flex items-center gap-2 cursor-pointer border border-stone-200/60 bg-stone-50/60 shadow-2xs"
                aria-label={t('menu')}
                title={t('menu')}
              >
                <Menu className="w-5 h-5 text-[#0F4C3A]" />
                <span className="text-xs font-bold text-stone-800">{t('menu')}</span>
              </button>

              <button
                onClick={() => {
                  onSelectCategory('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex flex-col text-left group cursor-pointer focus:outline-none"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#0F4C3A] font-sans">
                    {t('brandName')}
                  </span>
                  <span className="text-sm font-semibold text-stone-500 font-sans tracking-tight">
                    | {language === 'bn' ? 'Sashroyi Daam' : 'Affordable Store'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 -mt-0.5">
                  <span className="text-[11px] text-stone-500 font-medium">
                    {t('brandTagline')}
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Zone 2: Search Bar & Quick Categories */}
            <div className="flex items-center flex-1 max-w-xl gap-6">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-9 pr-4 py-2 bg-stone-100 hover:bg-stone-50 focus:bg-white text-sm text-stone-900 rounded-lg border border-transparent focus:border-stone-300 focus:outline-none transition-all placeholder:text-stone-400"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <nav className="flex items-center gap-5 text-sm font-medium text-stone-600 shrink-0">
                <button
                  onClick={() => onSelectCategory('all')}
                  className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t('allProducts')}
                </button>
                <button
                  onClick={() => onSelectCategory('cat-kitchen')}
                  className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {language === 'bn' ? 'গৃহস্থালি' : 'Kitchen'}
                </button>
                <button
                  onClick={() => onSelectCategory('cat-fashion')}
                  className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {language === 'bn' ? 'ফ্যাশন' : 'Fashion'}
                </button>
                <button
                  onClick={() => onSelectCategory('cat-gadgets')}
                  className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {language === 'bn' ? 'গ্যাজেট' : 'Gadgets'}
                </button>
              </nav>
            </div>

            {/* Desktop Zone 3: Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onOpenAccount}
                className="flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:text-[#0F4C3A] rounded-lg transition-colors cursor-pointer text-sm font-medium"
                title={t('account')}
              >
                <UserIcon className="w-5 h-5" />
                <span className="whitespace-nowrap">
                  {user ? user.name.split(' ')[0] : t('account')}
                </span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative p-2 text-stone-700 hover:text-[#0F4C3A] rounded-lg transition-colors cursor-pointer"
                title={t('wishlist')}
              >
                <Heart className="w-5 h-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-amber-600 text-white rounded-full flex items-center justify-center tabular-nums">
                    {wishlistIds.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#0F4C3A] text-white hover:bg-[#135D48] rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
                title={t('bag')}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('bag')}</span>
                <span className="bg-white/20 px-1.5 py-0.2 rounded text-xs font-bold tabular-nums">
                  {totalItemCount}
                </span>
              </button>
            </div>
          </div>

          {/* MOBILE LAYOUT (lg:hidden): Balanced 3-Zone Header (Left: Hamburger, Center: Logo, Right: Actions) */}
          <div className="lg:hidden flex items-center justify-between gap-2">
            {/* Mobile Left: 3-line Hamburger Menu Button (opens Left Sliding Drawer) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-1 text-stone-800 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors focus:outline-none shrink-0 cursor-pointer"
              aria-label={t('menu')}
              title={t('menu')}
            >
              <Menu className="w-6 h-6 text-[#0F4C3A]" />
            </button>

            {/* Mobile Center: Brand Logo Wordmark */}
            <button
              onClick={() => {
                onSelectCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center text-center cursor-pointer focus:outline-none flex-1 px-1"
            >
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-bold tracking-tight text-[#0F4C3A] font-sans">
                  {t('brandName')}
                </span>
                <span className="text-xs font-semibold text-stone-500 font-sans tracking-tight">
                  | Daam
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-medium truncate">
                {t('onlineShopping')}
              </span>
            </button>

            {/* Mobile Right: Wishlist & Cart Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative p-2 text-stone-700 hover:text-[#0F4C3A] rounded-lg transition-colors cursor-pointer"
                title={t('wishlist')}
              >
                <Heart className="w-5 h-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[9px] font-bold bg-amber-600 text-white rounded-full flex items-center justify-center tabular-nums">
                    {wishlistIds.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0F4C3A] text-white hover:bg-[#135D48] rounded-lg font-medium text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
                title={t('bag')}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="bg-white/20 px-1 py-0.2 rounded text-[11px] font-bold tabular-nums">
                  {totalItemCount}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-2 lg:hidden">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 bg-stone-100 focus:bg-white text-xs sm:text-sm text-stone-900 rounded-lg border border-transparent focus:border-stone-300 focus:outline-none placeholder:text-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </header>

      {/* Clean Left Hamburger Drawer */}
      <LeftHamburgerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenAccount={onOpenAccount}
        onOpenTracking={onOpenTracking}
        onOpenAdmin={onOpenAdmin}
        onSelectCategory={onSelectCategory}
        categories={categories}
      />
    </>
  );
};
