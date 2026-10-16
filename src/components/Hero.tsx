import React, { useState, useEffect, useRef } from 'react';
import { Truck, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface HeroProps {
  onExploreClick: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

interface HeroSlide {
  id: string;
  categoryId: string;
  tagBn: string;
  tagEn: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  badgeBn: string;
  badgeEn: string;
  image: string;
  alt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-kitchen',
    categoryId: 'cat-kitchen',
    tagBn: 'গৃহস্থালি ও রান্নাঘর',
    tagEn: 'Kitchen & Cookware',
    titleBn: 'রান্নাঘরের সেরা সাজ ও টেকসই সামগ্রী',
    titleEn: 'Best Kitchen Cookware & Everyday Essentials',
    subtitleBn: 'স্বাস্থ্যসম্মত স্টেইনলেস স্টিল, প্রিমিয়াম নন-স্টিক কুকার ও নিত্যপ্রয়োজনীয় কিচেন টুলসের নির্ভরযোগ্য কালেকশন সারাদেশে সাশ্রয়ী দামে।',
    subtitleEn: 'Healthy stainless steel, non-stick cookers & durable kitchen tools at affordable prices nationwide.',
    badgeBn: 'বেস্ট সেলার অফার',
    badgeEn: 'Best Seller',
    image: '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
    alt: 'রান্নাঘরের সামগ্রী ও কুকওয়্যার সেট'
  },
  {
    id: 'slide-fashion',
    categoryId: 'cat-fashion',
    tagBn: 'দেশীয় ফ্যাশন ও ঐতিহ্য',
    tagEn: 'Heritage & Fashion',
    titleBn: 'প্রিমিয়াম সুতি পোশাক ও দেশীয় হ্যান্ডক্রাফট',
    titleEn: 'Premium Cotton Apparel & Artisan Crafts',
    subtitleBn: 'টাঙ্গাইলের ঐতিহ্যবাহী নিখুঁত তাঁতের কাপড়, প্রিমিয়াম কটন পাঞ্জাবি ও দেশীয় কারিগরদের নান্দনিক পোশাকের সমৃদ্ধ সমাহার।',
    subtitleEn: 'Authentic Tangail weaves, premium cotton panjabis & artisan handcrafted apparel.',
    badgeBn: 'নতুন আগমন',
    badgeEn: 'New Arrival',
    image: '/src/assets/images/category_fashion_handcraft_1792084990401.jpg',
    alt: 'দেশীয় সুতি ফ্যাশন ও কারুকাজ'
  },
  {
    id: 'slide-gadgets',
    categoryId: 'cat-gadgets',
    tagBn: 'স্মার্ট গ্যাজেট ও লাইফস্টাইল',
    tagEn: 'Smart Tech & Gadgets',
    titleBn: 'দৈনন্দিন লাইফস্টাইল ও টেক অ্যাক্সেসরিজ',
    titleEn: 'Everyday Tech & Modern Lifestyle Gadgets',
    subtitleBn: 'হাই-স্পিড চার্জার, ব্লুটুথ অডিও ডিভাইস ও আধুনিক টেক সামগ্রী — নিশ্চিন্ত ওয়ারেন্টি ও দ্রুত ডেলিভারির সুবিধা।',
    subtitleEn: 'High-speed chargers, bluetooth audio & modern lifestyle gadgets with warranty & fast delivery.',
    badgeBn: 'স্মার্ট চয়েস',
    badgeEn: 'Smart Choice',
    image: '/src/assets/images/category_tech_lifestyle_1792084991359.jpg',
    alt: 'স্মার্ট টেক ও লাইফস্টাইল গ্যাজেট'
  }
];

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onSelectCategory }) => {
  const { language, t } = useLanguage();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeSlide = HERO_SLIDES[currentSlideIndex];

  // Auto-play timer (5 seconds)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    if (deltaX > 40) {
      handlePrev();
    } else if (deltaX < -40) {
      handleNext();
    }
    touchStartX.current = null;
  };

  const handleSlideCta = () => {
    if (onSelectCategory && activeSlide.categoryId) {
      onSelectCategory(activeSlide.categoryId);
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onExploreClick();
    }
  };

  return (
    <div
      className="relative bg-[#FAF9F6] border-b border-stone-200 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        {/* Main 2-Column Balanced Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[380px] sm:min-h-[420px]">
          {/* Left Column: Typography & CTAs with Smooth Content Transition */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#0F4C3A] tracking-wider uppercase">
                {language === 'en' ? activeSlide.tagEn : activeSlide.tagBn}
              </span>
              <span className="text-stone-300 font-bold" aria-hidden="true">·</span>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{language === 'en' ? activeSlide.badgeEn : activeSlide.badgeBn}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-[1.2] text-balance transition-all duration-500">
              {language === 'en' ? activeSlide.titleEn : activeSlide.titleBn}
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl transition-opacity duration-500">
              {language === 'en' ? activeSlide.subtitleEn : activeSlide.subtitleBn}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              <button
                onClick={handleSlideCta}
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-[#0F4C3A] text-white hover:bg-[#135D48] rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
              >
                <span>{language === 'en' ? 'View This Collection' : 'এই কালেকশন দেখুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreClick}
                className="px-4 py-3 text-stone-700 hover:text-stone-900 font-medium text-sm rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Explore All Products' : 'সকল পণ্য দেখুন'}
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Carousel Container */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-stone-200/80 bg-stone-100 aspect-16/10 lg:aspect-4/3 group">
              {/* Image with smooth fade & zoom transitions */}
              {HERO_SLIDES.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    idx === currentSlideIndex
                      ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                      : 'opacity-0 scale-98 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                  {/* Subtle Gradient Scrim with contextual highlight */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/10 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <div className="text-xs font-semibold text-emerald-300">
                        {slide.tagBn}
                      </div>
                      <div className="text-sm sm:text-base font-medium text-stone-100">
                        সঠিক মান ও সাশ্রয়ী মূল্যের বিশ্বস্ত নিশ্চয়তা
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prev / Next Carousel Arrow Buttons (desktop visible on group hover, mobile always discreet) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                aria-label="আগের স্লাইড"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                aria-label="পরের স্লাইড"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Slide Indicator Dots */}
              <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentSlideIndex
                        ? 'w-5 bg-white'
                        : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`স্লাইড ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Trust Strip Below Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-stone-200">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200/70 shadow-2xs">
            <div className="p-2 bg-emerald-50 text-[#0F4C3A] rounded-lg shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-stone-900">
                {language === 'en' ? 'Cash on Delivery' : 'ক্যাশ অন ডেলিভারি'}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                {language === 'en' ? 'Pay upon receiving & checking package' : 'পণ্য হাতে পেয়ে যাচাই করে মূল্য পরিশোধ'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200/70 shadow-2xs">
            <div className="p-2 bg-emerald-50 text-[#0F4C3A] rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-stone-900">
                {language === 'en' ? '100% Genuine Guaranteed' : '১০০% আসল পণ্যের নিশ্চয়তা'}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                {language === 'en' ? 'Verified quality & 7-day easy returns' : 'যাচাইকৃত কোয়ালিটি ও সহজ ৭ দিনের রিটার্ন'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200/70 shadow-2xs">
            <div className="p-2 bg-emerald-50 text-[#0F4C3A] rounded-lg shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-stone-900">
                {language === 'en' ? 'Nationwide 64 District Delivery' : 'সারাদেশে ৬৪ জেলায় ডেলিভারি'}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                {language === 'en' ? 'Free delivery on orders over ৳2,000' : '২,০০০ টাকার অর্ডারে দেশজুড়ে ফ্রি ডেলিভারি'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
