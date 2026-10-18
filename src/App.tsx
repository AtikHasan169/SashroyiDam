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
import { ProfilePage } from './components/ProfilePage.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { FloatingNavDock } from './components/FloatingNavDock.tsx';
import { ClassyFloatingBar } from './components/ClassyFloatingBar.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { useCart } from './context/CartContext.tsx';
import { ProductQuickActionSheet } from './components/ProductQuickActionSheet.tsx';
import { CartToast, type CartToastItem } from './components/CartToast.tsx';
import { SearchOverlay } from './components/SearchOverlay.tsx';
import { TrustGuaranteeBar } from './components/TrustGuaranteeBar.tsx';
import { Footer } from './components/Footer.tsx';
import { api } from './lib/api.ts';
import type { Product, Category, Order } from './types/index.ts';
import { Filter, ArrowUpDown, Check, RefreshCw, LayoutGrid, List } from 'lucide-react';

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
  const [isProfilePageOpen, setIsProfilePageOpen] = useState(false);
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Deep linking: detect ?product=..., ?category=..., or ?view=profile on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product');
    const catParam = params.get('category');
    const viewParam = params.get('view');

    if (viewParam === 'profile') {
      setIsProfilePageOpen(true);
    }
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
      const viewParam = params.get('view');

      setIsProfilePageOpen(viewParam === 'profile');

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
    setIsProfilePageOpen(false);
    setViewingProductPage(prod);
    const url = new URL(window.location.href);
    url.searchParams.set('product', prod.slug || prod.id);
    url.searchParams.delete('view');
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

  const handleOpenProfilePage = () => {
    setSelectedProduct(null);
    setViewingProductPage(null);
    setViewingCategory(null);
    setIsProfilePageOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'profile');
    url.searchParams.delete('product');
    url.searchParams.delete('category');
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catId: string) => {
    setIsProfilePageOpen(false);
    if (viewingProductPage) {
      setViewingProductPage(null);
    }
    if (catId === 'all') {
      setViewingCategory(null);
      setSelectedCategory('all');
      const url = new URL(window.location.href);
      url.searchParams.delete('category');
      url.searchParams.delete('product');
      url.searchParams.delete('view');
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
        url.searchParams.delete('view');
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
    setIsProfilePageOpen(false);
    setSelectedCategory('all');
    setSearchQuery('');
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    url.searchParams.delete('product');
    url.searchParams.delete('view');
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
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 font-sans pb-28 md:pb-0">
      {/* 1. Header with balanced mobile layout and clean marquee */}
      <Header
        onOpenAccount={handleOpenProfilePage}
        onHomeClick={handleBackToHome}
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
          if (isProfilePageOpen) {
            setIsProfilePageOpen(false);
          }
          setSearchQuery(q);
        }}
        announcement={storeInfo?.settings?.announcementStripBn}
        categories={categories}
        isDrawerOpen={isLeftDrawerOpen}
        setIsDrawerOpen={setIsLeftDrawerOpen}
      />

      {/* 2. DEDICATED PRODUCT PAGE, CATEGORY PAGE, DEDICATED PROFILE PAGE, OR HOMEPAGE CATALOG */}
      {viewingProductPage ? (
        <div className="animate-in fade-in duration-300 ease-out">
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
        </div>
      ) : viewingCategory ? (
        <div className="animate-in fade-in duration-300 ease-out">
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
        </div>
      ) : isProfilePageOpen ? (
        <div className="animate-in fade-in duration-300 ease-out">
          <ProfilePage
            onBackToShopping={handleBackToHome}
            onTrackOrder={handleOpenTrackingWithNumber}
            onOpenAdmin={() => {
              setIsProfilePageOpen(false);
              setAdminEditingProduct(null);
              setIsAdminOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-in fade-in duration-300 ease-out">
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
          <main id="products" className="flex-1 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1620px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-10">
            {/* Catalog Header & Filter Bar: Stock & Pick on one side, Grid Switcher on the other side */}
            <div className="flex flex-col gap-4 pb-6 border-b border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
              </div>

              {/* Side-by-Side Controls: Stock & Pick on Left Side, Grid Switcher on Right Side */}
              <div className="w-full flex items-center justify-between gap-2">
                {/* Side 1 (Left): Stock & Pick */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* In-Stock Toggle */}
                  <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-stone-700 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-stone-200 hover:border-stone-300 cursor-pointer transition-colors shadow-2xs shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded text-[#0F4C3A] focus:ring-[#0F4C3A] w-3.5 h-3.5"
                    />
                    <span className="hidden xs:inline sm:inline">{language === 'en' ? 'In Stock' : 'স্টকে আছে'}</span>
                    <span className="inline xs:hidden sm:hidden">{language === 'en' ? 'Stock' : 'স্টক'}</span>
                  </label>

                  {/* Sort Dropdown ("Pick") */}
                  <div className="relative shrink-0">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as any)}
                      className="appearance-none bg-white text-[11px] sm:text-xs font-semibold text-stone-700 pl-2.5 pr-7 py-1.5 sm:py-2 rounded-lg border border-stone-200 hover:border-stone-300 cursor-pointer focus:outline-none focus:border-[#0F4C3A] shadow-2xs max-w-[130px] sm:max-w-none truncate"
                    >
                      <option value="featured">{language === 'en' ? 'Featured Picks' : 'বাছাইকৃত (Featured)'}</option>
                      <option value="best_selling">{language === 'en' ? 'Best Selling' : 'জনপ্রিয় ও বেশি বিক্রিত'}</option>
                      <option value="newest">{language === 'en' ? 'New Arrivals' : 'নতুন সংযোজিত'}</option>
                      <option value="price_asc">{language === 'en' ? 'Price: Low' : 'মূল্য: কম থেকে বেশি'}</option>
                      <option value="price_desc">{language === 'en' ? 'Price: High' : 'মূল্য: বেশি থেকে কম'}</option>
                    </select>
                    <ArrowUpDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Side 2 (Right): View Mode Switcher (Grid vs List) */}
                <div className="flex items-center bg-white p-1 rounded-lg border border-stone-200 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#0F4C3A] text-white shadow-xs font-bold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                    title={language === 'en' ? 'Grid View' : 'গ্রিড ভিউ (Grid)'}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#0F4C3A] text-white shadow-xs font-bold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                    title={language === 'en' ? 'List View' : 'লিস্ট ভিউ (List)'}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Cards Grid / List with direct 1-click buy button */}
            <div className="pt-8">
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5 lg:gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
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
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5 lg:gap-6'
                      : 'flex flex-col gap-4'
                  }
                >
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      viewMode={viewMode}
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

      {/* Classy Floating Bar: Live Cart Total + 'সহায়তা' WhatsApp Help */}
      <ClassyFloatingBar />

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
        onOpenAdmin={() => {
          setIsAccountOpen(false);
          setIsAdminOpen(true);
        }}
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
          onOpenAccount={handleOpenProfilePage}
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
