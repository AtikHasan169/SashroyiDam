import React, { useState, useRef } from 'react';
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Check,
  Share2,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  ArrowRight
} from 'lucide-react';
import type { Product, Review } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import { ProductHighlightBadge } from './ProductHighlightBadge.tsx';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onProductUpdated?: () => void;
  onOpenDedicatedPage?: (p: Product) => void;
  onOpenCheckout?: () => void;
  onEditProduct?: (p: Product) => void;
  onDeleteProduct?: (id: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onProductUpdated,
  onOpenDedicatedPage,
  onOpenCheckout,
  onEditProduct,
  onDeleteProduct
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : undefined
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [copiedLink, setCopiedLink] = useState(false);

  // Image Zoom & Pan states
  const [isZoomed, setIsZoomed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPosition({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || e.touches.length === 0) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
  };

  // Review submission state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [revName, setRevName] = useState('');
  const [revPhone, setRevPhone] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  // Calculate price and stock based on selected variant
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = product.price + (selectedVariant?.priceDelta || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  // Load reviews on mount
  React.useEffect(() => {
    api.getProduct(product.id)
      .then((res) => {
        setReviews(res.reviews);
        setReviewsLoaded(true);
      })
      .catch((err) => console.error(err));
  }, [product.id]);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product.id, selectedVariantId, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product.id, selectedVariantId, quantity);
    onClose();
    if (onOpenCheckout) {
      onOpenCheckout();
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `?product=${product.slug}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewErrorMsg('');
    setReviewSuccessMsg('');
    setSubmittingReview(true);

    try {
      const res = await api.submitReview({
        productId: product.id,
        customerName: revName,
        customerPhone: revPhone,
        rating: revRating,
        comment: revComment
      });

      setReviews((prev) => [res.review, ...prev]);
      setReviewSuccessMsg(res.message);
      setRevName('');
      setRevPhone('');
      setRevComment('');
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      setReviewErrorMsg(err.message || 'রিভিউ যোগ করতে সমস্যা হয়েছে');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-200 relative my-8 text-left">
        {/* Top Header Actions (Full Page View, Admin Actions, Close) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {onOpenDedicatedPage && (
            <button
              onClick={() => onOpenDedicatedPage(product)}
              className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="ফুল পেজে দেখুন"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#0F4C3A]" />
              <span className="hidden sm:inline">ফুল পেজে দেখুন</span>
            </button>
          )}

          {isAdmin && (
            <div className="flex items-center gap-1.5">
              {onEditProduct && (
                <button
                  onClick={() => onEditProduct(product)}
                  className="px-2.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="পণ্য সম্পাদনা করুন"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">সম্পাদনা</span>
                </button>
              )}
              {onDeleteProduct && (
                <button
                  onClick={() => onDeleteProduct(product.id)}
                  className="px-2.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="পণ্যটি মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">মুছুন</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 p-6 bg-stone-50 border-r border-stone-200 flex flex-col gap-4">
            <div
              ref={imageContainerRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => {
                setIsHovering(false);
                setIsZoomed(false);
              }}
              onClick={toggleZoom}
              onTouchMove={handleTouchMove}
              onTouchStart={() => setIsZoomed(true)}
              className={`aspect-4/3 rounded-xl overflow-hidden bg-white border border-stone-200 relative select-none group/zoom ${
                isZoomed || isHovering ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.titleBn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover will-change-transform"
                style={{
                  transform: isZoomed || isHovering ? 'scale(2.4)' : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transition: isHovering ? 'transform 0.08s ease-out' : 'transform 0.25s ease-out',
                  pointerEvents: 'none'
                }}
              />

              {/* Auto-changing Product Highlight Badge */}
              {!isZoomed && !isHovering && (
                <div className="absolute top-3 left-3 z-10 pointer-events-none max-w-[80%]">
                  <ProductHighlightBadge product={product} variant="detail" />
                </div>
              )}

              {/* Zoom Action Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={toggleZoom}
                  className={`p-2 rounded-lg backdrop-blur-md border transition-all cursor-pointer ${
                    isZoomed || isHovering
                      ? 'bg-[#0F4C3A] text-white border-transparent shadow-sm'
                      : 'bg-white/90 text-stone-700 border-stone-200/80 hover:bg-white'
                  }`}
                  title={isZoomed ? 'জুম কমান' : 'জুম করুন'}
                  aria-label={isZoomed ? 'জুম কমান' : 'জুম করুন'}
                >
                  {isZoomed || isHovering ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreenModalOpen(true)}
                  className="p-2 rounded-lg bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 backdrop-blur-md transition-all cursor-pointer"
                  title="পূর্ণ পর্দায় দেখুন"
                  aria-label="পূর্ণ পর্দায় দেখুন"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Subtle Zoom Guidance Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 transition-opacity duration-200">
                {isZoomed || isHovering ? (
                  <div className="bg-stone-900/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                    <ZoomOut className="w-3 h-3 text-emerald-400" />
                    <span>জুম সক্রিয় (২.৪x) · সরাতে মাউস নাড়ান</span>
                  </div>
                ) : (
                  <div className="bg-white/85 text-stone-700 text-[11px] font-medium px-2.5 py-1 rounded-full border border-stone-200/80 shadow-2xs opacity-90 group-hover/zoom:opacity-100 flex items-center gap-1.5">
                    <ZoomIn className="w-3 h-3 text-[#0F4C3A]" />
                    <span>হোভার বা ট্যাপ করে জুম দেখুন</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      selectedImageIndex === idx ? 'border-[#0F4C3A]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Delivery Guarantee Notes */}
            <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-2.5 text-xs text-stone-600">
              <div className="flex items-center gap-2.5 font-medium text-stone-800">
                <Truck className="w-4 h-4 text-[#0F4C3A]" />
                <span>ডেলিভারি সময়: ঢাকায় ১-২ দিন, ঢাকার বাইরে ২-৪ দিন</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0F4C3A]" />
                <span>ক্যাশ অন ডেলিভারি এবং ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-[#0F4C3A] font-semibold">{product.brand}</span>
                  <span aria-hidden="true">·</span>
                  <span>{product.categoryNameBn || 'সাধারণ'}</span>
                </div>
                <span>SKU: {selectedVariant?.sku || product.sku}</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                  {product.titleBn}
                </h1>
                <p className="text-xs text-stone-400 mt-0.5">{product.titleEn}</p>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-3 text-xs text-stone-600">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm tabular-nums">{product.rating.toFixed(1)}</span>
                </div>
                <span aria-hidden="true">·</span>
                <span>{product.reviewCount} টি কাস্টমার রিভিউ</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">{product.salesCount} টি সম্পন্ন অর্ডার</span>
              </div>

              {/* Pricing */}
              <div className="py-2 border-y border-stone-100 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F4C3A] tabular-nums">
                  ৳{currentPrice.toLocaleString('bn-BD')}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    ৳{product.originalPrice.toLocaleString('bn-BD')}
                  </span>
                )}
                <div className="ml-auto text-xs font-semibold">
                  {isOutOfStock ? (
                    <span className="text-rose-600">স্টক শেষ</span>
                  ) : currentStock <= 5 ? (
                    <span className="text-amber-700">মাত্র {currentStock} টি স্টকে আছে</span>
                  ) : (
                    <span className="text-emerald-700">স্টকে উপলব্ধ ({currentStock} টি)</span>
                  )}
                </div>
              </div>

              {/* Dynamic Category-Aware Variants Selector */}
              {product.variants && product.variants.length > 0 && (() => {
                const isApparelOrShirt =
                  product.categorySlug?.includes('shirt') ||
                  product.categorySlug?.includes('fashion') ||
                  product.categoryNameBn?.includes('শার্ট') ||
                  product.categoryNameBn?.includes('পোশাক') ||
                  product.variants?.some((v) =>
                    v.attributes?.['সাইজ'] ||
                    ['M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '৪০', '৪২', '৪৪', '৪৬'].some((s) => v.nameBn.includes(s) || v.nameEn?.includes(s))
                  );

                const isFootwear =
                  product.categorySlug?.includes('shoe') ||
                  product.categoryNameBn?.includes('জুতা') ||
                  product.categoryNameBn?.includes('জুতো');

                const isWeightPack =
                  product.categorySlug?.includes('grocery') ||
                  product.categorySlug?.includes('food') ||
                  product.categoryNameBn?.includes('খাদ্য') ||
                  product.categoryNameBn?.includes('মধু') ||
                  product.variants?.some((v) => v.nameBn.includes('গ্রাম') || v.nameBn.includes('কেজি'));

                const isPackOption =
                  product.categorySlug?.includes('kitchen') ||
                  product.categoryNameBn?.includes('রান্নাঘর') ||
                  product.variants?.some((v) => v.nameBn.includes('সেট') || v.nameBn.includes('পিস'));

                const variantHeading = isApparelOrShirt
                  ? '👕 সাইজ নির্বাচন করুন (Select Size):'
                  : isFootwear
                  ? '👟 জুতো সাইজ নির্বাচন করুন:'
                  : isWeightPack
                  ? '⚖️ ওজন / পরিমাণ নির্বাচন করুন:'
                  : isPackOption
                  ? '📦 প্যাক বা সেট নির্বাচন করুন:'
                  : 'অপশন নির্বাচন করুন:';

                return (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800 tracking-wide">
                        {variantHeading}
                      </label>
                      {isApparelOrShirt && (
                        <span className="text-[11px] text-[#0F4C3A] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          📏 সাইজ: ৪০ (M), ৪২ (L), ৪৪ (XL), ৪৬ (XXL)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => {
                        const isSelected = selectedVariantId === variant.id;
                        const isVarOut = variant.stock <= 0;
                        return (
                          <button
                            key={variant.id}
                            disabled={isVarOut}
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white shadow-md ring-2 ring-emerald-200'
                                : isVarOut
                                ? 'border-stone-200 text-stone-300 line-through cursor-not-allowed bg-stone-50'
                                : 'border-stone-200 text-stone-800 hover:border-stone-400 bg-white shadow-2xs'
                            }`}
                          >
                            <span>{variant.nameBn}</span>
                            {variant.priceDelta !== 0 && (
                              <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                ({variant.priceDelta > 0 ? `+৳${variant.priceDelta}` : `-৳${Math.abs(variant.priceDelta)}`})
                              </span>
                            )}
                            <span className={`text-[10px] ml-1 px-1.5 py-0.2 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isVarOut
                                ? 'bg-stone-100 text-stone-400'
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              {isVarOut ? 'শেষ' : `${variant.stock} টি`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Quantity Stepper */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  পরিমাণ:
                </span>
                <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 hover:bg-stone-200 text-stone-600 rounded-l-lg transition-colors cursor-pointer disabled:opacity-40"
                    aria-label="কমান"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-stone-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={quantity >= currentStock || isOutOfStock}
                    className="p-2 hover:bg-stone-200 text-stone-600 rounded-r-lg transition-colors cursor-pointer disabled:opacity-40"
                    aria-label="বাড়ান"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add to Cart + Buy Now + Wishlist + Share (Desktop View) */}
              <div className="hidden md:flex flex-col gap-2.5 pt-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                        : 'bg-emerald-50 text-[#0F4C3A] border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>কার্টে যোগ করুন</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                      isOutOfStock
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-[#0F4C3A] hover:bg-[#135D48] text-white hover:shadow'
                    }`}
                  >
                    <span>এখনই কিনুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isInWishlist(product.id)
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    <span>{isInWishlist(product.id) ? 'পছন্দের তালিকায় সংরক্ষিত' : 'পছন্দের তালিকায় রাখুন'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="py-2 px-3 rounded-xl border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">লিংক কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>শেয়ার</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Sticky Action Bar */}
              <div className="md:hidden pt-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                        : 'bg-emerald-50 text-[#0F4C3A] border-emerald-300 active:bg-emerald-100'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>কার্ট</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      isOutOfStock
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-[#0F4C3A] active:bg-[#135D48] text-white'
                    }`}
                  >
                    <span>এখনই কিনুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Tabs: Description, Specs, Reviews */}
            <div className="pt-4 border-t border-stone-200">
              <div className="flex border-b border-stone-200 gap-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('desc')}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === 'desc'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  বিবরণ
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === 'specs'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  স্পেসিফিকেশন
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  রিভিউ ({reviews.length})
                </button>
              </div>

              <div className="py-3 text-xs text-stone-600 leading-relaxed min-h-[100px]">
                {activeTab === 'desc' && (
                  <div className="space-y-2">
                    <p>{product.descriptionBn}</p>
                    {product.descriptionEn && (
                      <p className="text-stone-400 italic pt-1 border-t border-stone-100">
                        {product.descriptionEn}
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-1.5">
                    {product.attributes && Object.keys(product.attributes).length > 0 ? (
                      Object.entries(product.attributes).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-stone-100">
                          <span className="font-medium text-stone-700">{key}:</span>
                          <span className="text-stone-600">{val}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone-400">কোনো অতিরিক্ত স্পেসিফিকেশন নেই।</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Existing Reviews */}
                    {reviews.length > 0 ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {reviews.map((r) => (
                          <div key={r.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/70">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-stone-800">{r.customerName}</span>
                              <div className="flex text-amber-500">
                                {Array.from({ length: r.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-stone-600 mt-1">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-stone-400">এখনও কোনো রিভিউ যুক্ত হয়নি। আপনার মতামত দিন।</p>
                    )}

                    {/* Submit Review Form */}
                    <form onSubmit={handleReviewSubmit} className="pt-2 border-t border-stone-200 space-y-2">
                      <div className="font-semibold text-stone-800 text-xs">আপনার রিভিউ দিন</div>
                      {reviewSuccessMsg && (
                        <div className="p-2 bg-emerald-50 text-emerald-800 text-[11px] rounded">
                          {reviewSuccessMsg}
                        </div>
                      )}
                      {reviewErrorMsg && (
                        <div className="p-2 bg-rose-50 text-rose-800 text-[11px] rounded">
                          {reviewErrorMsg}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="আপনার নাম"
                          value={revName}
                          onChange={(e) => setRevName(e.target.value)}
                          className="px-2.5 py-1.5 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#0F4C3A]"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="মোবাইল নম্বর (017...)"
                          value={revPhone}
                          onChange={(e) => setRevPhone(e.target.value)}
                          className="px-2.5 py-1.5 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#0F4C3A]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-500">রেটিং:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRevRating(star)}
                              className={`p-0.5 cursor-pointer ${revRating >= star ? 'text-amber-500' : 'text-stone-300'}`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        required
                        rows={2}
                        placeholder="পণ্যটি সম্পর্কে আপনার অভিজ্ঞতা লিখুন..."
                        value={revComment}
                        onChange={(e) => setRevComment(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#0F4C3A]"
                      />
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-3 py-1.5 bg-[#0F4C3A] text-white rounded text-xs font-semibold hover:bg-[#135D48] transition-colors cursor-pointer"
                      >
                        {submittingReview ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox & Viewfinder Modal */}
      {isFullscreenModalOpen && (
        <div
          className="fixed inset-0 z-70 bg-stone-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in duration-200 select-none"
          onClick={() => setIsFullscreenModalOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between z-10 max-w-5xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-100">{product.titleBn}</h3>
              <p className="text-xs text-stone-400">
                ছবি {selectedImageIndex + 1} / {product.images.length || 1} · জুম ভিউফাইন্ডার
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleZoom}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                <span>{isZoomed ? 'স্বাভাবিক সাইজ' : 'বড় করে দেখুন (২.৪x)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenModalOpen(false)}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Fullscreen Image Area with pan/zoom */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden my-4 max-w-5xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Image Button */}
            {product.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
                }
                className="absolute left-2 sm:left-4 z-20 p-2.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 transition-colors cursor-pointer"
                title="পূর্ববর্তী ছবি"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Zoomable / Pannable Image */}
            <div
              ref={imageContainerRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onClick={toggleZoom}
              className={`w-full h-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.titleBn}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain will-change-transform"
                style={{
                  transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transition: 'transform 0.15s ease-out',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Next Image Button */}
            {product.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-2 sm:right-4 z-20 p-2.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 transition-colors cursor-pointer"
                title="পরবর্তী ছবি"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails & Hints */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 z-10 max-w-5xl w-full mx-auto pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImageIndex === idx ? 'border-emerald-400' : 'border-stone-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="text-[11px] text-stone-400 text-center sm:text-right">
              মাউস কার্সার নাড়িয়ে বা স্ক্রিনে টেনে পণ্যের ফিনিশিং ও বুনন নিখুঁতভাবে দেখুন
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
