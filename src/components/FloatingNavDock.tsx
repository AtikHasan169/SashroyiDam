import React from 'react';
import { Home, Grid, Search, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface FloatingNavDockProps {
  onOpenAccount: () => void;
  onOpenCategories: () => void;
  onOpenSearch: () => void;
  onHomeClick?: () => void;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  onOpenAccount,
  onOpenCategories,
  onOpenSearch,
  onHomeClick
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      language === 'bn'
        ? 'সাশ্রয়ী দাম (Sashroyi Daam) থেকে সহায়তা প্রয়োজন।'
        : 'Hello! I need assistance with an order on Sashroyi Daam.'
    );
    window.open(`https://wa.me/8801700000000?text=${text}`, '_blank');
  };

  return (
    <nav
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-stone-200/90 px-3 py-1.5 flex items-center gap-2 sm:gap-4 transition-all duration-300 md:hidden"
      aria-label="মোবাইল নেভিগেশন ডক"
    >
      {/* 1. Home */}
      <button
        onClick={() => {
          if (onHomeClick) {
            onHomeClick();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[44px]"
        title={language === 'bn' ? 'হোম পেজ' : 'Home'}
      >
        <Home className="w-4 h-4" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'হোম' : 'Home'}
        </span>
      </button>

      {/* 2. Categories */}
      <button
        onClick={onOpenCategories}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[44px]"
        title={t('categoriesTitle')}
      >
        <Grid className="w-4 h-4 text-[#0F4C3A]" />
        <span className="text-[10px] font-bold mt-0.5 text-[#0F4C3A]">
          {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
        </span>
      </button>

      {/* 3. Search */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[44px]"
        title={language === 'bn' ? 'পণ্য খুঁজুন' : 'Search'}
      >
        <Search className="w-4 h-4" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'সার্চ' : 'Search'}
        </span>
      </button>

      {/* 4. WhatsApp Help */}
      <button
        onClick={handleOpenWhatsApp}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-emerald-700 hover:text-emerald-800 active:scale-90 transition-all cursor-pointer min-w-[44px]"
        title="WhatsApp Support"
      >
        <MessageCircle className="w-4 h-4 text-emerald-600" />
        <span className="text-[10px] font-semibold mt-0.5">
          {language === 'bn' ? 'সাপোর্ট' : 'Help'}
        </span>
      </button>

      {/* 5. Account / Profile */}
      <button
        onClick={onOpenAccount}
        className="flex flex-col items-center justify-center py-1 px-2.5 text-stone-600 hover:text-[#0F4C3A] active:scale-90 transition-all cursor-pointer min-w-[44px]"
        title={user ? t('account') : t('login')}
      >
        <User className="w-4 h-4" />
        <span className="text-[10px] font-semibold mt-0.5 truncate max-w-[50px]">
          {user ? user.name.split(' ')[0] : (language === 'bn' ? 'প্রোফাইল' : 'Account')}
        </span>
      </button>
    </nav>
  );
};
