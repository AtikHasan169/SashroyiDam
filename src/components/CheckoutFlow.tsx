import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Banknote, MapPin, Tag, Truck, RefreshCw, Copy, Check, Smartphone, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  BANGLADESH_DIVISIONS,
  getUpazilasForDistrict,
  CUSTOM_UPAZILA_OPTION_BN,
  CUSTOM_UPAZILA_OPTION_EN
} from '../data/bangladeshGeo.ts';
import { BANGLADESH_DISTRICTS, getDistrictById } from '../data/districts.ts';
import { api } from '../lib/api.ts';
import type { Order, Product, PaymentMethod, StoreSettings } from '../types/index.ts';

export interface DirectBuyItem {
  product: Product;
  variantId?: string;
  quantity: number;
}

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  directBuyItem?: DirectBuyItem | null;
  onOpenTrackingWithNumber?: (orderNumber: string) => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  directBuyItem,
  onOpenTrackingWithNumber
}) => {
  const {
    items: cartItems,
    cartValidation,
    division,
    setCustomerDivision,
    couponCode,
    applyCouponCode,
    removeCoupon,
    clearCart,
    refreshCartValidation,
    removeUnavailableItems
  } = useCart();
  const { user, setSession } = useAuth();
  const { language, t, formatPrice } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  const [selectedDivision, setSelectedDivision] = useState(division || 'dhaka');
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা');
  const [selectedUpazila, setSelectedUpazila] = useState('ধানমন্ডি');
  const [customUpazilaText, setCustomUpazilaText] = useState('');
  const [isCustomUpazila, setIsCustomUpazila] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [couponFeedback, setCouponFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Load store settings for bKash & Nagad numbers and instructions
  useEffect(() => {
    api.getStoreInfo()
      .then((res) => {
        if (res?.settings) {
          setStoreSettings(res.settings);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyNumber = (num: string, type: string) => {
    try {
      navigator.clipboard.writeText(num);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {}
  };

  // Address validation popup states & field focus refs
  const [addressValidationErrors, setAddressValidationErrors] = useState<string[]>([]);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [targetFocusField, setTargetFocusField] = useState<'name' | 'phone' | 'address' | 'upazila' | null>(null);

  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const addressInputRef = React.useRef<HTMLTextAreaElement>(null);
  const upazilaSelectRef = React.useRef<HTMLSelectElement>(null);
  const customUpazilaRef = React.useRef<HTMLInputElement>(null);

  const handleCloseAddressPopup = () => {
    setShowAddressPopup(false);
    setTimeout(() => {
      if (targetFocusField === 'name') nameInputRef.current?.focus();
      else if (targetFocusField === 'phone') phoneInputRef.current?.focus();
      else if (targetFocusField === 'address') addressInputRef.current?.focus();
      else if (targetFocusField === 'upazila') {
        if (isCustomUpazila) customUpazilaRef.current?.focus();
        else upazilaSelectRef.current?.focus();
      }
    }, 150);
  };

  // Sync user saved address if available
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone) setCustomerPhone(user.phone);
      if (!customerEmail) setCustomerEmail(user.email);
      if (user.savedAddresses && user.savedAddresses.length > 0) {
        const defaultAddr = user.savedAddresses.find((a) => a.isDefault) || user.savedAddresses[0];
        setSelectedDivision(defaultAddr.division || 'dhaka');
        setSelectedDistrict(defaultAddr.district || 'ঢাকা');
        setFullAddress(defaultAddr.fullAddress || '');

        const upzList = getUpazilasForDistrict(defaultAddr.district || 'ঢাকা');
        if (defaultAddr.upazila && upzList.includes(defaultAddr.upazila)) {
          setSelectedUpazila(defaultAddr.upazila);
          setIsCustomUpazila(false);
          setCustomUpazilaText('');
        } else if (defaultAddr.upazila) {
          setSelectedUpazila(CUSTOM_UPAZILA_OPTION_BN);
          setIsCustomUpazila(true);
          setCustomUpazilaText(defaultAddr.upazila);
        }
      }
    }
  }, [user]);

  // Sync division change to CartContext
  useEffect(() => {
    setCustomerDivision(selectedDivision);
  }, [selectedDivision, setCustomerDivision]);

  // Dynamic districts based on selected division
  const currentDivData = BANGLADESH_DIVISIONS.find((d) => d.id === selectedDivision);
  const districts = currentDivData ? currentDivData.districts : [];

  // Dynamic upazilas based on selected district
  const upazilas = React.useMemo(() => {
    return getUpazilasForDistrict(selectedDistrict);
  }, [selectedDistrict]);

  const handleDivisionChange = (divId: string) => {
    setSelectedDivision(divId);
    const divData = BANGLADESH_DIVISIONS.find((d) => d.id === divId);
    if (divData && divData.districts.length > 0) {
      const firstDist = divData.districts[0];
      setSelectedDistrict(firstDist.nameBn);
      setIsCustomUpazila(false);
      setCustomUpazilaText('');
      const upzList = getUpazilasForDistrict(firstDist.nameBn);
      if (upzList.length > 0) {
        setSelectedUpazila(upzList[0]);
      } else {
        setSelectedUpazila(CUSTOM_UPAZILA_OPTION_BN);
        setIsCustomUpazila(true);
      }
    }
  };

  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    setIsCustomUpazila(false);
    setCustomUpazilaText('');
    const upzList = getUpazilasForDistrict(distName);
    if (upzList.length > 0) {
      setSelectedUpazila(upzList[0]);
    } else {
      setSelectedUpazila(CUSTOM_UPAZILA_OPTION_BN);
      setIsCustomUpazila(true);
    }
  };

  const handleUpazilaChange = (val: string) => {
    setSelectedUpazila(val);
    if (val === CUSTOM_UPAZILA_OPTION_BN || val === CUSTOM_UPAZILA_OPTION_EN) {
      setIsCustomUpazila(true);
    } else {
      setIsCustomUpazila(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponFeedback(null);
    const res = await applyCouponCode(couponInput.trim());
    setCouponFeedback({ msg: res.message, isError: !res.success });
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput('');
    setCouponFeedback(null);
  };

  // Direct Buy Item calculation
  const isDirectBuy = !!directBuyItem;
  let directVariantName = '';
  let directItemPrice = 0;
  let directSubtotal = 0;

  if (directBuyItem) {
    const p = directBuyItem.product;
    const v = p.variants?.find((vr) => vr.id === directBuyItem.variantId);
    directVariantName = v ? v.nameBn : '';
    directItemPrice = p.price + (v ? v.priceDelta : 0);
    directSubtotal = directItemPrice * directBuyItem.quantity;
  }

  // Delivery fee & Total
  const activeSubtotal = isDirectBuy ? directSubtotal : (cartValidation?.subtotal || 0);
  const deliveryFee = activeSubtotal >= 2000 ? 0 : (selectedDivision === 'dhaka' ? 70 : 130);
  const discountAmount = isDirectBuy ? 0 : (cartValidation?.discount || 0);
  const activeTotal = Math.max(0, activeSubtotal - discountAmount + deliveryFee);

  const handleSubmitOrder = async () => {
    setOrderError('');
    setIsSubmitting(true);

    try {
      const finalUpazila = (isCustomUpazila || selectedUpazila === CUSTOM_UPAZILA_OPTION_BN)
        ? customUpazilaText.trim()
        : selectedUpazila.trim();

      if (!finalUpazila) {
        throw new Error(language === 'en' ? 'Please specify your Upazila or Thana' : 'উপজেলা বা থানার নাম নির্বাচন বা লিখুন');
      }

      let orderItems: { productId: string; variantId?: string; quantity: number }[] = [];

      if (isDirectBuy) {
        orderItems = [
          {
            productId: directBuyItem.product.id,
            variantId: directBuyItem.variantId,
            quantity: directBuyItem.quantity
          }
        ];
      } else {
        // Filter out any items that are unavailable or have quantity 0
        const validAvailable = cartValidation?.items?.filter((it) => it.isAvailable && it.quantity > 0);
        if (validAvailable && validAvailable.length > 0) {
          orderItems = validAvailable.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity
          }));
        } else {
          // If cartValidation has no available items but cartItems exists
          const availableCartItems = cartItems.filter((ci) => {
            const valItem = cartValidation?.items?.find((v) => v.productId === ci.productId && v.variantId === ci.variantId);
            return valItem ? valItem.isAvailable : true;
          });
          orderItems = availableCartItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity
          }));
        }
      }

      if (orderItems.length === 0) {
        throw new Error(
          language === 'en'
            ? 'The products in your cart are currently not available. Please add other items.'
            : 'আপনার কার্টের নির্বাচিত পণ্যগুলো বর্তমানে বিক্রয়ের জন্য উপলব্ধ নেই। অনুগ্রহ করে অন্য পণ্য যোগ করুন।'
        );
      }

      if (paymentMethod === 'bkash') {
        const cleanSender = senderNumber.replace(/[^0-9]/g, '');
        if (cleanSender.length < 11) {
          throw new Error('দয়া করে সঠিক ১১ ডিজিটের বিকাশ প্রেরক মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)');
        }
        const cleanTrx = transactionId.replace(/[^A-Za-z0-9]/g, '').trim();
        if (cleanTrx.length !== 10) {
          throw new Error('বিকাশ ট্রানজেকশন আইডি (TrxID) অবশ্যই ঠিক ১০ অক্ষরের হতে হবে (যেমন: 8N7A6D5EE7M)');
        }
      } else if (paymentMethod === 'nagad') {
        const cleanSender = senderNumber.replace(/[^0-9]/g, '');
        if (cleanSender.length < 11) {
          throw new Error('দয়া করে সঠিক ১১ ডিজিটের নগদ প্রেরক মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)');
        }
        const cleanTrx = transactionId.replace(/[^A-Za-z0-9]/g, '').trim();
        if (cleanTrx.length !== 8) {
          throw new Error('নগদ ট্রানজেকশন আইডি (TrxID) অবশ্যই ঠিক ৮ অক্ষরের হতে হবে (যেমন: 9J5A7B3X)');
        }
      }

      // 1. Submit order to server
      const res = await api.createOrder({
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        division: selectedDivision,
        district: selectedDistrict,
        upazila: finalUpazila,
        fullAddress,
        deliveryInstructions: deliveryInstructions || undefined,
        paymentMethod,
        senderNumber: (paymentMethod === 'bkash' || paymentMethod === 'nagad') ? senderNumber.trim() : undefined,
        transactionId: (paymentMethod === 'bkash' || paymentMethod === 'nagad') ? transactionId.trim().toUpperCase() : undefined,
        couponCode: isDirectBuy ? undefined : (couponCode || undefined),
        items: orderItems
      });

      const order = res.order;

      // Auto-login if server auto-created an account
      if (res.autoAuthToken && res.autoUser) {
        setSession(res.autoAuthToken, res.autoUser);
      }

      setCompletedOrder(order);
      onOrderSuccess(order);

      if (!isDirectBuy) {
        clearCart();
      }
    } catch (err: any) {
      setOrderError(err.message || 'অর্ডার সম্পন্ন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
      // Proactively refresh cart validation to wipe out phantom deleted items
      refreshCartValidation();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 relative text-left">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <span>{completedOrder ? 'অর্ডার সফল হয়েছে!' : 'সহজ অর্ডার — সাশ্রয়ী দাম'}</span>
              {!completedOrder && (
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  লগইন ছাড়া গেস্ট অর্ডার
                </span>
              )}
            </h2>
            {!completedOrder && (
              <p className="text-xs text-stone-500 mt-0.5">
                ধাপ {step} এর ২: {step === 1 ? 'ডেলিভারি ঠিকানা ও যোগাযোগের তথ্য' : 'পেমেন্ট ও অর্ডার নিশ্চিতকরণ'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* COMPLETED ORDER STATE */}
        {completedOrder ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-[#0F4C3A] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                ধন্যবাদ, আপনার অর্ডার সফলভাবে গৃহীত হয়েছে!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600">
                অর্ডার রেফারেন্স নম্বর:{' '}
                <span className="font-bold text-[#0F4C3A] font-mono text-base bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {completedOrder.orderNumber}
                </span>
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-700 max-w-md mx-auto space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-stone-500">গ্রাহকের নাম:</span>
                <span className="font-semibold text-stone-900">{completedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">মোবাইল নম্বর:</span>
                <span className="font-semibold text-stone-900">{completedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">ডেলিভারি ঠিকানা:</span>
                <span className="font-semibold text-stone-900 text-right max-w-[240px]">
                  {completedOrder.fullAddress}, {completedOrder.upazila}, {completedOrder.district}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">পেমেন্ট পদ্ধতি:</span>
                <span className="font-semibold text-emerald-800">
                  {completedOrder.paymentMethod === 'cod' && 'ক্যাশ অন ডেলিভারি (পণ্য পেয়ে মূল্য পরিশোধ)'}
                  {completedOrder.paymentMethod === 'bkash' && 'বিকাশ সেন্ড মানি (যাচাইকরণ প্রক্রিয়াধীন)'}
                  {completedOrder.paymentMethod === 'nagad' && 'নগদ সেন্ড মানি (যাচাইকরণ প্রক্রিয়াধীন)'}
                  {completedOrder.paymentMethod === 'sslcommerz_sandbox' && 'SSLCOMMERZ অনলাইন পেমেন্ট (পরিশোধিত)'}
                </span>
              </div>
              {completedOrder.senderNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">প্রেরক নম্বর:</span>
                  <span className="font-mono font-semibold text-stone-800">{completedOrder.senderNumber}</span>
                </div>
              )}
              {completedOrder.transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">ট্রানজেকশন আইডি:</span>
                  <span className="font-mono font-bold text-[#0F4C3A] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {completedOrder.transactionId}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span className="text-[#0F4C3A] tabular-nums">
                  ৳{completedOrder.total.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* bKash & Nagad Order Confirmation Store Number & Interactive TrxID Card */}
            {(completedOrder.paymentMethod === 'bkash' || completedOrder.paymentMethod === 'nagad') && (
              <div className={`p-4 rounded-2xl border text-xs max-w-md mx-auto text-left space-y-3 shadow-xs ${
                completedOrder.paymentMethod === 'bkash'
                  ? 'bg-pink-50/90 border-pink-200'
                  : 'bg-orange-50/90 border-orange-200'
              }`}>
                {/* Store Payment Number Box with One-Click Copy */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      {completedOrder.paymentMethod === 'bkash'
                        ? `bKash ${storeSettings?.bkashType || 'Personal'} Number:`
                        : `Nagad ${storeSettings?.nagadType || 'Personal'} Number:`}
                    </div>
                    <div className="font-mono text-base font-bold text-stone-900 tracking-wide mt-0.5">
                      {completedOrder.paymentMethod === 'bkash'
                        ? (storeSettings?.bkashNumber || '01609450703')
                        : (storeSettings?.nagadNumber || '01866289100')}
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      পরিশোধযোগ্য বিল: <span className="font-bold text-[#0F4C3A]">৳{completedOrder.total.toLocaleString('bn-BD')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyNumber(
                      completedOrder.paymentMethod === 'bkash'
                        ? (storeSettings?.bkashNumber || '01609450703')
                        : (storeSettings?.nagadNumber || '01866289100'),
                      'confirm_store_num'
                    )}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      completedOrder.paymentMethod === 'bkash'
                        ? 'bg-[#E2136E] hover:bg-[#c4105f]'
                        : 'bg-[#F7921E] hover:bg-[#e07d0f]'
                    }`}
                  >
                    {copiedType === 'confirm_store_num' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>নম্বর কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* TrxID View and Interactive Input with Character Length Validator */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs">
                      {completedOrder.paymentMethod === 'bkash' ? 'বিকাশ ট্রানজেকশন আইডি (TrxID)' : 'নগদ ট্রানজেকশন আইডি (TrxID)'}
                    </span>
                  </div>

                  {completedOrder.transactionId ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                        <div>
                          <div className="text-[10px] text-stone-500">দাখিলকৃত ট্রানজেকশন আইডি (TrxID):</div>
                          <div className="font-mono font-bold text-sm text-[#0F4C3A] mt-0.5">
                            {completedOrder.transactionId}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(completedOrder.transactionId!, 'confirm_trx_copy')}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0F4C3A] bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="TrxID কপি করুন"
                        >
                          {copiedType === 'confirm_trx_copy' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>কপি</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          আপনার TrxID সফলভাবে সিস্টেমে রেকর্ড করা হয়েছে। অ্যাডমিন প্যানেল থেকে পেমেন্ট স্টেটমেন্ট যাচাইপূর্বক অর্ডারটি চূড়ান্তভাবে কনফার্ম করা হবে।
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>পেমেন্ট তথ্য যাচাই বাকি রয়েছে</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        আমাদের অ্যাডমিন প্রতিনিধি শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করে পেমেন্ট নিশ্চিত করবেন।
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5 text-left max-w-md mx-auto">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-950">🎉 অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে তৈরি হয়েছে!</span>
                <span className="text-emerald-800 leading-relaxed block mt-0.5">
                  আপনার মোবাইল নম্বর ({completedOrder.customerPhone}) দিয়ে স্বয়ংক্রিয়ভাবে কাস্টমার অ্যাকাউন্ট তৈরি ও লগইন করা হয়েছে। পরবর্তীতে অর্ডার ট্র্যাক ও দ্রুত কেনাকাটা করতে এই নম্বর ব্যবহার করতে পারবেন।
                </span>
              </div>
            </div>

            <div className="text-xs max-w-md mx-auto bg-amber-50 p-3 rounded-lg border border-amber-200 text-stone-700">
              আমাদের কাস্টমার কেয়ার টিম থেকে দ্রুত আপনার নম্বরে কল দিয়ে অর্ডারটি কনফার্ম করা হবে।
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {onOpenTrackingWithNumber && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTrackingWithNumber(completedOrder.orderNumber);
                  }}
                  className="px-5 py-2.5 bg-emerald-50 text-[#0F4C3A] border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  অর্ডার ট্র্যাক করুন
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#0F4C3A] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#135D48] transition-colors cursor-pointer"
              >
                আরো কেনাকাটা করুন
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE CHECKOUT FORM */
          <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
            {orderError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Direct Buy Item Summary Pill */}
            {isDirectBuy && directBuyItem && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={directBuyItem.product.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'}
                    alt={directBuyItem.product.titleBn}
                    className="w-10 h-10 object-cover rounded-lg border border-emerald-200 shrink-0"
                  />
                  <div className="truncate">
                    <div className="font-semibold text-stone-900 truncate">
                      {directBuyItem.product.titleBn}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {directVariantName ? `ভেরিয়েন্ট: ${directVariantName} · ` : ''}পরিমাণ: {directBuyItem.quantity} টি
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 font-bold text-stone-900 tabular-nums">
                  ৳{directSubtotal.toLocaleString('bn-BD')}
                </div>
              </div>
            )}

            {/* STEP 1: Delivery Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs text-emerald-900">
                  <Truck className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                  <span>
                    কোনো একাউন্ট বা পাসওয়ার্ডের দরকার নেই! নিচের তথ্য দিয়ে সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করুন।
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Full Name' : 'আপনার পূর্ণ নাম'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={language === 'en' ? 'e.g., Tanvir Ahmed' : 'যেমন: তানভীর আহমেদ'}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Mobile Number' : 'মোবাইল নম্বর'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'en' ? 'Email Address (Optional)' : 'ইমেইল এড্রেস (ঐচ্ছিক)'}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder={language === 'en' ? 'your.email@example.com (for order receipt)' : 'আপনার ইমেইল (অর্ডার রসিদের জন্য)'}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>

                {/* Bangladesh Division -> District -> Upazila Cascading Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Division' : 'বিভাগ'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDivision}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0F4C3A]"
                    >
                      {BANGLADESH_DIVISIONS.map((div) => (
                        <option key={div.id} value={div.id}>
                          {language === 'en' ? div.nameEn : div.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'District' : 'জেলা'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0F4C3A]"
                    >
                      {districts.map((dist) => (
                        <option key={dist.nameBn} value={dist.nameBn}>
                          {language === 'en' ? dist.nameEn : dist.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Upazila / Thana' : 'উপজেলা / থানা'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      ref={upazilaSelectRef}
                      value={selectedUpazila}
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0F4C3A]"
                    >
                      {upazilas.map((upz) => (
                        <option key={upz} value={upz}>
                          {upz}
                        </option>
                      ))}
                      <option value={CUSTOM_UPAZILA_OPTION_BN}>
                        {language === 'en' ? CUSTOM_UPAZILA_OPTION_EN : CUSTOM_UPAZILA_OPTION_BN}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Custom manual Upazila / Thana input when selected or not in preset */}
                {isCustomUpazila && (
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold text-[#0F4C3A] mb-1">
                      {language === 'en' ? 'Specify Thana / Upazila Name' : 'আপনার থানা বা উপজেলার নাম লিখুন'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={customUpazilaRef}
                      type="text"
                      required
                      value={customUpazilaText}
                      onChange={(e) => setCustomUpazilaText(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. Rampura, Kotwali, or Custom Thana' : 'যেমন: রামপুরা, খিলগাঁও, বা স্থানীয় থানা...'}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0F4C3A]"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      {language === 'en'
                        ? 'Our delivery partner will use this exact Thana/Upazila name.'
                        : 'আমাদের ডেলিভারি রাইডার এই থানা/উপজেলা অনুযায়ী পার্সেল ডেলিভারি করবেন।'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'en' ? 'Full Delivery Address' : 'পূর্ণ ডেলিভারি ঠিকানা'} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    ref={addressInputRef}
                    required
                    rows={2}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'House number, road number, flat, area details...'
                        : 'বাড়ি নম্বর, রোড নম্বর, ফ্ল্যাট নম্বর, এলাকা...'
                    }
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ডেলিভারি নির্দেশনা (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="যেমন: বিকেলে কল দিয়ে আসবেন বা সিকিউরিটিকে দিবেন"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>

                {/* 3-Pillar Trust Guarantee Card */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F4C3A]">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>সাশ্রয়ী দাম ১০০% নিশ্চয়তা ও ডেলিভারি পলিসি</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-stone-600">
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-stone-100">
                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>ঢাকায় ২৪-৪৮ ঘণ্টা, সারাদেশে ৭২ ঘণ্টা</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-stone-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>ডেলিভারিম্যানের সামনে পার্সেল যাচাই</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-stone-100">
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>৭ দিনের সহজ রিপ্লেসমেন্ট</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const errors: string[] = [];
                      let firstField: 'name' | 'phone' | 'address' | 'upazila' | null = null;

                      if (!customerName.trim()) {
                        errors.push('আপনার পূর্ণ নাম লিখুন');
                        if (!firstField) firstField = 'name';
                      }

                      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
                      if (!customerPhone.trim() || cleanPhone.length !== 11) {
                        errors.push('১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)');
                        if (!firstField) firstField = 'phone';
                      }

                      const finalUpazila = (isCustomUpazila || selectedUpazila === CUSTOM_UPAZILA_OPTION_BN)
                        ? customUpazilaText.trim()
                        : selectedUpazila.trim();

                      if (!finalUpazila) {
                        errors.push('উপজেলা বা থানা নির্বাচন অথবা লিখুন');
                        if (!firstField) firstField = 'upazila';
                      }

                      if (!fullAddress.trim() || fullAddress.trim().length < 5) {
                        errors.push('সম্পূর্ণ ঠিকানা লিখুন (যেমন: বাড়ি নং, রোড নং, এলাকা/গ্রাম)');
                        if (!firstField) firstField = 'address';
                      }

                      if (errors.length > 0) {
                        setAddressValidationErrors(errors);
                        setTargetFocusField(firstField);
                        setShowAddressPopup(true);
                        return;
                      }

                      setOrderError('');
                      setStep(2);
                    }}
                    className="px-6 py-2.5 bg-[#0F4C3A] text-white rounded-xl text-sm font-semibold hover:bg-[#135D48] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>পরবর্তী ধাপ (পেমেন্ট পদ্ধতি)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Instant Address Validation Modal Popup */}
                {showAddressPopup && (
                  <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <MapPin className="w-7 h-7 text-amber-600" />
                      </div>

                      <h3 className="text-lg font-bold text-stone-900 mb-1">
                        ডেলিভারি ঠিকানা সম্পূর্ণ করুন
                      </h3>
                      <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                        পণ্যটি নিরাপদে আপনার ঠিকানায় পৌঁছে দিতে নিচের তথ্যগুলো পূরণ করা আবশ্যক:
                      </p>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 text-left space-y-2">
                        {addressValidationErrors.map((err, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-amber-950 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleCloseAddressPopup}
                        className="w-full py-2.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>ঠিকানা ঠিক করুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Payment & Order Confirmation */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Payment Methods */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                    পেমেন্ট পদ্ধতি নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* COD */}
                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-[#0F4C3A] bg-emerald-50/50 ring-2 ring-[#0F4C3A]'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-1 text-[#0F4C3A]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-stone-900">
                          <Banknote className="w-4 h-4 text-[#0F4C3A]" />
                          <span>ক্যাশ অন ডেলিভারি (COD)</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          প্রোডাক্ট হাতে পেয়ে দেখে ডেলিভারি ম্যানকে মূল্য পরিশোধ করুন।
                        </p>
                      </div>
                    </label>

                    {/* bKash Send Money */}
                    <label
                      onClick={() => setPaymentMethod('bkash')}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        paymentMethod === 'bkash'
                          ? 'border-[#E2136E] bg-pink-50/50 ring-2 ring-[#E2136E]'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'bkash'}
                        onChange={() => setPaymentMethod('bkash')}
                        className="mt-1 text-[#E2136E]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#E2136E]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#E2136E]"></span>
                            <span>bKash Send Money</span>
                          </div>
                          <span className="text-[10px] font-bold bg-[#E2136E] text-white px-2 py-0.5 rounded-full">
                            বিকাশ
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          পার্সোনাল বিকাশ নম্বরে সেন্ড মানি করে TrxID দিন।
                        </p>
                      </div>
                    </label>

                    {/* Nagad Send Money */}
                    <label
                      onClick={() => setPaymentMethod('nagad')}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        paymentMethod === 'nagad'
                          ? 'border-[#F7921E] bg-orange-50/50 ring-2 ring-[#F7921E]'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'nagad'}
                        onChange={() => setPaymentMethod('nagad')}
                        className="mt-1 text-[#F7921E]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#D35400]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F7921E]"></span>
                            <span>Nagad Send Money</span>
                          </div>
                          <span className="text-[10px] font-bold bg-[#F7921E] text-white px-2 py-0.5 rounded-full">
                            নগদ
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          পার্সোনাল নগদ নম্বরে সেন্ড মানি করে TrxID দিন।
                        </p>
                      </div>
                    </label>

                  </div>

                  {/* bKash Payment Details Panel */}
                  {paymentMethod === 'bkash' && (
                    <div className="mt-3 p-4 bg-pink-50/70 rounded-2xl border-2 border-pink-200 space-y-3.5 animate-in fade-in duration-200">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#E2136E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          ৳
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-[#E2136E]">
                            bKash Send Money নির্দেশিকা
                          </h4>
                          <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                            {storeSettings?.bkashInstructions ||
                              'বিকাশ থেকে সেন্ড মানি করার পর যে নাম্বার থেকে টাকা পাঠিয়েছেন সে নাম্বার এবং ১০ অক্ষরের ট্রানজেকশন আইডি লিখুন।'}
                          </p>
                        </div>
                      </div>

                      {/* Store Number Copy Box */}
                      <div className="bg-white p-3 rounded-xl border border-pink-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                        <div>
                          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            bKash {storeSettings?.bkashType || 'Personal'} Number:
                          </div>
                          <div className="font-mono text-base font-bold text-stone-900 tracking-wide mt-0.5">
                            {storeSettings?.bkashNumber || '01609450703'}
                          </div>
                          <div className="text-[11px] text-[#E2136E] font-medium mt-0.5">
                            পরিশোধের পরিমাণ: ৳{activeTotal.toLocaleString('bn-BD')}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyNumber(storeSettings?.bkashNumber || '01609450703', 'bkash')}
                          className="px-3.5 py-1.5 bg-[#E2136E] hover:bg-[#c4105f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          {copiedType === 'bkash' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-white" />
                              <span>নম্বর কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Input fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-stone-800">
                              bKash Number (প্রেরক নম্বর) <span className="text-rose-500">*</span>
                            </label>
                            {senderNumber.length > 0 && (
                              <span className={`text-[10px] font-mono font-bold ${senderNumber.length === 11 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {senderNumber.length}/১১
                              </span>
                            )}
                          </div>
                          <input
                            type="tel"
                            required
                            maxLength={11}
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="017XXXXXXXX"
                            className="w-full px-3 py-2 border border-pink-300 rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E]"
                          />
                          <p className="text-[10px] text-stone-500 mt-1">
                            যে বিকাশ নম্বর থেকে টাকা পাঠিয়েছেন (১১ ডিজিট)
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-stone-800">
                              bKash Transaction ID (TrxID) <span className="text-rose-500">*</span>
                            </label>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                transactionId.length === 10
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : transactionId.length > 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'text-stone-400'
                              }`}
                            >
                              {transactionId.length}/১০ অক্ষর
                            </span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            value={transactionId}
                            onChange={(e) =>
                              setTransactionId(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10))
                            }
                            placeholder="8N7A6D5EE7"
                            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white font-mono uppercase focus:outline-none focus:ring-1 ${
                              transactionId.length === 10
                                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-500'
                                : transactionId.length > 0
                                ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-400'
                                : 'border-pink-300 focus:border-[#E2136E] focus:ring-[#E2136E]'
                            }`}
                          />
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            {transactionId.length === 10 ? (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> TrxID ১০ অক্ষর সম্পন্ন
                              </span>
                            ) : transactionId.length > 0 ? (
                              <span className="text-amber-600 font-medium">
                                আরো {10 - transactionId.length}টি অক্ষর প্রয়োজন (ঠিক ১০ অক্ষর)
                              </span>
                            ) : (
                              <span className="text-stone-500">
                                বিকাশ ফিরতি এসএমএস থেকে ১০ অক্ষরের TrxID লিখুন
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nagad Payment Details Panel */}
                  {paymentMethod === 'nagad' && (
                    <div className="mt-3 p-4 bg-orange-50/70 rounded-2xl border-2 border-orange-200 space-y-3.5 animate-in fade-in duration-200">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#F7921E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          ৳
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-[#D35400]">
                            Nagad Send Money নির্দেশিকা
                          </h4>
                          <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                            {storeSettings?.nagadInstructions ||
                              'নগদ থেকে সেন্ড মানি করার পর যে নাম্বার থেকে টাকা পাঠিয়েছেন সে নাম্বার এবং ৮ অক্ষরের ট্রানজেকশন আইডি লিখুন।'}
                          </p>
                        </div>
                      </div>

                      {/* Store Number Copy Box */}
                      <div className="bg-white p-3 rounded-xl border border-orange-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                        <div>
                          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            Nagad {storeSettings?.nagadType || 'Personal'} Number:
                          </div>
                          <div className="font-mono text-base font-bold text-stone-900 tracking-wide mt-0.5">
                            {storeSettings?.nagadNumber || '01866289100'}
                          </div>
                          <div className="text-[11px] text-[#D35400] font-medium mt-0.5">
                            পরিশোধের পরিমাণ: ৳{activeTotal.toLocaleString('bn-BD')}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyNumber(storeSettings?.nagadNumber || '01866289100', 'nagad')}
                          className="px-3.5 py-1.5 bg-[#F7921E] hover:bg-[#e07d0f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          {copiedType === 'nagad' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-white" />
                              <span>নম্বর কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Input fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-stone-800">
                              Nagad Number (প্রেরক নম্বর) <span className="text-rose-500">*</span>
                            </label>
                            {senderNumber.length > 0 && (
                              <span className={`text-[10px] font-mono font-bold ${senderNumber.length === 11 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {senderNumber.length}/১১
                              </span>
                            )}
                          </div>
                          <input
                            type="tel"
                            required
                            maxLength={11}
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="017XXXXXXXX"
                            className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm bg-white font-mono focus:outline-none focus:border-[#F7921E] focus:ring-1 focus:ring-[#F7921E]"
                          />
                          <p className="text-[10px] text-stone-500 mt-1">
                            যে নগদ নম্বর থেকে টাকা পাঠিয়েছেন (১১ ডিজিট)
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-stone-800">
                              Nagad Transaction ID (TrxID) <span className="text-rose-500">*</span>
                            </label>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                transactionId.length === 8
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : transactionId.length > 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'text-stone-400'
                              }`}
                            >
                              {transactionId.length}/৮ অক্ষর
                            </span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            value={transactionId}
                            onChange={(e) =>
                              setTransactionId(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8))
                            }
                            placeholder="9J5A7B3X"
                            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white font-mono uppercase focus:outline-none focus:ring-1 ${
                              transactionId.length === 8
                                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-500'
                                : transactionId.length > 0
                                ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-400'
                                : 'border-orange-300 focus:border-[#F7921E] focus:ring-[#F7921E]'
                            }`}
                          />
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            {transactionId.length === 8 ? (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> TrxID ৮ অক্ষর সম্পন্ন
                              </span>
                            ) : transactionId.length > 0 ? (
                              <span className="text-amber-600 font-medium">
                                আরো {8 - transactionId.length}টি অক্ষর প্রয়োজন (ঠিক ৮ অক্ষর)
                              </span>
                            ) : (
                              <span className="text-stone-500">
                                নগদ ফিরতি এসএমএস থেকে ৮ অক্ষরের TrxID লিখুন
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coupon Code Box (only for cart checkout) */}
                {!isDirectBuy && (
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <Tag className="w-3.5 h-3.5 text-[#0F4C3A]" />
                      <span>ডিসকাউন্ট কুপন</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="কুপন কোড লিখুন"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0F4C3A]"
                      />
                      {couponCode ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          বাতিল
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-3 py-1.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          প্রয়োগ
                        </button>
                      )}
                    </div>

                    {couponFeedback && (
                      <div
                        className={`text-xs ${
                          couponFeedback.isError ? 'text-rose-600' : 'text-emerald-700 font-medium'
                        }`}
                      >
                        {couponFeedback.msg}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Review Breakdown */}
                <div className="bg-stone-50/80 rounded-xl p-4 border border-stone-200 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>পণ্যের উপমোট (Subtotal):</span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      ৳{activeSubtotal.toLocaleString('bn-BD')}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>কুপন ছাড় (Discount):</span>
                      <span className="tabular-nums">-৳{discountAmount.toLocaleString('bn-BD')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>
                      ডেলিভারি চার্জ ({selectedDivision === 'dhaka' ? 'ঢাকা মেট্রো সিটি' : 'ঢাকার বাইরে সমগ্র বাংলাদেশ'}):
                    </span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold">ফ্রি ডেলিভারি</span>
                      ) : (
                        `৳${deliveryFee.toLocaleString('bn-BD')}`
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm font-bold text-stone-900">
                    <span>সর্বমোট পরিশোধযোগ্য:</span>
                    <span className="text-lg text-[#0F4C3A] tabular-nums">
                      ৳{activeTotal.toLocaleString('bn-BD')}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    পূর্ববর্তী ধাপ
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>অর্ডার প্রসেস হচ্ছে...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>অর্ডার নিশ্চিত করুন (৳{activeTotal.toLocaleString('bn-BD')})</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
