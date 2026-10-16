import React from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { ProductHighlightBadge } from './ProductHighlightBadge.tsx';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWish = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0].id : undefined;
    addToCart(product.id, defaultVariant, 1);
  };

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group flex flex-col bg-white rounded-xl border border-stone-200/90 overflow-hidden hover:border-stone-300 hover:shadow-md transition-all duration-300 cursor-pointer text-left"
    >
      {/* 1. Image Container */}
      <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
        <img
          src={product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
          alt={product.titleBn}
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
          aria-label={isWish ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দ তালিকায় যুক্ত করুন'}
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
            <span className="truncate">{product.categoryNameBn || 'সাধারণ'}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm sm:text-base font-semibold text-stone-900 mt-1 line-clamp-2 group-hover:text-[#0F4C3A] transition-colors">
            {product.titleBn}
          </h3>

          {/* Ratings & Sales (real values) */}
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1.5">
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="tabular-nums">{product.rating.toFixed(1)}</span>
            </div>
            <span aria-hidden="true">·</span>
            <span>{product.reviewCount} রিভিউ</span>
            {product.salesCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-stone-400">{product.salesCount} টি বিক্রি</span>
              </>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-stone-900 tabular-nums">
                ৳{product.price.toLocaleString('bn-BD')}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through tabular-nums">
                  ৳{product.originalPrice.toLocaleString('bn-BD')}
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              {isOutOfStock ? (
                <span className="text-rose-600 font-semibold">স্টক শেষ</span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-700">মাত্র {product.stock} টি বাকি</span>
              ) : (
                <span className="text-emerald-700">স্টকে আছে</span>
              )}
            </div>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-emerald-50 text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white border border-emerald-200 hover:border-transparent'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'স্টক নেই' : 'কিনুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
