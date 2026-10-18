import React, { useState } from 'react';
import { ShoppingCart, Search, User as UserIcon, Heart, Menu, ShieldCheck, MapPin, Globe, Headphones } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { LeftHamburgerDrawer } from './LeftHamburgerDrawer.tsx';
import { BrandLogo } from './BrandLogo.tsx';
import type { Category } from '../types/index.ts';

interface HeaderProps {
  onOpenAccount: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onOpenHelp?: () => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenSearch: () => void;
  onHomeClick?: () => void;
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
  onOpenHelp,
  onSelectCategory,
  onOpenSearch,
  onHomeClick,
  searchQuery,
  setSearchQuery,
  announcement,
  categories = [],
  isDrawerOpen: controlledDrawerOpen,
  setIsDrawerOpen: controlledSetDrawerOpen
}) => {
  const { totalItemCount, setIsCartDrawerOpen, cartValidation } = useCart();
  const { wishlistIds } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, toggleLanguage, t, formatPrice } = useLanguage();
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
                  if (onHomeClick) {
                    onHomeClick();
                  } else {
                    onSelectCategory('all');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex items-center text-left group cursor-pointer focus:outline-none"
              >
                <BrandLogo variant="dark" size="md" showTagline={true} />
              </button>
            </div>

            {/* Desktop Zone 2: Search Bar & Quick Categories */}
            <div className="flex items-center flex-1 max-w-xl gap-6">
              <div
                onClick={onOpenSearch}
                className="relative w-full cursor-pointer group"
              >
                <div className="w-full pl-9 pr-4 py-2 bg-stone-100 hover:bg-stone-50 group-hover:border-stone-300 text-sm text-stone-500 rounded-lg border border-transparent transition-all flex items-center justify-between">
                  <span className="truncate">{searchQuery || t('searchPlaceholder')}</span>
                  <span className="text-[11px] font-semibold text-stone-400 bg-stone-200/80 px-1.5 py-0.5 rounded">
                    Ctrl + K
                  </span>
                </div>
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-[#0F4C3A] transition-colors" />
              </div>

              <nav className="flex items-center gap-4 text-xs xl:text-sm font-semibold text-stone-600 shrink-0">
                <button
                  onClick={() => onSelectCategory('all')}
                  className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t('allProducts')}
                </button>
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className="hover:text-[#0F4C3A] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {language === 'en' && cat.nameEn ? cat.nameEn : cat.nameBn}
                  </button>
                ))}
              </nav>
            </div>

            {/* Desktop Zone 3: Actions (Wishlist, Profile, Shopping Cart) */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Wishlist */}
              <button
                onClick={() => {
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative p-2 text-stone-700 hover:text-[#0F4C3A] rounded-xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
                title={t('wishlist')}
              >
                <Heart className="w-5 h-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-amber-600 text-white rounded-full flex items-center justify-center tabular-nums">
                    {wishlistIds.length}
                  </span>
                )}
              </button>

              {/* Profile / Account */}
              <button
                onClick={onOpenAccount}
                className="flex items-center gap-2 px-3 py-1.5 text-stone-700 hover:text-[#0F4C3A] hover:bg-stone-50 rounded-xl transition-colors cursor-pointer text-sm font-medium border border-transparent hover:border-stone-200"
                title={user ? (language === 'bn' ? 'ইউজার প্রোফাইল ও অর্ডার' : 'User Profile & Orders') : t('account')}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#0F4C3A] flex items-center justify-center font-bold text-xs shrink-0">
                  {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-[#0F4C3A]" />}
                </div>
                <span className="whitespace-nowrap font-semibold text-xs sm:text-sm">
                  {user ? user.name.split(' ')[0] : (language === 'bn' ? 'প্রোফাইল' : 'Profile')}
                </span>
              </button>

              {/* Desktop Shopping Cart with Item Count & Live Subtotal */}
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer group active:scale-95"
                title={t('cart')}
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
                  {totalItemCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-amber-400 text-stone-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs tabular-nums">
                      {totalItemCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">
                    {language === 'bn' ? 'কার্ট' : 'Cart'}
                  </span>
                  <span className="text-xs font-bold text-amber-300 tabular-nums">
                    {formatPrice(cartValidation?.subtotal || 0)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* MOBILE LAYOUT (lg:hidden): Sleek Single-Row Header (No 2nd line) */}
          <div className="lg:hidden flex items-center justify-between gap-1.5 py-0.5">
            {/* Mobile Left: 3-line Hamburger Menu Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 -ml-1 text-stone-800 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors focus:outline-none shrink-0 cursor-pointer"
              aria-label={t('menu')}
              title={t('menu')}
            >
              <Menu className="w-6 h-6 text-[#0F4C3A]" />
            </button>

            {/* Mobile Center: Brand Logo Wordmark */}
            <button
              onClick={() => {
                if (onHomeClick) {
                  onHomeClick();
                } else {
                  onSelectCategory('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex items-center justify-center text-center cursor-pointer focus:outline-none flex-1 px-1 min-w-0"
            >
              <BrandLogo variant="dark" size="sm" showTagline={false} />
            </button>

            {/* Mobile Right: Single Row Actions (Search, Wishlist, Profile) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onOpenSearch}
                className="p-1.5 text-stone-700 hover:text-[#0F4C3A] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                title={language === 'bn' ? 'পণ্য খুঁজুন' : 'Search'}
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-stone-700" />
              </button>

              {/* Wishlist / Love First */}
              <button
                onClick={() => {
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative p-1.5 text-stone-700 hover:text-[#0F4C3A] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                title={t('wishlist')}
              >
                <Heart className="w-5 h-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 text-[9px] font-bold bg-amber-600 text-white rounded-full flex items-center justify-center tabular-nums">
                    {wishlistIds.length}
                  </span>
                )}
              </button>

              {/* Profile / Account Second */}
              <button
                onClick={onOpenAccount}
                className="p-1.5 text-stone-700 hover:text-[#0F4C3A] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-center"
                title={user ? user.name : t('login')}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#0F4C3A] flex items-center justify-center font-bold text-xs shrink-0">
                  {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5 text-[#0F4C3A]" />}
                </div>
              </button>
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
