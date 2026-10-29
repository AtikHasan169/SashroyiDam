import React from 'react';
import { Home, Grid, Search, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface FloatingNavDockProps {
  onOpenCategories: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onHomeClick?: () => void;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  onOpenCategories,
  onOpenSearch,
  onOpenCart,
  onOpenWishlist,
  onHomeClick
}) => {
  const { totalItemCount } = useCart();
  const { wishlistIds } = useWishlist();
  const { language, t } = useLanguage();

  const handleWishlistClick = () => {
    if (onOpenWishlist) {
      onOpenWishlist();
    } else {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 rounded-t-2xl py-2 px-2 flex items-center justify-around md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)] select-none"
      aria-label="মোবাইল নেভিগেশন বার"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => {
          if (onHomeClick) {
            onHomeClick();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="flex flex-col items-center justify-center py-1 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[50px]"
        title={language === 'bn' ? 'হোম পেজ' : 'Home'}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'হোম' : 'Home'}
        </span>
      </button>

      {/* 2. Categories */}
      <button
        type="button"
        onClick={onOpenCategories}
        className="flex flex-col items-center justify-center py-1 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[50px]"
        title={t('categoriesTitle')}
      >
        <Grid className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
        </span>
      </button>

      {/* 3. Search */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center py-1 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[50px]"
        title={language === 'bn' ? 'পণ্য খুঁজুন' : 'Search'}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'সার্চ' : 'Search'}
        </span>
      </button>

      {/* 4. Cart with Live Badge */}
      <button
        type="button"
        onClick={onOpenCart}
        className="relative flex flex-col items-center justify-center py-1 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[50px]"
        title={t('cart')}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-[#0F4C3A] text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center tabular-nums shadow-xs">
              {totalItemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold mt-0.5">
          {t('cart')}
        </span>
      </button>

      {/* 5. Wishlist with Live Count */}
      <button
        type="button"
        onClick={handleWishlistClick}
        className="relative flex flex-col items-center justify-center py-1 px-2 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[50px]"
        title={t('wishlist')}
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${wishlistIds.length > 0 ? 'text-rose-600 fill-rose-600' : ''}`} />
          {wishlistIds.length > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center tabular-nums shadow-xs">
              {wishlistIds.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'পছন্দ' : 'Wishlist'}
        </span>
      </button>
    </nav>
  );
};

