import React, { useState, useEffect } from 'react';
import { X, User, Package, MapPin, LogOut, Plus, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { api } from '../lib/api.ts';
import type { Order } from '../types/index.ts';
import {
  BANGLADESH_DIVISIONS,
  getUpazilasForDistrict,
  CUSTOM_UPAZILA_OPTION_BN,
  CUSTOM_UPAZILA_OPTION_EN
} from '../data/bangladeshGeo.ts';
import { BANGLADESH_DISTRICTS } from '../data/districts.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (orderNumber: string, orderData?: Order) => void;
  onOpenAdmin?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onTrackOrder,
  onOpenAdmin
}) => {
  const { user, isAdmin, login, register, logout, refreshUser } = useAuth();
  const { language } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup' | 'profile'>('signin');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile tabs & orders
  const [profileTab, setProfileTab] = useState<'orders' | 'addresses' | 'info'>('orders');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile editing state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrTitle, setAddrTitle] = useState('বাসা');
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrDivision, setAddrDivision] = useState('dhaka');
  const [addrDistrict, setAddrDistrict] = useState('ঢাকা');
  const [addrUpazila, setAddrUpazila] = useState('ধানমন্ডি');
  const [addrFull, setAddrFull] = useState('');

  const [customUpazilaText, setCustomUpazilaText] = useState('');
  const [isCustomUpazila, setIsCustomUpazila] = useState(false);

  const currentDivData = BANGLADESH_DIVISIONS.find((d) => d.id === addrDivision) || BANGLADESH_DIVISIONS[0];
  const availableDistricts = currentDivData ? currentDivData.districts : [];
  const availableUpazilas = React.useMemo(() => {
    return getUpazilasForDistrict(addrDistrict);
  }, [addrDistrict]);

  const handleDivChange = (divId: string) => {
    setAddrDivision(divId);
    setIsCustomUpazila(false);
    setCustomUpazilaText('');
    const divData = BANGLADESH_DIVISIONS.find((d) => d.id === divId);
    if (divData && divData.districts.length > 0) {
      const firstDist = divData.districts[0];
      setAddrDistrict(firstDist.nameBn);
      const upzList = getUpazilasForDistrict(firstDist.nameBn);
      if (upzList.length > 0) {
        setAddrUpazila(upzList[0]);
      } else {
        setAddrUpazila(CUSTOM_UPAZILA_OPTION_BN);
        setIsCustomUpazila(true);
      }
    }
  };

  const handleDistChange = (distName: string) => {
    setAddrDistrict(distName);
    setIsCustomUpazila(false);
    setCustomUpazilaText('');
    const upzList = getUpazilasForDistrict(distName);
    if (upzList.length > 0) {
      setAddrUpazila(upzList[0]);
    } else {
      setAddrUpazila(CUSTOM_UPAZILA_OPTION_BN);
      setIsCustomUpazila(true);
    }
  };

  const handleUpazilaChange = (val: string) => {
    setAddrUpazila(val);
    if (val === CUSTOM_UPAZILA_OPTION_BN || val === CUSTOM_UPAZILA_OPTION_EN) {
      setIsCustomUpazila(true);
    } else {
      setIsCustomUpazila(false);
    }
  };

  useEffect(() => {
    if (user) {
      setMode('profile');
      setEditName(user.name);
      setEditPhone(user.phone || '');
      loadMyOrders();
    } else {
      setMode('signin');
    }
  }, [user]);

  const loadMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getMyOrders();
      setMyOrders(res.orders);
    } catch {
      // ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      setMode('profile');
    } catch (err: any) {
      setErrorMsg(err.message || 'লগইন ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await register(name.trim(), phone.trim(), email.trim(), password);
      setMode('profile');
    } catch (err: any) {
      setErrorMsg(err.message || 'নিবন্ধন ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const finalUpazila = (isCustomUpazila || addrUpazila === CUSTOM_UPAZILA_OPTION_BN)
        ? customUpazilaText.trim()
        : addrUpazila.trim();

      if (!finalUpazila) {
        setErrorMsg('উপজেলা বা থানার নাম নির্বাচন বা লিখুন');
        return;
      }

      await api.addAddress({
        title: addrTitle,
        name: addrName || user?.name || 'গ্রাহক',
        phone: addrPhone || user?.phone || '',
        division: addrDivision,
        district: addrDistrict,
        upazila: finalUpazila,
        fullAddress: addrFull,
        isDefault: true
      });
      await refreshUser();
      setShowAddAddress(false);
      setAddrFull('');
      setCustomUpazilaText('');
      setIsCustomUpazila(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'ঠিকানা যোগ করতে সমস্যা হয়েছে');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName.trim().length < 2) {
      setErrorMsg('সঠিক নাম লিখুন (কমপক্ষে ২ অক্ষর)');
      return;
    }
    setIsSavingProfile(true);
    setErrorMsg('');
    setProfileSuccessMsg('');
    try {
      await api.updateProfile({ name: editName.trim(), phone: editPhone.trim() || undefined });
      await refreshUser();
      setProfileSuccessMsg('প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!');
      setTimeout(() => setProfileSuccessMsg(''), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 relative my-8 text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <BrandLogo variant="dark" size="sm" showTagline={false} />
            <div className="border-l border-stone-200 pl-3">
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                {user ? 'আমার অ্যাকাউন্ট ড্যাশবোর্ড' : mode === 'signin' ? 'সাইন ইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {user ? `${user.phone} · ${user.email}` : 'অর্ডারের তথ্য ও ডেলিভারি ট্র্যাকিং'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* NOT LOGGED IN: SIGN IN OR SIGN UP */}
          {!user ? (
            <div>
              {/* Tabs */}
              <div className="flex border-b border-stone-200 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                  }}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors cursor-pointer text-center ${
                    mode === 'signin'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  সাইন ইন (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors cursor-pointer text-center ${
                    mode === 'signup'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  নতুন একাউন্ট (Sign Up)
                </button>
              </div>

              {mode === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ইমেইল অথবা মোবাইল নম্বর
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="আপনার ইমেইল অথবা মোবাইল নম্বর (যেমন: 017xxxxxxxx)"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      পাসওয়ার্ড
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      পূর্ণ নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="আপনার নাম"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      placeholder="017xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ইমেইল এড্রেস <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      পাসওয়ার্ড (অন্তত ৬ অক্ষর) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0F4C3A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* LOGGED IN CUSTOMER DASHBOARD */
            <div className="space-y-5">
              {/* Top Profile Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 text-[#0F4C3A] rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900">{user.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'order_manager' ? 'Order Staff' : 'Customer'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{user.phone} · {user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isAdmin && onOpenAdmin && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdmin();
                      }}
                      className="px-3 py-1.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>অ্যাডমিন প্যানেল</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setMode('signin');
                    }}
                    className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="লগআউট"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>লগআউট</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Orders, Saved Addresses, Profile Info */}
              <div className="flex border-b border-stone-200 gap-4 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setProfileTab('orders')}
                  className={`pb-2 transition-colors cursor-pointer whitespace-nowrap ${
                    profileTab === 'orders'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  আমার অর্ডারসমূহ ({myOrders.length})
                </button>
                <button
                  onClick={() => setProfileTab('addresses')}
                  className={`pb-2 transition-colors cursor-pointer whitespace-nowrap ${
                    profileTab === 'addresses'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  সংরক্ষিত ঠিকানা
                </button>
                <button
                  onClick={() => setProfileTab('info')}
                  className={`pb-2 transition-colors cursor-pointer whitespace-nowrap ${
                    profileTab === 'info'
                      ? 'border-b-2 border-[#0F4C3A] text-[#0F4C3A]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  প্রোফাইল তথ্য ও সেটিংস
                </button>
              </div>

              {/* TAB 1: Orders */}
              {profileTab === 'orders' && (
                <div className="space-y-3">
                  {loadingOrders ? (
                    <div className="text-center py-8 text-xs text-stone-400">অর্ডার লোড হচ্ছে...</div>
                  ) : myOrders.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 space-y-2">
                      <Package className="w-8 h-8 mx-auto text-stone-300" />
                      <p className="text-xs">আপনার এখনও কোনো অর্ডার নেই</p>
                    </div>
                  ) : (
                    myOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2 hover:border-stone-300 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-900 font-mono">
                            {ord.orderNumber}
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {ord.fulfilmentStatus}
                          </span>
                        </div>

                        <div className="text-xs text-stone-600">
                          {ord.items.map((i) => i.productTitleBn).join(', ')}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                          <span className="font-bold text-stone-900 tabular-nums">
                            মোট: ৳{ord.total.toLocaleString('bn-BD')}
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              onTrackOrder(ord.orderNumber, ord);
                            }}
                            className="text-[#0F4C3A] hover:underline font-semibold text-xs cursor-pointer"
                          >
                            ট্র্যাক করুন →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Addresses */}
              {profileTab === 'addresses' && (
                <div className="space-y-3">
                  {user.savedAddresses && user.savedAddresses.length > 0 ? (
                    user.savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-stone-900">
                          <span>{addr.title}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              ডিফল্ট
                            </span>
                          )}
                        </div>
                        <p className="text-stone-700">{addr.fullAddress}</p>
                        <p className="text-stone-500">{addr.upazila}, {addr.district}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400">কোনো সংরক্ষিত ঠিকানা নেই</p>
                  )}

                  {!showAddAddress ? (
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="w-full py-2 border border-dashed border-stone-300 hover:border-[#0F4C3A] text-[#0F4C3A] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন ঠিকানা যোগ করুন</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAddAddress} className="p-3.5 border border-stone-200 rounded-xl bg-stone-50/70 space-y-3">
                      <div className="text-xs font-bold text-stone-900">নতুন ডেলিভারি ঠিকানা</div>
                      <input
                        type="text"
                        placeholder="ঠিকানার নাম (যেমন: বাসা, অফিস)"
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs bg-white focus:outline-none"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">বিভাগ *</label>
                          <select
                            value={addrDivision}
                            onChange={(e) => handleDivChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs bg-white focus:outline-none cursor-pointer"
                          >
                            {BANGLADESH_DIVISIONS.map((div) => (
                              <option key={div.id} value={div.id}>
                                {language === 'en' ? div.nameEn : div.nameBn}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">জেলা *</label>
                          <select
                            value={addrDistrict}
                            onChange={(e) => handleDistChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs bg-white focus:outline-none cursor-pointer"
                          >
                            {availableDistricts.map((dist) => (
                              <option key={dist.nameBn} value={dist.nameBn}>
                                {language === 'en' ? dist.nameEn : dist.nameBn}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">উপজেলা / থানা *</label>
                          <select
                            value={addrUpazila}
                            onChange={(e) => handleUpazilaChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs bg-white focus:outline-none cursor-pointer"
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
                      {isCustomUpazila && (
                        <input
                          type="text"
                          required
                          placeholder="আপনার থানা বা উপজেলার নাম লিখুন..."
                          value={customUpazilaText}
                          onChange={(e) => setCustomUpazilaText(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-emerald-300 rounded text-xs bg-emerald-50/20 focus:outline-none"
                        />
                      )}
                      <textarea
                        required
                        rows={2}
                        placeholder="বিস্তারিত ঠিকানা..."
                        value={addrFull}
                        onChange={(e) => setAddrFull(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs bg-white focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded cursor-pointer"
                        >
                          বাতিল
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-semibold bg-[#0F4C3A] text-white rounded cursor-pointer"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: Profile Info & Settings */}
              {profileTab === 'info' && (
                <div className="space-y-4">
                  {profileSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4 bg-white p-4 border border-stone-200 rounded-xl">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-stone-700">পূর্ণ নাম</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0F4C3A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-stone-700">মোবাইল নম্বর</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0F4C3A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-stone-700">ইমেইল ঠিকানা</label>
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full px-3 py-2 border border-stone-200 bg-stone-100 rounded-lg text-xs text-stone-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-stone-700">অ্যাকাউন্ট ধরন: </span>
                        <span className="font-bold text-[#0F4C3A]">
                          {user.role === 'super_admin' ? 'সুপার অ্যাডমিন (Super Admin)' : user.role === 'order_manager' ? 'অর্ডার ম্যানেজার' : 'সাধারণ গ্রাহক (Customer)'}
                        </span>
                      </div>
                      {isAdmin && onOpenAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAdmin();
                          }}
                          className="px-2.5 py-1 bg-[#0F4C3A] text-white rounded text-[11px] font-semibold hover:bg-[#135D48] transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          অ্যাডমিন প্যানেলে যান →
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-4 py-2 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? 'সংরক্ষণ করা হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
