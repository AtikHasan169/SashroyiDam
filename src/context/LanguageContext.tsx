import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface Translations {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const translations: Translations = {
  // Brand & Taglines
  brandName: { bn: 'সাশ্রয়ী দাম', en: 'Sashroyi Daam' },
  brandTagline: { bn: 'আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান', en: 'Your choice, affordable price & best quality' },
  onlineShopping: { bn: 'অনলাইন শপিং', en: 'Online Shopping' },
  
  // Header & Navigation
  allProducts: { bn: 'সকল পণ্য', en: 'All Products' },
  menu: { bn: 'মেনু', en: 'Menu' },
  searchPlaceholder: { bn: 'পণ্য, ক্যাটাগরি বা ব্র্যান্ড খুঁজুন...', en: 'Search products, categories or brands...' },
  account: { bn: 'অ্যাকাউন্ট', en: 'Account' },
  login: { bn: 'লগইন', en: 'Login' },
  wishlist: { bn: 'পছন্দের তালিকা', en: 'Wishlist' },
  bag: { bn: 'ব্যাগ', en: 'Bag' },
  trackOrder: { bn: 'অর্ডার ট্র্যাক', en: 'Track Order' },
  adminPanel: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel' },
  facebookPage: { bn: 'ফেসবুক পেজ', en: 'Facebook Page' },
  freeDeliveryNotice: {
    bn: '🚚 ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি ডেলিভারি! সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।',
    en: '🚚 Free delivery nationwide on orders over ৳2,000! Cash on delivery available.'
  },

  // Actions
  addToBag: { bn: 'ব্যাগে যোগ করুন', en: 'Add to Bag' },
  buyNow: { bn: 'এখনই কিনুন', en: 'Buy Now' },
  orderNow: { bn: 'এখনই অর্ডার করুন', en: 'Order Now' },
  viewDetails: { bn: 'সম্পূর্ণ বিবরণ দেখুন', en: 'View Full Details' },
  checkout: { bn: 'চেকআউট করুন', en: 'Checkout' },
  proceedToOrder: { bn: 'অর্ডারে এগিয়ে যান', en: 'Proceed to Checkout' },
  confirmOrder: { bn: 'অর্ডার নিশ্চিত করুন', en: 'Confirm Order' },
  close: { bn: 'বন্ধ করুন', en: 'Close' },
  addedToBag: { bn: 'পণ্যটি ব্যাগে যোগ করা হয়েছে', en: 'Item added to your bag' },
  viewBag: { bn: 'ব্যাগ দেখুন', en: 'View Bag' },

  // Status & Stock
  inStock: { bn: 'স্টকে আছে', en: 'In Stock' },
  outOfStock: { bn: 'স্টক শেষ', en: 'Out of Stock' },
  onlyFewLeft: { bn: 'মাত্র {count} টি বাকি', en: 'Only {count} left' },
  savings: { bn: '{amount} সাশ্রয়', en: 'Save {amount}' },
  verifiedReviews: { bn: 'টি ভেরিফাইড রিভিউ', en: 'verified reviews' },
  soldCount: { bn: 'টি বিক্রি সম্পন্ন', en: 'sold' },

  // Cart & Free Shipping
  shoppingBagTitle: { bn: 'আপনার শপিং ব্যাগ', en: 'Your Shopping Bag' },
  emptyBag: { bn: 'আপনার শপিং ব্যাগটি খালি', en: 'Your shopping bag is empty' },
  subtotal: { bn: 'পণ্যের উপমোট (Subtotal):', en: 'Subtotal:' },
  deliveryFee: { bn: 'ডেলিভারি চার্জ:', en: 'Delivery Fee:' },
  discount: { bn: 'কুপন ছাড় (Discount):', en: 'Discount:' },
  totalPayable: { bn: 'পরিশোধযোগ্য মোট:', en: 'Total Payable:' },
  freeDeliveryCongrat: { bn: 'অভিনন্দন! আপনি ফ্রি ডেলিভারি পাচ্ছেন 🎉', en: 'Congratulations! You qualify for Free Delivery 🎉' },
  freeDeliveryRemaining: { bn: 'আর মাত্র {amount} টাকার কেনাকাটায় ফ্রি ডেলিভারি!', en: 'Add {amount} more for Free Delivery!' },
  itemsCount: { bn: '{count} টি পণ্য', en: '{count} items' },

  // Customer care & trust
  customerCare: { bn: 'কাস্টমার কেয়ার হেল্পলাইন', en: 'Customer Care Helpline' },
  callHotline: { bn: '০৯৬১২-৮৮৯৯০০', en: '09612-889900' },
  codPromise: { bn: 'সারাদেশে ক্যাশ অন ডেলিভারি ও যাচাই করে নেওয়ার নিশ্চয়তা', en: 'Nationwide Cash on Delivery with open-box verification' },
  replacementPromise: { bn: '৭ দিনের সহজ রিপ্লেসমেন্ট ও ১০০% আসল পণ্য', en: '7-day easy replacement & 100% genuine products' },
  categoriesTitle: { bn: 'পণ্য ক্যাটাগরিসমূহ', en: 'Product Categories' },
  hotDeals: { bn: '🔥 আজকের স্পেশাল অফার ও মেগা ডিল', en: '🔥 Today\'s Hot Deals & Offers' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  formatNumber: (num: number) => string;
  formatPrice: (num: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('sashroyi_language');
    return saved === 'en' ? 'en' : 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sashroyi_language', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'bn' ? 'en' : 'bn';
    setLanguage(next);
  };

  // Convert numbers to Bengali digits if language is bn
  const formatNumber = (num: number): string => {
    if (language === 'bn') {
      return num.toLocaleString('bn-BD');
    }
    return num.toLocaleString('en-US');
  };

  const formatPrice = (num: number): string => {
    return `৳${formatNumber(num)}`;
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const entry = translations[key];
    let text = entry ? entry[language] || entry.bn || key : key;
    if (replacements) {
      Object.entries(replacements).forEach(([rKey, rVal]) => {
        text = text.replace(`{${rKey}}`, String(rVal));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatNumber,
        formatPrice
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
