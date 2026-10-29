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
    <aside
      onClick={() => setIsCartDrawerOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsCartDrawerOpen(true);
        }
      }}
      className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer flex-col rounded-l-2xl shadow-2xl overflow-hidden border-y border-l border-emerald-700/60 hover:-translate-x-1.5 transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-400 select-none"
      title={t('shoppingCartTitle')}
      aria-label={t('cart')}
    >
      {/* 1. Upper Block: Brand Dark Green with Bag Icon & Count */}
      <div className="bg-[#0F4C3A] group-hover:bg-[#135D48] text-white flex flex-col items-center justify-center pt-2.5 pb-2 px-2.5 transition-colors">
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-amber-400 text-stone-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center tabular-nums shadow-xs">
              {totalItemCount}
            </span>
          )}
        </div>
        <p className="text-[11px] font-bold text-emerald-100 tracking-tight mt-1 whitespace-nowrap">
          {totalItemCount > 0
            ? (language === 'bn' ? `${formatNumber(totalItemCount)} টি` : `${totalItemCount} items`)
            : (language === 'bn' ? '০ টি' : '0 items')}
        </p>
      </div>

      {/* 2. Lower Block: Taka Price Tab */}
      <div className="bg-[#145C47] group-hover:bg-[#186F56] text-white font-extrabold text-[11px] py-1 px-2.5 text-center tabular-nums whitespace-nowrap border-t border-emerald-600/50 flex items-center justify-center gap-0.5">
        <span className="text-amber-300 font-bold">৳</span>
        <span>{subtotal.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>
      </div>
    </aside>
  );
};

