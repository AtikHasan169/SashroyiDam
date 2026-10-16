import React, { useState, useEffect } from 'react';
import { Flame, Star, ShieldCheck, Truck, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import type { Product } from '../types/index.ts';

interface ProductHighlightBadgeProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'card' | 'detail';
}

interface HighlightItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const ProductHighlightBadge: React.FC<ProductHighlightBadgeProps> = ({
  product,
  size = 'sm',
  variant = 'card'
}) => {
  // Build dynamic highlights tailored to this product's actual data
  const highlights: HighlightItem[] = [];

  // 1. Discount / Deal highlight
  if (product.originalPrice && product.originalPrice > product.price) {
    const savings = product.originalPrice - product.price;
    const discountPercent = Math.round((savings / product.originalPrice) * 100);
    highlights.push({
      id: 'discount',
      label: `৳${savings} সাশ্রয় (${discountPercent}% ছাড়)`,
      icon: <Flame className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" />,
      bgClass: 'bg-gradient-to-r from-rose-600 to-amber-600',
      textClass: 'text-white font-bold',
      borderClass: 'border-rose-400/30'
    });
  }

  // 2. Best-seller / Sales count
  if (product.salesCount && product.salesCount > 5) {
    highlights.push({
      id: 'bestseller',
      label: `🔥 বেস্টসেলার (${product.salesCount}+ বিক্রি)`,
      icon: <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />,
      bgClass: 'bg-stone-900/95',
      textClass: 'text-amber-300 font-semibold',
      borderClass: 'border-amber-400/30'
    });
  } else if (product.isFeatured) {
    highlights.push({
      id: 'featured',
      label: '✨ বিশেষ বাছাইকৃত পণ্য',
      icon: <Sparkles className="w-3 h-3 text-amber-300" />,
      bgClass: 'bg-[#0F4C3A]',
      textClass: 'text-white font-semibold',
      borderClass: 'border-emerald-400/30'
    });
  }

  // 3. Top Rating
  if (product.rating >= 4.5 && product.reviewCount > 0) {
    highlights.push({
      id: 'rating',
      label: `⭐ ${product.rating.toFixed(1)} টপ রেটিং (${product.reviewCount} রিভিউ)`,
      icon: <Star className="w-3 h-3 text-amber-400 fill-amber-400" />,
      bgClass: 'bg-amber-500/90',
      textClass: 'text-stone-950 font-bold',
      borderClass: 'border-amber-300'
    });
  }

  // 4. Low stock urgency or In-stock badge
  if (product.stock > 0 && product.stock <= 5) {
    highlights.push({
      id: 'urgency',
      label: `⚡ স্টক দ্রুত ফুরিয়ে যাচ্ছে (মাত্র ${product.stock} টি)`,
      icon: <Clock className="w-3 h-3 text-rose-300 animate-spin" />,
      bgClass: 'bg-rose-700/95',
      textClass: 'text-white font-semibold',
      borderClass: 'border-rose-400/40'
    });
  } else if (product.stock > 0) {
    highlights.push({
      id: 'cod',
      label: '🚚 সারাদেশে ক্যাশ অন ডেলিভারি',
      icon: <Truck className="w-3 h-3 text-emerald-300" />,
      bgClass: 'bg-[#0F4C3A]/90',
      textClass: 'text-emerald-100 font-semibold',
      borderClass: 'border-emerald-500/30'
    });
  }

  // 5. Authentic Quality Guarantee
  highlights.push({
    id: 'quality',
    label: '🛡️ ১০০% আসল ও কোয়ালিটি চেকড',
    icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />,
    bgClass: 'bg-emerald-900/90',
    textClass: 'text-emerald-200 font-medium',
    borderClass: 'border-emerald-700/50'
  });

  // 6. Custom tags if provided
  if (product.tags && product.tags.length > 0) {
    product.tags.forEach((tag, idx) => {
      highlights.push({
        id: `tag-${idx}`,
        label: `✨ ${tag}`,
        icon: <CheckCircle2 className="w-3 h-3 text-amber-300" />,
        bgClass: 'bg-stone-800/90',
        textClass: 'text-amber-200 font-semibold',
        borderClass: 'border-stone-700'
      });
    });
  }

  // Auto-change highlight every 2.8s
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (highlights.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % highlights.length);
        setIsTransitioning(false);
      }, 250);
    }, 2800);

    return () => clearInterval(timer);
  }, [highlights.length]);

  const current = highlights[currentIndex] || highlights[0];
  if (!current) return null;

  if (variant === 'detail') {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-xs transition-all duration-300 ${
            current.bgClass
          } ${current.textClass} ${current.borderClass} ${
            isTransitioning ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          {current.icon}
          <span className="text-xs tracking-wide">{current.label}</span>
          {highlights.length > 1 && (
            <div className="flex items-center gap-1 ml-1.5 pl-2 border-l border-white/20">
              {highlights.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] backdrop-blur-md shadow-sm border transition-all duration-300 ${
        current.bgClass
      } ${current.textClass} ${current.borderClass} ${
        isTransitioning ? 'opacity-0 scale-95 -translate-y-1' : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      {current.icon}
      <span className="truncate max-w-[170px]">{current.label}</span>
    </div>
  );
};
