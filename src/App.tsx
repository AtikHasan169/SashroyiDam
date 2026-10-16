import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { CategoryShowcase } from './components/CategoryShowcase.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { ProductPage } from './components/ProductPage.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutFlow } from './components/CheckoutFlow.tsx';
import { OrderTrackingModal } from './components/OrderTrackingModal.tsx';
import { AccountModal } from './components/AccountModal.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { Footer } from './components/Footer.tsx';
import { api } from './lib/api.ts';
import type { Product, Category, Order } from './types/index.ts';
import { Filter, ArrowUpDown, Check, RefreshCw } from 'lucide-react';

function StorefrontApp() {
  // Global Modals State
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingProductPage, setViewingProductPage] = useState<Product | null>(null);
  const [adminEditingProduct, setAdminEditingProduct] = useState<Partial<Product> | null>(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');

  // Store data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState<'featured' | 'newest' | 'price_asc' | 'price_desc' | 'best_selling'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Fetch store configuration and categories
  const loadStoreMeta = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.getCategories(),
        api.getStoreInfo()
      ]);
      setCategories(cRes.categories);
      setStoreInfo(sRes);
    } catch (err) {
      console.error('Failed to load store metadata:', err);
    }
  }, []);

  // Fetch products with active filters
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const res = await api.getProducts({
        category: selectedCategory !== 'all' ? selectedCategory : '',
        search: searchQuery || '',
        sort: sortOption,
        inStock: inStockOnly ? 'true' : ''
      });
      setProducts(res.items);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [selectedCategory, searchQuery, sortOption, inStockOnly]);

  useEffect(() => {
    loadStoreMeta();
  }, [loadStoreMeta]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Deep linking: detect ?product=... on load or URL popstate
  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product');
    if (prodParam) {
      const found = products.find((p) => p.slug === prodParam || p.id === prodParam);
      if (found) {
        setViewingProductPage(found);
      }
    }
  }, [products]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const prodParam = params.get('product');
      if (prodParam && products.length > 0) {
        const found = products.find((p) => p.slug === prodParam || p.id === prodParam);
        if (found) {
          setViewingProductPage(found);
          setSelectedProduct(null);
        } else {
          setViewingProductPage(null);
        }
      } else {
        setViewingProductPage(null);
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const handleOpenProductPage = (prod: Product) => {
    setSelectedProduct(null);
    setViewingProductPage(prod);
    const url = new URL(window.location.href);
    url.searchParams.set('product', prod.slug || prod.id);
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromProductPage = () => {
    setViewingProductPage(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    const newUrl = url.pathname + (url.search ? url.search : '');
    window.history.pushState({}, '', newUrl);
  };

  const handleAdminEditProduct = (prod: Product) => {
    setAdminEditingProduct(prod);
    setIsAdminOpen(true);
  };

  const handleAdminDeleteProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    const prodName = prod?.titleBn || 'এই পণ্যটি';
    if (!confirm(`আপনি কি নিশ্চিত যে "${prodName}" স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await api.deleteProduct(id, true);
      setSelectedProduct(null);
      setViewingProductPage(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.pushState({}, '', url.pathname);
      await loadProducts();
      await loadStoreMeta();
    } catch (err: any) {
      alert(err.message || 'পণ্য মুছতে সমস্যা হয়েছে');
    }
  };

  const handleOrderSuccess = (order: Order) => {
    loadProducts(); // refresh stock numbers
  };

  const handleOpenTrackingWithNumber = (orderNum: string) => {
    setTrackingOrderNumber(orderNum);
    setIsTrackingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 font-sans pb-16 md:pb-0">
      {/* 1. Header with moving announcement marquee */}
      <Header
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenAdmin={() => {
          setAdminEditingProduct(null);
          setIsAdminOpen(true);
        }}
        onSelectCategory={(catId) => {
          if (viewingProductPage) {
            handleBackFromProductPage();
          }
          setSelectedCategory(catId);
          setTimeout(() => {
            const el = document.getElementById('products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          if (viewingProductPage) {
            handleBackFromProductPage();
          }
          setSearchQuery(q);
        }}
        announcement={storeInfo?.settings?.announcementStripBn}
      />

      {/* 2. DEDICATED PRODUCT PAGE VIEW OR HOMEPAGE CATALOG */}
      {viewingProductPage ? (
        <ProductPage
          product={viewingProductPage}
          categories={categories}
          allProducts={products}
          onBack={handleBackFromProductPage}
          onOpenProduct={handleOpenProductPage}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onEditProduct={handleAdminEditProduct}
          onDeleteProduct={handleAdminDeleteProduct}
        />
      ) : (
        <>
          {/* Hero Section (shown when no specific search query is typed) */}
          {!searchQuery && (
            <>
              <Hero
                onExploreClick={() => {
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                bannerTitle={storeInfo?.banners?.[0]?.titleBn}
                bannerSubtitle={storeInfo?.banners?.[0]?.subtitleBn}
              />

              {/* Category Showcase Grid */}
              <CategoryShowcase
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(catId) => {
                  setSelectedCategory(catId);
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </>
          )}

          {/* Product Catalog Section */}
          <main id="products" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Catalog Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  {searchQuery
                    ? `খোঁজার ফলাফল: "${searchQuery}"`
                    : selectedCategory === 'all'
                    ? 'সকল পণ্য সম্ভার'
                    : categories.find((c) => c.id === selectedCategory)?.nameBn || 'পণ্যসমূহ'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  মোট {products.length} টি পণ্য পাওয়া গেছে
                </p>
              </div>

              {/* Sort & Quick Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* In-Stock Toggle */}
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 bg-white px-3 py-2 rounded-lg border border-stone-200 hover:border-stone-300 cursor-pointer transition-colors shadow-2xs">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-[#0F4C3A] focus:ring-[#0F4C3A]"
                  />
                  <span>শুধুমাত্র স্টকে থাকা পণ্য</span>
                </label>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="appearance-none bg-white text-xs font-semibold text-stone-700 pl-3 pr-8 py-2 rounded-lg border border-stone-200 hover:border-stone-300 cursor-pointer focus:outline-none focus:border-[#0F4C3A] shadow-2xs"
                  >
                    <option value="featured">বাছাইকৃত (Featured)</option>
                    <option value="best_selling">জনপ্রিয় ও বেশি বিক্রিত</option>
                    <option value="newest">নতুন সংযোজিত (Newest)</option>
                    <option value="price_asc">মূল্য: কম থেকে বেশি</option>
                    <option value="price_desc">মূল্য: বেশি থেকে কম</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product Cards Grid with auto-changing highlights */}
            <div className="pt-8">
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                      <div className="aspect-4/3 bg-stone-200 rounded-lg" />
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                      <div className="h-5 bg-stone-200 rounded w-1/3 pt-2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                /* Clear Empty State */
                <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 max-w-lg mx-auto space-y-4">
                  <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">
                    প্রদত্ত শর্তানুসারে কোনো পণ্য পাওয়া যায়নি
                  </h3>
                  <p className="text-xs text-stone-500">
                    অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setInStockOnly(false);
                    }}
                    className="px-4 py-2 bg-[#0F4C3A] text-white rounded-lg text-xs font-semibold hover:bg-[#135D48] transition-colors cursor-pointer"
                  >
                    সকল ফিল্টার মুছুন
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onOpenDetails={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* 5. Footer */}
      <Footer
        onOpenTracking={() => setIsTrackingOpen(true)}
        onSelectCategory={(catId) => {
          if (viewingProductPage) {
            handleBackFromProductPage();
          }
          setSelectedCategory(catId);
          setTimeout(() => {
            const el = document.getElementById('products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onProductUpdated={loadProducts}
        onOpenDedicatedPage={handleOpenProductPage}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onEditProduct={handleAdminEditProduct}
        onDeleteProduct={handleAdminDeleteProduct}
      />

      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setTrackingOrderNumber('');
        }}
        initialOrderNumber={trackingOrderNumber}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onTrackOrder={handleOpenTrackingWithNumber}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          setAdminEditingProduct(null);
        }}
        initialEditingProduct={adminEditingProduct}
        onStoreDataChanged={() => {
          loadStoreMeta();
          loadProducts();
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenCategories={() => {
          if (viewingProductPage) {
            handleBackFromProductPage();
          }
          setTimeout(() => {
            const el = document.getElementById('categories') || document.getElementById('products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onOpenSearch={() => {
          if (viewingProductPage) {
            handleBackFromProductPage();
          }
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <StorefrontApp />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
