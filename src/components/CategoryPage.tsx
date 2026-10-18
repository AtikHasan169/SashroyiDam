import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowUpDown, Filter, ChevronRight, Layers, SlidersHorizontal, Check, LayoutGrid, List } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort products for this category
  const filteredProducts = useMemo(() => {
    let list = products.filter(
      (p) => p.categoryId === category.id || p.categorySlug === category.slug
    );

    if (inStockOnly) {
      list = list.filter((p) => p.inStock ?? (p.stock > 0));
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
          return ((b.isFeatured || b.isHotDeal ? 1 : 0) - (a.isFeatured || a.isHotDeal ? 1 : 0));
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
        {/* 4. Filter & Sort Toolbar: Stock & Pick on one side, Grid on the other side */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-stone-200 flex items-center justify-between gap-2 shadow-2xs">
          {/* Side 1 (Left): Stock & Pick */}
          <div className="flex items-center gap-2 min-w-0">
            {/* In Stock Only Checkbox */}
            <label className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 px-2 sm:px-2.5 py-1.5 rounded-lg border border-stone-200 cursor-pointer shrink-0 select-none transition-colors">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-stone-300 text-[#0F4C3A] focus:ring-[#0F4C3A] w-3.5 h-3.5"
              />
              <span className="hidden xs:inline sm:inline">{language === 'bn' ? 'স্টকে আছে' : 'In Stock'}</span>
              <span className="inline xs:hidden sm:hidden">{language === 'bn' ? 'স্টক' : 'Stock'}</span>
            </label>

            {/* Sort Dropdown ("Pick") */}
            <div className="relative shrink-0">
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                className="appearance-none bg-stone-50 border border-stone-200 rounded-lg pl-2.5 pr-7 py-1.5 text-[11px] sm:text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] cursor-pointer max-w-[130px] sm:max-w-none truncate"
              >
                <option value="featured">{language === 'bn' ? 'ফিচার্ড পণ্য' : 'Featured'}</option>
                <option value="price_asc">{language === 'bn' ? 'দাম: কম থেকে বেশি' : 'Price: Low'}</option>
                <option value="price_desc">{language === 'bn' ? 'দাম: বেশি থেকে কম' : 'Price: High'}</option>
                <option value="rating">{language === 'bn' ? 'রেটিং' : 'Rating'}</option>
                <option value="newest">{language === 'bn' ? 'নতুন পণ্য' : 'Newest'}</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Side 2 (Right): Grid View Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0F4C3A] shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title={language === 'bn' ? 'গ্রিড ভিউ (Grid View)' : 'Grid View'}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#0F4C3A] shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title={language === 'bn' ? 'লিস্ট ভিউ (List View)' : 'List View'}
              aria-label="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. Product Grid / List */}
        {filteredProducts.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'
                : 'flex flex-col gap-4'
            }
          >
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenDetails={onOpenProduct}
                onDirectBuy={onDirectBuy}
                onQuickAddToast={onQuickAddToast}
                viewMode={viewMode}
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
