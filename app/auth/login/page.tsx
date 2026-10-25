'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Eye,
  EyeOff,
  Home,
  Shield,
  Key,
} from 'lucide-react';
import { 
  FaHome, 
  FaBuilding, 
  FaCity, 
  FaChartLine, 
  FaHandshake, 
  FaShieldAlt,
  FaUsers
} from 'react-icons/fa';

export default function LoginPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithOtp } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      let user;
      if (isOtpLogin) {
        user = await loginWithOtp(phone, otp);
      } else {
        user = await login(phone, password);
      }

      if (user && user.role) {
        toast.success(isAmharic ? 'በተሳካ ሁኔታ ገብተዋል! እንኳን ደህና መጡ!' : 'Login successful! Welcome back!', {
          position: 'top-right',
          autoClose: 2000,
        });

        if (['admin', 'user', 'owner', 'agent', 'manager', 'accountant'].includes(user.role)) {
          router.push('/admin/dashboard');
        } else {
          router.push('/admin/customer');
        }
      } else {
        const errorMsg = isAmharic ? 'መግባት አልተቻለም፡ የተጠቃሚ መረጃ አልተገኘም' : 'Login failed: User data is missing';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || (isAmharic ? 'መግባት አልተቻለም። እባክዎ መረጃዎን ያረጋግጡ' : 'Login failed. Please check your credentials');
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      const errorMsg = isAmharic ? 'እባክዎ ስልክ ቁጥር ያስገቡ' : 'Please enter your phone number';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        const successMsg = isAmharic ? 'የማረጋገጫ ኮድ ወደ ስልክዎ ተልኳል' : 'OTP sent to your phone successfully';
        setMessage(successMsg);
        toast.success(successMsg);
      } else {
        const errorMsg = data.message || (isAmharic ? 'ኮድ መላክ አልተቻለም' : 'Failed to send OTP');
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = isAmharic ? 'ኮድ መላክ አልተቻለም' : 'Failed to send OTP';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-[#0a192f] text-gray-100' 
        : 'bg-[#f8fafc] text-gray-900'
    }`}>
      <Navbar />
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme={theme === 'dark' ? 'dark' : 'light'}
      />

      <div className="container mx-auto px-4 py-8 pt-20 sm:pt-24 max-w-5xl">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 text-blue-600 dark:text-blue-400">
            {t('auth.signin_title', 'Sign In to Your Account')}
          </h1>
          <p className={`text-xs sm:text-base max-w-xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('auth.signin_subtitle', 'Welcome back! Please enter your credentials to continue.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Card */}
          <div className={`lg:col-span-7 p-6 sm:p-8 rounded-3xl border ${
            theme === 'dark' 
              ? 'bg-[#112240] border-slate-700 shadow-xl' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${
                theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}>
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isAmharic ? 'የመለያ መግቢያ' : 'Portal Sign In'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAmharic ? 'የደንበኛ፣ ወኪል ወይም አስተዳዳሪ' : 'Customer, Agent & Admin Access'}
                </p>
              </div>
            </div>

            {message && (
              <div className={`mb-5 p-3.5 rounded-xl text-xs sm:text-sm font-medium ${
                message.includes('success') || message.includes('ተሳክቷል')
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.phone', 'Phone Number')} *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-gray-500 dark:text-gray-400">
                    +251
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="912345678"
                    className={`w-full pl-14 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              {!isOtpLogin ? (
                /* Password Input */
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {t('auth.password', 'Password')} *
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t('auth.forgot_password', 'Forgot password?')}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2.5 sm:py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                /* OTP Input */
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {isAmharic ? 'የማረጋገጫ ኮድ (OTP) *' : 'Enter OTP Code *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className={`flex-1 px-4 py-2.5 sm:py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-bold shrink-0 transition-colors"
                    >
                      {t('auth.send_otp', 'Send OTP')}
                    </button>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-md transition-all disabled:opacity-50"
              >
                {isLoading 
                  ? (isAmharic ? 'በመግባት ላይ...' : 'Signing in...') 
                  : (isAmharic ? 'ግባ' : 'Sign In')}
              </button>

              {/* OTP Login Toggle */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpLogin(!isOtpLogin)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isOtpLogin 
                    ? (isAmharic ? 'በይለፍ ቃል ግባ' : 'Sign in with Password instead') 
                    : (isAmharic ? 'በስልክ ኮድ (OTP) ግባ' : 'Sign in with OTP code')}
                </button>
              </div>

              {/* Register Link */}
              <div className="text-center pt-3 border-t border-gray-100 dark:border-slate-800 text-xs sm:text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t('auth.no_account', "Don't have an account?")}{' '}
                </span>
                <Link
                  href="/auth/register"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
                >
                  {t('auth.signup_title', 'Create an Account')}
                </Link>
              </div>
            </form>
          </div>

          {/* Right Info Section */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-6 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`text-base font-bold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isAmharic ? 'የመድረካችን ጥቅሞች' : 'Platform Benefits'}
              </h3>
              <div className="space-y-3.5">
                {[
                  { icon: <FaHome className="text-blue-500" />, title: isAmharic ? 'የተረጋገጡ ቤቶች' : 'Verified Listings', desc: isAmharic ? '100% ህጋዊ ሰነድ ያላቸው ምርጥ ቤቶች' : 'Accurate details and verified ownership' },
                  { icon: <FaShieldAlt className="text-emerald-500" />, title: isAmharic ? 'አስተማማኝ ግብይት' : 'Secure Transactions', desc: isAmharic ? 'በህግ አግባብ የተጠበቀ የክፍያ እና የውል አሰራር' : 'Protected data and safe payment channels' },
                  { icon: <FaUsers className="text-purple-500" />, title: isAmharic ? 'የወሰኑ ወኪሎች' : 'Dedicated Agents', desc: isAmharic ? 'በማንኛውም ሰዓት ድጋፍ የሚሰጥ የባለሙያ ቡድን' : 'Expert real estate advice whenever you need' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      theme === 'dark' ? 'bg-slate-800' : 'bg-blue-50'
                    }`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className={`text-xs sm:text-sm font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.title}
                      </h4>
                      <p className={`text-[11px] sm:text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Note */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300">
              <span className="font-bold block mb-1">{isAmharic ? 'የእርዳታ መስመር' : 'Need help signing in?'}</span>
              <span>{isAmharic ? 'ለማንኛውም እገዛ በ +251 906 974 055 ይደውሉልን።' : 'Call our dedicated support desk at +251 906 974 055.'}</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}