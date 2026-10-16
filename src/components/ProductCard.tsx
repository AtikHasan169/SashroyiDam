import React from 'react';
import { Heart, ShoppingBag, Star, Zap } from 'lucide-react';
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
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onDirectBuy,
  onQuickAddToast
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

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer text-left"
    >
      {/* 1. Image Container */}
      <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
        <img
          src={product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={t('wishlist')}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
            isWish
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
        </button>

        {/* Auto-changing Product Highlight Badge */}
        <div className="absolute bottom-2.5 left-2.5 z-10 max-w-[85%]">
          <ProductHighlightBadge product={product} variant="card" />
        </div>
      </div>

      {/* 2. Content & Pricing */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Metadata: Category & Brand */}
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <span>{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{language === 'en' && product.categorySlug ? product.categorySlug : (product.categoryNameBn || 'সাধারণ')}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm sm:text-base font-semibold text-stone-900 mt-1 line-clamp-2 group-hover:text-[#0F4C3A] transition-colors">
            {title}
          </h3>

          {/* Ratings & Sales */}
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1.5">
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="tabular-nums">{product.rating.toFixed(1)}</span>
            </div>
            <span aria-hidden="true">·</span>
            <span>{product.reviewCount} {t('verifiedReviews')}</span>
            {product.salesCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-stone-400">
                <span aria-hidden="true">·</span>
                <span>{product.salesCount} {t('soldCount')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-stone-900 tabular-nums">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              {isOutOfStock ? (
                <span className="text-rose-600 font-semibold">{t('outOfStock')}</span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-700">{t('onlyFewLeft', { count: product.stock })}</span>
              ) : (
                <span className="text-emerald-700">{t('inStock')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              title={t('addToBag')}
              className="p-2 rounded-xl text-stone-600 hover:text-[#0F4C3A] hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            <button
              onClick={handleDirectBuyClick}
              disabled={isOutOfStock}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                isOutOfStock
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-[#0F4C3A] text-white hover:bg-[#145C47] shadow-2xs'
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
};
