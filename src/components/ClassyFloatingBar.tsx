import React from 'react';
import { ShoppingCart, MessageCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

export const ClassyFloatingBar: React.FC = () => {
  const { totalItemCount, cartValidation, setIsCartDrawerOpen, isCartDrawerOpen } = useCart();
  const { language, t, formatPrice, formatNumber } = useLanguage();

  if (isCartDrawerOpen) return null;

  const subtotal = cartValidation?.subtotal || 0;

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      language === 'bn'
        ? 'সাশ্রয়ী দাম (Sashroyi Daam) থেকে সহায়তা প্রয়োজন।'
        : 'Hello! I need assistance with an order on Sashroyi Daam.'
    );
    window.open(`https://wa.me/8801700000000?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex flex-col sm:flex-row items-end sm:items-center gap-2.5 pointer-events-auto">
      {/* 1. Classy Floating Support (WhatsApp) */}
      <button
        onClick={handleOpenWhatsApp}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-white text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50/90 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-emerald-200/80 font-medium text-xs transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="WhatsApp Support"
        aria-label="WhatsApp Support"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <MessageCircle className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold hidden sm:inline font-['Hind_Siliguri',sans-serif]">
          {language === 'bn' ? 'হোয়াটসঅ্যাপ সহায়তা' : 'WhatsApp Help'}
        </span>
      </button>

      {/* 2. Floating Live Cart Capsule (Shows when items > 0) */}
      {totalItemCount > 0 && (
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-full shadow-[0_8px_30px_rgba(15,76,58,0.35)] border border-emerald-500/40 text-xs font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in slide-in-from-bottom-2 fade-in duration-300"
          title={t('shoppingCartTitle')}
          aria-label={t('cart')}
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4 text-emerald-100" />
            <span className="absolute -top-2 -right-2 bg-amber-400 text-stone-950 font-bold text-[9.5px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {formatNumber(totalItemCount)}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 font-['Hind_Siliguri',sans-serif]">
            <span className="font-bold tabular-nums text-amber-300 text-sm">
              {formatPrice(subtotal)}
            </span>
            <span className="text-[11px] text-emerald-200/90 border-l border-emerald-700/80 pl-1.5 hidden xs:inline">
              {language === 'bn' ? 'কার্ট দেখুন' : 'View Cart'}
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
        </button>
      )}
    </div>
  );
};
