import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  Lock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  BANGLADESH_DIVISIONS,
  getUpazilasForDistrict,
  CUSTOM_UPAZILA_OPTION_BN,
  CUSTOM_UPAZILA_OPTION_EN
} from '../data/bangladeshGeo.ts';
import { api } from '../lib/api.ts';
import type { Order, Address } from '../types/index.ts';

interface ProfilePageProps {
  onBackToShopping: () => void;
  onTrackOrder?: (orderNumber: string, orderData?: Order, phone?: string) => void;
  onOpenAdmin?: () => void;
}

type TabType = 'info' | 'orders' | 'addresses' | 'security';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToShopping,
  onTrackOrder,
  onOpenAdmin
}) => {
  const { user, isAdmin, login, register, logout, refreshUser } = useAuth();
  const { language, formatPrice } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>('info');

  // Auth form states (for logged out state)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>(user?.savedAddresses || []);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState('বাসা (Home)');
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrDivision, setNewAddrDivision] = useState('dhaka');
  const [newAddrDistrict, setNewAddrDistrict] = useState('ঢাকা');
  const [newAddrUpazila, setNewAddrUpazila] = useState('ধানমন্ডি');
  const [newAddrFull, setNewAddrFull] = useState('');
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSuccessMsg, setAddressSuccessMsg] = useState('');
  const [addressErrorMsg, setAddressErrorMsg] = useState('');

  const [customUpazilaText, setCustomUpazilaText] = useState('');
  const [isCustomUpazila, setIsCustomUpazila] = useState(false);

  // Cascading geo calculations for address form
  const currentDivData = BANGLADESH_DIVISIONS.find((d) => d.id === newAddrDivision) || BANGLADESH_DIVISIONS[0];
  const availableDistricts = currentDivData ? currentDivData.districts : [];
  const availableUpazilas = React.useMemo(() => {
    return getUpazilasForDistrict(newAddrDistrict);
  }, [newAddrDistrict]);

  const handleDivisionChange = (divId: string) => {
    setNewAddrDivision(divId);
    setIsCustomUpazila(false);
    setCustomUpazilaText('');
    const divData = BANGLADESH_DIVISIONS.find((d) => d.id === divId);
    if (divData && divData.districts.length > 0) {
      const firstDist = divData.districts[0];
      setNewAddrDistrict(firstDist.nameBn);
      const upzList = getUpazilasForDistrict(firstDist.nameBn);
      if (upzList.length > 0) {
        setNewAddrUpazila(upzList[0]);
      } else {
        setNewAddrUpazila(CUSTOM_UPAZILA_OPTION_BN);
        setIsCustomUpazila(true);
      }
    }
  };

  const handleDistrictChange = (distName: string) => {
    setNewAddrDistrict(distName);
    setIsCustomUpazila(false);
    setCustomUpazilaText('');
    const upzList = getUpazilasForDistrict(distName);
    if (upzList.length > 0) {
      setNewAddrUpazila(upzList[0]);
    } else {
      setNewAddrUpazila(CUSTOM_UPAZILA_OPTION_BN);
      setIsCustomUpazila(true);
    }
  };

  const handleUpazilaChange = (val: string) => {
    setNewAddrUpazila(val);
    if (val === CUSTOM_UPAZILA_OPTION_BN || val === CUSTOM_UPAZILA_OPTION_EN) {
      setIsCustomUpazila(true);
    } else {
      setIsCustomUpazila(false);
    }
  };

  // Security / Password State
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Sync user details to form
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      if (user.savedAddresses && user.savedAddresses.length > 0) {
        setAddresses(user.savedAddresses);
      }
    }
  }, [user]);

  // Load addresses from authoritative server endpoint
  const loadAddresses = async () => {
    if (!user) return;
    setIsLoadingAddresses(true);
    try {
      const res = await api.getAddresses();
      if (res && res.addresses) {
        setAddresses(res.addresses);
      }
    } catch (err) {
      console.warn('Failed to load addresses from server:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user, activeTab]);

  // Load orders when orders tab active
  useEffect(() => {
    if (user && activeTab === 'orders') {
      setIsLoadingOrders(true);
      api
        .getMyOrders()
        .then((res) => {
          setOrders(res.orders || []);
        })
        .catch((err) => {
          console.error('Failed to load orders:', err);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  }, [user, activeTab]);

  // Handle Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        await login(authIdentifier.trim(), authPassword);
      } else {
        await register(
          authName.trim(),
          authPhone.trim(),
          authEmail.trim(),
          authPassword
        );
      }
    } catch (err: any) {
      setAuthError(err.message || (language === 'en' ? 'Authentication failed' : 'লগইন বা নিবন্ধন সফল হয়নি'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!editName.trim() || editName.trim().length < 2) {
      setProfileErrorMsg(language === 'en' ? 'Name must be at least 2 characters' : 'নাম অন্তত ২ অক্ষরের হতে হবে');
      return;
    }

    setIsSavingProfile(true);
    try {
      await api.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim()
      });
      await refreshUser();
      setProfileSuccessMsg(language === 'en' ? 'Profile updated successfully!' : 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || (language === 'en' ? 'Failed to update profile' : 'প্রোফাইল আপডেট ব্যর্থ হয়েছে'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressErrorMsg('');
    setAddressSuccessMsg('');

    const finalUpazila = (isCustomUpazila || newAddrUpazila === CUSTOM_UPAZILA_OPTION_BN)
      ? customUpazilaText.trim()
      : newAddrUpazila.trim();

    if (!finalUpazila) {
      setAddressErrorMsg(language === 'en' ? 'Please enter Thana / Upazila' : 'থানা বা উপজেলার নাম নির্বাচন বা লিখুন');
      return;
    }

    setAddressLoading(true);
    try {
      const res = await api.addAddress({
        title: newAddrTitle,
        name: newAddrName.trim(),
        phone: newAddrPhone.trim(),
        division: newAddrDivision,
        district: newAddrDistrict,
        upazila: finalUpazila,
        fullAddress: newAddrFull.trim(),
        isDefault: newAddrIsDefault
      });
      if (res && res.addresses) {
        setAddresses(res.addresses);
      }
      await loadAddresses();
      await refreshUser();
      setAddressSuccessMsg(language === 'en' ? 'Address added successfully!' : 'নতুন ঠিকানা সফলভাবে সংরক্ষিত হয়েছে!');
      setIsAddingAddress(false);
      setNewAddrName('');
      setNewAddrPhone('');
      setNewAddrFull('');
      setTimeout(() => setAddressSuccessMsg(''), 4000);
    } catch (err: any) {
      setAddressErrorMsg(err.message || (language === 'en' ? 'Failed to add address' : 'ঠিকানা সংরক্ষণ ব্যর্থ হয়েছে'));
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this address?' : 'আপনি কি নিশ্চিত যে এই ঠিকানাটি মুছে ফেলতে চান?')) {
      return;
    }

    try {
      const res = await api.deleteAddress(id);
      if (res && res.addresses) {
        setAddresses(res.addresses);
      }
      await loadAddresses();
      await refreshUser();
      setAddressSuccessMsg(language === 'en' ? 'Address deleted' : 'ঠিকানা মুছে ফেলা হয়েছে');
      setTimeout(() => setAddressSuccessMsg(''), 3000);
    } catch (err: any) {
      setAddressErrorMsg(err.message || (language === 'en' ? 'Failed to delete address' : 'ঠিকানা মুছতে ব্যর্থ হয়েছে'));
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (newPassword.length < 6) {
      setPasswordErrorMsg(language === 'en' ? 'New password must be at least 6 characters' : 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg(language === 'en' ? 'Passwords do not match' : 'পাসওয়ার্ড দুটি মিলছে না');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({
        currentPassword: currPassword,
        newPassword
      });
      setPasswordSuccessMsg(language === 'en' ? 'Password updated successfully!' : 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || (language === 'en' ? 'Failed to change password' : 'পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে'));
    } finally {
      setPasswordLoading(false);
    }
  };

  // Format Date Helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // ==========================================
  // VIEW: IF LOGGED OUT -> AUTHENTICATION VIEW
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-[85vh] bg-stone-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Back button */}
          <button
            onClick={onBackToShopping}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Back to shopping' : 'কেনাকাটায় ফিরে যান'}</span>
          </button>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-[#0F4C3A] rounded-xl flex items-center justify-center mx-auto shadow-2xs">
                <UserIcon className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                {authMode === 'signin'
                  ? (language === 'en' ? 'Sign In to Your Account' : 'আপনার অ্যাকাউন্টে লগইন করুন')
                  : (language === 'en' ? 'Create a New Account' : 'নতুন অ্যাকাউন্ট তৈরি করুন')}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                {language === 'en'
                  ? 'Access your orders, saved addresses, and profile details'
                  : 'আপনার অর্ডার ট্র্যাকিং, ডেলিভারি ঠিকানা ও প্রোফাইল ব্যবস্থাপনা করুন'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {language === 'en' ? 'Sign In' : 'লগইন'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {language === 'en' ? 'Register' : 'নতুন একাউন্ট'}
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signin' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Email / Phone / Username' : 'ইমেইল / মোবাইল নম্বর / ইউজারনেম'}
                    </label>
                    <input
                      type="text"
                      required
                      value={authIdentifier}
                      onChange={(e) => setAuthIdentifier(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. 01700000000 or admin' : 'যেমন: 017xxxxxxxx বা admin'}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Full Name' : 'আপনার পুরো নাম'}
                    </label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. মো: তানভীর হাসান"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Mobile Number' : 'মোবাইল নম্বর'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Email Address' : 'ইমেইল অ্যাড্রেস'}
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Password' : 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#0F4C3A] hover:bg-[#135D48] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading
                  ? (language === 'en' ? 'Processing...' : 'অপেক্ষা করুন...')
                  : authMode === 'signin'
                  ? (language === 'en' ? 'Sign In to Account' : 'লগইন করুন')
                  : (language === 'en' ? 'Create Account' : 'অ্যাকাউন্ট খুলুন')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LOGGED IN USER PROFILE PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 md:px-8 lg:px-10">
      <div className="w-full space-y-6">
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBackToShopping}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:border-stone-300 shadow-2xs hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back to Shopping' : 'কেনাকাটায় ফিরে যান'}</span>
          </button>

          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-2xs transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'en' ? 'Admin Panel' : 'অ্যাডমিন প্যানেল'}</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </button>
          )}
        </div>

        {/* Profile Hero Banner */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-[#0F4C3A] to-emerald-700 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
              {user.name ? user.name.slice(0, 1).toUpperCase() : <UserIcon className="w-8 h-8" />}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  {user.name || (language === 'en' ? 'User' : 'সম্মানিত গ্রাহক')}
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    {user.role === 'super_admin'
                      ? (language === 'en' ? 'Super Admin' : 'সুপার অ্যাডমিন')
                      : (language === 'en' ? 'Store Admin' : 'স্টোর অ্যাডমিন')}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    {language === 'en' ? 'Verified Customer' : 'সম্মানিত গ্রাহক'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                {user.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{user.email}</span>
                  </span>
                )}
                {user.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{user.phone}</span>
                  </span>
                )}
                {user.createdAt && (
                  <span className="inline-flex items-center gap-1.5 text-stone-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Member since' : 'সদস্য হয়েছেন'}: {formatDate(user.createdAt)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm(language === 'en' ? 'Are you sure you want to log out?' : 'আপনি কি নিশ্চিতভাবে লগআউট করতে চান?')) {
                logout();
              }
            }}
            className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Log Out' : 'লগআউট'}</span>
          </button>
        </div>

        {/* Layout: Sidebar Navigation & Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Side Navigation (Desktop Sidebar / Mobile Tab bar) */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-2 sm:p-3 overflow-x-auto">
            <nav className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer w-full text-left ${
                  activeTab === 'info'
                    ? 'bg-[#0F4C3A] text-white shadow-2xs font-bold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <UserIcon className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Personal Info' : 'ব্যক্তিগত তথ্য'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer w-full text-left ${
                  activeTab === 'orders'
                    ? 'bg-[#0F4C3A] text-white shadow-2xs font-bold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'My Orders' : 'আমার অর্ডারসমূহ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer w-full text-left ${
                  activeTab === 'addresses'
                    ? 'bg-[#0F4C3A] text-white shadow-2xs font-bold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Saved Addresses' : 'সংরক্ষিত ঠিকানা'}</span>
                {user.savedAddresses && user.savedAddresses.length > 0 && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    {user.savedAddresses.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer w-full text-left ${
                  activeTab === 'security'
                    ? 'bg-[#0F4C3A] text-white shadow-2xs font-bold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Security & Password' : 'নিরাপত্তা ও পাসওয়ার্ড'}</span>
              </button>
            </nav>
          </div>

          {/* Active Tab Main Content */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-7">
            {/* ========================================= */}
            {/* TAB 1: PERSONAL INFORMATION & EDIT PROFILE */}
            {/* ========================================= */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    {language === 'en' ? 'Personal Information' : 'ব্যক্তিগত তথ্য ও প্রোফাইল আপডেট'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'en'
                      ? 'Update your full name and primary phone number'
                      : 'আপনার পূর্ণ নাম ও যোগাযোগের মোবাইল নম্বর হালনাগাদ করুন'}
                  </p>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Primary Mobile Number' : 'মোবাইল নম্বর'}
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Email Address' : 'ইমেইল অ্যাড্রেস'}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      {language === 'en' ? 'Registered account identifier' : 'অ্যাকাউন্টের মূল শনাক্তকারী ইমেইল'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-5 py-2.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile
                        ? (language === 'en' ? 'Saving changes...' : 'সংরক্ষণ হচ্ছে...')
                        : (language === 'en' ? 'Save Profile Changes' : 'পরিবর্তন সংরক্ষণ করুন')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 2: ORDER HISTORY & TRACKING */}
            {/* ========================================= */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    {language === 'en' ? 'My Order History' : 'আমার অর্ডারসমূহ'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'en'
                      ? 'Review status and track current shipments'
                      : 'পূর্ববর্তী সকল অর্ডার এবং চলমান ডেলিভারি ট্র্যাক করুন'}
                  </p>
                </div>

                {isLoadingOrders ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
                        <div className="h-4 bg-stone-200 rounded w-1/4" />
                        <div className="h-3 bg-stone-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200 p-6 space-y-3">
                    <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                    <h3 className="text-sm font-bold text-stone-800">
                      {language === 'en' ? 'No orders placed yet' : 'এখনো কোনো অর্ডার করা হয়নি'}
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      {language === 'en'
                        ? 'Browse our products and discover unbeatable savings on quality items.'
                        : 'সাশ্রয়ী মূল্যের চমৎকার পণ্যসমূহ ঘুরে দেখুন এবং এখনই পছন্দের পণ্য অর্ডার করুন।'}
                    </p>
                    <button
                      onClick={onBackToShopping}
                      className="px-4 py-2 bg-[#0F4C3A] text-white rounded-xl text-xs font-semibold hover:bg-[#135D48] transition-colors"
                    >
                      {language === 'en' ? 'Start Shopping' : 'কেনাকাটা শুরু করুন'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 sm:p-5 rounded-2xl bg-stone-50/50 border border-stone-200 hover:border-emerald-300 transition-colors space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-stone-800">
                              #{ord.orderNumber}
                            </span>
                            <span className="text-[11px] text-stone-400 ml-2">
                              {formatDate(ord.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                ord.fulfilmentStatus === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.fulfilmentStatus === 'shipped'
                                  ? 'bg-sky-100 text-sky-800'
                                  : ord.fulfilmentStatus === 'processing'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ord.fulfilmentStatus === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-stone-200 text-stone-800'
                              }`}
                            >
                              {ord.fulfilmentStatus ? ord.fulfilmentStatus.replace('_', ' ').toUpperCase() : 'PENDING'}
                            </span>

                            {onTrackOrder && (
                              <button
                                onClick={() => onTrackOrder(ord.orderNumber, ord, ord.customerPhone)}
                                className="text-xs font-bold text-[#0F4C3A] hover:underline cursor-pointer"
                              >
                                {language === 'en' ? 'Track' : 'ট্র্যাক'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs gap-3">
                              <span className="text-stone-700 truncate font-medium">
                                {item.productTitleBn || item.productTitleEn || 'পণ্য'} × {item.quantity}
                              </span>
                              <span className="font-bold text-stone-900 shrink-0 tabular-nums">
                                {formatPrice(item.itemTotal || (item.unitPrice * item.quantity))}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs">
                          <span className="text-stone-500">
                            {language === 'en' ? 'Total Amount' : 'সর্বমোট মূল্য'}
                          </span>
                          <span className="text-sm font-extrabold text-stone-900 tabular-nums">
                            {formatPrice(ord.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 3: SAVED DELIVERY ADDRESSES */}
            {/* ========================================= */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-900">
                      {language === 'en' ? 'Saved Delivery Addresses' : 'সংরক্ষিত ডেলিভারি ঠিকানা'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {language === 'en'
                        ? 'Manage your home and office delivery addresses'
                        : 'সহজে অর্ডার করতে আপনার বাসার ও অফিসের ঠিকানা সংরক্ষণ করুন'}
                    </p>
                  </div>

                  {!isAddingAddress && (
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F4C3A] text-white rounded-xl text-xs font-bold hover:bg-[#135D48] shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Add New' : 'নতুন ঠিকানা'}</span>
                    </button>
                  )}
                </div>

                {addressSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{addressSuccessMsg}</span>
                  </div>
                )}

                {addressErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addressErrorMsg}</span>
                  </div>
                )}

                {/* Add Address Form */}
                {isAddingAddress && (
                  <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      {language === 'en' ? 'New Address Details' : 'নতুন ঠিকানার বিবরণ'}
                    </h3>

                    <form onSubmit={handleAddAddress} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            {language === 'en' ? 'Recipient Name' : 'প্রাপকের নাম'}
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddrName}
                            onChange={(e) => setNewAddrName(e.target.value)}
                            placeholder="মো: তানভীর"
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#0F4C3A]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            {language === 'en' ? 'Contact Phone' : 'যোগাযোগের ফোন'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={newAddrPhone}
                            onChange={(e) => setNewAddrPhone(e.target.value)}
                            placeholder="017xxxxxxxx"
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#0F4C3A]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            {language === 'en' ? 'Division' : 'বিভাগ'} *
                          </label>
                          <select
                            value={newAddrDivision}
                            onChange={(e) => handleDivisionChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#0F4C3A] cursor-pointer"
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
                            {language === 'en' ? 'District' : 'জেলা'} *
                          </label>
                          <select
                            value={newAddrDistrict}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#0F4C3A] cursor-pointer"
                          >
                            {availableDistricts.map((dist) => (
                              <option key={dist.nameBn} value={dist.nameBn}>
                                {language === 'en' ? dist.nameEn : dist.nameBn}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            {language === 'en' ? 'Thana / Upazila' : 'থানা / উপজেলা'} *
                          </label>
                          <select
                            value={newAddrUpazila}
                            onChange={(e) => handleUpazilaChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#0F4C3A] cursor-pointer"
                          >
                            {availableUpazilas.map((upz) => (
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

                      {/* Custom Upazila input */}
                      {isCustomUpazila && (
                        <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                          <label className="block text-xs font-semibold text-[#0F4C3A] mb-1">
                            {language === 'en' ? 'Thana / Upazila Name' : 'আপনার থানা বা উপজেলার নাম লিখুন'} *
                          </label>
                          <input
                            type="text"
                            required
                            value={customUpazilaText}
                            onChange={(e) => setCustomUpazilaText(e.target.value)}
                            placeholder={language === 'en' ? 'e.g. Rampura, Kotwali' : 'যেমন: রামপুরা, কোতোয়ালী...'}
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:border-[#0F4C3A]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          {language === 'en' ? 'Full Street Address' : 'বিস্তারিত ঠিকানা (বাড়ি, রোড, এলাকা)'} *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={newAddrFull}
                          onChange={(e) => setNewAddrFull(e.target.value)}
                          placeholder="বাড়ি নং, রোড নং, ফ্ল্যাট বা ল্যান্ডমার্ক..."
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#0F4C3A]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newAddrDefault"
                          checked={newAddrIsDefault}
                          onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                          className="rounded text-[#0F4C3A] focus:ring-[#0F4C3A]"
                        />
                        <label htmlFor="newAddrDefault" className="text-xs font-medium text-stone-700 cursor-pointer">
                          {language === 'en' ? 'Set as default address' : 'ডিফল্ট ঠিকানা হিসেবে সংরক্ষণ করুন'}
                        </label>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={addressLoading}
                          className="px-4 py-2 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-[#135D48] transition-colors cursor-pointer"
                        >
                          {addressLoading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="px-4 py-2 bg-white border border-stone-200 text-stone-600 text-xs font-semibold rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          {language === 'en' ? 'Cancel' : 'বাতিল'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Addresses List */}
                {isLoadingAddresses ? (
                  <div className="py-10 text-center text-xs text-stone-400">
                    ঠিকানা লোড হচ্ছে...
                  </div>
                ) : !addresses || addresses.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200 p-6 space-y-2">
                    <MapPin className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500">
                      {language === 'en'
                        ? 'No delivery addresses saved yet.'
                        : 'এখনো কোনো ঠিকানা সংরক্ষণ করা হয়নি। সহজে অর্ডার করতে আপনার ঠিকানা যোগ করুন।'}
                    </p>
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F4C3A] text-white rounded-xl text-xs font-semibold hover:bg-[#135D48] transition-colors cursor-pointer mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Add Address' : 'নতুন ঠিকানা যোগ করুন'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-2xl border transition-all relative ${
                          addr.isDefault
                            ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">{addr.title || 'ঠিকানা'}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                {language === 'en' ? 'Default' : 'ডিফল্ট'}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title={language === 'en' ? 'Delete' : 'মুছে ফেলুন'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-xs text-stone-600 space-y-1">
                          <p className="font-semibold text-stone-800">{addr.name}</p>
                          <p className="font-mono text-stone-600 tabular-nums">{addr.phone}</p>
                          <p className="text-stone-700 line-clamp-2">{addr.fullAddress}</p>
                          <p className="text-[11px] text-stone-500 font-medium pt-0.5">
                            {addr.upazila ? `${addr.upazila}, ` : ''}{addr.district}{addr.division ? ` (${addr.division})` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 4: SECURITY & PASSWORD */}
            {/* ========================================= */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    {language === 'en' ? 'Security & Password' : 'নিরাপত্তা ও পাসওয়ার্ড পরিবর্তন'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'en'
                      ? 'Ensure your account stays secure by using a strong password'
                      : 'আপনার অ্যাকাউন্টের সুরক্ষায় শক্তিশালী পাসওয়ার্ড ব্যবহার করুন'}
                  </p>
                </div>

                {passwordSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{passwordSuccessMsg}</span>
                  </div>
                )}

                {passwordErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Current Password' : 'বর্তমান পাসওয়ার্ড'}
                    </label>
                    <input
                      type="password"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'en' ? 'Confirm New Password' : 'নতুন পাসওয়ার্ড নিশ্চিত করুন'}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-5 py-2.5 bg-[#0F4C3A] hover:bg-[#135D48] text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading
                        ? (language === 'en' ? 'Updating...' : 'পরিবর্তন হচ্ছে...')
                        : (language === 'en' ? 'Update Password' : 'পাসওয়ার্ড পরিবর্তন করুন')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
