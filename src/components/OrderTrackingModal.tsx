import React, { useState } from 'react';
import { X, Search, CheckCircle, Clock, Truck, Package, AlertCircle, MapPin } from 'lucide-react';
import { api } from '../lib/api.ts';
import type { Order } from '../types/index.ts';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = ''
}) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMsg('অর্ডার নম্বর এবং মোবাইল নম্বর উভয়ই লিখুন');
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
      setErrorMsg(err.message || 'অর্ডারটি খুঁজে পাওয়া যায়নি');
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 relative my-8 text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 className="text-lg font-bold text-stone-900">অর্ডার ট্র্যাকিং</h2>
            <p className="text-xs text-stone-500 mt-0.5">আপনার অর্ডারের বর্তমান অবস্থা জানুন</p>
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
          {/* Tracking Form */}
          <form onSubmit={handleTrack} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অর্ডার রেফারেন্স নম্বর
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: OSH-2026-701"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm uppercase focus:outline-none focus:border-[#0F4C3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অর্ডারে ব্যবহৃত মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
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
              className="w-full py-2.5 px-4 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'খোঁজা হচ্ছে...' : 'স্ট্যাটাস দেখুন'}</span>
            </button>
          </form>

          {/* Result Card */}
          {order && (
            <div className="pt-4 border-t border-stone-200 space-y-5">
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
                  <span>পেমেন্ট স্ট্যাটাস:</span>
                  <span className="font-semibold text-stone-900">
                    {order.paymentStatus === 'paid' ? 'পরিশোধিত (Paid)' : 'পরিশোধ বকেয়া (COD)'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-stone-900">
                  <span>সর্বমোট বিল:</span>
                  <span className="text-[#0F4C3A] tabular-nums">
                    ৳{order.total.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

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
