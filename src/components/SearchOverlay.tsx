import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Tag, Star, ShoppingCart } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (categoryId: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onSelectCategory
}) => {
  const { language, t, formatPrice } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = searchTerm.trim().toLowerCase();

  const filteredProducts = trimmed
    ? products.filter((p) => {
        if (p.isArchived) return false;
        const inTitleBn = p.titleBn?.toLowerCase().includes(trimmed);
        const inTitleEn = p.titleEn?.toLowerCase().includes(trimmed);
        const inCatBn = p.categoryNameBn?.toLowerCase().includes(trimmed);
        const inCatSlug = p.categorySlug?.toLowerCase().includes(trimmed);
        const inBrand = p.brand?.toLowerCase().includes(trimmed);
        const inTags = p.tags?.some((t) => t.toLowerCase().includes(trimmed));
        return inTitleBn || inTitleEn || inCatBn || inCatSlug || inBrand || inTags;
      })
    : [];

  const dynamicCategories = Array.from(
    new Map(
      products
        .filter((p) => p.categoryId && p.categoryNameBn)
        .map((p) => [p.categoryId, { id: p.categoryId, nameBn: p.categoryNameBn!, nameEn: p.categorySlug || '' }])
    ).values()
  ).slice(0, 4);

  const quickPicks = dynamicCategories.length > 0
    ? dynamicCategories.map((c) => ({ labelBn: c.nameBn, labelEn: c.nameEn, catId: c.id }))
    : [
        { labelBn: 'সকল পণ্য', labelEn: 'All Products', catId: 'all' },
        { labelBn: 'নতুন অফার', labelEn: 'Special Offers', catId: 'all' }
      ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-start">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
      />

      {/* Search Container */}
      <div className="relative z-10 w-full max-w-3xl mx-auto mt-2 sm:mt-8 px-3 sm:px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Top Search Input Bar */}
          <div className="p-3 sm:p-4 border-b border-stone-200 flex items-center gap-3 bg-stone-50/70">
            <Search className="w-5 h-5 text-[#0F4C3A] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'en' ? 'Search by product name, category, or keyword...' : 'পণ্যের নাম, ক্যাটাগরি বা বিষয় লিখে খুঁজুন...'}
              className="flex-1 bg-transparent text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors"
                title="মুছে ফেলুন"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 rounded-lg transition-colors cursor-pointer"
            >
              ESC / {language === 'en' ? 'Close' : 'বন্ধ'}
            </button>
          </div>

          {/* Quick Suggestions when empty */}
          {!trimmed && (
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#0F4C3A]" />
                  <span>{language === 'en' ? 'Suggested Categories' : 'জনপ্রিয় ক্যাটাগরি'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickPicks.map((pick) => (
                    <button
                      key={pick.catId}
                      onClick={() => {
                        onSelectCategory(pick.catId);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-[#0F4C3A] hover:border-emerald-300 border border-stone-200 text-xs font-semibold text-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{language === 'en' ? pick.labelEn : pick.labelBn}</span>
                      <ArrowRight className="w-3 h-3 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Top picks preview */}
              <div>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                  {language === 'en' ? 'Featured Picks' : 'সেরা পণ্যসমূহ'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {products.slice(0, 4).map((p) => {
                    const title = language === 'en' && p.titleEn ? p.titleEn : p.titleBn;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="p-2 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer flex items-center gap-3 text-left group"
                      >
                        <img
                          src={p.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                          alt={title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-stone-900 group-hover:text-[#0F4C3A] truncate">
                            {title}
                          </h4>
                          <div className="text-xs font-bold text-emerald-800 tabular-nums mt-0.5">
                            {formatPrice(p.price)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {trimmed && (
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
              <div className="text-xs text-stone-500 font-medium px-1 pb-1">
                {language === 'en'
                  ? `Found ${filteredProducts.length} result(s)`
                  : `${filteredProducts.length} টি পণ্য পাওয়া গেছে`}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-stone-500">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-xl mb-2 text-stone-400">
                    🔍
                  </div>
                  <p className="text-sm font-semibold text-stone-800">
                    {language === 'en' ? 'No matching products found' : 'কোনো পণ্য পাওয়া যায়নি'}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    {language === 'en' ? 'Try searching with another keyword' : 'ভিন্ন কোনো নাম বা কিওয়ার্ড দিয়ে পুনরায় খুঁজুন'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => {
                    const title = language === 'en' && p.titleEn ? p.titleEn : p.titleBn;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="py-2.5 px-2 rounded-xl hover:bg-stone-50 flex items-center justify-between gap-3 cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={p.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                            alt={title}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                              {p.brand ? `${p.brand} · ` : ''}{language === 'en' && p.categorySlug ? p.categorySlug : (p.categoryNameBn || 'সাধারণ')}
                            </div>
                            <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#0F4C3A] truncate mt-0.5">
                              {title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-emerald-800 tabular-nums">
                                {formatPrice(p.price)}
                              </span>
                              {p.originalPrice && (
                                <span className="text-xs text-stone-400 line-through tabular-nums">
                                  {formatPrice(p.originalPrice)}
                                </span>
                              )}
                              {p.stock <= 0 ? (
                                <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded">
                                  {t('outOfStock')}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                                  {t('inStock')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#0F4C3A] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>{language === 'en' ? 'View' : 'দেখুন'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
