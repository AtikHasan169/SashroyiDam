import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowUpDown, Filter, ChevronRight, Layers, SlidersHorizontal, Check } from 'lucide-react';
import type { Category, Product } from '../types/index.ts';
import { ProductCard } from './ProductCard.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface CategoryPageProps {
  category: Category;
  allCategories: Category[];
  products: Product[];
  onBackToHome: () => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenProduct: (product: Product) => void;
  onDirectBuy: (product: Product) => void;
  onQuickAddToast: (product: Product) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  allCategories,
  products,
  onBackToHome,
  onSelectCategory,
  onOpenProduct,
  onDirectBuy,
  onQuickAddToast
}) => {
  const { language, t, formatNumber, formatPrice } = useLanguage();

  const [sortOption, setSortOption] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  // Filter and sort products for this category
  const filteredProducts = useMemo(() => {
    let list = products.filter(
      (p) => p.categoryId === category.id || p.categorySlug === category.slug
    );

    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    if (maxPrice < 10000) {
      list = list.filter((p) => p.price <= maxPrice);
    }

    return [...list].sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return (b.isHotDeal ? 1 : 0) - (a.isHotDeal ? 1 : 0);
      }
    });
  }, [products, category, inStockOnly, maxPrice, sortOption]);

  const categoryName = language === 'en' && category.nameEn ? category.nameEn : category.nameBn;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20">
      {/* 1. Breadcrumbs & Top Navigation Bar */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
            <button
              onClick={onBackToHome}
              className="hover:text-[#0F4C3A] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'হোম পেজ' : 'Home'}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[#0F4C3A] font-bold truncate">{categoryName}</span>
          </div>

          <button
            onClick={onBackToHome}
            className="text-xs text-[#0F4C3A] hover:underline font-semibold cursor-pointer"
          >
            {language === 'bn' ? 'সকল পণ্য দেখুন' : 'View All Products'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 2. Category Hero Banner */}
        <div className="bg-gradient-to-r from-[#0F4C3A] to-[#165B47] text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
              <Layers className="w-3.5 h-3.5" />
              <span>{category.nameEn || category.nameBn}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-['Hind_Siliguri',sans-serif] tracking-tight">
              {categoryName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl font-['Hind_Siliguri',sans-serif]">
              {category.descriptionBn || category.descriptionEn || 'সাশ্রয়ী দাম এবং সেরা মানের পণ্য সম্ভার।'}
            </p>
            <div className="pt-1 text-xs text-amber-300 font-medium">
              মোট {formatNumber(filteredProducts.length)} টি পণ্য পাওয়া গেছে
            </div>
          </div>

          {/* Decorative Glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl" />
        </div>

        {/* 3. Subcategories & Sibling Categories Carousel */}
        {allCategories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {allCategories.map((cat) => {
              const isCurrent = cat.id === category.id;
              const name = language === 'en' && cat.nameEn ? cat.nameEn : cat.nameBn;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    isCurrent
                      ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-xs'
                      : 'bg-white text-stone-700 hover:text-[#0F4C3A] hover:bg-emerald-50/50 border-stone-200'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Filter & Sort Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-[#0F4C3A]" />
            <span className="text-xs font-bold text-stone-800">
              {language === 'bn' ? 'ফিল্টার ও সাজানো' : 'Filters & Sort'}
            </span>

            {/* In Stock Only Checkbox */}
            <label className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-stone-300 text-[#0F4C3A] focus:ring-[#0F4C3A]"
              />
              <span>{language === 'bn' ? 'শুধুমাত্র স্টকে আছে' : 'In Stock Only'}</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <span>{language === 'bn' ? 'সাজান:' : 'Sort:'}</span>
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] cursor-pointer"
              >
                <option value="featured">{language === 'bn' ? 'ফিচার্ড পণ্য' : 'Featured'}</option>
                <option value="price_asc">{language === 'bn' ? 'দাম: কম থেকে বেশি' : 'Price: Low to High'}</option>
                <option value="price_desc">{language === 'bn' ? 'দাম: বেশি থেকে কম' : 'Price: High to Low'}</option>
                <option value="rating">{language === 'bn' ? 'সর্বোচ্চ রেটিং' : 'Top Rated'}</option>
                <option value="newest">{language === 'bn' ? 'নতুন পণ্য' : 'New Arrivals'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenDetails={onOpenProduct}
                onDirectBuy={onDirectBuy}
                onQuickAddToast={onQuickAddToast}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {language === 'bn' ? 'এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি' : 'No products found in this category'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              অন্য কোনো ক্যাটাগরি ব্রাউজ করুন অথবা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
            </p>
            <button
              onClick={onBackToHome}
              className="mt-2 px-4 py-2 bg-[#0F4C3A] text-white rounded-xl text-xs font-semibold hover:bg-[#145C47] transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'হোম পেজে ফিরে যান' : 'Back to Home'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
