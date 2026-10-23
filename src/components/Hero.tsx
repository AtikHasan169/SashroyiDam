import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import type { Product, Banner } from '../types/index.ts';

interface HeroSlide {
  id: string;
  image: string;
  alt: string;
  productId?: string;
  categoryId?: string;
  link?: string;
}

interface HeroProps {
  onExploreClick: () => void;
  onSelectCategory?: (categoryId: string) => void;
  products?: Product[];
  banners?: Banner[];
  onOpenProduct?: (product: Product) => void;
  onOpenAdmin?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreClick,
  onSelectCategory,
  products = [],
  banners = [],
  onOpenProduct,
  onOpenAdmin
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Dynamic slides from configured store banners
  const bannerSlides: HeroSlide[] = (banners || [])
    .filter((b) => b.isActive && b.imageUrl)
    .map((b) => ({
      id: b.id,
      image: b.imageUrl,
      alt: b.titleBn || '',
      link: b.link
    }));

  // If products are available with images, incorporate top products into the pure image carousel
  const productSlides: HeroSlide[] = (products || [])
    .filter((p) => !p.isArchived && p.isPublished !== false && p.images && p.images.length > 0)
    .slice(0, 3)
    .map((p, idx) => ({
      id: `prod-slide-${p.id || idx}`,
      image: p.images[0],
      alt: p.titleBn || p.titleEn || '',
      productId: p.id
    }));

  const allSlides = [...bannerSlides, ...productSlides];
  const totalSlides = allSlides.length;

  // Auto-change timer every 4 seconds
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 45) {
      handlePrev();
    } else if (diff < -45) {
      handleNext();
    }
    touchStartX.current = null;
  };

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.productId && onOpenProduct) {
      const found = products.find((p) => p.id === slide.productId);
      if (found) {
        onOpenProduct(found);
        return;
      }
    }
    if (slide.categoryId && onSelectCategory) {
      onSelectCategory(slide.categoryId);
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    onExploreClick();
  };

  if (allSlides.length === 0) {
    return (
      <section className="w-full overflow-hidden bg-[#FAF9F6] py-3 sm:py-5">
        <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#07241A] via-[#0F4C3A] to-[#145642] text-white p-6 sm:p-10 md:p-14 shadow-lg min-h-[200px] sm:min-h-[260px] flex flex-col justify-center border border-emerald-900/40">
            <div className="max-w-2xl space-y-3 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>সাশ্রয়ী দাম — আপনার বিশ্বস্ত অনলাইন রিটেইল</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-emerald-100/90 leading-relaxed max-w-xl">
                ক্যাটালগ সম্পূর্ণ প্রস্তুত। অ্যাডমিন প্যানেল থেকে আপনার নিজস্ব পণ্য, ক্যাটাগরি এবং ব্যানার যুক্ত করে দ্রুত বিক্রি শুরু করুন।
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onExploreClick}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span>পণ্য অন্বেষণ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Subtle decorative background circles */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full overflow-hidden bg-[#FAF9F6] py-3 sm:py-5">
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Pure Auto-Changing Banner Carousel */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 shadow-md group select-none aspect-[16/7] sm:aspect-[21/8] md:aspect-[24/8] 2xl:aspect-[26/8] min-h-[190px] sm:min-h-[280px] md:min-h-[340px] 2xl:min-h-[380px] max-h-[460px] 2xl:max-h-[520px]"
        >
          {/* Images with smooth opacity crossfade */}
          {allSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id}
                onClick={() => handleSlideClick(slide)}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-[1.01] transition-transform duration-700"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            );
          })}

          {/* Previous / Next Arrow Navigation Controls */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs cursor-pointer border border-white/20 shadow-md"
                aria-label="Previous Banner"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs cursor-pointer border border-white/20 shadow-md"
                aria-label="Next Banner"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Dots Pagination */}
          {totalSlides > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              {allSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 sm:w-8 bg-amber-400'
                      : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
