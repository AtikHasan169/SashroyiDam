import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Truck,
  Settings,
  FileText,
  AlertTriangle,
  Download,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle,
  LogOut,
  Printer,
  Layers,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Sliders,
  Sparkles,
  Calendar,
  Filter,
  Phone,
  MessageSquare,
  MessageCircle,
  Search,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { ManualOrderModal } from './ManualOrderModal.tsx';
import { generateCategorySku, generateVariantSku } from '../../utils/skuGenerator.ts';
import { cleanSlug } from '../../utils/slugify.ts';
import type {
  Product,
  Category,
  CategoryVariantType,
  ProductVariant,
  Order,
  OrderFulfilmentStatus,
  Coupon,
  StoreSettings,
  ShippingRate,
  AuditLog
} from '../../types/index.ts';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreDataChanged: (updatedProduct?: Product, deletedProductId?: string) => void;
  initialEditingProduct?: Partial<Product> | null;
  onViewProduct?: (p: Product) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onStoreDataChanged,
  initialEditingProduct,
  onViewProduct
}) => {
  const { user, isAdmin, login, logout } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'categories' | 'coupons' | 'settings' | 'audit'
  >('overview');

  // Login challenge state for admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals & sub-views
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderFulfilmentStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [showInvoicePrint, setShowInvoicePrint] = useState(false);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);

  // Manual Order Form State
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualCustomerEmail, setManualCustomerEmail] = useState('');
  const [manualDivision, setManualDivision] = useState('dhaka');
  const [manualDistrict, setManualDistrict] = useState('ঢাকা');
  const [manualAddress, setManualAddress] = useState('');
  const [manualInstructions, setManualInstructions] = useState('');
  const [manualSource, setManualSource] = useState<'facebook' | 'phone' | 'whatsapp' | 'walk_in'>('facebook');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'bank'>('cod');
  const [manualPaymentStatus, setManualPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [manualDeliveryFee, setManualDeliveryFee] = useState<number>(70);
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [manualInternalNotes, setManualInternalNotes] = useState('');
  const [manualOrderError, setManualOrderError] = useState('');
  const [manualOrderSuccess, setManualOrderSuccess] = useState('');
  const [isSubmittingManualOrder, setIsSubmittingManualOrder] = useState(false);
  const [manualItems, setManualItems] = useState<Array<{
    productId?: string;
    productTitle: string;
    variantId?: string;
    variantName?: string;
    unitPrice: number;
    quantity: number;
  }>>([
    { productTitle: '', unitPrice: 0, quantity: 1 }
  ]);

  const resetManualOrderForm = () => {
    setManualCustomerName('');
    setManualCustomerPhone('');
    setManualCustomerEmail('');
    setManualDivision('dhaka');
    setManualDistrict('ঢাকা');
    setManualAddress('');
    setManualInstructions('');
    setManualSource('facebook');
    setManualPaymentMethod('cod');
    setManualPaymentStatus('unpaid');
    setManualDeliveryFee(70);
    setManualDiscount(0);
    setManualInternalNotes('');
    setManualOrderError('');
    setManualOrderSuccess('');
    setManualItems([{ productTitle: '', unitPrice: 0, quantity: 1 }]);
  };

  // Order Filtering States
  const [orderStatusTab, setOrderStatusTab] = useState<'all' | 'pending' | 'processing' | 'delivered' | 'cancelled'>('all');
  const [orderDateRange, setOrderDateRange] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'>('all');
  const [orderCustomStartDate, setOrderCustomStartDate] = useState('');
  const [orderCustomEndDate, setOrderCustomEndDate] = useState('');

  // Date-filtered and status-filtered orders memo
  const filteredOrders = React.useMemo(() => {
    let result = [...orders];

    // 1. Date Range Filter
    const now = new Date();
    if (orderDateRange !== 'all') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 86400000;

      result = result.filter((o) => {
        const orderTime = new Date(o.createdAt || 0).getTime();
        switch (orderDateRange) {
          case 'today':
            return orderTime >= todayStart;
          case 'yesterday':
            return orderTime >= yesterdayStart && orderTime < todayStart;
          case '7days':
            return orderTime >= now.getTime() - 7 * 86400000;
          case '30days':
            return orderTime >= now.getTime() - 30 * 86400000;
          case 'month':
            return orderTime >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          case 'custom': {
            const start = orderCustomStartDate ? new Date(orderCustomStartDate).getTime() : 0;
            const end = orderCustomEndDate ? new Date(orderCustomEndDate).getTime() + 86400000 : Infinity;
            return orderTime >= start && orderTime <= end;
          }
          default:
            return true;
        }
      });
    }

    // 2. Status Tab Filter
    if (orderStatusTab !== 'all') {
      result = result.filter((o) => {
        if (orderStatusTab === 'pending') {
          return o.fulfilmentStatus === 'pending_confirmation';
        }
        if (orderStatusTab === 'processing') {
          return ['confirmed', 'processing', 'packed', 'shipped'].includes(o.fulfilmentStatus);
        }
        if (orderStatusTab === 'delivered') {
          return o.fulfilmentStatus === 'delivered';
        }
        if (orderStatusTab === 'cancelled') {
          return ['cancelled', 'return_requested', 'returned', 'refunded'].includes(o.fulfilmentStatus);
        }
        return true;
      });
    }

    return result;
  }, [orders, orderDateRange, orderStatusTab, orderCustomStartDate, orderCustomEndDate]);

  // Order counts & metrics by current date filter
  const orderMetrics = React.useMemo(() => {
    const now = new Date();
    let dateFiltered = [...orders];
    if (orderDateRange !== 'all') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 86400000;
      dateFiltered = dateFiltered.filter((o) => {
        const orderTime = new Date(o.createdAt || 0).getTime();
        switch (orderDateRange) {
          case 'today':
            return orderTime >= todayStart;
          case 'yesterday':
            return orderTime >= yesterdayStart && orderTime < todayStart;
          case '7days':
            return orderTime >= now.getTime() - 7 * 86400000;
          case '30days':
            return orderTime >= now.getTime() - 30 * 86400000;
          case 'month':
            return orderTime >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          case 'custom': {
            const start = orderCustomStartDate ? new Date(orderCustomStartDate).getTime() : 0;
            const end = orderCustomEndDate ? new Date(orderCustomEndDate).getTime() + 86400000 : Infinity;
            return orderTime >= start && orderTime <= end;
          }
          default:
            return true;
        }
      });
    }

    const all = dateFiltered.length;
    const pending = dateFiltered.filter((o) => o.fulfilmentStatus === 'pending_confirmation').length;
    const processing = dateFiltered.filter((o) => ['confirmed', 'processing', 'packed', 'shipped'].includes(o.fulfilmentStatus)).length;
    const delivered = dateFiltered.filter((o) => o.fulfilmentStatus === 'delivered').length;
    const cancelled = dateFiltered.filter((o) => ['cancelled', 'return_requested', 'returned', 'refunded'].includes(o.fulfilmentStatus)).length;
    const revenue = dateFiltered
      .filter((o) => o.fulfilmentStatus !== 'cancelled' && o.fulfilmentStatus !== 'refunded')
      .reduce((acc, o) => acc + (o.total || 0), 0);
    const aov = all > 0 ? Math.round(revenue / (all - cancelled || 1)) : 0;

    return { all, pending, processing, delivered, cancelled, revenue, aov };
  }, [orders, orderDateRange, orderCustomStartDate, orderCustomEndDate]);

  // Category edit/create modal state
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isUploadingCatImage, setIsUploadingCatImage] = useState(false);
  const [newCatOptionInput, setNewCatOptionInput] = useState('');

  // Product edit/create modal state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isUploadingProdImage, setIsUploadingProdImage] = useState(false);
  const [prodSearchTerm, setProdSearchTerm] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('all');
  const [prodStatusFilter, setProdStatusFilter] = useState<'all' | 'published' | 'hidden' | 'unavailable'>('all');

  // Real-time client-side duplicate SKU validator across existing catalog products
  const conflictingProduct = React.useMemo(() => {
    if (!editingProduct?.sku?.trim()) return null;
    const cleanCurrentSku = editingProduct.sku.trim().toUpperCase();
    return (
      products.find(
        (p) => p.sku?.trim().toUpperCase() === cleanCurrentSku && p.id !== editingProduct.id
      ) || null
    );
  }, [editingProduct?.sku, editingProduct?.id, products]);

  // Coupon modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('fixed');
  const [newCouponVal, setNewCouponVal] = useState(100);
  const [newCouponMin, setNewCouponMin] = useState(1000);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Floating high-visibility confirmation toast state
  const [toast, setToast] = useState<{
    id: number;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({
      id: Date.now(),
      title,
      message,
      type
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    showToast('সফলভাবে সংরক্ষিত', msg, 'success');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const showErrorFeedback = (msg: string) => {
    setErrorFeedback(msg);
    showToast('ত্রুটি ঘটেছে', msg, 'error');
    setTimeout(() => setErrorFeedback(''), 4000);
  };

  // MongoDB Cloud Persistence state (Configured strictly via MONGODB_URI in environment)
  const [mongoStatus, setMongoStatus] = useState<{
    isConfigured: boolean;
    isConnected: boolean;
    dbName: string;
    collections: { products: number; categories: number; orders: number; users: number };
  } | null>(null);
  const [isSyncingMongo, setIsSyncingMongo] = useState(false);

  // Initial load
  useEffect(() => {
    if (isOpen && isAdmin) {
      loadAllAdminData();
    }
  }, [isOpen, isAdmin]);

  useEffect(() => {
    if (initialEditingProduct) {
      setActiveTab('products');
      setEditingProduct(initialEditingProduct);
      setShowProductModal(true);
    }
  }, [initialEditingProduct]);

  const loadAllAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [mRes, oRes, pRes, cRes, coupRes, setRes, logRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminOrders({ limit: '30' }),
        api.getAdminProducts(),
        api.getCategories(),
        api.getAdminCoupons(),
        api.getAdminSettings(),
        api.getAuditLogs()
      ]);

      setMetrics(mRes);
      setOrders(oRes.orders);
      setProducts(pRes?.products || []);
      setCategories(cRes.categories);
      setCoupons(coupRes.coupons);
      setStoreSettings(setRes.settings);
      setShippingRates(setRes.shippingRates);
      setAuditLogs(logRes.logs);

      api.getMongoStatus().then((s) => {
        setMongoStatus(s);
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!isOpen) return null;

  // Handle Admin Login Challenge if not authenticated with administrative privileges
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(adminEmail, adminPass);
    } catch (err: any) {
      setLoginError(err.message || 'ভুল অ্যাডমিন ইমেইল বা পাসওয়ার্ড');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.updateOrderStatus(selectedOrder.id, {
        status: newStatus,
        note: statusNote || undefined
      });
      setSelectedOrder(res.order);
      setOrders((prev) => prev.map((o) => (o.id === res.order.id ? res.order : o)));
      setStatusNote('');
      setFeedbackMsg('অর্ডার স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে');
      onStoreDataChanged();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      showErrorFeedback(err.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleAddStaffNote = async () => {
    if (!selectedOrder || !staffNoteInput.trim()) return;
    try {
      const res = await api.addOrderNote(selectedOrder.id, staffNoteInput.trim());
      setSelectedOrder(res.order);
      setStaffNoteInput('');
      loadAllAdminData();
    } catch (err: any) {
      showErrorFeedback(err.message || 'নোট যোগ করতে সমস্যা হয়েছে');
    }
  };

  // Professional high-efficiency JPEG compression & upload helper (Shopify/Amazon retail standard)
  const compressAndUploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            const maxDim = 1200;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Export to professional standard high-grade JPEG (0.85 quality) for universal compatibility & sharp detail
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            try {
              const res = await api.uploadImage(dataUrl);
              resolve(res.url);
            } catch (uploadErr: any) {
              reject(new Error(uploadErr?.message || 'ছবি সার্ভারে আপলোড করতে সমস্যা হয়েছে'));
            }
          };
          img.onerror = () => reject(new Error('ছবি লোড করা সম্ভব হয়নি'));
          img.src = e.target?.result as string;
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('ফাইল পড়তে ব্যর্থ হয়েছে'));
      reader.readAsDataURL(file);
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.nameBn?.trim()) {
      showErrorFeedback('ক্যাটাগরির নাম দিন');
      return;
    }
    const catName = editingCategory.nameBn.trim();
    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory);
        showToast('ক্যাটাগরি আপডেট হয়েছে', `"${catName}" ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে`, 'success');
        setFeedbackMsg('ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে');
      } else {
        await api.createCategory(editingCategory);
        showToast('নতুন ক্যাটাগরি যুক্ত হয়েছে', `"${catName}" সফলভাবে তালিকায় যোগ করা হয়েছে`, 'success');
        setFeedbackMsg('নতুন ক্যাটাগরি সফলভাবে যুক্ত করা হয়েছে');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadAllAdminData();
      onStoreDataChanged();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      showErrorFeedback(err.message || 'ক্যাটাগরি সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      showToast('ক্যাটাগরি মুছে ফেলা হয়েছে', 'নির্বাচিত ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে', 'success');
      setFeedbackMsg('ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে');
      loadAllAdminData();
      onStoreDataChanged();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      showErrorFeedback(err.message || 'ক্যাটাগরি মুছে ফেলা যায়নি');
    }
  };

  const handleTogglePublishCategory = async (id: string) => {
    try {
      const res = await api.togglePublishCategory(id);
      setFeedbackMsg(res.message);
      loadAllAdminData();
      onStoreDataChanged();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      setFeedbackMsg(err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  const handleTogglePublishProduct = async (id: string) => {
    try {
      const res = await api.togglePublishProduct(id);
      setFeedbackMsg(res.message);
      loadAllAdminData();
      onStoreDataChanged();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      setFeedbackMsg(err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  const handleToggleAvailabilityProduct = async (id: string) => {
    try {
      const res = await api.toggleProductAvailability(id);
      setFeedbackMsg(res.message);
      loadAllAdminData();
      onStoreDataChanged();
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      setFeedbackMsg(err.message || 'অনুপলব্ধ স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  const handleSyncAllMongo = async () => {
    setIsSyncingMongo(true);
    try {
      const res = await api.syncAllToMongo();
      setFeedbackMsg(res.message);
      setTimeout(() => setFeedbackMsg(''), 4000);
      const updatedStatus = await api.getMongoStatus();
      setMongoStatus(updatedStatus);
    } catch (err: any) {
      setFeedbackMsg(err.message || 'MongoDB সিঙ্ক ব্যর্থ হয়েছে');
    } finally {
      setIsSyncingMongo(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setModalError('');

    const cleanTitle = (editingProduct.titleBn || '').trim();
    const cleanPrice = String(editingProduct.price !== undefined && editingProduct.price !== null ? editingProduct.price : '')
      .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
      .trim();
    const numPrice = Number(cleanPrice);

    if (!cleanTitle) {
      setModalError('পণ্যের নাম (বাংলা) আবশ্যক');
      return;
    }
    if (cleanPrice === '' || isNaN(numPrice) || numPrice <= 0) {
      setModalError('পণ্যের সঠিক বিক্রয় মূল্য (৳) প্রদান করুন (০ এর চেয়ে বেশি হতে হবে)');
      return;
    }

    const cleanSku = (editingProduct.sku || '').trim().toUpperCase();
    if (!cleanSku) {
      setModalError('পণ্যের SKU কোড প্রদান আবশ্যক');
      return;
    }

    // Client-side duplicate SKU validation guard
    const duplicateProd = products.find(
      (p) => p.sku?.trim().toUpperCase() === cleanSku && p.id !== editingProduct.id
    );

    if (duplicateProd) {
      const errorMsg = `এই SKU কোড (${cleanSku}) ইতিমধ্যে "${duplicateProd.titleBn}" পণ্যে ব্যবহৃত হচ্ছে। অনুগ্রহ করে ভিন্ন অথবা নতুন SKU কোড ব্যবহার করুন।`;
      setModalError(errorMsg);
      showToast('ডুপ্লিকেট SKU কোড', `SKU "${cleanSku}" ইতিমধ্যে "${duplicateProd.titleBn}" পণ্যে ব্যবহৃত হচ্ছে`, 'error');
      return;
    }

    const cleanStock = String(editingProduct.stock !== undefined && editingProduct.stock !== null ? editingProduct.stock : '10')
      .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
      .trim();
    const numStock = isNaN(Number(cleanStock)) ? 10 : Number(cleanStock);

    const cleanOrigPrice = editingProduct.originalPrice
      ? Number(String(editingProduct.originalPrice).replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))))
      : undefined;

    setIsSavingProduct(true);
    try {
      const payload = {
        ...editingProduct,
        titleBn: cleanTitle,
        price: numPrice,
        stock: numStock,
        originalPrice: cleanOrigPrice && cleanOrigPrice > 0 ? cleanOrigPrice : undefined,
        categoryId: editingProduct.categoryId || (categories[0]?.id || 'cat-general'),
        images: Array.isArray(editingProduct.images) ? editingProduct.images.filter(Boolean) : []
      };

      let savedProduct: Product;
      if (editingProduct.id) {
        const res = await api.updateProduct(editingProduct.id, payload);
        savedProduct = res.product || (payload as Product);
        setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
        showToast('পণ্য সফলভাবে আপডেট হয়েছে', `"${cleanTitle}" পণ্যের তথ্য ও বিক্রয়মূল্য সফলভাবে সংরক্ষিত হয়েছে`, 'success');
        setFeedbackMsg(`"${cleanTitle}" পণ্যটি সফলভাবে আপডেট করা হয়েছে`);
      } else {
        const res = await api.createProduct(payload);
        savedProduct = res.product || (payload as Product);
        setProducts((prev) => [savedProduct, ...prev.filter((p) => p.id !== savedProduct.id)]);
        showToast('নতুন পণ্য তৈরি হয়েছে', `"${cleanTitle}" পণ্যটি সফলভাবে ক্যাটালগে যুক্ত হয়েছে`, 'success');
        setFeedbackMsg(`"${cleanTitle}" পণ্যটি সফলভাবে তৈরি হয়েছে এবং তালিকায় যোগ হয়েছে`);
      }

      // Reset filters so the newly created/updated product is immediately visible
      setProdCatFilter('all');
      setProdSearchTerm('');

      setShowProductModal(false);
      setEditingProduct(null);

      // Instantly notify storefront catalog with the newly saved product
      onStoreDataChanged(savedProduct);

      // Refresh other admin data in background
      loadAllAdminData();
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err: any) {
      setModalError(err.message || 'পণ্য সংরক্ষণ ব্যর্থ হয়েছে');
      showToast('পণ্য সংরক্ষণ ব্যর্থ', err.message || 'পণ্য সংরক্ষণ করা সম্ভব হয়নি', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পণ্যটি আর্কাইভ করতে চান? পুরানো অর্ডারে এর কোনো প্রভাব পড়বে না।')) {
      return;
    }
    try {
      await api.archiveProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      onStoreDataChanged(undefined, id);
      showToast('পণ্য আর্কাইভ করা হয়েছে', 'পণ্যটি সফলভাবে আর্কাইভ করা হয়েছে', 'info');
      setFeedbackMsg('পণ্যটি সফলভাবে আর্কাইভ করা হয়েছে');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      showErrorFeedback(err.message || 'পণ্য আর্কাইভ করতে সমস্যা হয়েছে');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    const prodName = prod?.titleBn || 'এই পণ্যটি';
    if (!confirm(`আপনি কি নিশ্চিত যে "${prodName}" মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await api.deleteProduct(id, true);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setShowProductModal(false);
      setEditingProduct(null);
      onStoreDataChanged(undefined, id);
      showToast('পণ্য মুছে ফেলা হয়েছে', `"${prodName}" সফলভাবে ক্যাটালগ থেকে মুছে ফেলা হয়েছে`, 'success');
      setFeedbackMsg('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      showErrorFeedback(err.message || 'পণ্য মুছতে সমস্যা হয়েছে');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const couponCodeClean = newCouponCode.toUpperCase().trim();
    try {
      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.id, {
          code: couponCodeClean,
          discountType: newCouponType,
          discountValue: Number(newCouponVal),
          minOrderValue: Number(newCouponMin)
        });
        showToast('কুপন আপডেট হয়েছে', `কুপন কোড "${couponCodeClean}" সফলভাবে আপডেট করা হয়েছে`, 'success');
        setFeedbackMsg('কুপন সফলভাবে আপডেট করা হয়েছে');
      } else {
        await api.createCoupon({
          code: couponCodeClean,
          discountType: newCouponType,
          discountValue: Number(newCouponVal),
          minOrderValue: Number(newCouponMin)
        });
        showToast('নতুন কুপন যুক্ত হয়েছে', `কুপন কোড "${couponCodeClean}" সফলভাবে তৈরি করা হয়েছে`, 'success');
        setFeedbackMsg('কুপন সফলভাবে তৈরি হয়েছে');
      }
      setShowCouponModal(false);
      setEditingCoupon(null);
      setNewCouponCode('');
      setNewCouponVal(100);
      setNewCouponMin(1000);
      loadAllAdminData();
    } catch (err: any) {
      showErrorFeedback(err.message || 'কুপন সেভ করতে সমস্যা হয়েছে');
    }
  };

  const handleEditCoupon = (c: Coupon) => {
    setEditingCoupon(c);
    setNewCouponCode(c.code);
    setNewCouponType(c.discountType);
    setNewCouponVal(c.discountValue);
    setNewCouponMin(c.minOrderValue);
    setShowCouponModal(true);
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await api.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showToast('কুপন মুছে ফেলা হয়েছে', 'কুপনটি সফলভাবে মুছে ফেলা হয়েছে', 'success');
      setFeedbackMsg('কুপন মুছে ফেলা হয়েছে');
      loadAllAdminData();
    } catch (err: any) {
      showErrorFeedback(err.message || 'কুপন মুছতে সমস্যা হয়েছে');
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      await api.toggleCoupon(id);
      showToast('কুপন স্ট্যাটাস আপডেট', 'কুপনের সক্রিয় স্ট্যাটাস পরিবর্তন করা হয়েছে', 'success');
      setFeedbackMsg('কুপন স্ট্যাটাস পরিবর্তন করা হয়েছে');
      loadAllAdminData();
    } catch (err: any) {
      showErrorFeedback(err.message || 'কুপন স্ট্যাটাস পরিবর্তন ব্যর্থ');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSettings) return;
    try {
      await api.updateSettings(storeSettings);
      showToast(
        'স্টোর সেটিংস সংরক্ষিত',
        'দোকানের তথ্য, হেল্পলাইন, সোশ্যাল লিংক ও ডেলিভারি সেটিংস সফলভাবে সংরক্ষিত হয়েছে।',
        'success'
      );
      setFeedbackMsg('স্টোর সেটিংস সফলভাবে আপডেট হয়েছে');
      onStoreDataChanged();
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err: any) {
      showErrorFeedback(err.message || 'সেটিংস সেভ করতে সমস্যা হয়েছে');
    }
  };

  const handleExportCSV = () => {
    window.location.href = '/api/admin/products/export-csv';
  };

  // If not authenticated as Admin, show Secure Admin Access Gate
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-left space-y-5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">অ্যাডমিন প্রবেশদ্বার</h2>
              <p className="text-xs text-stone-500">অনুমোদিত কর্মীদের জন্য সংরক্ষিত</p>
            </div>
            <button onClick={onClose} className="p-1 rounded text-stone-400 hover:text-stone-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                অ্যাডমিন ইমেইল
              </label>
              <input
                type="email"
                required
                placeholder="admin@sashroyidaam.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                অ্যাডমিন পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                সুপার অ্যাডমিন ইমেইল ও পাসওয়ার্ড আপনার .env (SUPER_ADMIN_PASSWORD) ফাইল দ্বারা নিয়ন্ত্রিত।
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] rounded-2xl w-full max-w-7xl h-full shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-left">
        {/* Top Header */}
        <div className="px-6 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-sans text-[#0F4C3A]">সাশ্রয়ী দাম</span>
            <span className="text-lg font-bold text-stone-800">অ্যাডমিন কন্ট্রোল সেন্টার</span>
            <span className="text-xs bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllAdminData}
              className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="bg-emerald-50 text-emerald-900 px-6 py-2 text-xs font-semibold flex items-center gap-2 border-b border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}
        {errorFeedback && (
          <div className="bg-rose-50 text-rose-900 px-6 py-2 text-xs font-semibold flex items-center gap-2 border-b border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorFeedback}</span>
          </div>
        )}

        {/* Dashboard Layout: Responsive Sidebar + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar (horizontal scroll on mobile, vertical sidebar on desktop) */}
          <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-stone-200 p-2 md:p-3 flex md:flex-col gap-1 shrink-0 overflow-x-auto md:overflow-y-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-emerald-50 text-[#0F4C3A]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>ড্যাশবোর্ড</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`whitespace-nowrap md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 text-[#0F4C3A]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>অর্ডার</span>
              {metrics?.pendingOrders > 0 && (
                <span className="ml-1 bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold">
                  {metrics.pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`whitespace-nowrap md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left shrink-0 ${
                activeTab === 'products'
                  ? 'bg-emerald-50 text-[#0F4C3A]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>পণ্য ও স্টক</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`whitespace-nowrap md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-emerald-50 text-[#0F4C3A]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>ক্যাটাগরি</span>
              <span className="ml-1 bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`whitespace-nowrap md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left shrink-0 ${
                activeTab === 'coupons'
                  ? 'bg-emerald-50 text-[#0F4C3A]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Tags className="w-4 h-4 shrink-0" />
              <span>কুপন</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-emerald-50 text-[#0F4C3A]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>সেটিংস</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`whitespace-nowrap md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-emerald-50 text-[#0F4C3A]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>অডিট লগ</span>
            </button>
          </aside>

          {/* Main Workspace */}
          <main className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && metrics && (
              <div className="space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-stone-200">
                    <span className="text-xs font-medium text-stone-500">আজকের অর্ডার</span>
                    <div className="text-2xl font-bold text-stone-900 mt-1 tabular-nums">
                      {metrics.ordersToday} টি
                    </div>
                    <span className="text-[11px] text-stone-400">মোট অর্ডার: {metrics.totalOrders} টি</span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200">
                    <span className="text-xs font-medium text-stone-500">গ্রস সেলস (মোট বিক্রি)</span>
                    <div className="text-2xl font-bold text-[#0F4C3A] mt-1 tabular-nums">
                      ৳{metrics.grossSales.toLocaleString('bn-BD')}
                    </div>
                    <span className="text-[11px] text-stone-400">কার্যকর মোট অর্ডার মূল্য</span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200">
                    <span className="text-xs font-medium text-stone-500">সংগৃহীত পেমেন্ট (Paid)</span>
                    <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                      ৳{metrics.collectedPayments.toLocaleString('bn-BD')}
                    </div>
                    <span className="text-[11px] text-stone-400">
                      বকেয়া COD: ৳{metrics.pendingCodAmount.toLocaleString('bn-BD')}
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200">
                    <span className="text-xs font-medium text-stone-500">লো-স্টক সতর্কতা</span>
                    <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
                      {metrics.lowStockCount} টি
                    </div>
                    <span className="text-[11px] text-stone-400">১০ টির কম মওজুদ</span>
                  </div>
                </div>

                {/* Recent Orders & Best Sellers */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Recent Orders Table */}
                  <div className="lg:col-span-8 bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-900">সাম্প্রতিক অর্ডারসমূহ</h3>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs text-[#0F4C3A] font-semibold hover:underline"
                      >
                        সকল অর্ডার দেখুন →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                          <tr>
                            <th className="py-2 px-3">অর্ডার নং</th>
                            <th className="py-2 px-3">গ্রাহক</th>
                            <th className="py-2 px-3">মূল্য</th>
                            <th className="py-2 px-3">পদ্ধতি</th>
                            <th className="py-2 px-3">স্ট্যাটাস</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {metrics.recentOrders.map((o: Order) => (
                            <tr
                              key={o.id}
                              onClick={() => {
                                setSelectedOrder(o);
                                setNewStatus(o.fulfilmentStatus);
                                setActiveTab('orders');
                              }}
                              className="hover:bg-stone-50/70 cursor-pointer"
                            >
                              <td className="py-2.5 px-3 font-mono font-bold text-[#0F4C3A]">{o.orderNumber}</td>
                              <td className="py-2.5 px-3">{o.customerName}</td>
                              <td className="py-2.5 px-3 font-bold tabular-nums">৳{o.total}</td>
                              <td className="py-2.5 px-3 uppercase text-[11px]">{o.paymentMethod}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-800">
                                  {o.fulfilmentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Best Sellers */}
                  <div className="lg:col-span-4 bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-stone-900">শীর্ষ বিক্রীত পণ্য</h3>
                    <div className="space-y-3">
                      {metrics.bestSellers.map((p: Product) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg border border-stone-200"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-stone-900 truncate">{p.titleBn}</h4>
                            <div className="text-[11px] text-stone-500 tabular-nums">
                              বিক্রি: {p.salesCount} টি · স্টক: {p.stock} টি
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ORDERS MANAGEMENT TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Header & Manual Order Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 font-['Hind_Siliguri',sans-serif]">
                      অর্ডার ব্যবস্থাপনা ও ট্র্যাকিং
                    </h3>
                    <p className="text-xs text-stone-500 font-['Hind_Siliguri',sans-serif]">
                      অর্ডার প্রসেসিং, চ্যানেল ট্র্যাকিং ও দ্রুত ডেলিভারি নিশ্চিতকরণ
                    </p>
                  </div>

                  <button
                    onClick={() => setIsManualOrderOpen(true)}
                    className="px-4 py-2 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ ম্যানুয়াল অর্ডার (Facebook / Phone)</span>
                  </button>
                </div>

                {/* Date Range Filter Bar */}
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                      <Calendar className="w-4 h-4 text-[#0F4C3A]" />
                      <span>তারিখ নির্বাচন (Date Range):</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: 'all', labelBn: 'সব সময়', labelEn: 'All Time' },
                        { id: 'today', labelBn: 'আজ', labelEn: 'Today' },
                        { id: 'yesterday', labelBn: 'গতকাল', labelEn: 'Yesterday' },
                        { id: '7days', labelBn: 'গত ৭ দিন', labelEn: 'Last 7 Days' },
                        { id: '30days', labelBn: 'গত ৩০ দিন', labelEn: 'Last 30 Days' },
                        { id: 'month', labelBn: 'চলতি মাস', labelEn: 'This Month' },
                        { id: 'custom', labelBn: 'কাস্টম রেঞ্জ', labelEn: 'Custom' }
                      ].map((dr) => (
                        <button
                          key={dr.id}
                          onClick={() => setOrderDateRange(dr.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            orderDateRange === dr.id
                              ? 'bg-[#0F4C3A] text-white shadow-xs'
                              : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700'
                          }`}
                        >
                          {dr.labelBn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Pickers */}
                  {orderDateRange === 'custom' && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 font-semibold">হতে (From):</span>
                        <input
                          type="date"
                          value={orderCustomStartDate}
                          onChange={(e) => setOrderCustomStartDate(e.target.value)}
                          className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 font-semibold">পর্যন্ত (To):</span>
                        <input
                          type="date"
                          value={orderCustomEndDate}
                          onChange={(e) => setOrderCustomEndDate(e.target.value)}
                          className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                      {(orderCustomStartDate || orderCustomEndDate) && (
                        <button
                          onClick={() => {
                            setOrderCustomStartDate('');
                            setOrderCustomEndDate('');
                          }}
                          className="text-stone-500 hover:text-rose-600 underline font-medium cursor-pointer"
                        >
                          রিসেট
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Period Analytics Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-stone-200">
                    <span className="text-[11px] font-semibold text-stone-500 block">মোট অর্ডার</span>
                    <span className="text-xl font-extrabold text-stone-900 tabular-nums">
                      {orderMetrics.all} টি
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-stone-200">
                    <span className="text-[11px] font-semibold text-stone-500 block">মোট বিক্রয় (রেভিনিউ)</span>
                    <span className="text-xl font-extrabold text-[#0F4C3A] tabular-nums">
                      ৳{orderMetrics.revenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-stone-200">
                    <span className="text-[11px] font-semibold text-stone-500 block">গড় অর্ডার মূল্য (AOV)</span>
                    <span className="text-xl font-extrabold text-amber-700 tabular-nums">
                      ৳{orderMetrics.aov.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-stone-200">
                    <span className="text-[11px] font-semibold text-stone-500 block">ডেলিভারি বনাম বাতিল</span>
                    <div className="flex items-center gap-2 text-xs font-bold pt-1">
                      <span className="text-emerald-700">✓ {orderMetrics.delivered}</span>
                      <span className="text-stone-300">/</span>
                      <span className="text-rose-600">✕ {orderMetrics.cancelled}</span>
                    </div>
                  </div>
                </div>

                {/* Status Workflow Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 scrollbar-none">
                  {[
                    { id: 'all', label: 'সকল অর্ডার', count: orderMetrics.all, color: 'text-stone-700' },
                    { id: 'pending', label: 'নতুন যাচাই (Pending)', count: orderMetrics.pending, color: 'text-amber-700' },
                    { id: 'processing', label: 'প্রসেসিং ও শিপিং', count: orderMetrics.processing, color: 'text-blue-700' },
                    { id: 'delivered', label: 'ডেলিভারি সম্পন্ন', count: orderMetrics.delivered, color: 'text-emerald-700' },
                    { id: 'cancelled', label: 'বাতিল / রিটার্ন', count: orderMetrics.cancelled, color: 'text-rose-700' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderStatusTab(tab.id as any)}
                      className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border-b-2 ${
                        orderStatusTab === tab.id
                          ? 'border-[#0F4C3A] text-[#0F4C3A] bg-emerald-50/60'
                          : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200/80 text-stone-800 tabular-nums">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Filtered Orders List */}
                  <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-[65vh]">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">অর্ডার নং</th>
                            <th className="py-2.5 px-3">গ্রাহক ও জেলা</th>
                            <th className="py-2.5 px-3">টাকা</th>
                            <th className="py-2.5 px-3">উৎস</th>
                            <th className="py-2.5 px-3">স্ট্যাটাস</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredOrders.length > 0 ? (
                            filteredOrders.map((o) => {
                              const isSelected = selectedOrder?.id === o.id;

                              // Detect Order Source Tag
                              const isFb = o.orderNumber.includes('-FB-') || o.deliveryInstructions?.includes('FACEBOOK');
                              const isPhone = o.orderNumber.includes('-PH-') || o.deliveryInstructions?.includes('PHONE');
                              const isWa = o.orderNumber.includes('-WA-') || o.deliveryInstructions?.includes('WHATSAPP');
                              const sourceLabel = isFb ? 'Facebook' : isPhone ? 'Phone' : isWa ? 'WhatsApp' : 'Website';
                              const sourceClass = isFb
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isPhone
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : isWa
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-stone-50 text-stone-600 border-stone-200';

                              return (
                                <tr
                                  key={o.id}
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setNewStatus(o.fulfilmentStatus);
                                  }}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected ? 'bg-emerald-50/50' : 'hover:bg-stone-50'
                                  }`}
                                >
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#0F4C3A]">
                                    {o.orderNumber}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-stone-900 truncate max-w-[140px]">{o.customerName}</div>
                                    <div className="text-[11px] text-stone-500 font-mono">{o.customerPhone} ({o.district})</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-bold tabular-nums">৳{o.total}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sourceClass}`}>
                                      {sourceLabel}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      o.fulfilmentStatus === 'delivered'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : o.fulfilmentStatus === 'cancelled'
                                        ? 'bg-rose-100 text-rose-800'
                                        : o.fulfilmentStatus === 'pending_confirmation'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-stone-100 text-stone-800'
                                    }`}>
                                      {o.fulfilmentStatus}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-stone-400">
                                নির্বাচিত তারিখ ও ফিল্টারে কোনো অর্ডার পাওয়া যায়নি।
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Selected Order Detail & Status Transition */}
                  <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                    {selectedOrder ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                          <div>
                            <span className="text-xs text-stone-500">অর্ডার রেফারেন্স:</span>
                            <h4 className="text-base font-bold font-mono text-[#0F4C3A]">
                              {selectedOrder.orderNumber}
                            </h4>
                          </div>

                          <button
                            onClick={() => setShowInvoicePrint(true)}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>চালান / ইনভয়েস</span>
                          </button>
                        </div>

                        {/* Customer & Address Details */}
                        <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 text-xs text-stone-700">
                          <div><span className="font-semibold">গ্রাহকের নাম:</span> {selectedOrder.customerName}</div>
                          <div><span className="font-semibold">মোবাইল:</span> {selectedOrder.customerPhone}</div>
                          {selectedOrder.customerEmail && <div><span className="font-semibold">ইমেইল:</span> {selectedOrder.customerEmail}</div>}
                          <div><span className="font-semibold">ঠিকানা:</span> {selectedOrder.fullAddress}, {selectedOrder.upazila}, {selectedOrder.district}</div>
                          {selectedOrder.deliveryInstructions && (
                            <div className="text-amber-800 font-medium pt-1">
                              নির্দেশনা: {selectedOrder.deliveryInstructions}
                            </div>
                          )}
                        </div>

                        {/* Items Snapshot */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                            অর্ডারকৃত পণ্যসমূহ:
                          </span>
                          <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                            {selectedOrder.items.map((it, idx) => (
                              <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-semibold text-stone-900">{it.productTitleBn}</div>
                                  {it.variantNameBn && <div className="text-[11px] text-stone-500">অপশন: {it.variantNameBn}</div>}
                                  <div className="text-stone-400 font-mono">SKU: {it.sku}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold tabular-nums">৳{it.itemTotal}</div>
                                  <div className="text-[11px] text-stone-500">পরিমাণ: {it.quantity} টি</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status Change Form */}
                        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                          <label className="block text-xs font-bold text-stone-800">
                            স্ট্যাটাস পরিবর্তন করুন:
                          </label>

                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as OrderFulfilmentStatus)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none"
                          >
                            <option value="pending_confirmation">Pending Confirmation (যাচাইকরণ বাকি)</option>
                            <option value="confirmed">Confirmed (নিশ্চিত)</option>
                            <option value="processing">Processing (প্রসেসিং)</option>
                            <option value="packed">Packed (প্যাকেজিং সম্পন্ন)</option>
                            <option value="shipped">Shipped (কুরিয়ারে পাঠানো হয়েছে)</option>
                            <option value="delivered">Delivered (ডেলিভারি সম্পন্ন)</option>
                            <option value="cancelled">Cancelled (বাতিল - স্টক ফেরত হবে)</option>
                            <option value="returned">Returned (রিটার্নড - স্টক ফেরত)</option>
                          </select>

                          <input
                            type="text"
                            placeholder="পরিবর্তনের বিবরণ বা কুরিয়ার ট্র্যাকিং কোড..."
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none"
                          />

                          <button
                            onClick={handleUpdateOrderStatus}
                            className="w-full py-2 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            স্ট্যাটাস সেভ করুন
                          </button>
                        </div>

                        {/* Internal Staff Notes */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                            অভ্যন্তরীণ নোট (Internal Notes):
                          </span>
                          {selectedOrder.internalNotes && selectedOrder.internalNotes.length > 0 && (
                            <div className="space-y-1">
                              {selectedOrder.internalNotes.map((note, idx) => (
                                <div key={idx} className="p-2 bg-stone-100 rounded text-xs text-stone-700">
                                  {note}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="অভ্যন্তরীণ নোট লিখুন..."
                              value={staffNoteInput}
                              onChange={(e) => setStaffNoteInput(e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none"
                            />
                            <button
                              onClick={handleAddStaffNote}
                              className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-semibold hover:bg-stone-700"
                            >
                              যোগ করুন
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-stone-400 text-xs">
                        বিস্তারিত ও স্ট্যাটাস আপডেটের জন্য বামের তালিকা থেকে একটি অর্ডার নির্বাচন করুন
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRODUCTS MANAGEMENT TAB */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">পণ্য ও ইনভেন্টরি তালিকা</h3>
                    <p className="text-xs text-stone-500">পণ্য সংযোজন, মূল্য, স্টক এবং ভেরিয়েন্ট নিয়ন্ত্রণ ({products.length} টি পণ্য)</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-stone-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV এক্সপোর্ট</span>
                    </button>

                    <button
                      onClick={() => {
                        const defaultCat = categories[0];
                        const autoSku = generateCategorySku(defaultCat, products);
                        setEditingProduct({
                          titleBn: '',
                          titleEn: '',
                          price: 0,
                          originalPrice: 0,
                          stock: 10,
                          categoryId: defaultCat?.id || '',
                          categorySlug: defaultCat?.slug,
                          categoryNameBn: defaultCat?.nameBn,
                          brand: '',
                          sku: autoSku,
                          images: [],
                          descriptionBn: '',
                          isFeatured: false,
                          isPublished: true
                        });
                        setShowProductModal(true);
                      }}
                      className="px-3.5 py-2 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন পণ্য যোগ করুন</span>
                    </button>
                  </div>
                </div>

                {/* Search & Category Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-stone-50/80 p-3 rounded-xl border border-stone-200 text-xs">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="পণ্যের নাম, SKU বা ব্র্যান্ড দিয়ে খুঁজুন..."
                      value={prodSearchTerm}
                      onChange={(e) => setProdSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5">
                      <label className="text-stone-500 font-medium whitespace-nowrap">ক্যাটাগরি:</label>
                      <select
                        value={prodCatFilter}
                        onChange={(e) => setProdCatFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-[#0F4C3A] cursor-pointer"
                      >
                        <option value="all">সকল ক্যাটাগরি ({products.length})</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameBn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-stone-500 font-medium whitespace-nowrap">স্ট্যাটাস:</label>
                      <select
                        value={prodStatusFilter}
                        onChange={(e) => setProdStatusFilter(e.target.value as any)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-[#0F4C3A] cursor-pointer font-medium"
                      >
                        <option value="all">সব পণ্য ({products.length})</option>
                        <option value="published">
                          শুধু প্রকাশিত ({products.filter((p) => p.isPublished !== false).length})
                        </option>
                        <option value="hidden">
                          শুধু লুকানো / ড্রাফট ({products.filter((p) => p.isPublished === false).length})
                        </option>
                        <option value="unavailable">
                          বিক্রয়ে অনুপলব্ধ ({products.filter((p) => p.isUnavailable).length})
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[65vh]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold z-10">
                        <tr>
                          <th className="py-2.5 px-3">ছবি ও নাম</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">মূল্য</th>
                          <th className="py-2.5 px-3">মওজুদ (স্টক)</th>
                          <th className="py-2.5 px-3">ক্যাটাগরি</th>
                          <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                          <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {(() => {
                          const filtered = products.filter((p) => {
                            if (prodCatFilter !== 'all' && p.categoryId !== prodCatFilter) return false;
                            if (prodStatusFilter === 'published' && p.isPublished === false) return false;
                            if (prodStatusFilter === 'hidden' && p.isPublished !== false) return false;
                            if (prodStatusFilter === 'unavailable' && !p.isUnavailable) return false;
                            if (prodSearchTerm.trim()) {
                              const q = prodSearchTerm.trim().toLowerCase();
                              return (
                                (p.titleBn || '').toLowerCase().includes(q) ||
                                (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
                                (p.sku || '').toLowerCase().includes(q) ||
                                (p.brand && p.brand.toLowerCase().includes(q))
                              );
                            }
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-stone-500">
                                  <ShoppingBag className="w-9 h-9 text-stone-300 mx-auto mb-2" />
                                  <p className="font-semibold text-xs text-stone-700">কোনো পণ্য পাওয়া যায়নি</p>
                                  <p className="text-[11px] text-stone-400 mt-0.5">
                                    {prodSearchTerm || prodCatFilter !== 'all' || prodStatusFilter !== 'all'
                                      ? 'ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                                      : 'এখনো কোনো পণ্য তৈরি করা হয়নি। নতুন পণ্য যোগ করতে নিচের বাটনে চাপ দিন।'}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setEditingProduct({
                                        titleBn: '',
                                        titleEn: '',
                                        price: 0,
                                        originalPrice: 0,
                                        stock: 10,
                                        categoryId: categories[0]?.id || '',
                                        brand: '',
                                        sku: '',
                                        images: [],
                                        descriptionBn: '',
                                        isFeatured: false,
                                        isPublished: true,
                                        isUnavailable: false
                                      });
                                      setShowProductModal(true);
                                    }}
                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F4C3A] text-white rounded-lg text-xs font-semibold hover:bg-[#135D48] transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>নতুন পণ্য যোগ করুন</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((p) => (
                            <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                              <td className="py-2.5 px-3 flex items-center gap-3">
                                {p.images && p.images[0] ? (
                                  <img
                                    src={p.images[0]}
                                    alt=""
                                    className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 text-[#0F4C3A] rounded-lg flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-5 h-5 text-emerald-700" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-stone-900">{p.titleBn}</div>
                                  <div className="text-[11px] text-stone-400">{p.titleEn}</div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-stone-600">{p.sku}</td>
                              <td className="py-2.5 px-3 font-bold tabular-nums text-stone-900">৳{p.price}</td>
                              <td className="py-2.5 px-3">
                                <span className={`font-semibold tabular-nums ${p.stock <= 5 ? 'text-rose-600' : 'text-stone-900'}`}>
                                  {p.stock} টি
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-stone-600">{p.categoryNameBn || 'সাধারণ'}</td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {p.isPublished !== false ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                      প্রকাশিত
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                      লুকানো
                                    </span>
                                  )}

                                  {p.isUnavailable ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                      অনুপলব্ধ
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                      বিক্রয় চালু
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Storefront View Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onViewProduct) {
                                        onViewProduct(p);
                                      } else {
                                        window.location.search = `?product=${encodeURIComponent(p.slug || p.id)}`;
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-100 hover:bg-[#0F4C3A] text-stone-700 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                    title="গ্রাহকদের কাছে পণ্যটি কেমন দেখাচ্ছে দেখুন"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>ভিউ</span>
                                  </button>

                                  {/* Visibility Action Button */}
                                  {p.isPublished !== false ? (
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublishProduct(p.id)}
                                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-medium border border-stone-200 transition-colors cursor-pointer"
                                      title="স্টোর থেকে সাময়িকভাবে লুকান"
                                    >
                                      লুকান
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublishProduct(p.id)}
                                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                      title="স্টোরে এখনই প্রকাশ করুন"
                                    >
                                      পাবলিশ
                                    </button>
                                  )}

                                  {/* Availability Action Button */}
                                  {p.isUnavailable ? (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAvailabilityProduct(p.id)}
                                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer"
                                      title="পণ্যটির বিক্রয় পুনরায় চালু করুন"
                                    >
                                      বিক্রয় চালু
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAvailabilityProduct(p.id)}
                                      className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-medium border border-amber-200 transition-colors cursor-pointer"
                                      title="সাময়িকভাবে এই পণ্যের অর্ডার বন্ধ রাখুন"
                                    >
                                      অনুপলব্ধ
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setShowProductModal(true);
                                    }}
                                    className="px-2 py-1 text-[#0F4C3A] hover:bg-emerald-50 rounded font-semibold cursor-pointer text-xs"
                                  >
                                    সম্পাদনা
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold cursor-pointer text-xs"
                                  >
                                    মুছুন
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3.1. CATEGORIES MANAGEMENT TAB */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">ক্যাটাগরি ও ডাইনামিক ফিল্ডস</h3>
                    <p className="text-xs text-stone-500">
                      ক্যাটাগরি যুক্ত করুন, ছবি আপলোড করুন এবং স্বয়ংক্রিয় সাইজ/ওজন/ভ্যারিয়েন্ট নির্ধারণ করুন
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCategory({
                        nameBn: '',
                        nameEn: '',
                        descriptionBn: '',
                        image: '/src/assets/images/category_kitchen_cookware_1792084991823.jpg',
                        variantType: 'apparel_sizes',
                        defaultOptions: ['M (৪০)', 'L (৪২)', 'XL (৪৪)', 'XXL (৪৬)'],
                        isFeatured: true,
                        displayOrder: categories.length + 1
                      });
                      setShowCategoryModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন ক্যাটাগরি তৈরি করুন</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => {
                    const productCountInCat = products.filter(
                      (p) => p.categoryId === cat.id && !p.isArchived
                    ).length;

                    const variantTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
                      apparel_sizes: { label: 'পোশাক / সাইজ ভ্যারিয়েন্ট (M, L, XL)', icon: '👕', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      shoe_sizes: { label: 'জুতো সাইজ (৩৯ - ৪৪)', icon: '👟', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                      weight_options: { label: 'ওজন / পরিমাণ (গ্রাম, কেজি)', icon: '⚖️', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      pack_options: { label: 'প্যাক / সেট অপশন', icon: '📦', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      color_options: { label: 'কালার ভ্যারিয়েন্ট', icon: '🎨', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                      custom: { label: 'কাস্টম ভ্যারিয়েন্ট', icon: '⚙️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                      none: { label: 'কোনো ভ্যারিয়েন্ট নেই (একক পণ্য)', icon: '⛔', color: 'bg-stone-100 text-stone-600 border-stone-200' }
                    };

                    const vInfo = variantTypeLabels[cat.variantType || 'none'] || variantTypeLabels.none;

                    return (
                      <div
                        key={cat.id}
                        className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={cat.image}
                              alt={cat.nameBn}
                              className="w-16 h-16 rounded-lg object-cover border border-stone-200 shrink-0 bg-stone-100"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-stone-900 text-sm truncate">{cat.nameBn}</h4>
                                {cat.isFeatured && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded shrink-0">
                                    হোমপেজ
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-400 font-medium">{cat.nameEn || cat.slug}</p>
                              <span className="inline-block mt-1 text-[11px] text-stone-500 font-semibold">
                                {productCountInCat} টি সক্রিয় পণ্য
                              </span>
                            </div>
                          </div>

                          {cat.descriptionBn && (
                            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                              {cat.descriptionBn}
                            </p>
                          )}

                          {/* Dynamic Variant Rule Badge */}
                          <div className="pt-2 border-t border-stone-100 space-y-1.5">
                            <div className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                              <span>ভ্যারিয়েন্ট নির্ধারণ:</span>
                            </div>
                            <div className={`text-[11px] font-semibold px-2 py-1 rounded-md border inline-flex items-center gap-1.5 ${vInfo.color}`}>
                              <span>{vInfo.icon}</span>
                              <span>{vInfo.label}</span>
                            </div>

                            {cat.defaultOptions && cat.defaultOptions.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {cat.defaultOptions.map((opt, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono"
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-stone-50 px-4 py-2.5 border-t border-stone-200 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleTogglePublishCategory(cat.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                              cat.isFeatured
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                            }`}
                            title="ক্লিক করে হাইড বা আনহাইড করুন"
                          >
                            {cat.isFeatured ? 'দৃশ্যমান (Hide)' : 'লুকানো (Show)'}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCategory({ ...cat });
                                setShowCategoryModal(true);
                              }}
                              className="text-xs font-semibold text-[#0F4C3A] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>সম্পাদনা</span>
                            </button>
                            <span className="text-stone-300">|</span>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>মুছুন</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. COUPONS TAB */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">কুপন ও প্রচারমূলক ক্যাম্পেইন</h3>
                    <p className="text-xs text-stone-500">বিশেষ অফার ও ডিসকাউন্ট কোড পরিচালনা</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCoupon(null);
                      setNewCouponCode('');
                      setNewCouponVal(100);
                      setNewCouponMin(1000);
                      setShowCouponModal(true);
                    }}
                    className="px-3 py-2 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন কুপন কোড</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">কুপন কোড</th>
                        <th className="py-2.5 px-4">ছাড়ের ধরন</th>
                        <th className="py-2.5 px-4">মূল্য/শতাংশ</th>
                        <th className="py-2.5 px-4">নূন্যতম অর্ডার</th>
                        <th className="py-2.5 px-4">ব্যবহারের সংখ্যা</th>
                        <th className="py-2.5 px-4">স্ট্যাটাস</th>
                        <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {coupons.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2.5 px-4 font-mono font-bold text-[#0F4C3A]">{c.code}</td>
                          <td className="py-2.5 px-4">{c.discountType === 'percentage' ? 'শতাংশ (%)' : 'নির্দিষ্ট টাকা'}</td>
                          <td className="py-2.5 px-4 font-bold tabular-nums">
                            {c.discountType === 'percentage' ? `${c.discountValue}%` : `৳${c.discountValue}`}
                          </td>
                          <td className="py-2.5 px-4 tabular-nums">৳{c.minOrderValue}</td>
                          <td className="py-2.5 px-4 tabular-nums">{c.usageCount} বার</td>
                          <td className="py-2.5 px-4">
                            <button
                              onClick={() => handleToggleCoupon(c.id)}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                                c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {c.isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয়'}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditCoupon(c)}
                                className="p-1.5 hover:bg-stone-100 rounded text-stone-600 hover:text-[#0F4C3A] transition-colors cursor-pointer"
                                title="কুপন এডিট করুন"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(c.id)}
                                className="p-1.5 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="কুপন ডিলিট করুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. STORE SETTINGS TAB */}
            {activeTab === 'settings' && storeSettings && (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-200 pb-2">
                  স্টোর কনফিগারেশন ও ডেলিভারি চার্জ
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">স্টোরের নাম (বাংলা)</label>
                    <input
                      type="text"
                      value={storeSettings.storeNameBn}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeNameBn: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">ট্যাগলাইন</label>
                    <input
                      type="text"
                      value={storeSettings.taglineBn}
                      onChange={(e) => setStoreSettings({ ...storeSettings, taglineBn: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">কাস্টমার কেয়ার হেল্পলাইন</label>
                    <input
                      type="text"
                      placeholder="যেমন: +8801321949742 (ডিফল্ট)"
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">ফাঁকা রাখলে ডিফল্ট নম্বর +8801321949742 ব্যবহৃত হবে</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">সাপোর্ট ইমেইল</label>
                    <input
                      type="email"
                      value={storeSettings.email}
                      onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">ঢাকা মেট্রো ডেলিভারি ফি (৳)</label>
                    <input
                      type="number"
                      value={storeSettings.defaultDeliveryFeeDhaka}
                      onChange={(e) => setStoreSettings({ ...storeSettings, defaultDeliveryFeeDhaka: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">ঢাকার বাইরে ডেলিভারি ফি (৳)</label>
                    <input
                      type="number"
                      value={storeSettings.defaultDeliveryFeeOutside}
                      onChange={(e) => setStoreSettings({ ...storeSettings, defaultDeliveryFeeOutside: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">ফ্রি ডেলিভারি থ্রেশহোল্ড (৳)</label>
                    <input
                      type="number"
                      value={storeSettings.freeDeliveryThreshold}
                      onChange={(e) => setStoreSettings({ ...storeSettings, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Social Media & Customer Care Channels */}
                <div className="pt-2 border-t border-stone-200">
                  <h4 className="text-sm font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>সোশ্যাল মিডিয়া ও কাস্টমার সাপোর্ট চ্যানেল</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mb-3">
                    ওয়েবসাইটের ফুটার, ফ্লোটিং সাপোর্ট বাটন এবং মোবাইল ড্রয়ারে প্রদর্শিত যোগাযোগের তথ্য
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                        <span>হোয়াটসঅ্যাপ নম্বর (WhatsApp)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: +8801321949742 (ডিফল্ট)"
                        value={storeSettings.whatsappNumber || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono text-xs"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">ফাঁকা রাখলে হেল্পলাইন / +8801321949742 ব্যবহৃত হবে</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1877F2]"></span>
                        <span>ফেসবুক পেজ লিংক (Facebook URL)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/yourpage"
                        value={storeSettings.facebookUrl || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, facebookUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">ফেসবুক পেজের নাম / ইউজারনেম</label>
                      <input
                        type="text"
                        placeholder="যেমন: sashroyidaam"
                        value={storeSettings.facebookUsername || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, facebookUsername: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-purple-600"></span>
                        <span>ইনস্টাগ্রাম লিংক (Instagram URL)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/yourpage"
                        value={storeSettings.instagramUrl || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, instagramUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">সাপোর্ট সময়সূচি (ঘণ্টা)</label>
                      <input
                        type="text"
                        placeholder="যেমন: প্রতিদিন সকাল ৯টা - রাত ১০টা"
                        value={storeSettings.supportHoursBn || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, supportHoursBn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">স্টোর বা আউটলেট ঠিকানা (বাংলা)</label>
                      <input
                        type="text"
                        placeholder="যেমন: মিরপুর, ঢাকা - ১২১৬"
                        value={storeSettings.addressBn || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, addressBn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    টপ অ্যানাউন্সমেন্ট বার টেক্সট
                  </label>
                  <input
                    type="text"
                    value={storeSettings.announcementStripBn}
                    onChange={(e) => setStoreSettings({ ...storeSettings, announcementStripBn: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  সেটিংস সংরক্ষণ করুন
                </button>
              </form>
            )}

            {/* 6. AUDIT LOG TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-stone-900">প্রশাসনিক অডিট লগ</h3>
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden max-h-[65vh] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">কর্মকাণ্ড (Action)</th>
                        <th className="py-2.5 px-4">ব্যবহারকারী</th>
                        <th className="py-2.5 px-4">বিবরণ</th>
                        <th className="py-2.5 px-4">সময়</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="py-2.5 px-4 font-mono font-bold text-[#0F4C3A]">{log.action}</td>
                          <td className="py-2.5 px-4">{log.userEmail} ({log.userRole})</td>
                          <td className="py-2.5 px-4 text-stone-600">{log.details}</td>
                          <td className="py-2.5 px-4 text-stone-400 tabular-nums">
                            {new Date(log.createdAt).toLocaleDateString('bn-BD', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* PRODUCT CREATE/EDIT MODAL */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 text-left space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                {editingProduct.id ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য যোগ'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 rounded text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">পণ্যের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: প্রিমিয়াম সুতি পাঞ্জাবি"
                  value={editingProduct.titleBn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, titleBn: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-stone-700">পণ্যের নাম (ইংরেজি)</label>
                  {cleanSlug(editingProduct.titleEn || '') && (
                    <span className="text-[11px] text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      🔗 ?product={cleanSlug(editingProduct.titleEn || '')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Premium Cotton Panjabi"
                  value={editingProduct.titleEn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, titleEn: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
                <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                  <span>ওয়েবসাইটের পেজ লিঙ্ক:</span>
                  <code className="text-[#0F4C3A] font-semibold font-mono bg-stone-100 px-1 rounded">
                    ?product={cleanSlug(editingProduct.titleEn || editingProduct.titleBn || 'product-name')}
                  </code>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">মূল্য (৳) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="যেমন: ৯৯০"
                    value={editingProduct.price !== undefined && editingProduct.price !== null ? editingProduct.price : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
                      setEditingProduct({ ...editingProduct, price: val as any });
                    }}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">আসল মূল্য (৳)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="যেমন: ১২০০"
                    value={editingProduct.originalPrice !== undefined && editingProduct.originalPrice !== null ? editingProduct.originalPrice : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
                      setEditingProduct({ ...editingProduct, originalPrice: val as any });
                    }}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">স্টক পরিমাণ *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="যেমন: ২৫"
                    value={editingProduct.stock !== undefined && editingProduct.stock !== null ? editingProduct.stock : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
                      setEditingProduct({ ...editingProduct, stock: val as any });
                    }}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ক্যাটাগরি *</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const matchedCat = categories.find((c) => c.id === newCatId);
                      // Auto-generate fresh SKU for newly selected category if SKU is empty or creating new product
                      const shouldAutoUpdateSku = !editingProduct.id || !editingProduct.sku || /^[A-Z]{3}-\d{4}$/.test(editingProduct.sku);
                      const updatedSku = shouldAutoUpdateSku
                        ? generateCategorySku(matchedCat, products)
                        : editingProduct.sku;

                      setEditingProduct({
                        ...editingProduct,
                        categoryId: newCatId,
                        categorySlug: matchedCat?.slug,
                        categoryNameBn: matchedCat?.nameBn,
                        sku: updatedSku
                      });
                    }}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameBn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-stone-700">SKU কোড *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const matchedCat = categories.find((c) => c.id === editingProduct.categoryId);
                        const freshSku = generateCategorySku(matchedCat, products);
                        setEditingProduct({ ...editingProduct, sku: freshSku });
                      }}
                      className="text-[11px] text-[#0F4C3A] hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="ক্যাটাগরি অনুযায়ী নতুন SKU তৈরি করুন"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>নতুন তৈরি</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })}
                      placeholder="যেমন: KIT-4821"
                      className={`w-full px-3 py-2 pr-9 border rounded-lg font-mono font-bold tracking-wide text-sm transition-colors ${
                        conflictingProduct
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40 text-rose-900 ring-2 ring-rose-200'
                          : 'border-stone-200 focus:border-[#0F4C3A] text-stone-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const matchedCat = categories.find((c) => c.id === editingProduct.categoryId);
                        const freshSku = generateCategorySku(matchedCat, products);
                        setEditingProduct({ ...editingProduct, sku: freshSku });
                      }}
                      className="absolute right-1 p-1.5 text-stone-400 hover:text-[#0F4C3A] hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                      title="নতুন র‍্যান্ডম SKU কোড তৈরি করুন"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Real-time Inline Conflict Alert Banner */}
                  {conflictingProduct && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold">ডুপ্লিকেট SKU!</span> এই কোডটি ইতিমধ্যে{' '}
                          <span className="font-bold underline decoration-rose-300">"{conflictingProduct.titleBn}"</span> পণ্যে ব্যবহৃত হচ্ছে।
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const matchedCat = categories.find((c) => c.id === editingProduct.categoryId);
                          const freshSku = generateCategorySku(matchedCat, products);
                          setEditingProduct({ ...editingProduct, sku: freshSku });
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-200" />
                        <span>নতুন অনন্য SKU দিন</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Category-Wise Automatic Variant / Size Generator */}
              {(() => {
                const currentCat = categories.find((c) => c.id === editingProduct.categoryId);
                const vType = currentCat?.variantType || 'none';
                const defaultOpts = currentCat?.defaultOptions && currentCat.defaultOptions.length > 0
                  ? currentCat.defaultOptions
                  : vType === 'apparel_sizes'
                  ? ['M (৪০)', 'L (৪২)', 'XL (৪৪)', 'XXL (৪৬)']
                  : vType === 'shoe_sizes'
                  ? ['৩৯', '৪০', '৪১', '৪২', '৪৩', '৪৪']
                  : vType === 'weight_options'
                  ? ['২৫০ গ্রাম', '৫০০ গ্রাম', '১ কেজি', '২ কেজি']
                  : vType === 'pack_options'
                  ? ['১ পিস একক', '২ পিস সেট', '৪ পিস কমপ্লিট সেট']
                  : vType === 'color_options'
                  ? ['কালো', 'সাদা', 'ধূসর', 'মেরুন']
                  : [];

                const vHeading =
                  vType === 'apparel_sizes'
                    ? '👕 শার্ট / পোশাক সাইজ ভ্যারিয়েন্ট (ক্যাটাগরি ডাটাবেজ থেকে স্বয়ংক্রিয়)'
                    : vType === 'shoe_sizes'
                    ? '👟 জুতো সাইজ ভ্যারিয়েন্ট (স্বয়ংক্রিয়)'
                    : vType === 'weight_options'
                    ? '⚖️ ওজন / পরিমাণ অপশন (স্বয়ংক্রিয়)'
                    : vType === 'pack_options'
                    ? '📦 প্যাক ও সেট ভ্যারিয়েন্ট (স্বয়ংক্রিয়)'
                    : vType === 'color_options'
                    ? '🎨 কালার ভ্যারিয়েন্ট (স্বয়ংক্রিয়)'
                    : vType === 'custom'
                    ? '⚙️ কাস্টম অপশন ভ্যারিয়েন্ট (স্বয়ংক্রিয়)'
                    : 'ভ্যারিয়েন্ট নির্ধারণ';

                const variants = editingProduct.variants || [];

                const addVariantRow = (label: string) => {
                  if (variants.some((v) => v.nameBn === label)) return;
                  const varSku = generateVariantSku(editingProduct.sku || 'SKU', label, variants.length + 1);
                  const newVar: ProductVariant = {
                    id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                    nameBn: label,
                    nameEn: label,
                    sku: varSku,
                    priceDelta: 0,
                    stock: 10,
                    attributes: { [vType === 'apparel_sizes' ? 'সাইজ' : 'অপশন']: label }
                  };
                  const updatedVariants = [...variants, newVar];
                  const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
                  setEditingProduct({
                    ...editingProduct,
                    variants: updatedVariants,
                    stock: newTotalStock > 0 ? newTotalStock : editingProduct.stock
                  });
                };

                const addAllSizes = () => {
                  const newRows: ProductVariant[] = defaultOpts.map((label, idx) => ({
                    id: `v-${Date.now()}-${label.replace(/[^a-zA-Z0-9]/g, '') || Math.random()}`,
                    nameBn: label,
                    nameEn: label,
                    sku: generateVariantSku(editingProduct.sku || 'SKU', label, idx + 1),
                    priceDelta: 0,
                    stock: 10,
                    attributes: { [vType === 'apparel_sizes' ? 'সাইজ' : 'অপশন']: label }
                  }));
                  setEditingProduct({
                    ...editingProduct,
                    variants: newRows,
                    stock: newRows.reduce((sum, v) => sum + v.stock, 0)
                  });
                };

                const removeVariantRow = (id: string) => {
                  const updatedVariants = variants.filter((v) => v.id !== id);
                  const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
                  setEditingProduct({
                    ...editingProduct,
                    variants: updatedVariants,
                    stock: newTotalStock > 0 ? newTotalStock : editingProduct.stock
                  });
                };

                const updateVariantField = (id: string, field: keyof ProductVariant, val: any) => {
                  const updatedVariants = variants.map((v) =>
                    v.id === id ? { ...v, [field]: val } : v
                  );
                  const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
                  setEditingProduct({
                    ...editingProduct,
                    variants: updatedVariants,
                    stock: newTotalStock > 0 ? newTotalStock : editingProduct.stock
                  });
                };

                return (
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{vHeading}</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {vType === 'apparel_sizes'
                            ? 'শার্ট বা পোশাকের জন্য নিচে সাইজে ক্লিক করে যোগ করুন। প্রতিটি সাইজের আলাদা স্টক থাকবে।'
                            : vType === 'none'
                            ? 'এই ক্যাটাগরিতে সাইজের প্রয়োজন নেই। আপনি চাইলে নিচে কাস্টম অপশন যোগ করতে পারেন।'
                            : 'নিচের অপশন বাটনে ক্লিক করে ভ্যারিয়েন্ট যোগ করুন:'}
                        </p>
                      </div>

                      {defaultOpts.length > 0 && (
                        <button
                          type="button"
                          onClick={addAllSizes}
                          className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-[#0F4C3A] rounded-lg text-[11px] font-bold transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          + সব অপশন যোগ করুন
                        </button>
                      )}
                    </div>

                    {/* Quick Preset Buttons */}
                    {defaultOpts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center pt-1">
                        <span className="text-[11px] text-stone-400 font-medium">ক্লিক করে যোগ করুন:</span>
                        {defaultOpts.map((opt, i) => {
                          const isAlreadyAdded = variants.some((v) => v.nameBn === opt);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => addVariantRow(opt)}
                              disabled={isAlreadyAdded}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isAlreadyAdded
                                  ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                                  : 'bg-white hover:bg-emerald-50 text-stone-800 border-stone-300 hover:border-emerald-500'
                              }`}
                            >
                              + {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Active Variants Table */}
                    {variants.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-stone-200/80">
                        <div className="text-[11px] font-bold text-stone-700">
                          সংযুক্ত ভ্যারিয়েন্টসমূহ ({variants.length} টি):
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {variants.map((v) => (
                            <div
                              key={v.id}
                              className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-stone-200 text-xs"
                            >
                              <div className="col-span-4 sm:col-span-3">
                                <label className="block text-[10px] text-stone-400">সাইজ/নাম</label>
                                <input
                                  type="text"
                                  value={v.nameBn}
                                  onChange={(e) => updateVariantField(v.id, 'nameBn', e.target.value)}
                                  className="w-full px-2 py-1 border border-stone-200 rounded font-semibold text-stone-900"
                                />
                              </div>

                              <div className="col-span-3 sm:col-span-2">
                                <label className="block text-[10px] text-stone-400">স্টক</label>
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={(e) => updateVariantField(v.id, 'stock', Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-stone-200 rounded tabular-nums"
                                />
                              </div>

                              <div className="col-span-3 sm:col-span-3">
                                <label className="block text-[10px] text-stone-400">মূল্য পরিবর্তন (±৳)</label>
                                <input
                                  type="number"
                                  value={v.priceDelta}
                                  onChange={(e) => updateVariantField(v.id, 'priceDelta', Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-stone-200 rounded tabular-nums"
                                  placeholder="0"
                                />
                              </div>

                              <div className="col-span-2 sm:col-span-3">
                                <label className="block text-[10px] text-stone-400">SKU</label>
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => updateVariantField(v.id, 'sku', e.target.value)}
                                  className="w-full px-2 py-1 border border-stone-200 rounded font-mono text-[11px]"
                                />
                              </div>

                              <div className="col-span-12 sm:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(v.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                                  title="মুছুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => addVariantRow(`অপশন-${variants.length + 1}`)}
                        className="text-xs text-[#0F4C3A] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ কাস্টম ভ্যারিয়েন্ট যোগ করুন</span>
                      </button>

                      {variants.length > 0 && (
                        <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          মোট স্টক: {editingProduct.stock} টি
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Product Photos Upload Area */}
              <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-800 text-xs">
                    পণ্যের ছবি (Product Photos)
                  </label>
                  {editingProduct.images && editingProduct.images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, images: [] })}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      সব ছবি মুছুন
                    </button>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingProdImage ? 'ছবি আপলোড হচ্ছে...' : '📷 ছবি আপলোড করুন'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={isUploadingProdImage}
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        setIsUploadingProdImage(true);
                        try {
                          const uploadedUrls: string[] = [];
                          for (let i = 0; i < files.length; i++) {
                            const url = await compressAndUploadImage(files[i]);
                            uploadedUrls.push(url);
                          }
                          setEditingProduct((prev) => {
                            if (!prev) return prev;
                            const existing = prev.images || [];
                            return {
                              ...prev,
                              images: [...existing, ...uploadedUrls]
                            };
                          });
                        } catch (err: any) {
                          setModalError(err.message || 'ছবি আপলোড ব্যর্থ হয়েছে');
                        } finally {
                          setIsUploadingProdImage(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-stone-400">মোবাইল বা কম্পিউটার থেকে এক বা একাধিক ছবি নির্বাচন করুন</span>
                </div>

                {/* Image Previews Grid with explicit Delete & Cover buttons */}
                {editingProduct.images && editingProduct.images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
                    {editingProduct.images.map((imgUrl, idx) => {
                      const isCover = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-lg overflow-hidden border bg-white group shadow-2xs ${
                            isCover ? 'border-emerald-500 ring-2 ring-emerald-400/40' : 'border-stone-200'
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />

                          {/* Cover badge */}
                          {isCover && (
                            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              মূল ছবি
                            </span>
                          )}

                          {/* Delete button (Always visible top-right) */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct((prev) => {
                                if (!prev) return prev;
                                const filtered = (prev.images || []).filter((_, i) => i !== idx);
                                return { ...prev, images: filtered };
                              });
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                            title="ছবি মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Make Cover Button */}
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct((prev) => {
                                  if (!prev) return prev;
                                  const current = [...(prev.images || [])];
                                  const selected = current.splice(idx, 1)[0];
                                  return { ...prev, images: [selected, ...current] };
                                });
                              }}
                              className="absolute bottom-1 inset-x-1 py-1 bg-black/70 hover:bg-black/90 text-white text-[10px] font-semibold rounded text-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              কভার বানান
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center border border-dashed border-stone-300 rounded-lg text-stone-400 text-xs">
                    কোনো ছবি যুক্ত করা হয়নি। ওপরে বাটনে ক্লিক করে ছবি আপলোড করুন।
                  </div>
                )}

                {/* Optional Image URL Input */}
                <div className="flex gap-2 items-center pt-1 border-t border-stone-200/60">
                  <input
                    type="url"
                    placeholder="অথবা সরাসরি ওয়েব ছবির URL দিন (https://...)"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrlInput.trim()) return;
                      const trimmed = imageUrlInput.trim();
                      setEditingProduct((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          images: [...(prev.images || []), trimmed]
                        };
                      });
                      setImageUrlInput('');
                    }}
                    className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                  >
                    + লিংক যোগ
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">বিস্তারিত বিবরণ (বাংলা)</label>
                <textarea
                  rows={3}
                  value={editingProduct.descriptionBn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descriptionBn: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="rounded text-[#0F4C3A]"
                  />
                  <span>ফিচারড পণ্য হিসেবে দেখান</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isPublished !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isPublished: e.target.checked })}
                    className="rounded text-[#0F4C3A]"
                  />
                  <span>পাবলিশড (গ্রাহকদের কাছে দৃশ্যমান)</span>
                </label>
              </div>

              {/* Unavailable for Sale Configuration */}
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/70">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isUnavailable || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isUnavailable: e.target.checked })}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">
                      🚫 পণ্যটি বর্তমানে আর বিক্রয়ের জন্য উপলব্ধ নেই (Mark Unavailable for Sale)
                    </span>
                    <span className="text-[11px] text-rose-700 block mt-0.5">
                      পণ্যটি স্টোরে দেখা যাবে, কিন্তু 'কার্টে যোগ করুন' ও 'সরাসরি কিনুন' বাটন বন্ধ থাকবে এবং গ্রাহকদের অনুপলব্ধ নোটিশ দেওয়া হবে।
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200">
                {editingProduct.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct.id!)}
                    className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>পণ্যটি মুছে ফেলুন</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct || Boolean(conflictingProduct)}
                    className={`px-5 py-2 font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      conflictingProduct
                        ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed opacity-90'
                        : isSavingProduct
                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        : 'bg-[#0F4C3A] text-white hover:bg-[#135D48] shadow-sm'
                    }`}
                  >
                    {isSavingProduct ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : conflictingProduct ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>ডুপ্লিকেট SKU সমাধান করুন</span>
                      </>
                    ) : (
                      <span>সংরক্ষণ করুন</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATE / EDIT MODAL */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {editingCategory.id ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
                </h3>
                <p className="text-xs text-stone-500">
                  ক্যাটাগরি ও এর সাথে জড়িত সাইজ/ওজন/ভ্যারিয়েন্ট নির্ধারণ করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ক্যাটাগরির নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: শার্ট ও পাঞ্জাবি"
                    value={editingCategory.nameBn || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, nameBn: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ক্যাটাগরির নাম (ইংরেজি)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shirts & Apparel"
                    value={editingCategory.nameEn || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Picture Upload Area */}
              <div className="space-y-2">
                <label className="block font-semibold text-stone-700">
                  ক্যাটাগরি ছবি * (ফোন/কম্পিউটার থেকে ছবি আপলোড করুন)
                </label>

                <div className="flex items-center gap-3">
                  {editingCategory.image ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100 group">
                      <img src={editingCategory.image} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingCategory((prev) => prev ? { ...prev, image: '' } : prev)}
                        className="absolute inset-0 bg-stone-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="ছবি পরিবর্তন"
                      >
                        <Trash2 className="w-4 h-4 text-rose-300" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 bg-stone-50 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[10px] mt-1">ছবি নেই</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0F4C3A] border border-emerald-300 rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingCatImage ? 'আপলোড হচ্ছে...' : '📷 ছবি আপলোড করুন'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingCatImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingCatImage(true);
                          try {
                            const url = await compressAndUploadImage(file);
                            setEditingCategory((prev) => prev ? { ...prev, image: url } : prev);
                          } catch (err: any) {
                            showErrorFeedback(err.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে');
                          } finally {
                            setIsUploadingCatImage(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="বা ছবির URL দিন (https://...)"
                      value={editingCategory.image || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Variant Rule Setup */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div>
                  <label className="block font-bold text-stone-900 mb-1 text-xs">
                    ভ্যারিয়েন্ট নির্ধারণ (পণ্য তৈরির সময় স্বয়ংক্রিয়ভাবে যেসব অপশন চাওয়া হবে):
                  </label>
                  <p className="text-[11px] text-stone-500">
                    যেমন: শার্ট হলে সাইজ (M, L, XL), জুতো হলে জুতো সাইজ, গ্রোসারি হলে ওজন।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { type: 'apparel_sizes', label: '👕 পোশাক / শার্ট সাইজ', defaultOptions: ['M (৪০)', 'L (৪২)', 'XL (৪৪)', 'XXL (৪৬)'] },
                    { type: 'shoe_sizes', label: '👟 জুতো সাইজ', defaultOptions: ['৩৯', '৪০', '৪১', '৪২', '৪৩', '৪৪'] },
                    { type: 'weight_options', label: '⚖️ ওজন / পরিমাণ', defaultOptions: ['২৫০ গ্রাম', '৫০০ গ্রাম', '১ কেজি', '২ কেজি'] },
                    { type: 'pack_options', label: '📦 প্যাক বা সেট', defaultOptions: ['১ পিস একক', '২ পিস সেট', '৪ পিস কমপ্লিট সেট'] },
                    { type: 'color_options', label: '🎨 কালার অপশন', defaultOptions: ['কালো', 'সাদা', 'ধূসর', 'মেরুন'] },
                    { type: 'custom', label: '⚙️ কাস্টম অপশন', defaultOptions: [] },
                    { type: 'none', label: '⛔ কোনো ভ্যারিয়েন্ট নেই (একক পণ্য)', defaultOptions: [] }
                  ].map((item) => {
                    const isSelected = (editingCategory.variantType || 'none') === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setEditingCategory({
                            ...editingCategory,
                            variantType: item.type as CategoryVariantType,
                            defaultOptions: item.defaultOptions.length > 0 ? item.defaultOptions : editingCategory.defaultOptions || []
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-[#0F4C3A] text-[#0F4C3A] shadow-xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Option Chips Editor */}
                {editingCategory.variantType && editingCategory.variantType !== 'none' && (
                  <div className="pt-2 border-t border-stone-200 space-y-2">
                    <label className="block font-bold text-stone-800 text-[11px]">
                      ডিফল্ট অপশন চিপস (অ্যাডমিন পণ্য তৈরির সময় এক ক্লিকে ব্যবহার করতে পারবেন):
                    </label>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(editingCategory.defaultOptions || []).map((opt, i) => (
                        <span
                          key={i}
                          className="bg-white border border-stone-300 text-stone-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const opts = (editingCategory.defaultOptions || []).filter((_, idx) => idx !== i);
                              setEditingCategory({ ...editingCategory, defaultOptions: opts });
                            }}
                            className="text-stone-400 hover:text-rose-600 cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="নতুন অপশন লিখুন (যেমন: ৪৪ বা ৫০০ গ্রাম)"
                        value={newCatOptionInput}
                        onChange={(e) => setNewCatOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCatOptionInput.trim()) {
                              const opts = [...(editingCategory.defaultOptions || []), newCatOptionInput.trim()];
                              setEditingCategory({ ...editingCategory, defaultOptions: opts });
                              setNewCatOptionInput('');
                            }
                          }
                        }}
                        className="flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCatOptionInput.trim()) {
                            const opts = [...(editingCategory.defaultOptions || []), newCatOptionInput.trim()];
                            setEditingCategory({ ...editingCategory, defaultOptions: opts });
                            setNewCatOptionInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-[#0F4C3A] text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        + যোগ করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">ক্যাটাগরি বিবরণ (বাংলা)</label>
                <textarea
                  rows={2}
                  placeholder="ক্যাটাগরি সম্পর্কে এক বা দুই লাইনে বর্ণনা লিখুন..."
                  value={editingCategory.descriptionBn || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, descriptionBn: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ডিসপ্লে অর্ডার (সিরিয়াল)</label>
                  <input
                    type="number"
                    value={editingCategory.displayOrder || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg tabular-nums"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCategory.isFeatured || false}
                      onChange={(e) => setEditingCategory({ ...editingCategory, isFeatured: e.target.checked })}
                      className="rounded text-[#0F4C3A]"
                    />
                    <span className="font-semibold text-stone-800">হোমপেজে ফিচারড হিসেবে দেখান</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F4C3A] text-white font-semibold rounded-lg hover:bg-[#135D48] cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON CREATE MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="text-sm font-bold text-stone-900">
                {editingCoupon ? 'কুপন সম্পাদনা (Edit Coupon)' : 'নতুন কুপন কোড তৈরি'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCouponModal(false);
                  setEditingCoupon(null);
                }}
                className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">কুপন কোড (যেমন: SPECIAL20)</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ছাড়ের ধরন</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                    <option value="percentage">শতাংশ (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ছাড়ের পরিমাণ</label>
                  <input
                    type="number"
                    required
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">নূন্যতম অর্ডার মান (৳)</label>
                <input
                  type="number"
                  required
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0F4C3A] text-white font-semibold rounded-lg hover:bg-[#135D48] transition-colors cursor-pointer"
              >
                {editingCoupon ? 'কুপন আপডেট সংরক্ষণ করুন' : 'কুপন তৈরি করুন'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE PACKING SLIP / INVOICE MODAL */}
      {showInvoicePrint && selectedOrder && (
        <div className="fixed inset-0 z-70 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-stone-300 text-left space-y-6">
            <div className="flex items-center justify-between border-b border-stone-300 pb-4">
              <div>
                <h2 className="text-2xl font-bold font-sans text-[#0F4C3A]">সাশ্রয়ী দাম | Sashroyi Daam</h2>
                <p className="text-xs text-stone-500">আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-400">চালান নম্বর:</span>
                <div className="text-lg font-mono font-bold text-stone-900">{selectedOrder.orderNumber}</div>
                <div className="text-xs text-stone-500">
                  তারিখ: {new Date(selectedOrder.createdAt).toLocaleDateString('bn-BD')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg">
                <div className="font-bold text-stone-800 mb-1">প্রেরক:</div>
                <div className="text-stone-700">{storeSettings?.storeNameBn || 'সাশ্রয়ী দাম'}</div>
                {storeSettings?.addressBn && <div className="text-stone-500">{storeSettings.addressBn}</div>}
                {storeSettings?.phone && <div className="text-stone-500">হেল্পলাইন: {storeSettings.phone}</div>}
              </div>

              <div className="p-3 bg-stone-50 rounded-lg">
                <div className="font-bold text-stone-800 mb-1">গ্রাহকের ঠিকানা:</div>
                <div className="font-semibold text-stone-900">{selectedOrder.customerName}</div>
                <div className="text-stone-700">{selectedOrder.fullAddress}</div>
                <div className="text-stone-500">{selectedOrder.upazila}, {selectedOrder.district}</div>
                <div className="text-stone-700 font-semibold mt-1">ফোন: {selectedOrder.customerPhone}</div>
              </div>
            </div>

            <table className="w-full text-xs">
              <thead className="border-b border-stone-300 bg-stone-100 font-bold">
                <tr>
                  <th className="py-2 px-3 text-left">আইটেম</th>
                  <th className="py-2 px-3 text-left">SKU</th>
                  <th className="py-2 px-3 text-center">পরিমাণ</th>
                  <th className="py-2 px-3 text-right">একক মূল্য</th>
                  <th className="py-2 px-3 text-right">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {selectedOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-semibold">{it.productTitleBn}</td>
                    <td className="py-2 px-3 font-mono text-stone-500">{it.sku}</td>
                    <td className="py-2 px-3 text-center tabular-nums">{it.quantity} টি</td>
                    <td className="py-2 px-3 text-right tabular-nums">৳{it.unitPrice}</td>
                    <td className="py-2 px-3 text-right font-bold tabular-nums">৳{it.itemTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end text-xs space-y-1">
              <div className="w-48 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>উপমোট:</span>
                  <span className="font-bold tabular-nums">৳{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>কুপন ছাড়:</span>
                    <span className="tabular-nums">-৳{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ডেলিভারি ফি:</span>
                  <span className="tabular-nums">৳{selectedOrder.deliveryFee}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-300 font-bold text-sm text-[#0F4C3A]">
                  <span>পরিশোধযোগ্য:</span>
                  <span className="tabular-nums">৳{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-200">
              <button
                onClick={() => setShowInvoicePrint(false)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#0F4C3A] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ORDER ENTRY MODAL (Facebook / Phone / WhatsApp) */}
      <ManualOrderModal
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        products={products}
        onOrderCreated={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          showToast('ম্যানুয়াল অর্ডার তৈরি হয়েছে', `ম্যানুয়াল অর্ডার #${newOrder.orderNumber} সফলভাবে তৈরি হয়েছে`, 'success');
          setFeedbackMsg(`ম্যানুয়াল অর্ডার #${newOrder.orderNumber} সফলভাবে তৈরি হয়েছে`);
          loadAllAdminData();
          onStoreDataChanged();
        }}
      />

      {/* Floating High-Visibility Confirmation Toast (Top-Right, Above all modals) */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Admin Notification"
          className="fixed top-5 right-5 z-[9999] max-w-sm sm:max-w-md w-full bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-stone-200/90 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div
            className={`h-1.5 w-full ${
              toast.type === 'error'
                ? 'bg-rose-500'
                : toast.type === 'info'
                ? 'bg-blue-500'
                : 'bg-emerald-500'
            }`}
          />
          <div className="p-4 flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                toast.type === 'error'
                  ? 'bg-rose-100 text-rose-600'
                  : toast.type === 'info'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-bold text-stone-900 leading-snug">{toast.title}</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
