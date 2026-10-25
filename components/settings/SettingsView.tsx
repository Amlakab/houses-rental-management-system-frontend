'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import api from '@/app/utils/api';
import {
  Lock,
  Sun,
  Moon,
  Globe,
  User,
  Bell,
  Database,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Laptop,
  Save,
  Check,
  RefreshCw,
  Sliders,
  DollarSign,
  Download,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  isAdminContext?: boolean;
}

type SettingsTab = 'security' | 'appearance' | 'language' | 'profile' | 'notifications' | 'storage';

export default function SettingsView({ isAdminContext = false }: SettingsViewProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, isAmharic } = useLanguage();

  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [mounted, setMounted] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Regional Preferences
  const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB');
  const [dateFormat, setDateFormat] = useState<'gregorian' | 'ethiopian'>('gregorian');

  // Notifications State
  const [emailInquiries, setEmailInquiries] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [priceDrops, setPriceDrops] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [notificationSaved, setNotificationSaved] = useState(false);

  // Cache & Storage State
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileEmail(user.email || '');
    }

    // Load saved preferences from localStorage
    try {
      const savedCurrency = localStorage.getItem('hrms_currency_pref');
      if (savedCurrency === 'ETB' || savedCurrency === 'USD') setCurrency(savedCurrency);

      const savedDateFormat = localStorage.getItem('hrms_date_format');
      if (savedDateFormat === 'gregorian' || savedDateFormat === 'ethiopian') setDateFormat(savedDateFormat);

      const savedNotifs = localStorage.getItem('hrms_notif_prefs');
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        if (typeof parsed.emailInquiries === 'boolean') setEmailInquiries(parsed.emailInquiries);
        if (typeof parsed.smsAlerts === 'boolean') setSmsAlerts(parsed.smsAlerts);
        if (typeof parsed.priceDrops === 'boolean') setPriceDrops(parsed.priceDrops);
        if (typeof parsed.soundEffects === 'boolean') setSoundEffects(parsed.soundEffects);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-slate-700' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score === 1) return { score: 25, label: isAmharic ? 'ደካማ' : 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 50, label: isAmharic ? 'መካከለኛ' : 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: isAmharic ? 'ጥሩ' : 'Good', color: 'bg-blue-500' };
    return { score: 100, label: isAmharic ? 'በጣም ጠንካራ' : 'Strong', color: 'bg-emerald-500' };
  }, [newPassword, isAmharic]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!user) {
      setPasswordError(isAmharic ? 'የይለፍ ቃል ለመቀየር መጀመሪያ መግባት አለብዎት።' : 'You must be logged in to change your password.');
      return;
    }

    if (!currentPassword) {
      setPasswordError(isAmharic ? 'እባክዎ የአሁኑን የይለፍ ቃል ያስገቡ።' : 'Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(isAmharic ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት።' : 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isAmharic ? 'የተረጋገጠው የይለፍ ቃል ከተመረጠው ጋር አይመሳሰልም።' : 'New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.status === 200 || response.data?.success) {
        setPasswordSuccess(isAmharic ? 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል!' : 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.data?.message || (isAmharic ? 'የይለፍ ቃል መቀየር አልተሳካም።' : 'Failed to change password.'));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || (isAmharic ? 'የይለፍ ቃል መቀየር አልተሳካም። እባክዎ የአሁኑን የይለፍ ቃል ያረጋግጡ።' : 'Failed to update password. Please check your current password.');
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (user) {
        const updatedUser = {
          ...user,
          name: profileName,
          phone: profilePhone,
          email: profileEmail,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      setProfileSuccess(isAmharic ? 'የመለያ መረጃ በተሳካ ሁኔታ ተቀምጧል!' : 'Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch {
      // ignore
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = () => {
    try {
      const prefs = { emailInquiries, smsAlerts, priceDrops, soundEffects };
      localStorage.setItem('hrms_notif_prefs', JSON.stringify(prefs));
      setNotificationSaved(true);
      setTimeout(() => setNotificationSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleCurrencyChange = (newCurr: 'ETB' | 'USD') => {
    setCurrency(newCurr);
    localStorage.setItem('hrms_currency_pref', newCurr);
  };

  const handleClearCache = () => {
    try {
      // Clear non-critical cache without logging out
      sessionStorage.clear();
      localStorage.removeItem('hrms_recent_searches');
      localStorage.removeItem('hrms_viewed_houses');
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleExportData = () => {
    const data = {
      user: user ? { name: user.name, phone: user.phone, email: user.email, role: user.role } : null,
      preferences: {
        theme,
        language,
        currency,
        dateFormat,
        notifications: { emailInquiries, smsAlerts, priceDrops, soundEffects },
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrms-settings-${user?.name || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg mb-4" />
        <div className="h-4 w-96 bg-gray-100 dark:bg-slate-800/60 rounded mb-8" />
        <div className="h-96 bg-gray-100 dark:bg-slate-800/40 rounded-2xl" />
      </div>
    );
  }

  const tabs = [
    {
      id: 'security' as SettingsTab,
      label: isAmharic ? 'ደህንነት እና የይለፍ ቃል' : 'Security & Password',
      icon: Lock,
      desc: isAmharic ? 'የይለፍ ቃል ይቀይሩ እና ደህንነትን ያጠናክሩ' : 'Change password & secure your account',
    },
    {
      id: 'appearance' as SettingsTab,
      label: isAmharic ? 'ገጽታ እና ማሳያ' : 'Appearance & Theme',
      icon: theme === 'dark' ? Moon : Sun,
      desc: isAmharic ? 'የቀን እና የጨለማ ሁነታ ገጽታን ይምረጡ' : 'Light, Dark, and Contrast display modes',
    },
    {
      id: 'language' as SettingsTab,
      label: isAmharic ? 'ቋንቋ እና አካባቢ' : 'Language & Region',
      icon: Globe,
      desc: isAmharic ? 'አማርኛ ወይም እንግሊዝኛ፣ የገንዘብ ምንዛሬ' : 'Amharic, English & Currency settings',
    },
    {
      id: 'profile' as SettingsTab,
      label: isAmharic ? 'የመለያ መረጃ' : 'Account Profile',
      icon: User,
      desc: isAmharic ? 'የግል መረጃ እና ስልክ ቁጥር' : 'Personal info, phone and role',
    },
    {
      id: 'notifications' as SettingsTab,
      label: isAmharic ? 'ማሳወቂያዎች' : 'Notifications',
      icon: Bell,
      desc: isAmharic ? 'የኢሜይል እና የኤስኤምኤስ ማሳወቂያዎች' : 'Email, SMS and sound alerts',
    },
    {
      id: 'storage' as SettingsTab,
      label: isAmharic ? 'ግላዊነት እና መሸጎጫ' : 'Privacy & Storage',
      icon: Database,
      desc: isAmharic ? 'መረጃዎችን ማጽዳት እና ማውረድ' : 'Clear cache and export data',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 pb-5 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {isAmharic ? 'ቅንብሮች እና ምርጫዎች' : 'Settings & Preferences'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isAmharic
                  ? 'የይለፍ ቃልዎን፣ ገጽታዎን፣ ቋንቋዎን እና የመለያዎን ደህንነት በቀላሉ ያስተካክሉ።'
                  : 'Manage your password security, appearance, language, and system preferences.'}
              </p>
            </div>
          </div>
        </div>

        {/* User Status Card */}
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700/80 px-3.5 py-2 rounded-xl shrink-0">
          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.phone ? user.phone.slice(-2) : 'U')}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
              {user ? (user.name || user.email || user.phone) : (isAmharic ? 'የእንግዳ መለያ' : 'Guest User')}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
              {user?.role ? user.role : (isAmharic ? 'እንግዳ' : 'Guest')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Layout (Sidebar Tabs on desktop + Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Navigation Tabs */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-1.5 overflow-x-auto lg:overflow-visible flex lg:flex-col pb-2 lg:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`flex items-center text-left px-3.5 py-3 rounded-xl transition-all duration-200 shrink-0 lg:w-full border cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-bold'
                    : 'bg-white dark:bg-[#112240] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/80 font-medium'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 pr-2">
                  <span className="block text-xs sm:text-sm font-semibold truncate">{tab.label}</span>
                  <span className={`text-[11px] truncate hidden xl:block ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panels */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#112240] border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 transition-colors duration-200 min-h-[460px]">
          
          {/* ========================================================= */}
          {/* TAB 1: SECURITY & PASSWORD */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {isAmharic ? 'የይለፍ ቃል መቀየሪያ' : 'Change Account Password'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isAmharic
                    ? 'መለያዎን ደህንነቱ የተጠበቀ ለማድረግ ጠንካራ የይለፍ ቃል ይጠቀሙ።'
                    : 'Ensure your account stays protected by choosing a strong, unique password.'}
                </p>
              </div>

              {!user && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {isAmharic ? 'የይለፍ ቃል ለመቀየር መጀመሪያ ይግቡ' : 'Sign in required'}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      {isAmharic
                        ? 'የይለፍ ቃልዎን ለመቀየር ወደ መለያዎ መግባት አለብዎት።'
                        : 'You are currently browsing as a guest. Please sign in to update your credentials.'}
                    </p>
                    <Link
                      href="/auth/login?redirect=/settings"
                      className="inline-block mt-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      {isAmharic ? 'አሁን ግባ' : 'Sign In Now'}
                    </Link>
                  </div>
                </div>
              )}

              {/* Status Alert Banners */}
              {passwordSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-3 animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{passwordSuccess}</p>
                </div>
              )}

              {passwordError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center space-x-3 animate-fadeIn">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">{passwordError}</p>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                {/* Current Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAmharic ? 'የአሁኑ የይለፍ ቃል' : 'Current Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={isAmharic ? 'የአሁኑን የይለፍ ቃል ያስገቡ' : 'Enter current password'}
                      required
                      disabled={!user || isChangingPassword}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAmharic ? 'አዲስ የይለፍ ቃል' : 'New Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isAmharic ? 'አዲስ የይለፍ ቃል ያስገቡ (ቢያንስ 6 ቁምፊዎች)' : 'Enter new password (min. 6 chars)'}
                      required
                      disabled={!user || isChangingPassword}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Bar */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {isAmharic ? 'የይለፍ ቃል ጥንካሬ:' : 'Password strength:'}
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">{passwordStrength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                        <span className={newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                          ✓ 8+ {isAmharic ? 'ቁምፊዎች' : 'characters'}
                        </span>
                        <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                          ✓ {isAmharic ? 'ትልቅ ፊደል (Uppercase)' : 'Uppercase letter'}
                        </span>
                        <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                          ✓ {isAmharic ? 'ቁጥሮች (Numbers)' : 'Number included'}
                        </span>
                        <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                          ✓ {isAmharic ? 'ልዩ ምልክት (Symbol)' : 'Special character'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAmharic ? 'አዲሱን የይለፍ ቃል አረጋግጥ' : 'Confirm New Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isAmharic ? 'አዲሱን የይለፍ ቃል በድጋሚ ያስገቡ' : 'Re-enter new password'}
                      required
                      disabled={!user || isChangingPassword}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {isAmharic ? 'የይለፍ ቃሎቹ አይመሳሰሉም!' : 'Passwords do not match!'}
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      {isAmharic ? 'የይለፍ ቃሎቹ በትክክል ተመሳስለዋል' : 'Passwords match'}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!user || isChangingPassword}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{isAmharic ? 'በመቀየር ላይ...' : 'Updating Password...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{isAmharic ? 'የይለፍ ቃል ቀይር' : 'Update Password'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Status Box */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {isAmharic ? 'የመለያ ደህንነት ሁኔታ' : 'Security Overview'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60">
                    <span className="text-gray-500 dark:text-gray-400 block">{isAmharic ? 'የኤስኤምኤስ ኦቲፒ (2FA)' : 'SMS OTP Two-Factor:'}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {isAmharic ? '✓ ነቅቷል (የተጠበቀ)' : '✓ Enabled (Active)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60">
                    <span className="text-gray-500 dark:text-gray-400 block">{isAmharic ? 'የይለፍ ቃል ምስጠራ' : 'Encryption Standard:'}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Bcrypt (10 Salt Rounds)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: APPEARANCE & THEME */}
          {/* ========================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  {isAmharic ? 'የገጽታ እና የቀለም ምርጫ' : 'Appearance & Theme Mode'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isAmharic
                    ? 'ለዓይን ምቹ የሆነ የቀን ወይም የጨለማ ሁነታ ገጽታን ይምረጡ።'
                    : 'Choose your preferred visual theme to suit your environment.'}
                </p>
              </div>

              {/* Theme Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 relative overflow-hidden cursor-pointer ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                      <Sun className="h-6 w-6" />
                    </div>
                    {theme === 'light' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-1 rounded-full">
                        <Check className="h-3.5 w-3.5" />
                        {isAmharic ? 'የነቃ' : 'Active'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {isAmharic ? 'የቀን ሁነታ (Light Mode)' : 'Light Mode'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isAmharic
                      ? 'ንፁህ ነጭ ዳራ ለብርሃን ቦታዎች እና ለቀን ንባብ።'
                      : 'Crisp white surfaces with rich contrast for daytime productivity.'}
                  </p>
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 relative overflow-hidden cursor-pointer ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 rounded-xl bg-indigo-900/50 text-indigo-400">
                      <Moon className="h-6 w-6" />
                    </div>
                    {theme === 'dark' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-900/50 px-2.5 py-1 rounded-full">
                        <Check className="h-3.5 w-3.5" />
                        {isAmharic ? 'የነቃ' : 'Active'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {isAmharic ? 'የጨለማ ሁነታ (Dark Mode)' : 'Dark Mode'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isAmharic
                      ? 'የዓይን ድካምን የሚቀንስ የሚያምር የሌሊት ሰማያዊ ገጽታ።'
                      : 'Sleek midnight navy (#0a192f) designed to reduce eye fatigue.'}
                  </p>
                </button>
              </div>

              {/* Theme Live Preview Preview Card */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                  {isAmharic ? 'የቀጥታ ገጽታ እይታ (Live UI Preview)' : 'Live UI Theme Preview'}
                </span>
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                      HR
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {isAmharic ? 'ቅንጡ ቪላ በቦሌ' : 'Luxury Villa in Bole'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Addis Ababa, Ethiopia • 4 Beds • 3 Baths
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 block">
                      12,500,000 ETB
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                      {isAmharic ? 'የተረጋገጠ' : 'Verified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LANGUAGE & REGIONAL */}
          {/* ========================================================= */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {isAmharic ? 'ቋንቋ እና የክልል ምርጫዎች' : 'Language & Regional Settings'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isAmharic
                    ? 'የስርዓቱን ቋንቋ እና የገንዘብ ምንዛሬ ምርጫዎን ያዘጋጁ።'
                    : 'Set your preferred interface language, currency, and date formats.'}
                </p>
              </div>

              {/* Language Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  {isAmharic ? 'የስርዓቱ ቋንቋ' : 'Interface Language'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* English */}
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      language === 'en'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 font-bold'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🇺🇸</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">English (US)</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Default International</p>
                      </div>
                    </div>
                    {language === 'en' && <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                  </button>

                  {/* Amharic */}
                  <button
                    type="button"
                    onClick={() => setLanguage('am')}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      language === 'am'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 font-bold'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🇪🇹</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">አማርኛ (Amharic)</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">የኢትዮጵያ ቋንቋ</p>
                      </div>
                    </div>
                    {language === 'am' && <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  {isAmharic ? 'የገንዘብ ምንዛሬ ምርጫ' : 'Preferred Property Currency'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('ETB')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      currency === 'ETB'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="block text-base font-extrabold">ETB (ብር)</span>
                    <span className="text-[11px] opacity-75">{isAmharic ? 'የኢትዮጵያ ብር' : 'Ethiopian Birr'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('USD')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      currency === 'USD'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 font-bold text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="block text-base font-extrabold">USD ($)</span>
                    <span className="text-[11px] opacity-75">{isAmharic ? 'የአሜሪካን ዶላር' : 'US Dollar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: ACCOUNT PROFILE */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {isAmharic ? 'የመለያ እና የግል መረጃ' : 'Personal Profile Information'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isAmharic
                    ? 'ስምዎን፣ ስልክዎን እና የመለያዎን ዝርዝር ይመልከቱ ወይም ያስተካክሉ።'
                    : 'View and update your display name, telephone, and account details.'}
                </p>
              </div>

              {profileSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-3 animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{profileSuccess}</p>
                </div>
              )}

              {/* Profile Card Header */}
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {user?.name || (isAmharic ? 'ተጠቃሚ' : 'User')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {user?.role || 'Guest'}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ {isAmharic ? 'የተረጋገጠ መለያ' : 'Active Account'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Edit Form */}
              <form onSubmit={handleProfileSave} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={isAmharic ? 'ሙሉ ስምዎን ያስገቡ' : 'Enter your full name'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAmharic ? 'የስልክ ቁጥር' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAmharic ? 'ኢሜይል አድራሻ' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isAmharic ? 'መረጃዎችን አስቀምጥ' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: NOTIFICATIONS */}
          {/* ========================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {isAmharic ? 'የማሳወቂያ ምርጫዎች' : 'Notification Preferences'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isAmharic
                    ? 'አዳዲስ ቤቶች፣ የዋጋ ቅነሳ እና መልዕክቶች ሲኖሩ እንዴት እንዲደርስዎት እንደሚፈልጉ ይምረጡ።'
                    : 'Choose how and when you receive property alerts, tour updates, and direct messages.'}
                </p>
              </div>

              {notificationSaved && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-3 animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    {isAmharic ? 'የማሳወቂያ ምርጫዎችዎ ተመዝግበዋል!' : 'Notification preferences saved!'}
                  </p>
                </div>
              )}

              <div className="space-y-4 max-w-xl">
                {/* Email Inquiries Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {isAmharic ? 'የኢሜይል ማሳወቂያዎች' : 'Email Alerts & Inquiries'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAmharic ? 'አዳዲስ ጥያቄዎች እና መልዕክቶች በኢሜይል እንዲደርስዎት' : 'Get notified via email when agents or clients reach out'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailInquiries}
                    onChange={(e) => setEmailInquiries(e.target.checked)}
                    className="h-5 w-5 accent-blue-600 cursor-pointer rounded"
                  />
                </div>

                {/* SMS Alerts Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {isAmharic ? 'የኤስኤምኤስ (SMS) ማሳወቂያዎች' : 'SMS Phone Alerts'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAmharic ? 'አስቸኳይ ማረጋገጫዎች እና የጉብኝት ሰዓቶች በስልክ መልዕክት' : 'Receive instant SMS alerts for property tours and OTPs'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="h-5 w-5 accent-blue-600 cursor-pointer rounded"
                  />
                </div>

                {/* Price Drops */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {isAmharic ? 'የዋጋ ቅነሳ ማሳወቂያ' : 'Price Drop Alerts'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAmharic ? 'የተወደዱ ቤቶች ዋጋቸው ሲቀንስ መልዕክት ይላክ' : 'Notify me when bookmarked houses reduce their prices'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={priceDrops}
                    onChange={(e) => setPriceDrops(e.target.checked)}
                    className="h-5 w-5 accent-blue-600 cursor-pointer rounded"
                  />
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {isAmharic ? 'የድምፅ ማሳወቂያ' : 'In-App Sound Effects'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAmharic ? 'አዳዲስ ማሳወቂያዎች ሲመጡ ድምፅ ይሰማ' : 'Play audio chime on incoming messages and notifications'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="h-5 w-5 accent-blue-600 cursor-pointer rounded"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isAmharic ? 'ምርጫዎችን አስቀምጥ' : 'Save Notification Preferences'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: PRIVACY & STORAGE */}
          {/* ========================================================= */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {isAmharic ? 'የመረጃ ግላዊነት እና መሸጎጫ' : 'Data, Privacy & Local Storage'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isAmharic
                    ? 'የአሳሽዎን መሸጎጫ ያጽዱ ወይም የመለያዎን ውሂብ ወደ ኮምፒውተርዎ ያውርዱ።'
                    : 'Manage cached application storage, export your settings, or sign out safely.'}
                </p>
              </div>

              {cacheCleared && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-3 animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    {isAmharic ? 'የአሳሽ መሸጎጫ በተሳካ ሁኔታ ጸድቷል!' : 'Application cache cleared successfully!'}
                  </p>
                </div>
              )}

              <div className="space-y-4 max-w-xl">
                {/* Clear Cache Card */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {isAmharic ? 'የአሳሽ መሸጎጫ አጽዳ' : 'Clear Temporary Cache'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAmharic
                        ? 'የቅርብ ጊዜ ፍለጋዎችን እና ጊዜያዊ መረጃዎችን ያጠፋል (መለያዎን ሳይዘጋ)'
                        : 'Clears recent search history and temporary page cache without logging you out'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    {isAmharic ? 'መሸጎጫውን አጽዳ' : 'Clear Cache'}
                  </button>
                </div>

                {/* Export Data Card */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {isAmharic ? 'የቅንብሮች መረጃን አውርድ (JSON)' : 'Export Settings Profile'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAmharic ? 'የመለያ ቅንብሮችዎን ወደ JSON ፋይል ያውርዱ' : 'Download a structured JSON backup of your preferences and configurations'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isAmharic ? 'ፋይል አውርድ' : 'Export JSON'}</span>
                  </button>
                </div>

                {/* Logout Card */}
                {user && (
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">
                        {isAmharic ? 'ከመለያ ውጣ' : 'Sign Out of Account'}
                      </p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80">
                        {isAmharic ? 'ከዚህ መሳሪያ ላይ መለያዎን ደህንነቱ በተጠበቀ ሁኔታ ይዝጉ' : 'Terminate your current session securely on this device'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{isAmharic ? 'ውጣ (Logout)' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
