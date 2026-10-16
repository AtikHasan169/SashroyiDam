import React from 'react';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface MobileBottomNavProps {
  onOpenAccount: () => void;
  onOpenCategories: () => void;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenAccount,
  onOpenCategories,
  onOpenSearch
}) => {
  const { totalItemCount, setIsCartDrawerOpen } = useCart();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 py-1.5 px-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"
      aria-label="মোবাইল নেভিগেশন"
    >
      {/* Home */}
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex flex-col items-center justify-center py-1 px-3 text-stone-600 hover:text-[#0F4C3A] active:scale-95 transition-all cursor-pointer min-w-[56px]"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">হোম</span>
      </button>

      {/* Categories */}
      <button
        onClick={onOpenCategories}
        className="flex flex-col items-center justify-center py-1 px-3 text-stone-600 hover:text-[#0F4C3A] active:scale-95 transition-all cursor-pointer min-w-[56px]"
      >
        <Grid className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">ক্যাটাগরি</span>
      </button>

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center py-1 px-3 text-stone-600 hover:text-[#0F4C3A] active:scale-95 transition-all cursor-pointer min-w-[56px]"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">খুঁজুন</span>
      </button>

      {/* Cart with live item counter */}
      <button
        onClick={() => setIsCartDrawerOpen(true)}
        className="relative flex flex-col items-center justify-center py-1 px-3 text-[#0F4C3A] active:scale-95 transition-all cursor-pointer min-w-[56px]"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums shadow-xs animate-in zoom-in-50">
              {totalItemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5">ব্যাগ</span>
      </button>

      {/* Account */}
      <button
        onClick={onOpenAccount}
        className="flex flex-col items-center justify-center py-1 px-3 text-stone-600 hover:text-[#0F4C3A] active:scale-95 transition-all cursor-pointer min-w-[56px]"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">অ্যাকাউন্ট</span>
      </button>
    </nav>
  );
};
