import React from 'react';
import { Truck, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  bannerTitle?: string;
  bannerSubtitle?: string;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreClick,
  bannerTitle = 'আপনার পছন্দ, অশেষ সম্ভাবনা',
  bannerSubtitle = 'বাংলাদেশের প্রতিটি গৃহস্থালির জন্য যাচাইকৃত রান্নাঘরের সামগ্রী, দেশীয় তাঁতের ঐতিহ্যবাহী পোশাক এবং টেকসই গ্যাজেটের নির্ভরযোগ্য সংগ্রহ।'
}) => {
  return (
    <div className="relative bg-[#FAF9F6] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
        {/* Main 2-Column Balanced Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F4C3A] tracking-wider uppercase">
                <span>জাতীয় অনলাইন রিটেইল</span>
                <span aria-hidden="true">·</span>
                <span>বাংলাদেশ</span>
              </div>
              <a
                href="https://facebook.com/sashroyidaam"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full text-xs font-semibold border border-blue-200 transition-colors"
              >
                <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold">f</span>
                <span>সাশ্রয়ী দাম | @sashroyidaam</span>
              </a>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-[1.2] text-balance">
              {bannerTitle}
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
              {bannerSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="px-6 py-3.5 bg-[#0F4C3A] text-white hover:bg-[#135D48] rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
              >
                <span>পণ্যসমূহ দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-xs text-stone-500 font-medium pl-2">
                <span>সারাদেশে ৬৪ জেলায় সরাসরি হোম ডেলিভারি</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-stone-200/80 bg-stone-100 aspect-16/10 lg:aspect-4/3 group">
              <img
                src="/src/assets/images/hero_oshesh_lifestyle_1792084990587.jpg"
                alt="অশেষ - আধুনিক বাংলাদেশি গৃহস্থালি ও লাইফস্টাইল সংগ্রহ"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <div className="text-xs font-medium text-emerald-200">
                    জীবনযাত্রার নির্ভরযোগ্য সঙ্গী
                  </div>
                  <div className="text-base sm:text-lg font-semibold">
                    সঠিক মান ও সাশ্রয়ী মূল্যের নিশ্চয়তা
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Trust Strip Below Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 lg:pt-12 mt-8 border-t border-stone-200">
          <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white border border-stone-200/70">
            <div className="p-2 bg-emerald-50 text-[#0F4C3A] rounded-md shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">ক্যাশ অন ডেলিভারি</h2>
              <p className="text-xs text-stone-500 mt-0.5">পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white border border-stone-200/70">
            <div className="p-2 bg-emerald-50 text-[#0F4C3A] rounded-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">যাচাইকৃত পণ্যের নিশ্চয়তা</h2>
              <p className="text-xs text-stone-500 mt-0.5">সরাসরি মান যাচাই করে সরবরাহকৃত</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white border border-stone-200/70">
            <div className="p-2 bg-emerald-50 text-[#0F4C3A] rounded-md shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">সহজ রিটার্ন সুবিধা</h2>
              <p className="text-xs text-stone-500 mt-0.5">ত্রুটিযুক্ত পণ্যে সহজ বদল ও সহায়তা</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
