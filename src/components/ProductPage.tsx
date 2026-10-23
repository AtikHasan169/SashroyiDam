import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Star,
  Heart,
  ShoppingCart,
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
  Sparkles,
  Edit,
  Trash2,
  PhoneCall,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import type { Product, Review, Category } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { api } from '../lib/api.ts';
import { ProductHighlightBadge } from './ProductHighlightBadge.tsx';

interface ProductPageProps {
  product: Product;
  categories: Category[];
  allProducts: Product[];
  onBack: () => void;
  onOpenProduct: (p: Product) => void;
  onOpenCheckout: () => void;
  onDirectBuy?: (product: Product, variantId?: string, quantity?: number) => void;
  onEditProduct?: (p: Product) => void;
  onDeleteProduct?: (id: string) => void;
  storePhone?: string;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  categories,
  allProducts,
  onBack,
  onOpenProduct,
  onOpenCheckout,
  onDirectBuy,
  onEditProduct,
  onDeleteProduct,
  storePhone
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { language, t, formatPrice, formatNumber } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const title = language === 'en' && product.titleEn ? product.titleEn : product.titleBn;

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : undefined
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [copiedLink, setCopiedLink] = useState(false);

  // Zoom & Pan states
  const [isZoomed, setIsZoomed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [revName, setRevName] = useState('');
  const [revPhone, setRevPhone] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  // Pre-fill reviewer details from logged in user if available
  useEffect(() => {
    if (user) {
      if (!revName && user.name) setRevName(user.name);
      if (!revPhone && user.phone) setRevPhone(user.phone);
    }
  }, [user]);

  // Selected variant calculation
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = product.price + (selectedVariant?.priceDelta || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const isUnavailable = Boolean(product.isUnavailable);
  const canOrder = !isOutOfStock && !isUnavailable;
  const isWish = isInWishlist(product.id);

  // Category matching
  const matchedCategory = categories.find((c) => c.id === product.categoryId);

  // Reset variant selection when product changes
  useEffect(() => {
    setSelectedVariantId(product.variants && product.variants.length > 0 ? product.variants[0].id : undefined);
    setSelectedImageIndex(0);
    setQuantity(1);
    setIsZoomed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    api.getProduct(product.id)
      .then((res) => {
        setReviews(res.reviews || []);
        setReviewsLoaded(true);
      })
      .catch((err) => console.error(err));
  }, [product.id]);

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

  const handleAddToCart = () => {
    if (!canOrder) return;
    addToCart(product.id, selectedVariantId, quantity);
  };

  const handleBuyNow = () => {
    if (!canOrder) return;
    if (onDirectBuy) {
      onDirectBuy(product, selectedVariantId, quantity);
    } else {
      addToCart(product.id, selectedVariantId, quantity);
      onOpenCheckout();
    }
  };

  const handleShare = () => {
    const url = window.location.origin + `?product=${product.slug || product.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revPhone.trim() || !revComment.trim()) {
      setReviewErrorMsg(
        language === 'en'
          ? 'Please enter your name, order mobile number, and your review'
          : 'দয়া করে আপনার নাম, অর্ডারের মোবাইল নম্বর এবং রিভিউ লিখুন'
      );
      return;
    }
    setSubmittingReview(true);
    setReviewErrorMsg('');
    try {
      const res = await api.submitReview({
        productId: product.id,
        customerName: revName.trim(),
        customerPhone: revPhone.trim(),
        rating: revRating,
        comment: revComment.trim()
      });
      setReviews((prev) => [res.review, ...prev]);
      setRevComment('');
      setRevRating(5);
      setReviewSuccessMsg(res.message || (language === 'en' ? 'Your verified review has been submitted successfully!' : 'আপনার ভেরিফায়েড ক্রেতা রিভিউ সফলভাবে যুক্ত হয়েছে!'));
      setTimeout(() => setReviewSuccessMsg(''), 5000);
    } catch (err: any) {
      setReviewErrorMsg(err.message || (language === 'en' ? 'Could not submit review' : 'রিভিউ জমা দেওয়া যায়নি'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Related products
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.categorySlug === product.categorySlug))
    .slice(0, 4);

  // Variant category helpers
  const catSlug = (product.categorySlug || matchedCategory?.slug || '').toLowerCase();
  const catName = (product.categoryNameBn || matchedCategory?.nameBn || '').toLowerCase();
  const pTitle = (product.titleBn + ' ' + product.titleEn).toLowerCase();

  const isApparelOrShirt =
    catSlug.includes('apparel') ||
    catSlug.includes('shirt') ||
    catSlug.includes('panjabi') ||
    catName.includes('পোশাক') ||
    catName.includes('শার্ট') ||
    catName.includes('পাঞ্জাবি') ||
    pTitle.includes('শার্ট') ||
    pTitle.includes('shirt') ||
    pTitle.includes('panjabi');

  const isFootwear =
    catSlug.includes('shoe') ||
    catSlug.includes('footwear') ||
    catName.includes('জুতো') ||
    catName.includes('জুতা');

  const isWeightPack =
    catSlug.includes('grocer') ||
    catSlug.includes('honey') ||
    catSlug.includes('spices') ||
    catName.includes('মধু') ||
    catName.includes('গ্রোসারি') ||
    catName.includes('খাবার');

  const variantHeading = isApparelOrShirt
    ? '👕 সাইজ নির্বাচন করুন (Select Size):'
    : isFootwear
    ? '👟 জুতো সাইজ নির্বাচন করুন (Select Footwear Size):'
    : isWeightPack
    ? '⚖️ ওজন / পরিমাণ নির্বাচন করুন (Select Weight):'
    : '📦 অপশন / ভ্যারিয়েন্ট নির্বাচন করুন:';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 pb-20">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-stone-200 sticky top-14 md:top-16 z-30 shadow-2xs">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-600 truncate">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back to Shop' : 'শপে ফিরে যান'}</span>
            </button>
            <span className="text-stone-300">/</span>
            <span className="text-stone-500 truncate hidden sm:inline">
              {language === 'en' && matchedCategory?.nameEn
                ? matchedCategory.nameEn
                : (matchedCategory?.nameBn || product.categoryNameBn || (language === 'en' ? 'Category' : 'ক্যাটাগরি'))}
            </span>
            <span className="text-stone-300 hidden sm:inline">/</span>
            <span className="font-semibold text-stone-900 truncate">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                {onEditProduct && (
                  <button
                    onClick={() => onEditProduct(product)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Edit Product' : 'পণ্য সম্পাদনা করুন'}
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Edit' : 'সম্পাদনা'}</span>
                  </button>
                )}
                {onDeleteProduct && (
                  <button
                    onClick={() => onDeleteProduct(product.id)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Delete Product' : 'পণ্য মুছে ফেলুন'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Delete' : 'মুছে ফেলুন'}</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleShare}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 text-stone-700 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{language === 'en' ? 'Copied!' : 'কপি হয়েছে!'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Share' : 'শেয়ার করুন'}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Draft / Unpublished Warning Notice for Admins & Direct Link Viewers */}
      {product.isPublished === false && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 md:px-8 lg:px-10 py-2.5 text-amber-900 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg shrink-0">⚠️</span>
              <p>
                <strong className="font-bold">
                  {language === 'en' ? 'Unpublished Product (Draft):' : 'অপ্রকাশিত পণ্য (ড্রাফট মোড):'}
                </strong>{' '}
                {language === 'en'
                  ? 'This item is currently hidden from the public store catalog. It is only accessible via direct link or to admins.'
                  : 'এই পণ্যটি সাধারণ গ্রাহকদের শপ ক্যাটালগে প্রদর্শিত হচ্ছে না। এটি শুধুমাত্র ডিরেক্ট লিংক অথবা অ্যাডমিন প্যানেলের মাধ্যমে দৃশ্যমান।'}
              </p>
            </div>
            {isAdmin && onEditProduct && (
              <button
                onClick={() => onEditProduct(product)}
                className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs transition-colors self-start sm:self-auto"
              >
                {language === 'en' ? 'Edit & Publish' : 'সম্পাদনা ও প্রকাশ করুন'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Product Currently Unavailable for Sale Alert Banner */}
      {isUnavailable && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-6 md:px-8 lg:px-10 py-3 text-rose-900 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0">⛔</span>
              <p>
                <strong className="font-bold">
                  {language === 'en' ? 'Currently Unavailable for Sale:' : 'বর্তমানে বিক্রয়ের জন্য উপলব্ধ নেই:'}
                </strong>{' '}
                {language === 'en'
                  ? 'This product is currently not available for purchase. All ordering buttons have been temporarily disabled.'
                  : 'এই পণ্যটি বর্তমানে আর বিক্রয়ের জন্য উপলব্ধ নেই। সাময়িকভাবে এর সকল অর্ডার গ্রহণ বন্ধ রাখা হয়েছে।'}
              </p>
            </div>
            {isAdmin && onEditProduct && (
              <button
                onClick={() => onEditProduct(product)}
                className="shrink-0 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs transition-colors self-start sm:self-auto"
              >
                {language === 'en' ? 'Edit Availability' : 'অনুপলব্ধতা পরিবর্তন'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Product Stage Container */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden p-4 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            
            {/* LEFT COLUMN: Gallery & Zoomable Image View */}
            <div className="lg:col-span-6 space-y-4">
              <div
                ref={imageContainerRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onClick={() => setIsZoomed((prev) => !prev)}
                className={`relative aspect-square sm:aspect-4/3 lg:aspect-square bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 cursor-crosshair group select-none transition-shadow ${
                  isZoomed ? 'ring-2 ring-[#0F4C3A]' : ''
                }`}
              >
                <img
                  src={product.images[selectedImageIndex] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                  alt={product.titleBn}
                  referrerPolicy="no-referrer"
                  style={{
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    transform: isZoomed
                      ? 'scale(2.2)'
                      : isHovering
                      ? 'scale(1.3)'
                      : 'scale(1)'
                  }}
                  className="w-full h-full object-cover transition-transform duration-200 ease-out pointer-events-none"
                />

                {/* Top overlay badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start max-w-[calc(100%-80px)] pointer-events-none">
                  <ProductHighlightBadge product={product} variant="detail" />
                </div>

                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer shadow-sm ${
                      isWish
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-white/90 text-stone-700 hover:bg-white hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreenModalOpen(true);
                    }}
                    className="p-2.5 rounded-full bg-white/90 text-stone-700 hover:bg-white hover:text-stone-900 border border-stone-200 shadow-sm cursor-pointer"
                    title="ফুলস্ক্রিন দেখুন"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Zoom Hint Bar */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 bg-stone-900/80 backdrop-blur-md text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                    {isZoomed ? <ZoomOut className="w-3 h-3 text-amber-300" /> : <ZoomIn className="w-3 h-3 text-amber-300" />}
                    <span>{isZoomed ? 'ট্যাপ করে জুম কমান' : 'ট্যাপ বা মাউস ঘুরিয়ে জুম করুন'}</span>
                  </span>

                  {product.images.length > 1 && (
                    <span className="px-2 py-0.5 bg-white/90 backdrop-blur-md text-stone-700 rounded text-[11px] font-bold border border-stone-200">
                      {selectedImageIndex + 1} / {product.images.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setIsZoomed(false);
                      }}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#0F4C3A] ring-2 ring-emerald-600/30 shadow-xs'
                          : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Product Information & Purchase CTAs */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Brand & Category meta */}
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                  {product.brand ? (
                    <>
                      <span className="text-[#0F4C3A] uppercase tracking-wider">{product.brand}</span>
                      <span>·</span>
                    </>
                  ) : null}
                  <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                    {matchedCategory?.nameBn || product.categoryNameBn || 'সাধারণ'}
                  </span>
                  {product.sku && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-stone-400">SKU: {product.sku}</span>
                    </>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-snug">
                  {title}
                </h1>
                {language === 'bn' && product.titleEn && (
                  <p className="text-xs text-stone-400 font-normal -mt-2">
                    {product.titleEn}
                  </p>
                )}

                {/* Reviews & Sales Count */}
                <div className="flex items-center gap-3 text-xs text-stone-600 pb-1">
                  <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="tabular-nums">{product.rating.toFixed(1)}</span>
                  </div>
                  <span>{reviews.length || product.reviewCount} {t('verifiedReviews')}</span>
                  {product.salesCount > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">{product.salesCount} {t('soldCount')}</span>
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-bold text-stone-950 tabular-nums">
                      {formatPrice(currentPrice)}
                    </span>
                    {product.originalPrice && product.originalPrice > currentPrice && (
                      <span className="inline-flex items-baseline gap-2">
                        <span className="text-base text-stone-400 line-through tabular-nums">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-xs font-bold shadow-2xs">
                          {t('savings', { amount: formatPrice(product.originalPrice - currentPrice) })}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Stock Availability */}
                  <div className="text-xs font-semibold">
                    {isUnavailable ? (
                      <span className="text-rose-600 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        {language === 'en' ? 'Currently Unavailable for Sale' : 'বর্তমানে আর বিক্রয়ের জন্য উপলব্ধ নেই'}
                      </span>
                    ) : isOutOfStock ? (
                      <span className="text-rose-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        {t('outOfStock')}
                      </span>
                    ) : currentStock <= 5 ? (
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        {t('onlyFewLeft', { count: currentStock })}
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {t('inStock')} ({currentStock})
                      </span>
                    )}
                  </div>
                </div>

                {/* Category-Specific Variant Selector (e.g. Shirts: Sizes; Food: Weights) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                      <span>{variantHeading}</span>
                      {selectedVariant && (
                        <span className="text-[#0F4C3A] font-semibold">
                          নির্বাচিত: {selectedVariant.nameBn}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => {
                        const isSelected = selectedVariantId === v.id;
                        const isVOutOfStock = v.stock <= 0;
                        return (
                          <button
                            key={v.id}
                            disabled={isVOutOfStock || isUnavailable}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-sm scale-102 ring-2 ring-emerald-500/30'
                                : isVOutOfStock || isUnavailable
                                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60 line-through'
                                : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300'
                            }`}
                          >
                            <span>{v.nameBn}</span>
                            {v.priceDelta !== 0 && (
                              <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-stone-500'}`}>
                                ({v.priceDelta > 0 ? `+৳${v.priceDelta}` : `-৳${Math.abs(v.priceDelta)}`})
                              </span>
                            )}
                            {isVOutOfStock && <span className="text-[10px] text-rose-500">(স্টক নেই)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Control */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-stone-700">পরিমাণ (Quantity):</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || !canOrder}
                        className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 py-2 text-sm font-bold text-stone-900 tabular-nums min-w-[40px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                        disabled={quantity >= currentStock || !canOrder}
                        className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-stone-500">
                      মোট মূল্য: <strong className="text-stone-900 font-bold tabular-nums">৳{(currentPrice * quantity).toLocaleString('bn-BD')}</strong>
                    </span>
                  </div>
                </div>

                {/* CTA Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!canOrder}
                    className={`py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      !canOrder
                        ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                        : 'bg-emerald-50 text-[#0F4C3A] border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isUnavailable ? (language === 'en' ? 'Unavailable' : 'অনুপলব্ধ') : t('addToCart')}</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!canOrder}
                    className={`py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      !canOrder
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-[#0F4C3A] hover:bg-[#135D48] text-white hover:shadow-lg'
                    }`}
                  >
                    <span>{isUnavailable ? (language === 'en' ? 'Unavailable for Sale' : 'বর্তমানে বিক্রয়ের জন্য উপলব্ধ নেই') : t('buyNow')}</span>
                    {canOrder && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>

                {/* Trust Guarantees Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-stone-200 text-xs">
                  <div className="flex items-center gap-2 text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                    <Truck className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    <div>
                      <div className="font-semibold text-stone-900">ক্যাশ অন ডেলিভারি</div>
                      <div className="text-[10px] text-stone-500">সারাদেশে হোম ডেলিভারি</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                    <ShieldCheck className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    <div>
                      <div className="font-semibold text-stone-900">১০০% আসল পণ্য</div>
                      <div className="text-[10px] text-stone-500">৭ দিনের রিটার্ন গ্যারান্টি</div>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex items-center gap-2 text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                    <PhoneCall className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    <div>
                      <div className="font-semibold text-stone-900">{language === 'en' ? 'Support Helpline' : 'সহায়তা হেল্পলাইন'}</div>
                      <div className="text-[10px] text-stone-500">
                        {storePhone || (language === 'en' ? 'Direct Live Chat' : 'সরাসরি সহায়তা')}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* LOWER TABS SECTION: Description, Specs, Reviews */}
          <div className="mt-12 pt-8 border-t border-stone-200">
            <div className="flex border-b border-stone-200 gap-4 sm:gap-8">
              <button
                onClick={() => setActiveTab('desc')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'desc'
                    ? 'border-[#0F4C3A] text-[#0F4C3A]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                পণ্যের বিস্তারিত বিবরণ
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'specs'
                    ? 'border-[#0F4C3A] text-[#0F4C3A]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                স্পেসিফিকেশন ও সাইজ গাইড
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-[#0F4C3A] text-[#0F4C3A]'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                গ্রাহকদের রিভিউ ({reviews.length || product.reviewCount})
              </button>
            </div>

            <div className="pt-6">
              {activeTab === 'desc' && (
                <div className="prose max-w-none text-stone-700 text-sm leading-relaxed space-y-4">
                  <p>{product.descriptionBn || 'এই পণ্যের বিস্তারিত বিবরণ শীঘ্রই হালনাগাদ করা হবে।'}</p>
                  {product.descriptionEn && (
                    <p className="text-xs text-stone-500 italic">{product.descriptionEn}</p>
                  )}
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-[#0F4C3A] space-y-1">
                    <div className="font-bold">সাশ্রয়ী দামের কেনাকাটার নিশ্চয়তা:</div>
                    <p>
                      প্রতিটি পণ্য সরাসরি প্রস্তুতকারক বা বিশ্বস্ত সোর্স থেকে সরবরাহ করা হয়। ডেলিভারিম্যান সামনে রেখে পণ্য পরীক্ষা করে মূল্য পরিশোধের সুযোগ পাবেন।
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                    <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500">ব্র্যান্ড:</span>
                      <span className="font-semibold text-stone-900">{product.brand}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500">ক্যাটাগরি:</span>
                      <span className="font-semibold text-stone-900">{matchedCategory?.nameBn || product.categoryNameBn || 'সাধারণ'}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500">SKU কোড:</span>
                      <span className="font-mono font-semibold text-stone-900">{product.sku}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500">মওজুদ (স্টক):</span>
                      <span className="font-semibold text-stone-900">{currentStock} টি</span>
                    </div>
                    {product.attributes &&
                      Object.entries(product.attributes).map(([k, v]) => (
                        <div key={k} className="flex justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                          <span className="text-stone-500">{k}:</span>
                          <span className="font-semibold text-stone-900">{v}</span>
                        </div>
                      ))}
                  </div>

                  {isApparelOrShirt && (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 max-w-2xl mt-4">
                      <h4 className="font-bold text-amber-950 mb-1">📏 পোশাকের সাইজ নির্দেশিকা:</h4>
                      <p className="text-stone-600 text-xs">
                        • M (৪০): বুক ৪০ ইঞ্চি, দৈর্ঘ্য ২৮ ইঞ্চি<br />
                        • L (৪২): বুক ৪২ ইঞ্চি, দৈর্ঘ্য ২৯ ইঞ্চি<br />
                        • XL (৪৪): বুক ৪৪ ইঞ্চি, দৈর্ঘ্য ৩০ ইঞ্চি<br />
                        • XXL (৪৬): বুক ৪৬ ইঞ্চি, দৈর্ঘ্য ৩১ ইঞ্চি
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews List */}
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <div className="p-6 bg-stone-50 rounded-xl text-center text-xs text-stone-500">
                        এখনও কোনো গ্রাহক রিভিউ দেননি। প্রথম রিভিউ দিন আপনি!
                      </div>
                    ) : (
                      reviews.map((r) => (
                        <div key={r.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-stone-900">{r.customerName}</span>
                              {r.isVerifiedPurchase !== false && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{language === 'en' ? 'Verified Buyer' : 'ভেরিফায়েড ক্রেতা'}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 shrink-0">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-stone-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-stone-700 leading-relaxed">{r.comment}</p>
                          <span className="text-[10px] text-stone-400 block">
                            {new Date(r.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Review Form */}
                  <div className="p-5 bg-white rounded-2xl border border-stone-200 max-w-xl space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>{language === 'en' ? 'Write a Verified Customer Review' : 'ভেরিফায়েড ক্রেতার রিভিউ ও রেটিং লিখুন'}</span>
                      </h4>
                    </div>

                    {/* Verified Buyer Policy Notice */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        {language === 'en'
                          ? 'Policy: Only customers who purchased this product can leave a review. Please enter the mobile number used during ordering to verify your purchase.'
                          : 'পলিসি: শুধুমাত্র এই পণ্যটি ক্রয়কৃত ভেরিফায়েড ক্রেতারা রিভিউ দিতে পারবেন। অর্ডার করার সময় ব্যবহৃত আপনার মোবাইল নম্বরটি লিখে যাচাই করুন।'}
                      </span>
                    </div>

                    {reviewSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}
                    {reviewErrorMsg && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                        {reviewErrorMsg}
                      </div>
                    )}

                    <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-stone-600 mb-1 font-semibold">
                          {language === 'en' ? 'Your Rating:' : 'আপনার রেটিং:'}
                        </label>
                        <div className="flex gap-1.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRevRating(star)}
                              className="p-1 cursor-pointer"
                            >
                              <Star className={`w-5 h-5 ${star <= revRating ? 'fill-current text-amber-500' : 'text-stone-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-600 mb-1 font-semibold">
                            {language === 'en' ? 'Your Name *' : 'আপনার নাম *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={revName}
                            onChange={(e) => setRevName(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-[#0F4C3A]"
                            placeholder={language === 'en' ? 'e.g. John Doe' : 'যেমন: সাকিব হাসান'}
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 mb-1 font-semibold">
                            {language === 'en' ? 'Order Mobile Number *' : 'অর্ডারের মোবাইল নম্বর *'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={revPhone}
                            onChange={(e) => setRevPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-[#0F4C3A]"
                            placeholder="017xxxxxxxx"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-stone-600 mb-1 font-semibold">
                          {language === 'en' ? 'Your Review *' : 'মন্তব্য ও বাস্তব অভিজ্ঞতা *'}
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={revComment}
                          onChange={(e) => setRevComment(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-[#0F4C3A]"
                          placeholder={language === 'en' ? 'Share your experience regarding quality, fitting...' : 'পণ্যের গুণগত মান ও অভিজ্ঞতা সম্পর্কে লিখুন...'}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-2.5 bg-[#0F4C3A] text-white rounded-xl font-semibold hover:bg-[#135D48] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{submittingReview ? (language === 'en' ? 'Verifying Purchase...' : 'যাচাই হচ্ছে...') : (language === 'en' ? 'Submit Verified Review' : 'ভেরিফায়েড রিভিউ দিন')}</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900">
                  একই ক্যাটাগরির আরও পণ্য ({matchedCategory?.nameBn || 'অন্যান্য'})
                </h3>
                <p className="text-xs text-stone-500">গ্রাহকদের পছন্দের আরও নির্বাচিত কালেকশন</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
              {relatedProducts.map((relProd) => (
                <div
                  key={relProd.id}
                  onClick={() => onOpenProduct(relProd)}
                  className="group flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-all cursor-pointer text-left"
                >
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    <img
                      src={relProd.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                      alt={relProd.titleBn}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 left-2 z-10 max-w-[85%]">
                      <ProductHighlightBadge product={relProd} variant="card" />
                    </div>
                  </div>
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-stone-400">{relProd.brand}</div>
                      <h4 className="text-xs sm:text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-[#0F4C3A]">
                        {relProd.titleBn}
                      </h4>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-stone-100">
                      <span className="text-sm font-bold text-stone-900 tabular-nums">
                        ৳{relProd.price.toLocaleString('bn-BD')}
                      </span>
                      <span className="text-xs text-[#0F4C3A] font-semibold hover:underline">
                        বিস্তারিত দেখুন →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* FULLSCREEN ZOOM MODAL */}
      {isFullscreenModalOpen && (
        <div className="fixed inset-0 z-70 bg-stone-950/95 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
            <span className="text-white text-xs font-mono">
              {selectedImageIndex + 1} / {product.images.length}
            </span>
            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img
              src={product.images[selectedImageIndex]}
              alt={product.titleBn}
              className="max-w-full max-h-full object-contain"
            />

            {product.images.length > 1 && (
              <div className="contents">
                <button
                  onClick={() =>
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))
                  }
                  className="absolute left-2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setSelectedImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Mobile Purchase Bar (Shreshtho Style for 1-thumb purchasing) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 p-3 shadow-2xl md:hidden flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-stone-500 font-medium truncate">
            {title}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-stone-900 tabular-nums">
              {formatPrice(currentPrice * quantity)}
            </span>
            {product.originalPrice && product.originalPrice > currentPrice && (
              <span className="text-[11px] text-stone-400 line-through tabular-nums">
                {formatPrice(product.originalPrice * quantity)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="p-2.5 rounded-xl border border-emerald-600 text-[#0F4C3A] bg-emerald-50 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
            title={t('addToCart')}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="py-2.5 px-4 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <span>{t('buyNow')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
