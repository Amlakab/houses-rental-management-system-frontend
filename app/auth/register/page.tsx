'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Eye,
  EyeOff,
  User,
  Mail,
  Home,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';
import { 
  FaHome, 
  FaBuilding, 
  FaShieldAlt,
  FaHandshake,
  FaUsers
} from 'react-icons/fa';
import { User as UserType } from '@/types';

export default function RegisterPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    background: '',
    role: 'user' as UserType['role']
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      const err = isAmharic ? 'እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ' : 'Please fill in all required fields';
      setMessage(err);
      toast.error(err);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      const err = isAmharic ? 'የይለፍ ቃሎች አይመሳሰሉም' : 'Passwords do not match';
      setMessage(err);
      toast.error(err);
      return false;
    }

    if (formData.password.length < 6) {
      const err = isAmharic ? 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት' : 'Password must be at least 6 characters';
      setMessage(err);
      toast.error(err);
      return false;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      const err = isAmharic ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ' : 'Please enter a valid email address';
      setMessage(err);
      toast.error(err);
      return false;
    }

    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      const err = isAmharic ? 'እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (09XXXXXXXX)' : 'Please enter a valid Ethiopian phone number (09XXXXXXXX)';
      setMessage(err);
      toast.error(err);
      return false;
    }

    if (!acceptedTerms) {
      const err = isAmharic ? 'እባክዎ የአገልግሎት ውሎችን ይቀበሉ' : 'Please accept the Terms of Service';
      setMessage(err);
      toast.error(err);
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        background: formData.background || undefined,
        role: formData.role
      };

      const user = await register(userData);

      if (user) {
        toast.success(isAmharic ? 'ምዝገባው ተሳክቷል! እንኳን ደህና መጡ!' : 'Registration successful! Welcome!', {
          position: 'top-right',
          autoClose: 2000,
        });

        router.push('/admin/customer/orders');
      } else {
        const err = isAmharic ? 'ምዝገባው አልተሳካም' : 'Registration failed: User creation failed';
        setMessage(err);
        toast.error(err);
      }
    } catch (error: any) {
      const err = error.message || (isAmharic ? 'ምዝገባው አልተሳካም። እባክዎ እንደገና ይሞክሩ' : 'Registration failed');
      setMessage(err);
      toast.error(err);
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
            {t('auth.signup_title', 'Create an Account')}
          </h1>
          <p className={`text-xs sm:text-base max-w-xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('auth.signup_subtitle', 'Join our platform to buy, sell, or rent properties seamlessly.')}
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
                  {isAmharic ? 'የደንበኛ ምዝገባ' : 'User Registration'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAmharic ? 'ለቤት ግዢ፣ ሽያጭ ወይም ኪራይ' : 'For property seekers & home buyers'}
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

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.full_name', 'Full Name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={isAmharic ? 'ሙሉ ስምዎን ያስገቡ' : 'Abebe Bikila'}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.email', 'Email Address')} *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.phone', 'Phone Number')} (09XXXXXXXX) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.password', 'Password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.confirm_password', 'Confirm Password')} *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bio / Background */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {isAmharic ? 'ስለ እርስዎ አጭር መረጃ' : 'Background / Bio'}
                </label>
                <textarea
                  name="background"
                  rows={2}
                  value={formData.background}
                  onChange={handleChange}
                  placeholder={isAmharic ? 'የሚፈልጉትን የቤት ዓይነት ወይም ፍላጎትዎን ይጥቀሱ...' : 'Tell us about your property interests...'}
                  className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400">
                  {isAmharic ? 'የአገልግሎት ውሎችን እና ግላዊነት ፖሊሲን ተቀብያለሁ' : 'I agree to the Terms of Service & Privacy Policy'}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-md transition-all disabled:opacity-50"
              >
                {isLoading 
                  ? (isAmharic ? 'በመመዝገብ ላይ...' : 'Creating Account...') 
                  : (isAmharic ? 'ተመዝገብ' : 'Create Account')}
              </button>

              {/* Sign In Link */}
              <div className="text-center pt-2 text-xs sm:text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t('auth.have_account', 'Already have an account?')}{' '}
                </span>
                <Link
                  href="/auth/login"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
                >
                  {t('auth.login_btn', 'Sign In')}
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
                {isAmharic ? 'ለምን መለያ ይከፍታሉ?' : 'Why Create an Account?'}
              </h3>
              <div className="space-y-3.5">
                {[
                  { icon: <FaHome className="text-blue-500" />, title: isAmharic ? 'ቤቶችን በቀላሉ መከታተል' : 'Save Favorite Homes', desc: isAmharic ? 'የወደዷቸውን ቤቶች በአንድ ቦታ ያስቀምጡ' : 'Bookmark and compare listings easily' },
                  { icon: <FaShieldAlt className="text-emerald-500" />, title: isAmharic ? 'የቀጥታ ትዕዛዝ እና ክፍያ' : 'Direct Orders & Offers', desc: isAmharic ? 'በመድረኩ በኩል የቤት ግዢ ጥያቄ ያቅርቡ' : 'Submit purchase offers and track payment status' },
                  { icon: <FaUsers className="text-purple-500" />, title: isAmharic ? 'ከወኪሎች ጋር የቀጥታ መልእክት' : 'Direct Agent Chat', desc: isAmharic ? 'ጥያቄዎችዎን በቀጥታ ከባለቤቶች ጋር ይወያዩ' : 'Message property managers and agents directly' },
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

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-300">
              <span className="font-bold block mb-1">100% {isAmharic ? 'ነፃ ምዝገባ' : 'Free Registration'}</span>
              <span>{isAmharic ? 'ምንም አይነት የተደበቀ ክፍያ የለም፤ አሁኑኑ ይቀላቀሉን!' : 'No hidden fees or charges for buyer and renter registration.'}</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}