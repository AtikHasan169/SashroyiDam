import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TrustGuaranteeBarProps {
  className?: string;
}

export const TrustGuaranteeBar: React.FC<TrustGuaranteeBarProps> = ({ className = '' }) => {
  const { language } = useLanguage();

  const guarantees = [
    {
      icon: <Truck className="w-5 h-5 text-[#0F4C3A]" />,
      bg: 'bg-emerald-50 text-[#0F4C3A] border-emerald-200/80',
      title: language === 'bn' ? 'সারাদেশে দ্রুত হোম ডেলিভারি' : 'Fastest Delivery',
      desc: language === 'bn' ? 'ঢাকায় ২৪-৪৮ ঘণ্টা, সারাদেশে ৭২ ঘণ্টায় ক্যাশ অন ডেলিভারি' : '24-48h in Dhaka, 72h nationwide Cash on Delivery'
    },
    {
      icon: <RefreshCw className="w-5 h-5 text-amber-700" />,
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      title: language === 'bn' ? 'সহজ রিটার্ন ও রিপ্লেসমেন্ট' : 'Easy Return Policy',
      desc: language === 'bn' ? '৭ দিনের মধ্যে সহজ এক্সচেঞ্জ ও রিপ্লেসমেন্ট সুবিধা' : '7 days easy return & replacement guarantee'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-teal-800" />,
      bg: 'bg-teal-50 text-teal-800 border-teal-200/80',
      title: language === 'bn' ? '১০০% আসল ও কোয়ালিটি নিশ্চিত' : '100% Quality Assured',
      desc: language === 'bn' ? 'ডেলিভারিম্যানের সামনে পার্সেল দেখে যাচাইয়ের নিশ্চয়তা' : 'Check parcel in front of delivery person before payment'
    },
    {
      icon: <Headphones className="w-5 h-5 text-sky-800" />,
      bg: 'bg-sky-50 text-sky-800 border-sky-200/80',
      title: language === 'bn' ? '২৪/৭ কাস্টমার সাপোর্ট' : 'Online Support 24/7',
      desc: language === 'bn' ? 'হটলাইন ও হোয়াটসঅ্যাপে সরাসরি তাৎক্ষণিক সহায়তা' : 'Direct hotline & WhatsApp live support'
    }
  ];

  return (
    <section className={`border-t border-b border-stone-200/80 bg-white py-3.5 sm:py-5 ${className}`}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
          {guarantees.map((g, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-stone-50/70 border border-stone-200/60 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all text-left"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${g.bg}`}>
                {g.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug truncate">
                  {g.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-stone-500 leading-tight mt-0.5 line-clamp-2">
                  {g.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

