import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

/**
 * DesktopFloatingCartTab
 * Premium vertical sticky cart tab pinned to the right edge of desktop viewports.
 * Gives instant visual feedback for item count and active subtotal while scrolling.
 */
export const DesktopFloatingCartTab: React.FC = () => {
  const { totalItemCount, cartValidation, setIsCartDrawerOpen, isCartDrawerOpen } = useCart();
  const { language, formatPrice, formatNumber } = useLanguage();
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCountRef = useRef(totalItemCount);

  // Pulse animation when an item is newly added
  useEffect(() => {
    if (totalItemCount > prevCountRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 900);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalItemCount;
  }, [totalItemCount]);

  // Hidden when the cart drawer is open to prevent overlap
  if (isCartDrawerOpen) return null;

  const subtotal = cartValidation?.subtotal || 0;

  return (
    <aside
      aria-label="Desktop Floating Cart"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden md:block select-none"
    >
      <button
        type="button"
        onClick={() => setIsCartDrawerOpen(true)}
        className={`group relative flex flex-col items-center justify-center py-3.5 px-2.5 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-l-2xl shadow-[-5px_0_25px_rgba(15,76,58,0.32)] border-l-2 border-t-2 border-b-2 border-emerald-400/50 transition-all duration-200 cursor-pointer hover:-translate-x-1 active:scale-95 ${
          isPulsing ? 'scale-105 ring-4 ring-amber-400/80 shadow-emerald-500/50' : ''
        }`}
        title={language === 'bn' ? 'শপিং কার্ট খুলুন' : 'Open Shopping Cart'}
      >
        {/* Shopping Bag Icon with Count Badge */}
        <div className="relative mb-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 group-hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors">
            <ShoppingBag className="w-5 h-5 text-emerald-200 group-hover:text-white transition-colors" />
          </div>
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-950 font-extrabold text-[10px] min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-xs tabular-nums">
              {formatNumber(totalItemCount)}
            </span>
          )}
        </div>

        {/* Vertical Separator */}
        <div className="w-6 h-px bg-emerald-700/80 my-1" />

        {/* Item Count Label */}
        <span className="text-[10px] font-bold tracking-tight uppercase text-emerald-200/90 whitespace-nowrap mb-1">
          {totalItemCount > 0
            ? (language === 'bn' ? `${formatNumber(totalItemCount)} টি আইটেম` : `${totalItemCount} Items`)
            : (language === 'bn' ? 'কার্ট' : 'Cart')}
        </span>

        {/* Price Pill */}
        <div className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-center font-bold text-xs text-amber-300 tabular-nums shadow-inner min-w-[58px]">
          {formatPrice(subtotal)}
        </div>

        {/* Subtle shine bar indicator */}
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-emerald-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </aside>
  );
};
