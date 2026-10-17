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
import { CategoryPage } from './components/CategoryPage.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutFlow, type DirectBuyItem } from './components/CheckoutFlow.tsx';
import { OrderTrackingModal } from './components/OrderTrackingModal.tsx';
import { AccountModal } from './components/AccountModal.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { FloatingNavDock } from './components/FloatingNavDock.tsx';
import { SmartBazaarCartPill } from './components/SmartBazaarCartPill.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { useCart } from './context/CartContext.tsx';
import { ProductQuickActionSheet } from './components/ProductQuickActionSheet.tsx';
import { CartToast, type CartToastItem } from './components/CartToast.tsx';
import { SearchOverlay } from './components/SearchOverlay.tsx';
import { TrustGuaranteeBar } from './components/TrustGuaranteeBar.tsx';
import { Footer } from './components/Footer.tsx';
import { FloatingSocialBadge } from './components/FloatingSocialBadge.tsx';
import { api } from './lib/api.ts';
import type { Product, Category, Order } from './types/index.ts';
import { Filter, ArrowUpDown, Check, RefreshCw } from 'lucide-react';

function StorefrontApp() {
  const { language, t, formatNumber } = useLanguage();
  const { addToCart, setIsCartDrawerOpen } = useCart();

  // Global Modals State
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [directBuyItem, setDirectBuyItem] = useState<DirectBuyItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingProductPage, setViewingProductPage] = useState<Product | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [quickActionProduct, setQuickActionProduct] = useState<Product | null>(null);
  const [cartToastItem, setCartToastItem] = useState<CartToastItem | null>(null);
  const [adminEditingProduct, setAdminEditingProduct] = useState<Partial<Product> | null>(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);

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

  // Deep linking: detect ?product=... or ?category=... on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product');
    const catParam = params.get('category');
    if (prodParam && products.length > 0) {
      const found = products.find((p) => p.slug === prodParam || p.id === prodParam);
      if (found) {
        setViewingProductPage(found);
      }
    }
    if (catParam && categories.length > 0) {
      const foundCat = categories.find((c) => c.slug === catParam || c.id === catParam);
      if (foundCat) {
        setViewingCategory(foundCat);
        setSelectedCategory(foundCat.id);
      }
    }
  }, [products, categories]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const prodParam = params.get('product');
      const catParam = params.get('category');
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

      if (catParam && categories.length > 0) {
        const foundCat = categories.find((c) => c.slug === catParam || c.id === catParam);
        if (foundCat) {
          setViewingCategory(foundCat);
          setSelectedCategory(foundCat.id);
        } else {
          setViewingCategory(null);
        }
      } else {
        setViewingCategory(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, categories]);

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

  const handleSelectCategory = (catId: string) => {
    if (viewingProductPage) {
      setViewingProductPage(null);
    }
    if (catId === 'all') {
      setViewingCategory(null);
      setSelectedCategory('all');
      const url = new URL(window.location.href);
      url.searchParams.delete('category');
      url.searchParams.delete('product');
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const cat = categories.find((c) => c.id === catId || c.slug === catId);
      if (cat) {
        setViewingCategory(cat);
        setSelectedCategory(cat.id);
        const url = new URL(window.location.href);
        url.searchParams.set('category', cat.slug || cat.id);
        url.searchParams.delete('product');
        window.history.pushState({}, '', url.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSelectedCategory(catId);
      }
    }
  };

  const handleBackToHome = () => {
    setViewingCategory(null);
    setViewingProductPage(null);
    setSelectedCategory('all');
    setSearchQuery('');
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    url.searchParams.delete('product');
    window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleDirectBuy = (product: Product, variantId?: string, quantity: number = 1) => {
    setDirectBuyItem({ product, variantId, quantity });
    setIsCheckoutOpen(true);
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
      {/* 1. Header with balanced mobile layout and clean marquee */}
      <Header
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenAdmin={() => {
          setAdminEditingProduct(null);
          setIsAdminOpen(true);
        }}
        onOpenHelp={() => setIsHelpOpen((prev) => !prev)}
        onOpenSearch={() => setIsSearchOverlayOpen(true)}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          if (viewingProductPage) {
            handleBackFromProductPage();
          }
          if (viewingCategory) {
            setViewingCategory(null);
          }
          setSearchQuery(q);
        }}
        announcement={storeInfo?.settings?.announcementStripBn}
        categories={categories}
        isDrawerOpen={isLeftDrawerOpen}
        setIsDrawerOpen={setIsLeftDrawerOpen}
      />

      {/* 2. DEDICATED PRODUCT PAGE VIEW, DEDICATED CATEGORY PAGE, OR HOMEPAGE CATALOG */}
      {viewingProductPage ? (
        <ProductPage
          product={viewingProductPage}
          categories={categories}
          allProducts={products}
          onBack={handleBackFromProductPage}
          onOpenProduct={handleOpenProductPage}
          onOpenCheckout={() => {
            setDirectBuyItem(null);
            setIsCheckoutOpen(true);
          }}
          onDirectBuy={handleDirectBuy}
          onEditProduct={handleAdminEditProduct}
          onDeleteProduct={handleAdminDeleteProduct}
        />
      ) : viewingCategory ? (
        <CategoryPage
          category={viewingCategory}
          allCategories={categories}
          products={products}
          onBackToHome={handleBackToHome}
          onSelectCategory={handleSelectCategory}
          onOpenProduct={handleOpenProductPage}
          onDirectBuy={handleDirectBuy}
          onQuickAddToast={(p) =>
            setCartToastItem({
              id: p.id,
              title: language === 'en' && p.titleEn ? p.titleEn : p.titleBn,
              imageUrl: p.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
              price: p.price
            })
          }
        />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Hero Section (shown when no specific search query is typed) */}
          {!searchQuery && (
            <div>
              <Hero
                products={products}
                onOpenProduct={handleOpenProductPage}
                onExploreClick={() => {
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onSelectCategory={handleSelectCategory}
              />

              {/* Category Showcase Grid */}
              <CategoryShowcase
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
            </div>
          )}

          {/* Product Catalog Section */}
          <main id="products" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Catalog Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  {searchQuery
                    ? (language === 'en' ? `Search results for: "${searchQuery}"` : `খোঁজার ফলাফল: "${searchQuery}"`)
                    : selectedCategory === 'all'
                    ? (language === 'en' ? 'All Products Collection' : 'সকল পণ্য সম্ভার')
                    : (language === 'en'
                        ? categories.find((c) => c.id === selectedCategory)?.nameEn || categories.find((c) => c.id === selectedCategory)?.nameBn || 'Products'
                        : categories.find((c) => c.id === selectedCategory)?.nameBn || 'পণ্যসমূহ')}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  {language === 'en' ? `Total ${products.length} products found` : `মোট ${formatNumber(products.length)} টি পণ্য পাওয়া গেছে`}
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
                  <span>{language === 'en' ? 'In Stock Only' : 'শুধুমাত্র স্টকে থাকা পণ্য'}</span>
                </label>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="appearance-none bg-white text-xs font-semibold text-stone-700 pl-3 pr-8 py-2 rounded-lg border border-stone-200 hover:border-stone-300 cursor-pointer focus:outline-none focus:border-[#0F4C3A] shadow-2xs"
                  >
                    <option value="featured">{language === 'en' ? 'Featured Picks' : 'বাছাইকৃত (Featured)'}</option>
                    <option value="best_selling">{language === 'en' ? 'Best Selling' : 'জনপ্রিয় ও বেশি বিক্রিত'}</option>
                    <option value="newest">{language === 'en' ? 'New Arrivals' : 'নতুন সংযোজিত (Newest)'}</option>
                    <option value="price_asc">{language === 'en' ? 'Price: Low to High' : 'মূল্য: কম থেকে বেশি'}</option>
                    <option value="price_desc">{language === 'en' ? 'Price: High to Low' : 'মূল্য: বেশি থেকে কম'}</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product Cards Grid with direct 1-click buy button */}
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
                    {language === 'en' ? 'No products found matching your criteria' : 'প্রদত্ত শর্তানুসারে কোনো পণ্য পাওয়া যায়নি'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'en' ? 'Try searching for a different keyword or reset active filters.' : 'অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setInStockOnly(false);
                    }}
                    className="px-4 py-2 bg-[#0F4C3A] text-white rounded-lg text-xs font-semibold hover:bg-[#135D48] transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Clear All Filters' : 'সকল ফিল্টার মুছুন'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onOpenDetails={(p) => handleOpenProductPage(p)}
                      onDirectBuy={(p) => handleDirectBuy(p)}
                      onQuickAddToast={(p) =>
                        setCartToastItem({
                          id: p.id,
                          title: language === 'en' && p.titleEn ? p.titleEn : p.titleBn,
                          imageUrl: p.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
                          price: p.price
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* 5. Trust & Delivery Guarantee Bar (Relocated to dedicated pre-footer) */}
      <TrustGuaranteeBar />

      {/* 6. Footer */}
      <Footer
        onOpenTracking={() => setIsTrackingOpen(true)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Floating Classy Minimal Customer Support Badge */}
      <FloatingSocialBadge
        isOpenControlled={isHelpOpen}
        onOpenChangeControlled={setIsHelpOpen}
      />

      {/* SmartBazaar Style Persistent Floating Side Cart Pill */}
      <SmartBazaarCartPill />

      {/* Product Tap Quick-Action Bottom Sheet (Add to Cart / Buy Now / View Details) */}
      <ProductQuickActionSheet
        product={quickActionProduct}
        onClose={() => setQuickActionProduct(null)}
        onAddToCart={(product, variantId, quantity) => {
          addToCart(product.id, variantId, quantity || 1);
          setCartToastItem({
            id: product.id,
            title: language === 'en' && product.titleEn ? product.titleEn : product.titleBn,
            imageUrl: product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
            price: product.price
          });
        }}
        onDirectBuy={(product, variantId, quantity) => {
          handleDirectBuy(product, variantId, quantity);
        }}
        onOpenFullPage={(product) => {
          handleOpenProductPage(product);
        }}
      />

      {/* User-Friendly Floating Cart Toast Feedback */}
      <CartToast
        toastItem={cartToastItem}
        onClose={() => setCartToastItem(null)}
        onOpenCart={() => setIsCartDrawerOpen(true)}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onProductUpdated={loadProducts}
        onOpenDedicatedPage={handleOpenProductPage}
        onOpenCheckout={() => {
          setDirectBuyItem(null);
          setIsCheckoutOpen(true);
        }}
        onDirectBuy={handleDirectBuy}
        onEditProduct={handleAdminEditProduct}
        onDeleteProduct={handleAdminDeleteProduct}
      />

      <CartDrawer
        onProceedToCheckout={() => {
          setDirectBuyItem(null);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setDirectBuyItem(null);
        }}
        onOrderSuccess={handleOrderSuccess}
        directBuyItem={directBuyItem}
        onOpenTrackingWithNumber={handleOpenTrackingWithNumber}
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

      {/* Shreshtho-Style Floating Rounded Pill Dock (Shown on Storefront Catalog) */}
      {!viewingProductPage && (
        <FloatingNavDock
          onOpenAccount={() => setIsAccountOpen(true)}
          onOpenCategories={() => setIsLeftDrawerOpen(true)}
          onOpenSearch={() => setIsSearchOverlayOpen(true)}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onHomeClick={handleBackToHome}
        />
      )}

      {/* Instant Search Overlay with Autofocus Keyboard */}
      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        products={products}
        onSelectProduct={(p) => {
          handleOpenProductPage(p);
          setIsSearchOverlayOpen(false);
        }}
        onSelectCategory={(catId) => {
          handleSelectCategory(catId);
          setIsSearchOverlayOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <StorefrontApp />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
