import React, { useState } from 'react';
import { MessageCircle, X, ExternalLink, Phone, ShieldCheck, Headphones, Instagram } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface FloatingSocialBadgeProps {
  facebookUrl?: string;
  facebookUsername?: string;
  instagramUrl?: string;
  instagramUsername?: string;
  whatsappNumber?: string;
  phone?: string;
  isOpenControlled?: boolean;
  onOpenChangeControlled?: (open: boolean) => void;
}

export const FloatingSocialBadge: React.FC<FloatingSocialBadgeProps> = ({
  facebookUrl = '',
  facebookUsername = '',
  instagramUrl = '',
  instagramUsername = '',
  whatsappNumber = '',
  phone = '',
  isOpenControlled,
  onOpenChangeControlled
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;
  const setIsOpen = (val: boolean) => {
    if (onOpenChangeControlled) {
      onOpenChangeControlled(val);
    } else {
      setInternalOpen(val);
    }
  };
  const { language } = useLanguage();

  const cleanWaNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '';
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const waGreeting = encodeURIComponent(
    language === 'bn'
      ? 'সাশ্রয়ী দাম (Sashroyi Daam) থেকে সহায়তা প্রয়োজন।'
      : 'Hello! I need assistance with an order on Sashroyi Daam.'
  );

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-30 flex flex-col items-end">
      {/* Expanded Minimal Popover Card */}
      {isOpen && (
        <div className="mb-2.5 w-76 sm:w-80 bg-white rounded-2xl shadow-2xl border border-stone-200/95 p-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
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
                  <span>{language === 'bn' ? 'সরাসরি সহায়তা টিম সক্রিয়' : 'Live Team Active'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
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
                className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/90 border border-emerald-200/80 text-emerald-950 transition-all cursor-pointer group"
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
                className="flex items-center justify-between p-2 rounded-xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-200/80 text-purple-950 transition-all cursor-pointer group"
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
                className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 hover:bg-blue-100/80 border border-blue-200/80 text-blue-950 transition-all cursor-pointer group"
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

            {/* 4. Phone Hotline */}
            {phone && (
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-stone-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-stone-900">হটলাইন কল</div>
                    <div className="text-[10px] text-stone-600 font-medium">{phone}</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {!cleanWaNumber && !instagramUrl && !facebookUrl && !phone && (
              <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-500">
                {language === 'bn' ? 'যোগাযোগের চ্যানেল শীঘ্রই হালনাগাদ করা হবে।' : 'Support channels will be updated soon.'}
              </div>
            )}
          </div>

          <p className="text-[10px] text-stone-400 text-center pt-1 border-t border-stone-100">
            {language === 'bn' ? 'সকাল ৯টা – রাত ১০টা পর্যন্ত সক্রিয় সেবা' : 'Available 9:00 AM – 10:00 PM'}
          </p>
        </div>
      )}

      {/* Minimal Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#145C47] text-white px-3 sm:px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer border border-emerald-600/50"
        aria-label="সহায়তা ও যোগাযোগ"
        title="সহায়তা ও যোগাযোগ"
      >
        <div className="relative">
          <Headphones className="w-4 h-4 text-emerald-200 group-hover:text-white transition-colors" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </div>
        <span className="text-xs font-bold tracking-wide">
          {language === 'bn' ? 'সহায়তা' : 'Help'}
        </span>
      </button>
    </div>
  );
};
