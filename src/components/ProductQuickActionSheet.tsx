import React, { useState } from 'react';
import { X, ShoppingBag, Zap, ArrowRight, Star, ShieldCheck, Check } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ProductQuickActionSheetProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variantId?: string, quantity?: number) => void;
  onDirectBuy: (product: Product, variantId?: string, quantity?: number) => void;
  onOpenFullPage: (product: Product) => void;
}

export const ProductQuickActionSheet: React.FC<ProductQuickActionSheetProps> = ({
  product,
  onClose,
  onAddToCart,
  onDirectBuy,
  onOpenFullPage
}) => {
  const { language, t, formatPrice } = useLanguage();

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product?.variants && product.variants.length > 0 ? product.variants[0].id : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const title = language === 'en' && product.titleEn ? product.titleEn : product.titleBn;
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = product.price + (selectedVariant?.priceDelta || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const handleAdd = () => {
    setIsAdding(true);
    onAddToCart(product, selectedVariantId, quantity);
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 400);
  };

  const handleBuy = () => {
    onClose();
    onDirectBuy(product, selectedVariantId, quantity);
  };

  const handleFullPage = () => {
    onClose();
    onOpenFullPage(product);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Floating Modal / Bottom Sheet Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden relative z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 text-left"
      >
        {/* Grab bar on mobile */}
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Top Product Header */}
        <div className="p-4 sm:p-5 flex gap-3.5 items-start border-b border-stone-100 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Thumbnail */}
          <div
            onClick={handleFullPage}
            className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 cursor-pointer group"
          >
            <img
              src={product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Details */}
          <div className="flex-1 pr-6 min-w-0">
            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
              {product.brand}
            </span>

            <h3
              onClick={handleFullPage}
              className="text-sm font-bold text-stone-900 line-clamp-2 mt-1 hover:text-[#0F4C3A] cursor-pointer transition-colors"
            >
              {title}
            </h3>

            {/* Price block */}
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-lg font-bold text-[#0F4C3A] tabular-nums">
                {formatPrice(currentPrice)}
              </span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-xs text-stone-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                  {t('savings', { amount: formatPrice(product.originalPrice - currentPrice) })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Variants Selector (if applicable) */}
        {product.variants && product.variants.length > 0 && (
          <div className="px-5 py-3.5 border-b border-stone-100 space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              {language === 'bn' ? 'সাইজ / ভ্যারিয়েন্ট নির্বাচন করুন:' : 'Select Size / Variant:'}
            </label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                const isOutOf = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isOutOf}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-xs'
                        : isOutOf
                        ? 'bg-stone-100 text-stone-400 border-stone-200 line-through cursor-not-allowed'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300'
                    }`}
                  >
                    <span>{language === 'en' && v.nameEn ? v.nameEn : v.nameBn}</span>
                    {v.priceDelta !== 0 && (
                      <span className={`text-[10px] ml-1 ${isSelected ? 'text-amber-200' : 'text-stone-500'}`}>
                        ({v.priceDelta > 0 ? `+৳${v.priceDelta}` : `-৳${Math.abs(v.priceDelta)}`})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons: Add to Bag & Buy Now */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Add to Bag */}
            <button
              onClick={handleAdd}
              disabled={isOutOfStock || isAdding}
              className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  : 'bg-emerald-50 text-[#0F4C3A] border-emerald-300 hover:bg-emerald-100 shadow-2xs'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAdding ? (language === 'bn' ? 'যোগ হচ্ছে...' : 'Adding...') : t('addToBag')}</span>
            </button>

            {/* 2. Instant Buy Now */}
            <button
              onClick={handleBuy}
              disabled={isOutOfStock}
              className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#0F4C3A] hover:bg-[#145C47] text-white hover:shadow-lg'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{t('buyNow')}</span>
            </button>
          </div>

          {/* Full Page Link */}
          <button
            onClick={handleFullPage}
            className="w-full py-2 text-center text-xs text-stone-600 hover:text-[#0F4C3A] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <span>{t('viewDetails')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trust badge footer */}
        <div className="bg-stone-50 px-4 py-2 border-t border-stone-100 flex items-center justify-center gap-1 text-[11px] text-stone-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{t('codPromise')}</span>
        </div>
      </div>
    </div>
  );
};
