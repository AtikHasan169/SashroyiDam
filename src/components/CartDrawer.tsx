import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

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
    isValidating
  } = useCart();

  if (!isCartDrawerOpen) return null;

  const items = cartValidation?.items || [];
  const subtotal = cartValidation?.subtotal || 0;
  const discount = cartValidation?.discount || 0;
  const warnings = cartValidation?.warnings || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 text-left">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0F4C3A]" />
            <h2 className="text-base font-bold text-stone-900">
              আপনার শপিং ব্যাগ ({items.length})
            </h2>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warnings Strip (if any) */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-stone-400 space-y-3">
              <ShoppingBag className="w-12 h-12 text-stone-300 stroke-[1.5]" />
              <p className="text-sm font-medium text-stone-600">আপনার শপিং ব্যাগ খালি রয়েছে</p>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#0F4C3A] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                পণ্য দেখুন
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'base'}`}
                className="flex gap-3.5 p-3 rounded-xl border border-stone-200/80 bg-stone-50/50"
              >
                {/* Product Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-stone-200 shrink-0">
                  <img
                    src={item.product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                    alt={item.product.titleBn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 line-clamp-1">
                      {item.product.titleBn}
                    </h3>
                    {item.selectedVariant && (
                      <span className="text-[11px] text-stone-500 font-medium">
                        অপশন: {item.selectedVariant.nameBn}
                      </span>
                    )}
                    <div className="text-xs font-semibold text-[#0F4C3A] mt-0.5 tabular-nums">
                      ৳{item.unitPrice.toLocaleString('bn-BD')}
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-stone-200 rounded-md bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="p-1 hover:bg-stone-100 text-stone-600 rounded-l transition-colors cursor-pointer"
                        aria-label="কমান"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-stone-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxAvailable}
                        className="p-1 hover:bg-stone-100 text-stone-600 rounded-r transition-colors cursor-pointer disabled:opacity-40"
                        aria-label="বাড়ান"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 tabular-nums">
                        ৳{item.itemSubtotal.toLocaleString('bn-BD')}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-stone-200 bg-stone-50/70 space-y-3.5">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>পণ্যের উপমোট (Subtotal):</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  ৳{subtotal.toLocaleString('bn-BD')}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>কুপন ছাড় (Discount):</span>
                  <span className="tabular-nums">-৳{discount.toLocaleString('bn-BD')}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>ডেলিভারি চার্জ:</span>
                <span>চেকআউটে এলাকা নির্বাচন অনুযায়ী হিসাব হবে</span>
              </div>
              {subtotal < 2000 && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200/60">
                  আর মাত্র ৳{(2000 - subtotal).toLocaleString('bn-BD')} টাকার কেনাকাটায় ফ্রি ডেলিভারি!
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
              <span className="text-sm font-bold text-stone-900">মোট আনুমানিক:</span>
              <span className="text-lg font-bold text-[#0F4C3A] tabular-nums">
                ৳{Math.max(0, subtotal - discount).toLocaleString('bn-BD')}
              </span>
            </div>

            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                onProceedToCheckout();
              }}
              disabled={isValidating || items.length === 0}
              className="w-full py-3.5 px-4 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl font-bold text-sm shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>চেকআউট করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>নিরাপদ চেকআউট ও ক্যাশ অন ডেলিভারি</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
