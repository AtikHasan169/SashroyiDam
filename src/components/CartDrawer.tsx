import React from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cartValidation,
    updateQuantity,
    removeFromCart,
    clearCart,
    removeUnavailableItems,
    hasUnavailableItems,
    isValidating
  } = useCart();
  const { language, t, formatPrice, formatNumber } = useLanguage();

  if (!isCartDrawerOpen) return null;

  const items = cartValidation?.items || [];
  const subtotal = cartValidation?.subtotal || 0;
  const discount = cartValidation?.discount || 0;
  const warnings = cartValidation?.warnings || [];
  const availableItems = items.filter((it) => it.isAvailable);

  // SmartBazaar Free Delivery Progress Meter Calculation
  const FREE_DELIVERY_THRESHOLD = 2000;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const qualifiesForFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  const handleProceed = () => {
    if (hasUnavailableItems) {
      removeUnavailableItems();
    }
    setIsCartDrawerOpen(false);
    onProceedToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 text-left animate-in slide-in-from-right duration-300">
        
        {/* 1. Drawer Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[#0F4C3A]">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {t('shoppingCartTitle')}
              </h2>
              <p className="text-[11px] text-stone-500 font-medium">
                {items.length > 0 ? (language === 'bn' ? `${formatNumber(items.length)} টি পণ্য কার্টে যোগ করা হয়েছে` : `${items.length} items added`) : (language === 'bn' ? 'কোনো পণ্য নেই' : 'No items yet')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SmartBazaar Free Delivery Progress Meter */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            {qualifiesForFreeDelivery ? (
              <span className="text-emerald-800 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{t('freeDeliveryCongrat')}</span>
              </span>
            ) : (
              <span className="text-stone-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#0F4C3A]" />
                <span>
                  {t('freeDeliveryRemaining', { amount: formatPrice(remainingForFree) })}
                </span>
              </span>
            )}
            <span className="text-[11px] font-bold text-emerald-900 tabular-nums">
              {progressPercent}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-[#0F4C3A] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Unavailable items alert banner */}
        {hasUnavailableItems && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                {language === 'bn'
                  ? 'কার্টে কিছু অনুপলব্ধ পণ্য রয়েছে।'
                  : 'Some items in your cart are currently unavailable.'}
              </p>
            </div>
            <button
              onClick={removeUnavailableItems}
              className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg shrink-0 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাদ দিন' : 'Remove'}
            </button>
          </div>
        )}

        {/* Warnings Strip (if any) */}
        {warnings.length > 0 && !hasUnavailableItems && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* 3. Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-stone-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
                <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-stone-700">{t('emptyCart')}</p>
              <p className="text-xs text-stone-400 max-w-xs">
                {language === 'bn'
                  ? 'আমাদের সাশ্রয়ী দামের নতুন কালেকশন ঘুরে দেখুন এবং পছন্দের পণ্য যোগ করুন।'
                  : 'Explore our affordable collections and pick your favorite items.'}
              </p>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="mt-2 px-5 py-2 text-xs font-bold text-white bg-[#0F4C3A] hover:bg-[#145C47] rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {language === 'bn' ? 'কেনাকাটা শুরু করুন' : 'Start Shopping'}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const itemTitle = language === 'en' && item.product.titleEn ? item.product.titleEn : item.product.titleBn;
              const variantName = item.selectedVariant
                ? (language === 'en' && item.selectedVariant.nameEn ? item.selectedVariant.nameEn : item.selectedVariant.nameBn)
                : null;
              const isItemAvailable = item.isAvailable;

              return (
                <div
                  key={`${item.productId}-${item.variantId || 'base'}`}
                  className={`flex gap-3 p-3 rounded-2xl border transition-all shadow-2xs ${
                    isItemAvailable
                      ? 'border-stone-200 bg-white hover:border-emerald-200'
                      : 'border-amber-300 bg-amber-50/40'
                  }`}
                >
                  {/* Product Thumbnail */}
                  <div className="w-18 h-18 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0 relative">
                    <img
                      src={item.product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                      alt={itemTitle}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover ${!isItemAvailable ? 'opacity-60 grayscale' : ''}`}
                    />
                    {!isItemAvailable && (
                      <span className="absolute inset-x-0 bottom-0 bg-rose-600/90 text-[9px] text-white font-bold text-center py-0.5">
                        {language === 'bn' ? 'অনুপলব্ধ' : 'Unavailable'}
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className={`text-xs sm:text-sm font-bold line-clamp-1 ${isItemAvailable ? 'text-stone-900' : 'text-stone-500 line-through'}`}>
                          {itemTitle}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-1 -mr-1 cursor-pointer shrink-0"
                          title={language === 'bn' ? 'পণ্যটি সরান' : 'Remove item'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {variantName && (
                        <span className="inline-block mt-0.5 text-[11px] text-stone-500 font-medium bg-stone-100 px-1.5 py-0.2 rounded">
                          {language === 'bn' ? `অপশন: ${variantName}` : `Option: ${variantName}`}
                        </span>
                      )}

                      {isItemAvailable ? (
                        <div className="text-xs font-semibold text-[#0F4C3A] mt-1 tabular-nums">
                          {formatPrice(item.unitPrice)}
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-rose-700 mt-1">
                          {item.error || (language === 'bn' ? 'বর্তমানে আর বিক্রয়ের জন্য উপলব্ধ নেই' : 'Currently unavailable')}
                        </div>
                      )}
                    </div>

                    {/* Quantity Stepper & Line Total OR Remove Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2">
                      {isItemAvailable ? (
                        <>
                          <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="p-1.5 hover:bg-stone-200 text-stone-600 rounded-l transition-colors cursor-pointer"
                              aria-label={language === 'bn' ? 'কমান' : 'Decrease'}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-stone-900 tabular-nums">
                              {formatNumber(item.quantity)}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxAvailable}
                              className="p-1.5 hover:bg-stone-200 text-stone-600 rounded-r transition-colors cursor-pointer disabled:opacity-40"
                              aria-label={language === 'bn' ? 'বাড়ান' : 'Increase'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-bold text-stone-900 tabular-nums">
                              {formatPrice(item.itemSubtotal)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-stone-500 font-medium">
                            {language === 'bn' ? 'অর্ডারে যোগ হবে না' : 'Will not be ordered'}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.productId, item.variantId)}
                            className="text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer & Smart Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/90 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{t('discount')}</span>
                  <span className="tabular-nums">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>{t('deliveryFee')}</span>
                <span className="font-semibold text-stone-700">
                  {qualifiesForFreeDelivery
                    ? (language === 'bn' ? 'ফ্রি (০ ৳)' : 'Free (৳0)')
                    : (language === 'bn' ? 'চেকআউটে এলাকা অনুযায়ী' : 'Calculated at checkout')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">{t('totalPayable')}</span>
                <span className="text-lg font-bold text-[#0F4C3A] tabular-nums">
                  {formatPrice(Math.max(0, subtotal - discount))}
                </span>
              </div>
              <button
                onClick={handleProceed}
                disabled={isValidating || availableItems.length === 0}
                className="py-3 px-5 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>
                  {hasUnavailableItems && availableItems.length > 0
                    ? (language === 'bn' ? 'উপলব্ধ পণ্য নিয়ে অর্ডার করুন' : 'Order Available Items')
                    : t('proceedToOrder')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('codPromise')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
