import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag, Truck, Check, AlertCircle } from 'lucide-react';
import type { Product, Order, OrderItemSnapshot } from '../../types/index.ts';
import {
  BANGLADESH_DIVISIONS,
  getUpazilasForDistrict,
  CUSTOM_UPAZILA_OPTION_BN,
  CUSTOM_UPAZILA_OPTION_EN
} from '../../data/bangladeshGeo.ts';
import { BANGLADESH_DISTRICTS } from '../../data/districts.ts';
import { api } from '../../lib/api.ts';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOrderCreated: (order: Order) => void;
}

interface SelectedItem {
  productId?: string;
  productTitle?: string;
  quantity: number;
  unitPrice: number;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onOrderCreated
}) => {
  if (!isOpen) return null;

  // Order Details Form State
  const [orderSource, setOrderSource] = useState<'facebook' | 'phone' | 'whatsapp' | 'walk_in'>('facebook');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [division, setDivision] = useState('dhaka');
  const [district, setDistrict] = useState('ঢাকা');
  const [upazila, setUpazila] = useState('ধানমন্ডি');
  const [customUpazilaText, setCustomUpazilaText] = useState('');
  const [isCustomUpazila, setIsCustomUpazila] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [initialStatus, setInitialStatus] = useState<'confirmed' | 'processing' | 'pending_confirmation'>('confirmed');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'bank'>('cod');

  const currentDivData = BANGLADESH_DIVISIONS.find((d) => d.id === division) || BANGLADESH_DIVISIONS[0];
  const availableDistricts = currentDivData ? currentDivData.districts : [];
  const availableUpazilas = React.useMemo(() => {
    return getUpazilasForDistrict(district);
  }, [district]);

  // Products Selected
  const [items, setItems] = useState<SelectedItem[]>(() => {
    if (products.length > 0) {
      return [{ productId: products[0].id, productTitle: products[0].titleBn, quantity: 1, unitPrice: products[0].price }];
    }
    return [{ productTitle: '', quantity: 1, unitPrice: 0 }];
  });

  // Shipping & Discount
  const [deliveryFee, setDeliveryFee] = useState<number>(70);
  const [discount, setDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Division Change
  const handleDivisionChange = (divId: string) => {
    setDivision(divId);
    setIsCustomUpazila(false);
    setCustomUpazilaText('');
    const divData = BANGLADESH_DIVISIONS.find((d) => d.id === divId);
    if (divData && divData.districts.length > 0) {
      const firstDist = divData.districts[0];
      setDistrict(firstDist.nameBn);
      const isDhaka = firstDist.nameBn.includes('ঢাকা') || firstDist.nameEn.toLowerCase() === 'dhaka';
      setDeliveryFee(isDhaka ? 70 : 130);
      const upzList = getUpazilasForDistrict(firstDist.nameBn);
      if (upzList.length > 0) {
        setUpazila(upzList[0]);
      } else {
        setUpazila(CUSTOM_UPAZILA_OPTION_BN);
        setIsCustomUpazila(true);
      }
    }
  };

  // Handle District Change to auto-adjust delivery fee and upazila
  const handleDistrictChange = (distName: string) => {
    setDistrict(distName);
    setIsCustomUpazila(false);
    setCustomUpazilaText('');
    const isDhaka = distName.includes('ঢাকা') || distName.toLowerCase().includes('dhaka');
    setDeliveryFee(isDhaka ? 70 : 130);
    const upzList = getUpazilasForDistrict(distName);
    if (upzList.length > 0) {
      setUpazila(upzList[0]);
    } else {
      setUpazila(CUSTOM_UPAZILA_OPTION_BN);
      setIsCustomUpazila(true);
    }
  };

  const handleUpazilaChange = (val: string) => {
    setUpazila(val);
    if (val === CUSTOM_UPAZILA_OPTION_BN || val === CUSTOM_UPAZILA_OPTION_EN) {
      setIsCustomUpazila(true);
    } else {
      setIsCustomUpazila(false);
    }
  };

  // Add Item Row
  const handleAddItem = () => {
    if (products.length > 0) {
      setItems((prev) => [
        ...prev,
        { productId: products[0].id, productTitle: products[0].titleBn, quantity: 1, unitPrice: products[0].price }
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        { productTitle: '', quantity: 1, unitPrice: 0 }
      ]);
    }
  };

  // Update Item
  const handleUpdateItem = (index: number, updates: Partial<SelectedItem>) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      if (updates.productId) {
        if (updates.productId === 'custom') {
          updated[index].productId = undefined;
          updated[index].productTitle = '';
        } else {
          const prod = products.find((p) => p.id === updates.productId);
          if (prod) {
            updated[index].productTitle = prod.titleBn || prod.titleEn;
            updated[index].unitPrice = prod.price;
          }
        }
      }
      return updated;
    });
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerPhone.trim() || !fullAddress.trim()) {
      setErrorMessage('গ্রাহকের নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা অবশ্যই পূরণ করুন।');
      return;
    }

    const validItems = items.filter((it) => (it.productId || it.productTitle?.trim()) && it.unitPrice >= 0 && it.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('কমপক্ষে একটি বৈধ পণ্য নির্বাচন বা এন্ট্রি করুন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalUpazila = (isCustomUpazila || upazila === CUSTOM_UPAZILA_OPTION_BN)
        ? customUpazilaText.trim()
        : upazila.trim();

      if (!finalUpazila) {
        setErrorMessage('উপজেলা বা থানার নাম নির্বাচন বা লিখুন।');
        setIsSubmitting(false);
        return;
      }

      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        division,
        district,
        upazila: finalUpazila,
        fullAddress: fullAddress.trim(),
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        orderSource,
        paymentMethod,
        paymentStatus,
        deliveryFee: Number(deliveryFee) || 0,
        discount: Number(discount) || 0,
        items: validItems.map((it) => {
          const prod = it.productId ? products.find((p) => p.id === it.productId) : null;
          return {
            productId: it.productId,
            productTitleBn: prod?.titleBn || it.productTitle || 'কাস্টম পণ্য',
            productTitleEn: prod?.titleEn || it.productTitle || 'Custom Product',
            unitPrice: Number(it.unitPrice),
            quantity: Number(it.quantity)
          };
        })
      };

      const res = await api.createAdminOrder(orderPayload);
      onOrderCreated(res.order);
      onClose();
    } catch (err: any) {
      console.error('Failed to create manual order:', err);
      setErrorMessage(err.message || 'ম্যানুয়াল অর্ডার তৈরি করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden text-stone-900 my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F4C3A] text-white flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                ম্যানুয়াল অর্ডার তৈরি (Manual Order Entry)
              </h3>
              <p className="text-[11px] text-stone-500">
                Facebook, WhatsApp বা ফোন কলের মাধ্যমে আসা অর্ডারের তথ্য এন্ট্রি করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* 1. Channel & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                অর্ডারের মাধ্যম (Order Channel) *
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'phone', label: 'Phone Call' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'walk_in', label: 'Direct / Store' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setOrderSource(s.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      orderSource === s.id
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                প্রাথমিক স্ট্যাটাস (Status)
              </label>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
              >
                <option value="confirmed">অর্ডার কনফার্মড (Confirmed)</option>
                <option value="processing">প্রসেসিং (Processing)</option>
                <option value="pending_confirmation">পেন্ডিং কনফার্মেশন (Pending)</option>
              </select>
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-[#0F4C3A]">
              গ্রাহকের তথ্য (Customer Details)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  গ্রাহকের পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: তানভীর আহমেদ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  মোবাইল নম্বর * (১১ ডিজিট)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  বিভাগ (Division) *
                </label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] cursor-pointer"
                >
                  {BANGLADESH_DIVISIONS.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.nameBn} ({div.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  জেলা (District) *
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] cursor-pointer"
                >
                  {availableDistricts.map((d) => (
                    <option key={d.nameBn} value={d.nameBn}>
                      {d.nameBn} ({d.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  থানা / উপজেলা (Upazila) *
                </label>
                <select
                  value={upazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] cursor-pointer"
                >
                  {availableUpazilas.map((upz) => (
                    <option key={upz} value={upz}>
                      {upz}
                    </option>
                  ))}
                  <option value={CUSTOM_UPAZILA_OPTION_BN}>
                    {CUSTOM_UPAZILA_OPTION_BN}
                  </option>
                </select>
              </div>
            </div>

            {/* Custom Upazila text input */}
            {isCustomUpazila && (
              <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <label className="block text-xs font-semibold text-[#0F4C3A] mb-1">
                  থানা বা উপজেলার নাম লিখুন *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রামপুরা, খিলগাঁও, কোতোয়ালী..."
                  value={customUpazilaText}
                  onChange={(e) => setCustomUpazilaText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                সম্পূর্ণ ঠিকানা (রোড, বাড়ি, ফ্ল্যাট নং ইত্যাদি) *
              </label>
              <textarea
                required
                rows={2}
                placeholder="বাড়ি নং, রোড নং, এলাকা এবং ডেলিভারির বিস্তারিত ঠিকানা..."
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
              />
            </div>
          </div>

          {/* 3. Product Selection */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-[#0F4C3A]">
                অর্ডারের পণ্যসমূহ (Ordered Items)
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#0F4C3A] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ পণ্য যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap sm:flex-nowrap items-center gap-2"
                >
                  <div className="flex-1 min-w-[200px]">
                    {products.length > 0 ? (
                      <div className="space-y-1">
                        <select
                          value={it.productId || 'custom'}
                          onChange={(e) => handleUpdateItem(idx, { productId: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                        >
                          <option value="custom">-- কাস্টম পণ্য (Custom Item) --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.titleBn} (৳{p.price})
                            </option>
                          ))}
                        </select>
                        {!it.productId && (
                          <input
                            type="text"
                            placeholder="পণ্যের নাম লিখুন..."
                            value={it.productTitle || ''}
                            onChange={(e) => handleUpdateItem(idx, { productTitle: e.target.value })}
                            className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded text-xs"
                          />
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="পণ্যের নাম লিখুন..."
                        required
                        value={it.productTitle || ''}
                        onChange={(e) => handleUpdateItem(idx, { productTitle: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                      />
                    )}
                  </div>

                  <div className="w-20">
                    <label className="block text-[10px] text-stone-400 sm:hidden">পরিমাণ</label>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => handleUpdateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-center font-bold"
                      title="পরিমাণ"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] text-stone-400 sm:hidden">একক মূল্য</label>
                    <input
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-right font-bold tabular-nums"
                      title="একক মূল্য"
                    />
                  </div>

                  <div className="w-20 text-right font-bold text-stone-900 tabular-nums">
                    ৳{it.unitPrice * it.quantity}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Financial Adjustments & Totals */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  ডেলিভারি চার্জ (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  স্পেশাল ডিসকাউন্ট / ছাড় (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold tabular-nums"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-2 border-t border-stone-200 space-y-1 text-right">
              <div className="flex justify-between text-stone-600">
                <span>পণ্যের উপমোট:</span>
                <span className="font-semibold tabular-nums">৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-semibold tabular-nums">+৳{deliveryFee}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>ছাড়:</span>
                  <span className="tabular-nums">-৳{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#0F4C3A] pt-1 border-t border-stone-200">
                <span>সর্বমোট প্রদেয়:</span>
                <span className="text-base tabular-nums">৳{total}</span>
              </div>
            </div>
          </div>

          {/* 5. Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                পেমেন্ট মেথড
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
              >
                <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                পেমেন্ট স্ট্যাটাস
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
              >
                <option value="unpaid">বকেয়া (Unpaid / COD)</option>
                <option value="paid">পরিশোধিত (Paid)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-stone-300 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#0F4C3A] hover:bg-[#135D48] text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>অর্ডার তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>অর্ডার তৈরি ও নিশ্চিত করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
