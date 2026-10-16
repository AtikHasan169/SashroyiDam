import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Banknote, MapPin, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshGeo.ts';
import { api } from '../lib/api.ts';
import type { Order } from '../types/index.ts';

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  isOpen,
  onClose,
  onOrderSuccess
}) => {
  const {
    items,
    cartValidation,
    division,
    setCustomerDivision,
    couponCode,
    applyCouponCode,
    removeCoupon,
    clearCart
  } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  const [selectedDivision, setSelectedDivision] = useState(division || 'dhaka');
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা');
  const [selectedUpazila, setSelectedUpazila] = useState('ধানমন্ডি');
  const [fullAddress, setFullAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'sslcommerz_sandbox'>('cod');
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [couponFeedback, setCouponFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

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
        setSelectedUpazila(defaultAddr.upazila || '');
        setFullAddress(defaultAddr.fullAddress || '');
      }
    }
  }, [user]);

  // Sync division change to CartContext for instant delivery fee recalculation
  useEffect(() => {
    setCustomerDivision(selectedDivision);
  }, [selectedDivision, setCustomerDivision]);

  // Dynamic districts based on selected division
  const currentDivData = BANGLADESH_DIVISIONS.find((d) => d.id === selectedDivision);
  const districts = currentDivData ? currentDivData.districts : [];

  // Dynamic upazilas based on selected district
  const currentDistrictData = districts.find((dist) => dist.nameBn === selectedDistrict);
  const upazilas = currentDistrictData ? currentDistrictData.upazilas : [];

  const handleDivisionChange = (divId: string) => {
    setSelectedDivision(divId);
    const divData = BANGLADESH_DIVISIONS.find((d) => d.id === divId);
    if (divData && divData.districts.length > 0) {
      const firstDist = divData.districts[0];
      setSelectedDistrict(firstDist.nameBn);
      if (firstDist.upazilas.length > 0) {
        setSelectedUpazila(firstDist.upazilas[0]);
      } else {
        setSelectedUpazila('');
      }
    }
  };

  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    const distData = districts.find((d) => d.nameBn === distName);
    if (distData && distData.upazilas.length > 0) {
      setSelectedUpazila(distData.upazilas[0]);
    } else {
      setSelectedUpazila('');
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

  const handleSubmitOrder = async () => {
    setOrderError('');
    setIsSubmitting(true);

    try {
      // 1. Submit order to server
      const res = await api.createOrder({
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        division: selectedDivision,
        district: selectedDistrict,
        upazila: selectedUpazila,
        fullAddress,
        deliveryInstructions: deliveryInstructions || undefined,
        paymentMethod,
        couponCode: couponCode || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity
        }))
      });

      const order = res.order;

      // 2. If SSLCOMMERZ Sandbox is selected, execute server payment verification simulation
      if (paymentMethod === 'sslcommerz_sandbox') {
        const initRes = await api.initSslPayment(order.id);
        // Simulate successful sandbox card/mobile bank debit
        const valRes = await api.validateSslPayment({
          tran_id: initRes.tran_id,
          val_id: `VAL-${Date.now()}`,
          status: 'VALID'
        });
        setCompletedOrder(valRes.order);
        onOrderSuccess(valRes.order);
      } else {
        setCompletedOrder(order);
        onOrderSuccess(order);
      }

      clearCart();
    } catch (err: any) {
      setOrderError(err.message || 'অর্ডার সম্পন্ন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 relative text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {completedOrder ? 'অর্ডার সফল হয়েছে!' : 'চেকআউট — নিরাপদ অর্ডার সম্পন্নকরণ'}
            </h2>
            {!completedOrder && (
              <p className="text-xs text-stone-500 mt-0.5">
                ধাপ {step} এর ২: {step === 1 ? 'ডেলিভারি ঠিকানা ও গ্রাহকের তথ্য' : 'পেমেন্ট ও অর্ডার নিশ্চিতকরণ'}
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
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-[#0F4C3A] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-stone-900">
                ধন্যবাদ, আপনার অর্ডার গৃহীত হয়েছে!
              </h3>
              <p className="text-sm text-stone-600">
                অর্ডার রেফারেন্স নম্বর:{' '}
                <span className="font-bold text-[#0F4C3A] font-mono text-base">
                  {completedOrder.orderNumber}
                </span>
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-700 max-w-md mx-auto space-y-2 text-left">
              <div className="flex justify-between">
                <span>গ্রাহকের নাম:</span>
                <span className="font-semibold">{completedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>মোবাইল নম্বর:</span>
                <span className="font-semibold">{completedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span>ডেলিভারি ঠিকানা:</span>
                <span className="font-semibold text-right max-w-[240px]">
                  {completedOrder.fullAddress}, {completedOrder.upazila}, {completedOrder.district}
                </span>
              </div>
              <div className="flex justify-between">
                <span>পেমেন্ট পদ্ধতি:</span>
                <span className="font-semibold">
                  {completedOrder.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'SSLCOMMERZ (পরিশোধিত)'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span className="text-[#0F4C3A] tabular-nums">
                  ৳{completedOrder.total.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-500 max-w-md mx-auto">
              আমাদের টিম থেকে শিঘ্রই ফোনে যোগাযোগ করে অর্ডার কনফার্ম ও দ্রুত ডেলিভারির ব্যবস্থা করা হবে।
            </p>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#0F4C3A] text-white rounded-xl text-sm font-semibold hover:bg-[#135D48] transition-colors cursor-pointer"
              >
                কেনাকাটা চালিয়ে যান
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE CHECKOUT FORM */
          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {orderError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <span>{orderError}</span>
              </div>
            )}

            {/* STEP 1: Delivery Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
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
                    ইমেইল এড্রেস (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="আপনার ইমেইল (অর্ডার রসিদের জন্য)"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>

                {/* Bangladesh Division -> District -> Upazila Cascading Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      বিভাগ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDivision}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0F4C3A]"
                    >
                      {BANGLADESH_DIVISIONS.map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.nameBn} ({div.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      জেলা <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0F4C3A]"
                    >
                      {districts.map((dist) => (
                        <option key={dist.nameBn} value={dist.nameBn}>
                          {dist.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      উপজেলা / থানা <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedUpazila}
                      onChange={(e) => setSelectedUpazila(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0F4C3A]"
                    >
                      {upazilas.map((upz) => (
                        <option key={upz} value={upz}>
                          {upz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="বাড়ি নম্বর, রোড নম্বর, ফ্ল্যাট নম্বর, এলাকা..."
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

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!customerName.trim() || !customerPhone.trim() || !fullAddress.trim()) {
                        setOrderError('নাম, সঠিক মোবাইল নম্বর এবং ঠিকানা পূরণ করুন');
                        return;
                      }
                      setOrderError('');
                      setStep(2);
                    }}
                    className="px-6 py-2.5 bg-[#0F4C3A] text-white rounded-xl text-sm font-semibold hover:bg-[#135D48] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>পরবর্তী ধাপ (পেমেন্ট)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Payment & Order Confirmation */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Payment Methods */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2.5">
                    পেমেন্ট পদ্ধতি নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-[#0F4C3A] bg-emerald-50/30 ring-1 ring-[#0F4C3A]'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-1 text-[#0F4C3A]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-stone-900">
                          <Banknote className="w-4 h-4 text-[#0F4C3A]" />
                          <span>ক্যাশ অন ডেলিভারি (COD)</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          পণ্য হাতে পাওয়ার পর রাইডারকে নগদ অর্থ পরিশোধ করুন।
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod('sslcommerz_sandbox')}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        paymentMethod === 'sslcommerz_sandbox'
                          ? 'border-[#0F4C3A] bg-emerald-50/30 ring-1 ring-[#0F4C3A]'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'sslcommerz_sandbox'}
                        onChange={() => setPaymentMethod('sslcommerz_sandbox')}
                        className="mt-1 text-[#0F4C3A]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-stone-900">
                          <CreditCard className="w-4 h-4 text-[#0F4C3A]" />
                          <span>SSLCOMMERZ পেমেন্ট</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          বিকাশ, নগদ, রকেট, কার্ড ও ইন্টারনেট ব্যাংকিং (স্যান্ডবক্স মোড)।
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Coupon Code Box */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Tag className="w-3.5 h-3.5 text-[#0F4C3A]" />
                    <span>ডিসকাউন্ট কুপন</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="কুপন কোড (যেমন: WELCOME50 বা OSHESH10)"
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
                        প্রয়োগ করুন
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

                {/* Order Review Breakdown */}
                <div className="bg-stone-50/80 rounded-xl p-4 border border-stone-200 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>পণ্যের উপমোট (Subtotal):</span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      ৳{cartValidation?.subtotal.toLocaleString('bn-BD')}
                    </span>
                  </div>

                  {cartValidation?.discount && cartValidation.discount > 0 ? (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>কুপন ছাড় (Discount):</span>
                      <span className="tabular-nums">-৳{cartValidation.discount.toLocaleString('bn-BD')}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between">
                    <span>
                      ডেলিভারি চার্জ ({selectedDivision === 'dhaka' ? 'ঢাকা মেট্রো' : 'ঢাকার বাইরে'}):
                    </span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      {cartValidation?.deliveryFee === 0 ? (
                        <span className="text-emerald-700">ফ্রি</span>
                      ) : (
                        `৳${cartValidation?.deliveryFee.toLocaleString('bn-BD')}`
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm font-bold text-stone-900">
                    <span>সর্বমোট পরিশোধযোগ্য:</span>
                    <span className="text-lg text-[#0F4C3A] tabular-nums">
                      ৳{cartValidation?.total.toLocaleString('bn-BD')}
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
                      <span>অর্ডার তৈরি হচ্ছে...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>অর্ডার নিশ্চিত করুন (৳{cartValidation?.total.toLocaleString('bn-BD')})</span>
                      </>
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
