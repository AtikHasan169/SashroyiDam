import React, { useEffect } from 'react';
import {
  X,
  ChevronRight,
  ShoppingBag,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  Flame,
  ExternalLink,
  Globe
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import type { Category } from '../types/index.ts';

interface LeftHamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccount: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: (categoryId: string) => void;
  categories: Category[];
}

export const LeftHamburgerDrawer: React.FC<LeftHamburgerDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAccount,
  onOpenTracking,
  onOpenAdmin,
  onSelectCategory,
  categories
}) => {
  const { wishlistIds } = useWishlist();
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { language, setLanguage, t } = useLanguage();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-out Left Drawer Panel */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-80 sm:w-88 bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out animate-in slide-in-from-left">
          
          {/* 1. Clean Drawer Header (No login clutter) */}
          <div className="bg-[#0F4C3A] text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
                {t('brandName')}
              </span>
              <span className="text-[11px] text-emerald-200/90 font-medium">
                {t('brandTagline')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher in Drawer */}
              <div className="flex bg-white/15 p-0.5 rounded-lg border border-white/20 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    language === 'bn' ? 'bg-white text-[#0F4C3A] shadow-xs' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  বাং
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    language === 'en' ? 'bg-white text-[#0F4C3A] shadow-xs' : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Quick Navigation Shortcuts */}
          <div className="p-3 bg-stone-50 border-b border-stone-200 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenTracking();
              }}
              className="p-2.5 bg-white hover:bg-emerald-50/70 border border-stone-200/80 rounded-xl text-left flex items-center gap-2 text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#0F4C3A]" />
              <span className="truncate">{t('trackOrder')}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setIsCartDrawerOpen(true);
              }}
              className="p-2.5 bg-white hover:bg-emerald-50/70 border border-stone-200/80 rounded-xl text-left flex items-center justify-between text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <ShoppingBag className="w-4 h-4 text-[#0F4C3A]" />
                <span className="truncate">{t('bag')}</span>
              </div>
              {totalItemCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#0F4C3A] text-white rounded text-[10px] font-bold">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>

          {/* 3. Categories List (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider px-1 pb-2 border-b border-stone-100">
                <span>{t('categoriesTitle')}</span>
                <span className="text-[10px] font-normal lowercase text-stone-400">
                  {categories.length} {language === 'bn' ? 'টি বিভাগ' : 'items'}
                </span>
              </div>

              <div className="divide-y divide-stone-100 mt-1">
                {/* All products shortcut */}
                <button
                  onClick={() => {
                    onSelectCategory('all');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-stone-50 rounded-lg text-sm font-semibold text-stone-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-base">
                      🛍️
                    </span>
                    <span>{t('allProducts')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#0F4C3A] group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Categories */}
                {categories.map((cat) => {
                  let icon = '📦';
                  if (cat.slug.includes('kitchen') || cat.nameEn?.toLowerCase().includes('kitchen')) icon = '🍳';
                  else if (cat.slug.includes('fashion') || cat.slug.includes('shirt') || cat.nameEn?.toLowerCase().includes('fashion')) icon = '🧵';
                  else if (cat.slug.includes('gadget') || cat.nameEn?.toLowerCase().includes('gadget')) icon = '⚡';
                  else if (cat.slug.includes('jute') || cat.nameEn?.toLowerCase().includes('jute')) icon = '🪴';

                  const name = language === 'en' && cat.nameEn ? cat.nameEn : cat.nameBn;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-stone-50 rounded-lg text-sm font-semibold text-stone-800 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center text-base">
                          {icon}
                        </span>
                        <div>
                          <div className="text-stone-900 group-hover:text-[#0F4C3A] transition-colors">
                            {name}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#0F4C3A] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Deals & Wishlist */}
            <div className="space-y-1.5 pt-2">
              <button
                onClick={() => {
                  onSelectCategory('all');
                  onClose();
                  setTimeout(() => {
                    const el = document.getElementById('products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>{t('hotDeals')}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    const el = document.getElementById('products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>{t('wishlist')}</span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium">
                  {wishlistIds.length} {language === 'bn' ? 'টি' : ''}
                </span>
              </button>
            </div>
          </div>

          {/* 4. Customer Helpline & Social Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-2.5">
            {/* Phone hotline */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0F4C3A] flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 font-medium">{t('customerCare')}</div>
                  <a
                    href="tel:09612889900"
                    className="text-xs font-bold text-stone-900 hover:text-[#0F4C3A] transition-colors"
                  >
                    {t('callHotline')}
                  </a>
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                9 AM - 10 PM
              </span>
            </div>

            {/* Facebook shortcut */}
            <a
              href="https://facebook.com/sashroyidaam"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/15 text-[#1877F2] rounded-xl text-xs font-bold border border-[#1877F2]/20 transition-colors cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold">
                f
              </span>
              <span>{language === 'bn' ? 'অফিসিয়াল ফেসবুক পেজ' : 'Follow on Facebook'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </a>

            {/* Trust badge */}
            <div className="text-[10px] text-center text-stone-500 flex items-center justify-center gap-1.5 pt-0.5">
              <span>{t('replacementPromise')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
