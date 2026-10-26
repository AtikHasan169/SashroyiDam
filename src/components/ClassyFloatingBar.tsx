import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, MessageCircle, ArrowRight, X, ExternalLink, Phone, Instagram, Headphones } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ClassyFloatingBarProps {
  facebookUrl?: string;
  facebookUsername?: string;
  instagramUrl?: string;
  instagramUsername?: string;
  whatsappNumber?: string;
  phone?: string;
  supportHoursBn?: string;
}

export const ClassyFloatingBar: React.FC<ClassyFloatingBarProps> = ({
  facebookUrl = '',
  facebookUsername = '',
  instagramUrl = '',
  instagramUsername = '',
  whatsappNumber = '',
  phone = '',
  supportHoursBn = ''
}) => {
  const { totalItemCount, cartValidation, setIsCartDrawerOpen, isCartDrawerOpen } = useCart();
  const { language, t, formatPrice, formatNumber } = useLanguage();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCountRef = useRef(totalItemCount);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pulse effect when items are added to cart
  useEffect(() => {
    if (totalItemCount > prevCountRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 800);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalItemCount;
  }, [totalItemCount]);

  // Close support card when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSupportOpen(false);
      }
    };
    if (isSupportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSupportOpen]);

  if (isCartDrawerOpen) return null;

  const subtotal = cartValidation?.subtotal || 0;
  const cleanWaNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '';
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const waGreeting = encodeURIComponent(
    language === 'bn'
      ? 'সাশ্রয়ী দাম (Sashroyi Daam) থেকে সহায়তা প্রয়োজন।'
      : 'Hello! I need assistance with an order on Sashroyi Daam.'
  );

  const hasAnySupportChannel = Boolean(cleanWaNumber || instagramUrl || facebookUrl || phone);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-auto"
    >
      {/* 1. Interactive Support Contact Card Popover */}
      {isSupportOpen && (
        <div className="w-76 sm:w-80 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-stone-200/90 p-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#0F4C3A] flex items-center justify-center">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 leading-tight">
                  {language === 'bn' ? 'কাস্টমার কেয়ার ও সহায়তা' : 'Customer Care & Support'}
                </h4>
                <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span>{language === 'bn' ? 'সরাসরি সহায়তা টিম সক্রিয়' : 'Live Support Active'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSupportOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
              aria-label="Close support"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Social Channels Options in সহায়তা */}
          <div className="py-2.5 space-y-2 text-xs">
            {/* 1. WhatsApp Support */}
            {cleanWaNumber && (
              <a
                href={`https://wa.me/${cleanWaNumber}?text=${waGreeting}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/90 text-emerald-950 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-emerald-950 flex items-center gap-1">
                      <span>হোয়াটসঅ্যাপ (WhatsApp)</span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1 rounded">দ্রুততম</span>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-medium">ইনস্ট্যান্ট চ্যাট ও ছবির মাধ্যমে অর্ডার</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {/* 2. Instagram Support */}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 hover:bg-purple-100 border border-purple-200/90 text-purple-950 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Instagram className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-purple-950">ইনস্টাগ্রাম (Instagram)</div>
                    <div className="text-[10px] text-purple-700 font-medium">{instagramUsername || 'Instagram'}</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-purple-700 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {/* 3. Facebook Support */}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-200/90 text-blue-950 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    f
                  </div>
                  <div>
                    <div className="font-bold text-xs text-blue-950">ফেসবুক পেজ (Facebook)</div>
                    <div className="text-[10px] text-blue-700 font-medium">{facebookUsername || 'Facebook Page'}</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-700 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {/* 4. Phone Hotline Call */}
            {phone && (
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-stone-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-stone-900">হটলাইন কল</div>
                    <div className="text-[10px] text-stone-700 font-medium">{phone}</div>
                    {supportHoursBn && (
                      <div className="text-[9.5px] text-stone-500 font-normal mt-0.5">({supportHoursBn})</div>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {!hasAnySupportChannel && (
              <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-500">
                {language === 'bn' ? 'যোগাযোগের চ্যানেল শীঘ্রই হালনাগাদ করা হবে।' : 'Support channels will be updated soon.'}
              </div>
            )}
          </div>

          <p className="text-[10px] text-stone-400 text-center pt-1 border-t border-stone-100">
            {language === 'bn' ? 'সরাসরি সহায়তা ও অর্ডার সমাধান' : 'Direct order support & assistance'}
          </p>
        </div>
      )}

      {/* 2. Floating Live Cart Capsule (Shown on mobile viewports; desktop uses the top navbar cart) */}
      {totalItemCount > 0 && (
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className={`md:hidden flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-full shadow-[0_6px_25px_rgba(15,76,58,0.35)] border border-emerald-500/40 text-xs font-medium transition-all duration-300 active:scale-95 cursor-pointer animate-in slide-in-from-bottom-2 fade-in ${
            isPulsing ? 'scale-110 ring-4 ring-amber-400/80 shadow-emerald-500/50' : 'hover:scale-105'
          }`}
          title={t('shoppingCartTitle')}
          aria-label={t('cart')}
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4 text-emerald-100" />
            <span className="absolute -top-1.5 -right-2 bg-amber-400 text-stone-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {formatNumber(totalItemCount)}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 font-['Hind_Siliguri',sans-serif]">
            <span className="font-bold tabular-nums text-amber-300 text-xs sm:text-sm">
              {formatPrice(subtotal)}
            </span>
            <span className="text-[11px] text-emerald-200/90 border-l border-emerald-700/80 pl-1.5 hidden xs:inline">
              {language === 'bn' ? 'কার্ট' : 'Cart'}
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
        </button>
      )}

      {/* 3. Dedicated Floating Support Button ("সহায়তা") */}
      <button
        onClick={() => setIsSupportOpen(!isSupportOpen)}
        className="flex items-center gap-2 px-3.5 py-2 sm:py-2.5 bg-white text-emerald-900 hover:text-emerald-950 hover:bg-emerald-50/80 rounded-full shadow-[0_4px_22px_rgba(0,0,0,0.16)] border border-emerald-400/80 font-medium text-xs transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="সহায়তা ও যোগাযোগ (Help & Support)"
        aria-label="সহায়তা"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
        </div>
        <span className="font-bold text-emerald-900 text-xs sm:text-sm font-['Hind_Siliguri',sans-serif] tracking-wide pr-0.5">
          {language === 'bn' ? 'সহায়তা' : 'Help'}
        </span>
        <span className="relative flex h-2 w-2 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </button>
    </div>
  );
};
