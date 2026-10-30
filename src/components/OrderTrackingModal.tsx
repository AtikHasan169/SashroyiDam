import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Clock, Truck, Package, AlertCircle, MapPin, Copy, Check, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { BKashLogo, NagadLogo } from './PaymentLogos.tsx';
import type { Order, StoreSettings } from '../types/index.ts';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  initialOrder?: Order | null;
  initialPhone?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
  initialOrder = null,
  initialPhone = ''
}) => {
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone || user?.phone || '');
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      api.getStoreSettings().then(setStoreSettings).catch(() => {});

      if (initialOrder) {
        setOrder(initialOrder);
        setOrderNumber(initialOrder.orderNumber);
        if (initialOrder.customerPhone) setPhone(initialOrder.customerPhone);
      } else if (initialOrderNumber) {
        setOrderNumber(initialOrderNumber);
        // Automatically fetch order if order number is passed (e.g. from checkout or direct link)
        setIsLoading(true);
        setErrorMsg('');
        api.trackOrder({ orderNumber: initialOrderNumber, phone: initialPhone || user?.phone || '' })
          .then((res) => {
            if (res?.order) {
              setOrder(res.order);
            }
          })
          .catch((err) => {
            setErrorMsg(err.message || 'অর্ডারটি খুঁজে পাওয়া যায়নি');
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setOrder(null);
        setErrorMsg('');
        if (user?.phone) setPhone(user.phone);
      }
    }
  }, [isOpen, initialOrder, initialOrderNumber, initialPhone, user]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch {}
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMsg('অনুগ্রহ করে অর্ডার রেফারেন্স নম্বর এবং মোবাইল নম্বর উভয়ই লিখুন');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await api.trackOrder({
        orderNumber: orderNumber.trim(),
        phone: phone.trim()
      });
      setOrder(res.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'প্রদত্ত তথ্য অনুযায়ী কোনো অর্ডার পাওয়া যায়নি। নম্বর দুটি পুনরায় যাচাই করুন।');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold">যাচাই প্রক্রিয়াধীন</span>;
      case 'confirmed':
        return <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold">নিশ্চিত হয়েছে</span>;
      case 'processing':
        return <span className="text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded text-xs font-semibold">প্রস্তুত করা হচ্ছে</span>;
      case 'packed':
        return <span className="text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded text-xs font-semibold">প্যাকেজিং সম্পন্ন</span>;
      case 'shipped':
        return <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-xs font-semibold">কুরিয়ারে পাঠানো হয়েছে</span>;
      case 'delivered':
        return <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">ডেলিভারি সম্পন্ন</span>;
      case 'cancelled':
        return <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold">বাতিল করা হয়েছে</span>;
      default:
        return <span className="text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-xs font-semibold">{status}</span>;
    }
  };

  const isBkashOrder = order?.paymentMethod === 'bkash';
  const isNagadOrder = order?.paymentMethod === 'nagad';
  const storePaymentNumber = isBkashOrder
    ? storeSettings?.bkashNumber || '01609450703'
    : isNagadOrder
    ? storeSettings?.nagadNumber || '01866289100'
    : '';
  const storePaymentType = isBkashOrder
    ? storeSettings?.bkashType || 'Personal'
    : isNagadOrder
    ? storeSettings?.nagadType || 'Personal'
    : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 relative my-8 text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="text-lg font-bold text-stone-900">অর্ডার ট্র্যাকিং</h2>
            <p className="text-xs text-stone-500 mt-0.5">আপনার অর্ডারের বর্তমান অবস্থা ও পেমেন্ট বিবরণী</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* If order is already loaded (from Profile or direct search), show top bar with switch option */}
          {order ? (
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0F4C3A]" />
                <span className="text-xs font-bold text-stone-900">
                  অর্ডার বিস্তারিত তথ্য
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setErrorMsg('');
                }}
                className="text-xs text-[#0F4C3A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>অন্য অর্ডার খুঁজুন</span>
              </button>
            </div>
          ) : (
            /* Tracking Form when searching */
            <form onSubmit={handleTrack} className="space-y-3.5 bg-stone-50/80 p-4 rounded-xl border border-stone-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-900 block">
                  অর্ডার রেফারেন্স নম্বর ও মোবাইল নম্বর দিয়ে খুঁজুন
                </span>
                <span className="text-[11px] text-stone-500 block">
                  গ্রাহকের তথ্যের গোপনীয়তা রক্ষায় অর্ডার নম্বর এবং অর্ডারে ব্যবহৃত মোবাইল নম্বর উভয়ই প্রদান করা আবশ্যক
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    অর্ডার রেফারেন্স নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: OSH-2026-701"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm uppercase font-mono bg-white focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono bg-white focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>{isLoading ? 'খোঁজা হচ্ছে...' : 'অর্ডার স্ট্যাটাস দেখুন'}</span>
              </button>
            </form>
          )}

          {/* Result Card */}
          {order && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-stone-500">অর্ডার নম্বর:</div>
                  <div className="text-base font-bold text-stone-900 font-mono">
                    {order.orderNumber}
                  </div>
                </div>
                <div>{getStatusBadge(order.fulfilmentStatus)}</div>
              </div>

              {/* Order Meta details */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>গ্রাহক:</span>
                  <span className="font-semibold text-stone-900">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি ঠিকানা:</span>
                  <span className="font-medium text-stone-800 text-right max-w-[240px]">
                    {order.fullAddress}, {order.upazila}, {order.district}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>পেমেন্ট মাধ্যম:</span>
                  <span className="font-semibold text-stone-900">
                    {order.paymentMethod === 'bkash'
                      ? 'bKash Send Money'
                      : order.paymentMethod === 'nagad'
                      ? 'Nagad Send Money'
                      : 'ক্যাশ অন ডেলিভারি (COD)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>পেমেন্ট স্ট্যাটাস:</span>
                  <span className="font-semibold text-stone-900">
                    {order.paymentStatus === 'paid' ? 'পরিশোধিত (Paid)' : 'পরিশোধ বকেয়া'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-stone-900">
                  <span>সর্বমোট বিল:</span>
                  <span className="text-[#0F4C3A] tabular-nums">
                    ৳{order.total.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {/* bKash / Nagad Payment Information Card */}
              {(isBkashOrder || isNagadOrder) && (
                <div
                  className={`p-4 rounded-xl border-2 space-y-3 ${
                    isBkashOrder
                      ? 'bg-pink-50/60 border-pink-200'
                      : 'bg-orange-50/60 border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isBkashOrder ? (
                        <div className="bg-white px-2 py-0.5 rounded-lg border border-pink-200 shadow-2xs">
                          <BKashLogo className="h-4.5 w-auto" />
                        </div>
                      ) : (
                        <div className="bg-white px-2 py-0.5 rounded-lg border border-orange-200 shadow-2xs">
                          <NagadLogo className="h-4.5 w-auto" />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-stone-700">
                        {storePaymentType} নম্বর:
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(storePaymentNumber, 'storeNum')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                        isBkashOrder ? 'bg-[#E2136E] hover:bg-[#c4105f]' : 'bg-[#F7921E] hover:bg-[#d67b14]'
                      }`}
                    >
                      {copiedKey === 'storeNum' ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-white" />
                          <span>নম্বর কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-stone-200 flex items-center justify-between text-xs">
                    <span className="text-stone-500">স্টোর নম্বর:</span>
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {storePaymentNumber}
                    </span>
                  </div>

                  {/* Customer TrxID display (Tamper-proof, read-only with copy) */}
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200 space-y-1.5">
                    {order.senderNumber && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500">প্রেরক নম্বর:</span>
                        <span className="font-mono font-bold text-stone-800">
                          {order.senderNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Transaction ID (TrxID):</span>
                      {order.transactionId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {order.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.transactionId || '', 'trxId')}
                            className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                            title="TrxID কপি করুন"
                          >
                            {copiedKey === 'trxId' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          প্রদান করা হয়নি
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Verification Status Notice */}
                  <div className="p-2.5 rounded-lg text-xs leading-relaxed border bg-white/80 border-stone-200">
                    {order.paymentStatus === 'paid' ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>পেমেন্ট সফলভাবে অনুমোদিত ও সম্পন্ন হয়েছে (Paid)</span>
                      </div>
                    ) : order.transactionId ? (
                      <div className="flex items-start gap-1.5 text-stone-700">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          আপনার TrxID অ্যাডমিন প্যানেলে যাচাই করা হচ্ছে। কোনো সহায়তার প্রয়োজন হলে আমাদের কাস্টমার সার্ভিসে যোগাযোগ করুন।
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          পেমেন্ট এখনও সম্পন্ন হয়নি। অনুগ্রহ করে স্টোর নম্বরে সেন্ড মানি করুন অথবা আমাদের হটলাইনে জানান।
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-3">
                  অর্ডারের টাইমলাইন
                </h3>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {order.statusTimeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#0F4C3A] border-2 border-white flex items-center justify-center" />
                      <div className="text-xs font-bold text-stone-900">
                        {item.note}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {new Date(item.timestamp).toLocaleDateString('bn-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
