import React from 'react';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface FloatingNavDockProps {
  onOpenAccount: () => void;
  onOpenCategories: () => void;
  onOpenSearch: () => void;
  onHomeClick?: () => void;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  onOpenAccount,
  onOpenCategories,
  onOpenSearch,
  onHomeClick
}) => {
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-stone-200/90 px-3 sm:px-5 py-2 flex items-center gap-3 sm:gap-6 transition-all duration-300 md:hidden"
      aria-label="ফ্লোটিং নেভিগেশন ডক"
    >
      {/* 1. Home */}
      <button
        onClick={() => {
          if (onHomeClick) {
            onHomeClick();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="flex flex-col items-center justify-center py-0.5 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[48px] group"
        title={language === 'bn' ? 'হোম পেজ' : 'Home'}
      >
        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'হোম' : 'Home'}
        </span>
      </button>

      {/* 2. Categories (Opens Left Hamburger Drawer) */}
      <button
        onClick={onOpenCategories}
        className="flex flex-col items-center justify-center py-0.5 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[48px] group"
        title={t('categoriesTitle')}
      >
        <Grid className="w-5 h-5 group-hover:scale-110 transition-transform text-[#0F4C3A]" />
        <span className="text-[10px] font-semibold mt-0.5 text-[#0F4C3A]">
          {language === 'bn' ? 'ক্যাটাগরি' : 'Categories'}
        </span>
      </button>

      {/* 3. Search */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center py-0.5 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[48px] group"
        title={language === 'bn' ? 'পণ্য খুঁজুন' : 'Search'}
      >
        <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'খুঁজুন' : 'Search'}
        </span>
      </button>

      {/* 4. Cart Bag with Live Counter */}
      <button
        onClick={() => setIsCartDrawerOpen(true)}
        className="relative flex flex-col items-center justify-center py-0.5 px-2 text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[48px] group"
        title={t('bag')}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums shadow-xs animate-in zoom-in-50">
              {totalItemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5">{t('bag')}</span>
      </button>

      {/* 5. Account / Profile */}
      <button
        onClick={onOpenAccount}
        className="flex flex-col items-center justify-center py-0.5 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[48px] group"
        title={user ? t('account') : t('login')}
      >
        <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-semibold mt-0.5 truncate max-w-[52px]">
          {user ? user.name.split(' ')[0] : t('login')}
        </span>
      </button>
    </nav>
  );
};
