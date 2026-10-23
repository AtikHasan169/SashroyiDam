import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import type { Category } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface CategoryShowcaseProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  const { language, formatNumber } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (catId: string) => {
    onSelectCategory(catId);
    setTimeout(() => {
      const el = document.getElementById('products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="py-6 sm:py-8 bg-white border-b border-stone-200">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        {/* Section Header with Left/Right Scroll Controls */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C3A]" />
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                {language === 'en' ? 'Top Categories' : 'শীর্ষ ক্যাটাগরি'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {language === 'en'
                ? 'Swipe horizontally & tap any category to view its products'
                : 'যেকোনো ক্যাটাগরিতে ক্লিক করে সেই বিভাগের পণ্যগুলো সরাসরি দেখুন'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`text-xs sm:text-sm font-semibold transition-colors px-3 py-1.5 rounded-xl cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-100 text-[#0F4C3A]'
                  : 'text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200'
              }`}
            >
              {language === 'en' ? 'All Products' : 'সকল পণ্য'}
            </button>

            {/* Scroll Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Carousel Track */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Categories Card */}
          <button
            onClick={() => handleCategoryClick('all')}
            className={`snap-start shrink-0 w-36 sm:w-44 text-left rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between group p-3.5 ${
              selectedCategory === 'all'
                ? 'border-[#0F4C3A] ring-2 ring-[#0F4C3A]/20 bg-emerald-50/50'
                : 'border-stone-200 hover:border-emerald-300 bg-stone-50 hover:shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#0F4C3A] text-white flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {language === 'en' ? 'All Categories' : 'সকল বিভাগ'}
              </span>
              <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#0F4C3A] transition-colors mt-0.5">
                {language === 'en' ? 'Complete Store' : 'পুরো কালেকশন'}
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                {language === 'en' ? 'Explore all items' : 'সব পণ্য দেখুন'}
              </p>
            </div>
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`snap-start shrink-0 w-44 sm:w-52 text-left rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-[#0F4C3A] ring-2 ring-[#0F4C3A]/25 bg-emerald-50/40 shadow-sm'
                    : 'border-stone-200/90 hover:border-emerald-300 bg-white hover:shadow-md'
                }`}
              >
                <div className="aspect-16/10 overflow-hidden bg-stone-100 relative">
                  <img
                    src={cat.image || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                    alt={cat.nameBn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors" />
                </div>

                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider truncate">
                      {cat.nameEn || cat.slug}
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 mt-0.5 group-hover:text-[#0F4C3A] transition-colors truncate">
                      {language === 'en' && cat.nameEn ? cat.nameEn : cat.nameBn}
                    </h3>
                  </div>

                  <div className="text-[11px] text-emerald-800 font-semibold mt-2 flex items-center justify-between">
                    <span>
                      {formatNumber(cat.productCount ?? 0)} {language === 'bn' ? 'টি পণ্য' : 'products'}
                    </span>
                    <span className="text-xs group-hover:translate-x-1 transition-transform text-[#0F4C3A]">
                      →
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
