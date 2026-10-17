import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag, Truck, Check, AlertCircle } from 'lucide-react';
import type { Product, Order, OrderItemSnapshot } from '../../types/index.ts';
import { BANGLADESH_DISTRICTS } from '../../data/districts.ts';
import { api } from '../../lib/api.ts';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOrderCreated: (order: Order) => void;
}

interface SelectedItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  onOrderCreated
}) => {
  if (!isOpen) return null;

  // Order Details Form State
  const [orderSource, setOrderSource] = useState<'facebook' | 'phone' | 'whatsapp' | 'in_store'>('facebook');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [district, setDistrict] = useState('ঢাকা (Dhaka)');
  const [upazila, setUpazila] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [initialStatus, setInitialStatus] = useState<'pending_confirmation' | 'confirmed' | 'processing'>('confirmed');

  // Products Selected
  const [items, setItems] = useState<SelectedItem[]>(() => {
    if (products.length > 0) {
      return [{ productId: products[0].id, quantity: 1, unitPrice: products[0].price }];
    }
    return [];
  });

  // Shipping & Discount
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [discount, setDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle District Change to auto-adjust delivery fee
  const handleDistrictChange = (distName: string) => {
    setDistrict(distName);
    const isDhaka = distName.includes('ঢাকা') || distName.toLowerCase().includes('dhaka');
    setDeliveryFee(isDhaka ? 60 : 120);
  };

  // Add Item Row
  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems((prev) => [
      ...prev,
      { productId: products[0].id, quantity: 1, unitPrice: products[0].price }
    ]);
  };

  // Update Item
  const handleUpdateItem = (index: number, updates: Partial<SelectedItem>) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      // If productId changed, update unitPrice to that product's current price
      if (updates.productId) {
        const prod = products.find((p) => p.id === updates.productId);
        if (prod) {
          updated[index].unitPrice = prod.price;
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

    if (items.length === 0) {
      setErrorMessage('কমপক্ষে একটি পণ্য নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build order items snapshot
      const orderItems: OrderItemSnapshot[] = items.map((it) => {
        const prod = products.find((p) => p.id === it.productId);
        return {
          productId: it.productId,
          productTitleBn: prod?.titleBn || 'ম্যানুয়াল পণ্য',
          productTitleEn: prod?.titleEn || 'Manual Product',
          sku: prod?.sku || `MANUAL-${it.productId}`,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          itemTotal: it.unitPrice * it.quantity,
          imageUrl: prod?.images[0] || '/src/assets/images/category_kitchen_cookware_1792084991823.jpg'
        };
      });

      const matchedDist = BANGLADESH_DISTRICTS.find(
        (d) => district.includes(d.nameBn) || district.toLowerCase().includes(d.nameEn.toLowerCase())
      );
      const division = matchedDist ? matchedDist.division.toLowerCase() : 'dhaka';

      const prefix = orderSource === 'facebook' ? 'FB' : orderSource === 'phone' ? 'PH' : orderSource === 'whatsapp' ? 'WA' : 'DIR';
      const orderNumber = `SD-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      const orderPayload: Partial<Order> = {
        orderNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        division,
        district,
        upazila: upazila.trim() || district,
        fullAddress: fullAddress.trim(),
        deliveryInstructions: `[অর্ডার মাধ্যম: ${orderSource.toUpperCase()}] ${deliveryInstructions.trim()}`,
        items: orderItems,
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
        fulfilmentStatus: initialStatus,
        statusTimeline: [
          {
            status: initialStatus,
            timestamp: new Date().toISOString(),
            note: `অর্ডারটি ম্যানুয়ালি যুক্ত করা হয়েছে (${orderSource.toUpperCase()} চ্যানেল থেকে)`,
            changedBy: 'Admin'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res = await api.createOrder(orderPayload);
      onOrderCreated(res.order || (orderPayload as Order));
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
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Hind_Siliguri',sans-serif]">
              ম্যানুয়াল / ফেসবুক অর্ডার এন্ট্রি
            </h3>
            <p className="text-xs text-stone-500 font-['Hind_Siliguri',sans-serif]">
              ফেসবুক পেজ, হোয়াটসঅ্যাপ কিংবা ফোন কলের অর্ডার সরাসরি যুক্ত করুন
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Order Source & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/70">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                অর্ডার মাধ্যম (Sales Channel) *
              </label>
              <select
                value={orderSource}
                onChange={(e: any) => setOrderSource(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
              >
                <option value="facebook">📘 Facebook Page (ফেসবুক পেজ)</option>
                <option value="whatsapp">💬 WhatsApp (হোয়াটসঅ্যাপ চ্যাট)</option>
                <option value="phone">📞 Phone Call (সরাসরি ফোন কল)</option>
                <option value="in_store">🏬 In-Store / Direct (সরাসরি বিক্রয়)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                প্রাথমিক স্ট্যাটাস (Initial Status) *
              </label>
              <select
                value={initialStatus}
                onChange={(e: any) => setInitialStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
              >
                <option value="confirmed">✅ Confirmed (নিশ্চিত অর্ডার)</option>
                <option value="processing">⚙️ Processing (প্রক্রিয়াধীন)</option>
                <option value="pending_confirmation">⏳ Pending (যাচাই বাকি)</option>
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
                  মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="০১XXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  জেলা (District) *
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.id} value={`${d.nameBn} (${d.nameEn})`}>
                      {d.nameBn} ({d.nameEn}) {d.isDhakaCity ? '• ঢাকা মেট্রো' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  থানা / উপজেলা (Upazila/Area)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মিরপুর, ধানমন্ডি"
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  ইমেইল (ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                সম্পূর্ণ ঠিকানা (বাসা, রোড, এলাকা) *
              </label>
              <textarea
                required
                rows={2}
                placeholder="বাসা নং, রোড নং, এলাকা এবং কোনো ল্যান্ডমার্ক..."
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
                <span>পণ্য যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap sm:flex-nowrap items-center gap-2"
                >
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={it.productId}
                      onChange={(e) => handleUpdateItem(idx, { productId: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titleBn} (৳{p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
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
                    <input
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-right font-bold tabular-nums"
                      title="একক মূল্য"
                    />
                  </div>

                  <div className="w-24 text-right font-bold text-stone-900 tabular-nums">
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
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  ডিসকাউন্ট / ছাড় (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs font-semibold">
              <span className="text-stone-600">পণ্যের উপমোট: ৳{subtotal} | ডেলিভারি: ৳{deliveryFee} | ছাড়: ৳{discount}</span>
              <div className="text-right">
                <span className="text-[11px] text-stone-500 mr-2">সর্বমোট প্রদেয়:</span>
                <span className="text-base font-extrabold text-[#0F4C3A] tabular-nums">৳{total}</span>
              </div>
            </div>
          </div>

          {/* 5. Special Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              ডেলিভারি বা বিশেষ নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: বিকেলে ডেলিভারি দিতে হবে, পার্সেল চেক করে নিবেন..."
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              বাতিল
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0F4C3A] hover:bg-[#145C47] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'অর্ডার সংরক্ষিত হচ্ছে...' : 'অর্ডার সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
