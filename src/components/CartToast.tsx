import React, { useEffect } from 'react';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export interface CartToastItem {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
}

interface CartToastProps {
  toastItem: CartToastItem | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export const CartToast: React.FC<CartToastProps> = ({
  toastItem,
  onClose,
  onOpenCart
}) => {
  const { t, formatPrice } = useLanguage();

  useEffect(() => {
    if (!toastItem) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastItem, onClose]);

  if (!toastItem) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200/90 p-3.5 flex items-center gap-3 backdrop-blur-md">
        {/* Product Thumbnail */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
          <img
            src={toastItem.imageUrl}
            alt={toastItem.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{t('addedToBag')}</span>
          </div>
          <p className="text-xs font-semibold text-stone-900 truncate mt-0.5">
            {toastItem.title}
          </p>
          <p className="text-[11px] font-bold text-[#0F4C3A]">
            {formatPrice(toastItem.price)}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenCart();
            }}
            className="px-2.5 py-1.5 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('viewBag')}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-lg transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
