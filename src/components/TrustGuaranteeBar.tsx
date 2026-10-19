import React from 'react';
import { Truck, ShieldCheck, RefreshCw } from 'lucide-react';

interface TrustGuaranteeBarProps {
  className?: string;
}

export const TrustGuaranteeBar: React.FC<TrustGuaranteeBarProps> = ({ className = '' }) => {
  return (
    <section className={`border-t border-b border-stone-200/70 bg-white py-4 sm:py-5 ${className}`}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Guarantee 1: Nationwide Delivery */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-200/60 transition-all hover:bg-emerald-50/30">
            <div className="w-9 h-9 rounded-lg bg-emerald-100/80 border border-emerald-200/70 flex items-center justify-center shrink-0 text-[#0F4C3A]">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-['Hind_Siliguri',sans-serif] leading-snug">
                সারাদেশে দ্রুত হোম ডেলিভারি
              </h3>
              <p className="text-[11px] text-stone-500 leading-tight font-['Hind_Siliguri',sans-serif] truncate sm:whitespace-normal">
                ঢাকায় ২৪-৪৮ ঘণ্টা, সারাদেশে ৭২ ঘণ্টায় ক্যাশ অন ডেলিভারি
              </p>
            </div>
          </div>

          {/* Guarantee 2: Open Box Verification Before Payment */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-200/60 transition-all hover:bg-amber-50/30">
            <div className="w-9 h-9 rounded-lg bg-amber-100/80 border border-amber-200/70 flex items-center justify-center shrink-0 text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-['Hind_Siliguri',sans-serif] leading-snug">
                দেখে যাচাই করে মূল্য পরিশোধ
              </h3>
              <p className="text-[11px] text-stone-500 leading-tight font-['Hind_Siliguri',sans-serif] truncate sm:whitespace-normal">
                ডেলিভারিম্যানের সামনে পার্সেল যাচাই করার শতভাগ নিশ্চয়তা
              </p>
            </div>
          </div>

          {/* Guarantee 3: 7 Days Easy Replacement */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-200/60 transition-all hover:bg-teal-50/30">
            <div className="w-9 h-9 rounded-lg bg-teal-100/80 border border-teal-200/70 flex items-center justify-center shrink-0 text-teal-800">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-['Hind_Siliguri',sans-serif] leading-snug">
                ৭ দিনের সহজ রিপ্লেসমেন্ট
              </h3>
              <p className="text-[11px] text-stone-500 leading-tight font-['Hind_Siliguri',sans-serif] truncate sm:whitespace-normal">
                কোনো পণ্য সমস্যা হলে ৭ দিনের মধ্যে দ্রুত রিপ্লেসমেন্ট বা রিফান্ড
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
