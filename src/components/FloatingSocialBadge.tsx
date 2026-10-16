import React, { useState } from 'react';
import { MessageCircle, X, ExternalLink, Phone, ShieldCheck } from 'lucide-react';

interface FloatingSocialBadgeProps {
  facebookUrl?: string;
  facebookUsername?: string;
  phone?: string;
}

export const FloatingSocialBadge: React.FC<FloatingSocialBadgeProps> = ({
  facebookUrl = 'https://facebook.com/sashroyidaam',
  facebookUsername = '@sashroyidaam',
  phone = '০৯৬১২-৮৮৯৯০০'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30 flex flex-col items-end">
      {/* Expanded Popover Card */}
      {isOpen && (
        <div className="mb-3 w-76 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200/90 p-4 text-left animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                f
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 leading-tight">সাশ্রয়ী দাম</h4>
                <p className="text-[11px] text-stone-500 font-medium">অফিসিয়াল ফেসবুক পেজ ও হেল্পডেস্ক</p>
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

          <div className="py-3 space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>১০০% আসল পণ্য ও দ্রুত সমাধান</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-500 pt-0.5">
              অর্ডার সংক্রান্ত যেকোনো তথ্য, পণ্যের ভিডিও দেখতে বা সরাসরি কথা বলতে আমাদের ফেসবুক পেজে যোগাযোগ করুন।
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#1877F2] hover:bg-[#1567d3] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span className="font-bold text-sm leading-none">f</span>
              <span>ফেসবুক পেজে যান ({facebookUsername})</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
            </a>

            <a
              href={`tel:${phone.replace(/[^0-9]/g, '') || '09612889900'}`}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-stone-500" />
              <span>হটলাইন: {phone}</span>
            </a>
          </div>
        </div>
      )}

      {/* Trigger Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 bg-[#1877F2] hover:bg-[#1567d3] text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer border-2 border-white"
        aria-label="ফেসবুক পেজ ও সাপোর্ট"
      >
        <span className="w-5 h-5 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-bold text-xs shadow-2xs">
          f
        </span>
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">
          ফেসবুক পেজ
        </span>
        <span className="text-xs font-semibold tracking-wide sm:hidden">
          সহায়তা
        </span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
      </button>
    </div>
  );
};
