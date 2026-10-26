import React from 'react';
import { Heart, ShoppingCart, Star, Zap, Eye } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProductHighlightBadge } from './ProductHighlightBadge.tsx';
import { ProductShareButton } from './ProductShareButton.tsx';

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
  const isUnavailable = Boolean(product.isUnavailable);
  const canOrder = !isOutOfStock && !isUnavailable;

  const title = language === 'en' && product.titleEn ? product.titleEn : product.titleBn;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canOrder) return;
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0].id : undefined;
    addToCart(product.id, defaultVariant, 1);
    onQuickAddToast?.(product);
  };

  const handleDirectBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canOrder) return;
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
            src={product.images?.[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/src/assets/images/category_kitchen_cookware_1792084991823.jpg';
            }}
          />

          {/* Actions: Share & Wishlist */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
            <ProductShareButton product={product} variant="card-icon" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              aria-label={t('wishlist')}
              className={`p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                isWish
                  ? 'bg-rose-50 text-rose-600 shadow-sm'
                  : 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Unavailable Badge */}
          {isUnavailable && (
            <span className="absolute top-2.5 left-2.5 z-20 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm">
              {language === 'en' ? 'Unavailable' : 'অনুপলব্ধ'}
            </span>
          )}

          {/* Auto-changing Product Highlight Badge */}
          <div className="absolute bottom-2.5 left-2.5 z-10 max-w-[calc(100%-1.25rem)] pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
            <ProductHighlightBadge product={product} variant="card" />
          </div>
        </div>

        {/* Center & Right: Content, Description, Pricing, and Actions */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              {product.brand ? (
                <>
                  <span className="font-semibold text-stone-700">{product.brand}</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
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
                {isUnavailable ? (
                  <span className="text-rose-600 font-bold">{language === 'en' ? 'Currently Unavailable' : 'বিক্রয়ের জন্য অনুপলব্ধ'}</span>
                ) : isOutOfStock ? (
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
                disabled={!canOrder}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-[#0F4C3A] bg-stone-100 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{t('addToCart')}</span>
              </button>

              <button
                onClick={handleDirectBuyClick}
                disabled={!canOrder}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  !canOrder
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : 'bg-[#0F4C3A] text-white hover:bg-[#145C47]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{isUnavailable ? (language === 'en' ? 'Unavailable' : 'অনুপলব্ধ') : isOutOfStock ? t('outOfStock') : t('buyNow')}</span>
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
      className="group relative flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden hover:border-emerald-400 hover:shadow-xl transition-all duration-300 cursor-pointer text-left h-full"
    >
      {/* 1. Image Container with Wishlist & Highlight Badge */}
      <div className="relative aspect-square bg-stone-100 overflow-hidden shrink-0">
        <img
          src={product.images?.[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/src/assets/images/category_kitchen_cookware_1792084991823.jpg';
          }}
        />

        {/* Actions: Share & Wishlist */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 flex items-center gap-1 sm:gap-1.5">
          <ProductShareButton product={product} variant="card-icon" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            aria-label={t('wishlist')}
            className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
              isWish
                ? 'bg-rose-50 text-rose-600 shadow-sm'
                : 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900'
            }`}
          >
            <Heart className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isWish ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Unavailable Badge */}
        {isUnavailable && (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-20 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm">
            {language === 'en' ? 'Unavailable' : 'অনুপলব্ধ'}
          </span>
        )}

        {/* Auto-changing Product Highlight Badge */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10 max-w-[calc(100%-1rem)] pointer-events-none transition-opacity duration-200">
          <ProductHighlightBadge product={product} variant="card" />
        </div>
      </div>

      {/* 2. Content & Pricing - flex-1 with uniform spacing */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Metadata: Brand · Category */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500 font-medium">
            {product.brand ? (
              <>
                <span className="font-semibold text-stone-700">{product.brand}</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <span className="truncate">{language === 'en' && product.categorySlug ? product.categorySlug : (product.categoryNameBn || 'সাধারণ')}</span>
          </div>

          {/* Product Title (2-line clamp with uniform min-height for clean grid rows) */}
          <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1 line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] leading-snug group-hover:text-[#0F4C3A] transition-colors">
            {title}
          </h3>

          {/* Ratings & Verified Sales */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500 mt-1">
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <span className="tabular-nums">{product.rating.toFixed(1)}</span>
            </div>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.reviewCount} {t('verifiedReviews')}</span>
          </div>
        </div>

        {/* Bottom Section: Price Row + Action Buttons (Pinned to bottom of card) */}
        <div className="mt-auto pt-2.5 border-t border-stone-100 space-y-2">
          {/* Price & Stock Row */}
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-extrabold text-stone-900 tabular-nums">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] sm:text-xs text-stone-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="text-[10px] sm:text-[11px] font-semibold shrink-0">
              {isUnavailable ? (
                <span className="text-rose-600 font-bold">{language === 'en' ? 'Unavailable' : 'অনুপলব্ধ'}</span>
              ) : isOutOfStock ? (
                <span className="text-rose-600">{t('outOfStock')}</span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-700">{t('onlyFewLeft', { count: product.stock })}</span>
              ) : (
                <span className="text-emerald-700">{t('inStock')}</span>
              )}
            </div>
          </div>

          {/* Symmetrical Action Buttons (Cart + Buy Now) */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-0.5">
            {/* Quick Add to Cart Button */}
            <button
              onClick={handleQuickAdd}
              disabled={!canOrder}
              title={t('addToCart')}
              className="col-span-1 p-2 rounded-xl text-stone-700 hover:text-[#0F4C3A] bg-stone-100 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>

            {/* Direct Order Now Button */}
            <button
              onClick={handleDirectBuyClick}
              disabled={!canOrder}
              className={`col-span-3 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                !canOrder
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-[#0F4C3A] text-white hover:bg-[#145C47] hover:shadow-xs'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span>{isUnavailable ? (language === 'bn' ? 'অনুপলব্ধ' : 'Unavailable') : isOutOfStock ? t('outOfStock') : (language === 'bn' ? 'অর্ডার করুন' : 'Order Now')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
