import React from 'react';
import { Heart, ShoppingCart, Star, Zap, Eye } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProductHighlightBadge } from './ProductHighlightBadge.tsx';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onDirectBuy?: (product: Product) => void;
  onQuickAddToast?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onDirectBuy,
  onQuickAddToast,
  viewMode = 'grid'
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { language, t, formatPrice } = useLanguage();
  const isWish = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  const title = language === 'en' && product.titleEn ? product.titleEn : product.titleBn;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0].id : undefined;
    addToCart(product.id, defaultVariant, 1);
    onQuickAddToast?.(product);
  };

  const handleDirectBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onDirectBuy) {
      onDirectBuy(product);
    } else {
      onOpenDetails(product);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpenDetails(product)}
        className="group relative flex flex-col sm:flex-row bg-white rounded-2xl border border-stone-200/90 overflow-hidden hover:border-emerald-400 hover:shadow-lg transition-all duration-300 cursor-pointer text-left"
      >
        {/* Left: Product Image */}
        <div className="relative w-full sm:w-56 sm:min-w-56 aspect-16/10 sm:aspect-auto bg-stone-100 overflow-hidden shrink-0">
          <img
            src={product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            aria-label={t('wishlist')}
            className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
              isWish
                ? 'bg-rose-50 text-rose-600 shadow-sm'
                : 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
          </button>

          {/* Auto-changing Product Highlight Badge */}
          <div className="absolute bottom-2.5 left-2.5 z-10 max-w-[85%] group-hover:opacity-0 transition-opacity duration-200">
            <ProductHighlightBadge product={product} variant="card" />
          </div>
        </div>

        {/* Center & Right: Content, Description, Pricing, and Actions */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="font-semibold text-stone-700">{product.brand}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{language === 'en' && product.categorySlug ? product.categorySlug : (product.categoryNameBn || 'সাধারণ')}</span>
              {product.sku && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px] text-stone-400">SKU: {product.sku}</span>
                </>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1 line-clamp-1 group-hover:text-[#0F4C3A] transition-colors">
              {title}
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 mt-1 line-clamp-2 leading-relaxed">
              {language === 'en' && product.descriptionEn ? product.descriptionEn : product.descriptionBn}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-2">
              <div className="flex items-center gap-1 text-amber-600 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
              </div>
              <span aria-hidden="true">·</span>
              <span>{product.reviewCount} {t('verifiedReviews')}</span>
              {product.salesCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-stone-400">{product.salesCount} {t('soldCount')}</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 tabular-nums">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xs sm:text-sm text-stone-400 line-through tabular-nums">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% ছাড়
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-semibold">{t('outOfStock')}</span>
                ) : product.stock <= 5 ? (
                  <span className="text-amber-700 font-semibold">{t('onlyFewLeft', { count: product.stock })}</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">{t('inStock')}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(product);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Details' : 'বিস্তারিত'}</span>
              </button>

              <button
                onClick={handleQuickAdd}
                disabled={isOutOfStock}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-[#0F4C3A] bg-stone-100 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{t('addToCart')}</span>
              </button>

              <button
                onClick={handleDirectBuyClick}
                disabled={isOutOfStock}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isOutOfStock
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : 'bg-[#0F4C3A] text-white hover:bg-[#145C47]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{isOutOfStock ? t('outOfStock') : t('buyNow')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden hover:border-emerald-400 hover:shadow-xl transition-all duration-300 cursor-pointer text-left"
    >
      {/* 1. Image Container with Hover Quick Add Overlay */}
      <div className="relative aspect-square bg-stone-100 overflow-hidden">
        <img
          src={product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={t('wishlist')}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
            isWish
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900'
          }`}
        >
          <Heart className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isWish ? 'fill-current' : ''}`} />
        </button>

        {/* Auto-changing Product Highlight Badge */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10 max-w-[90%] group-hover:opacity-0 transition-opacity duration-200">
          <ProductHighlightBadge product={product} variant="card" />
        </div>

        {/* Desktop Hover Quick Action Bar (Reveals smoothly on hover) */}
        <div className="absolute inset-x-2 bottom-2 z-20 hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="flex-1 py-2 px-3 bg-[#0F4C3A]/95 hover:bg-[#0F4C3A] text-white text-xs font-bold rounded-xl shadow-lg backdrop-blur-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? t('outOfStock') : t('addToCart')}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="p-2 bg-white/95 hover:bg-white text-stone-700 hover:text-stone-950 text-xs font-bold rounded-xl shadow-lg backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer"
            title={language === 'en' ? 'Quick View' : 'বিস্তারিত দেখুন'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Content & Pricing */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2.5 sm:gap-3">
        <div>
          {/* Metadata: Category & Brand */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500 font-medium">
            <span>{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{language === 'en' && product.categorySlug ? product.categorySlug : (product.categoryNameBn || 'সাধারণ')}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-base font-semibold text-stone-900 mt-1 line-clamp-2 leading-tight group-hover:text-[#0F4C3A] transition-colors">
            {title}
          </h3>

          {/* Ratings & Sales */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500 mt-1">
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <span className="tabular-nums">{product.rating.toFixed(1)}</span>
            </div>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.reviewCount} {t('verifiedReviews')}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-lg font-bold text-stone-900 tabular-nums">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-stone-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
              {isOutOfStock ? (
                <span className="text-rose-600 font-semibold">{t('outOfStock')}</span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-700">{t('onlyFewLeft', { count: product.stock })}</span>
              ) : (
                <span className="text-emerald-700">{t('inStock')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              title={t('addToCart')}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-600 hover:text-[#0F4C3A] hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <ShoppingCart className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>

            <button
              onClick={handleDirectBuyClick}
              disabled={isOutOfStock}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                isOutOfStock
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-[#0F4C3A] text-white hover:bg-[#145C47] shadow-2xs'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
              <span>{isOutOfStock ? t('outOfStock') : t('buyNow')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
