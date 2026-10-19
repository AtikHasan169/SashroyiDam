import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types/index.ts';

interface HeroSlide {
  id: string;
  image: string;
  alt: string;
  productId?: string;
  categoryId?: string;
}

interface HeroProps {
  onExploreClick: () => void;
  onSelectCategory?: (categoryId: string) => void;
  products?: Product[];
  onOpenProduct?: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreClick,
  onSelectCategory,
  products = [],
  onOpenProduct
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Dynamic slides list: Use high quality promotional assets & top products
  const defaultSlides: HeroSlide[] = [
    {
      id: 'slide-1',
      image: '/src/assets/images/hero_oshesh_lifestyle_1792084990587.jpg',
      alt: 'সাশ্রয়ী দাম মেগা অফার ও উৎসব ডিসকাউন্ট'
    },
    {
      id: 'slide-2',
      image: '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
      alt: 'টেকসই ও খাঁটি কিচেনওয়্যার কালেকশন',
      categoryId: 'cat-kitchen'
    },
    {
      id: 'slide-3',
      image: '/src/assets/images/category_fashion_handcraft_1792084990401.jpg',
      alt: 'ঐতিহ্যবাহী তাঁত ও আরামদায়ক সুতি পোশাক',
      categoryId: 'cat-fashion'
    },
    {
      id: 'slide-4',
      image: '/src/assets/images/category_tech_lifestyle_1792084991359.jpg',
      alt: 'স্মার্ট গ্যাজেট ও লাইফস্টাইল কালেকশন',
      categoryId: 'cat-gadgets'
    }
  ];

  // If products are available with images, incorporate top products into the pure image carousel
  const productSlides: HeroSlide[] = products
    .filter(p => !p.isArchived && p.isPublished !== false && p.images && p.images.length > 0)
    .slice(0, 3)
    .map((p, idx) => ({
      id: `prod-slide-${p.id || idx}`,
      image: p.images[0],
      alt: p.titleBn || p.titleEn || '',
      productId: p.id
    }));

  const allSlides = productSlides.length > 0 ? [...defaultSlides.slice(0, 2), ...productSlides] : defaultSlides;
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
      const found = products.find(p => p.id === slide.productId);
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
