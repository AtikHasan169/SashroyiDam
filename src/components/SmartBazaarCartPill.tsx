import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

export const SmartBazaarCartPill: React.FC = () => {
  const { totalItemCount, cartValidation, setIsCartDrawerOpen, isCartDrawerOpen } = useCart();
  const { language, t, formatPrice, formatNumber } = useLanguage();

  // If drawer is already open, hide the floating pill
  if (isCartDrawerOpen) return null;

  const subtotal = cartValidation?.subtotal || 0;

  return (
    <div
      onClick={() => setIsCartDrawerOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsCartDrawerOpen(true);
        }
      }}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#0F4C3A] text-white rounded-l-2xl shadow-2xl flex flex-col items-center py-3 px-2 sm:px-2.5 cursor-pointer hover:bg-[#145C47] transition-all transform hover:-translate-x-1 active:scale-95 border-y border-l border-emerald-600/80 group focus:outline-none focus:ring-2 focus:ring-emerald-400"
      title={t('shoppingBagTitle')}
      aria-label={t('bag')}
    >
      {/* Top Cart Icon with animated badge */}
      <div className="relative mb-1">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
          <ShoppingBag className="w-4 h-4 text-emerald-100" />
        </div>
        {totalItemCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums shadow-xs">
            {formatNumber(totalItemCount)}
          </span>
        )}
      </div>

      {/* Item Count Label */}
      <span className="text-[10px] font-bold tracking-tight text-emerald-100 uppercase whitespace-nowrap">
        {totalItemCount > 0 ? (language === 'bn' ? `${formatNumber(totalItemCount)} টি পণ্য` : `${totalItemCount} items`) : t('bag')}
      </span>

      {/* Live Total Price Pill */}
      <div className="mt-1.5 bg-amber-400 text-stone-950 font-bold text-[11px] px-2 py-0.5 rounded-full shadow-2xs tabular-nums whitespace-nowrap">
        {formatPrice(subtotal)}
      </div>
    </div>
  );
};
