import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle, Facebook, Send } from 'lucide-react';
import type { Product } from '../types/index.ts';

interface ProductShareButtonProps {
  product: Product;
  variant?: 'card-icon' | 'modal' | 'pill' | 'minimal';
  className?: string;
  showLabel?: boolean;
}

export const ProductShareButton: React.FC<ProductShareButtonProps> = ({
  product,
  variant = 'card-icon',
  className = '',
  showLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const productTitle = product.titleBn || product.titleEn || 'পণ্য';
  const getProductUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}?product=${product.slug || product.id}`;
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getProductUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Failed to copy product link:', err);
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getProductUrl();
    const shareText = `*${productTitle}*\nদাম: ৳${product.price.toLocaleString('bn-BD')}\n\nবিস্তারিত দেখুন ও অর্ডার করুন:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleFacebookShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getProductUrl();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    setIsOpen(false);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getProductUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          text: `${productTitle} - সাশ্রয়ী দামে অর্ডার করুন!`,
          url: url
        });
        setIsOpen(false);
      } catch (err: any) {
        // AbortError is normal when user cancels the share dialog
        if (err?.name !== 'AbortError') {
          console.log('Native share fallback');
        }
      }
    } else {
      handleCopyLink(e);
    }
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // On mobile touch devices with native share support, trigger native share directly if preferred,
    // or toggle menu. Opening the menu gives instant WhatsApp / Copy Link / Facebook options everywhere!
    // If native share is supported and it's a mobile touch device, let's open the menu with the native option included.
    setIsOpen((prev) => !prev);
  };

  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Trigger Button */}
      {variant === 'card-icon' && (
        <button
          type="button"
          onClick={handleMainButtonClick}
          aria-label="শেয়ার করুন"
          title="পণ্যটি শেয়ার করুন"
          className="p-1.5 sm:p-2 rounded-full backdrop-blur-md bg-white/85 text-stone-600 hover:text-[#0F4C3A] hover:bg-white shadow-xs transition-all cursor-pointer border border-stone-200/60"
        >
          <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        </button>
      )}

      {variant === 'modal' && (
        <button
          type="button"
          onClick={handleMainButtonClick}
          className="py-2 px-3 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          title="বন্ধুদের সাথে শেয়ার করুন"
        >
          <Share2 className="w-4 h-4 text-[#0F4C3A]" />
          <span>{showLabel !== false ? 'শেয়ার করুন' : ''}</span>
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={handleMainButtonClick}
          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-stone-600" />
          <span>শেয়ার</span>
        </button>
      )}

      {variant === 'minimal' && (
        <button
          type="button"
          onClick={handleMainButtonClick}
          className="p-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          title="শেয়ার"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}

      {/* Share Popover / Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 px-1 animate-in fade-in zoom-in-95 duration-150 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1 flex items-center justify-between">
            <span>পণ্যটি শেয়ার করুন</span>
            <Share2 className="w-3 h-3 text-stone-400" />
          </div>

          {/* Copy Link Option */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left"
          >
            {copied ? (
              <>
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-emerald-700 font-bold">লিংক কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
                <span>লিংক কপি করুন</span>
              </>
            )}
          </button>

          {/* WhatsApp Share Option */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50/70 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
            <span>হোয়াটসঅ্যাপে পাঠান</span>
          </button>

          {/* Facebook Share Option */}
          <button
            type="button"
            onClick={handleFacebookShare}
            className="w-full px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-blue-50/70 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Facebook className="w-3.5 h-3.5" />
            </div>
            <span>ফেসবুকে শেয়ার করুন</span>
          </button>

          {/* Native Device Share Sheet (if supported) */}
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer border-t border-stone-100 mt-1 text-left"
            >
              <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Send className="w-3.5 h-3.5" />
              </div>
              <span>অন্যান্য অপশন...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
