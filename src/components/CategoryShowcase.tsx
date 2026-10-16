import React from 'react';
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

  return (
    <section id="categories" className="py-8 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {language === 'en' ? 'Popular Categories' : 'জনপ্রিয় ক্যাটাগরি'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {language === 'en' ? 'Your everyday essential picks at a glance' : 'আপনার নিত্যপ্রয়োজনীয় পছন্দসমূহ এক নজরে'}
            </p>
          </div>

          <button
            onClick={() => onSelectCategory('all')}
            className={`text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'text-[#0F4C3A] underline underline-offset-4'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            {language === 'en' ? 'View All Categories' : 'সব ক্যাটাগরি দেখুন'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`group text-left rounded-xl overflow-hidden border transition-all cursor-pointer bg-stone-50 ${
                  isSelected
                    ? 'border-[#0F4C3A] ring-2 ring-[#0F4C3A]/20 bg-emerald-50/20'
                    : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                }`}
              >
                <div className="aspect-4/3 overflow-hidden bg-stone-200 relative">
                  <img
                    src={cat.image}
                    alt={cat.nameBn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="p-3.5">
                  <div className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                    {cat.nameEn}
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5 group-hover:text-[#0F4C3A] transition-colors">
                    {language === 'en' && cat.nameEn ? cat.nameEn : cat.nameBn}
                  </h3>
                  <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1.5">
                    <span>{formatNumber(cat.productCount ?? 0)} {language === 'bn' ? 'টি পণ্য' : 'products'}</span>
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
