'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Home,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  FaGoogle, 
  FaMicrosoft, 
  FaGithub,
  FaApple,
  FaHome,
  FaBuilding,
  FaKey,
  FaHandshake,
  FaShieldAlt,
  FaChartLine
} from 'react-icons/fa';
import { User as UserType } from '@/types';

// Import real estate images
const images = {
  hero: '/INSA/image15.jpg',
  interior: '/INSA/image12.jpg',
  office: '/INSA/image17.jpg',
  team: '/INSA/image19.jpg',
};

export default function RegisterPage() {
  const { theme } = useTheme();
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

  // Theme styles with real estate colors (blue theme)
  const themeStyles = {
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f0f5ff, #ffffff)',
    textColor: theme === 'dark' ? 'text-[#ccd6f6]' : 'text-[#333333]',
    primaryColor: theme === 'dark' ? 'text-[#3b82f6]' : 'text-[#2563eb]',
    secondaryColor: theme === 'dark' ? 'text-[#60a5fa]' : 'text-[#3b82f6]',
    borderColor: theme === 'dark' ? 'border-[#3b82f6]' : 'border-[#2563eb]',
    buttonBg: theme === 'dark' 
      ? 'border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white' 
      : 'border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white',
    cardBg: theme === 'dark' 
      ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] border-[#3b82f6]/30' 
      : 'bg-gradient-to-br from-white to-blue-50 border-[#2563eb]/30',
    inputBg: theme === 'dark' 
      ? 'bg-[#0a192f] border-[#3b82f6]/50 text-white placeholder-gray-400 focus:ring-[#3b82f6]' 
      : 'bg-white border-[#2563eb]/50 text-[#333333] focus:ring-[#2563eb]'
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setMessage('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return false;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setMessage('Please enter a valid Ethiopian phone number (09XXXXXXXX)');
      toast.error('Please enter a valid Ethiopian phone number (09XXXXXXXX)');
      return false;
    }

    if (!acceptedTerms) {
      setMessage('Please accept the Terms of Service and Privacy Policy');
      toast.error('Please accept the Terms of Service and Privacy Policy');
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
        background: formData.background,
        role: formData.role
      };

      const user = await register(userData);

      if (user && user.role) {
        toast.success('Registration successful! Welcome to RealEstate Pro!', {
          position: 'top-right',
          autoClose: 2000,
        });

        // Redirect based on role
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      } else {
        setMessage('Registration failed: User data is missing');
        toast.error('Registration failed: User data is missing');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Registration failed';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Property types for display
  const propertyTypes = [
    { icon: <FaHome className="w-5 h-5" />, title: "Houses", description: "Single-family homes" },
    { icon: <FaBuilding className="w-5 h-5" />, title: "Apartments", description: "Modern living spaces" },
    { icon: <FaKey className="w-5 h-5" />, title: "Rentals", description: "Lease options" },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeStyles.background} ${theme === 'dark' ? 'text-white' : 'text-[#333333]'}`}>
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`text-4xl md:text-5xl font-bold mb-4 ${themeStyles.primaryColor}`}
            >
              Join RealEstate Pro
            </motion.h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-[#555555]'} max-w-2xl mx-auto`}>
              Create your account to start your real estate journey with us
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Registration Form Card */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`rounded-2xl shadow-2xl p-8 border ${themeStyles.cardBg}`}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-[#3b82f6]/20' : 'bg-[#2563eb]/10'}`}>
                  <User className={`w-8 h-8 ${themeStyles.primaryColor}`} />
                </div>
                <h2 className={`text-2xl font-bold ${themeStyles.primaryColor}`}>
                  Create Account
                </h2>
              </div>

              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Sign up to browse properties, save favorites, and connect with agents.
              </p>

              {message && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mb-6 p-4 rounded-lg flex items-start gap-2 ${
                    message.includes('success')
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  } ${theme === 'dark' ? 'bg-opacity-20' : ''}`}
                >
                  {message.includes('success') ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={handleRegister}>
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="name"
                    className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-700'}`}
                  >
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className={`w-full pl-10 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 ${themeStyles.inputBg}`}
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-700'}`}
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className={`w-full pl-10 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 ${themeStyles.inputBg}`}
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-700'}`}
                  >
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} sm:text-sm`}>+251</span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className={`w-full pl-16 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 ${themeStyles.inputBg}`}
                      placeholder="912345678"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-700'}`}
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 pr-12 ${themeStyles.inputBg}`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className={`absolute inset-y-0 right-3 flex items-center ${
                        theme === 'dark' ? 'text-gray-400 hover:text-[#3b82f6]' : 'text-gray-500 hover:text-[#2563eb]'
                      }`}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-700'}`}
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 pr-12 ${themeStyles.inputBg}`}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className={`absolute inset-y-0 right-3 flex items-center ${
                        theme === 'dark' ? 'text-gray-400 hover:text-[#3b82f6]' : 'text-gray-500 hover:text-[#2563eb]'
                      }`}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Background/Profile */}
                <div>
                  <label
                    htmlFor="background"
                    className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-700'}`}
                  >
                    Background / Bio
                  </label>
                  <textarea
                    id="background"
                    name="background"
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 ${themeStyles.inputBg}`}
                    placeholder="Tell us about your real estate interests or professional background..."
                    value={formData.background}
                    onChange={handleChange}
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label
                    htmlFor="role"
                    className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-700'}`}
                  >
                    I am a *
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 ${themeStyles.inputBg}`}
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="user">Home Buyer</option>
                    <option value="user">Property Seller</option>
                    <option value="user">Real Estate Investor</option>
                    <option value="user">Property Renter</option>
                    <option value="user">Real Estate Agent</option>
                    <option value="user">Property Manager</option>
                  </select>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#2563eb] border-gray-300 rounded focus:ring-[#2563eb]"
                  />
                  <label htmlFor="terms" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    I agree to the{' '}
                    <Link href="/terms-of-service" className={`${themeStyles.primaryColor} hover:underline`}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" className={`${themeStyles.primaryColor} hover:underline`}>
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white hover:opacity-90'
                      : 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white hover:opacity-90'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-8 pt-6 border-t border-gray-700/30">
                <p className={`text-center ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-600'} text-sm`}>
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className={`font-semibold ${
                      theme === 'dark' ? 'text-[#3b82f6] hover:text-blue-300' : 'text-[#2563eb] hover:text-blue-700'
                    } transition duration-200`}
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </motion.div>

            {/* Right Side - Information */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Welcome Image */}
              <div className={`rounded-2xl overflow-hidden shadow-2xl ${themeStyles.cardBg} border`}>
                <div className="relative h-64">
                  <Image
                    src={images.office || '/api/placeholder/600/300'}
                    alt="Real Estate Office"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/40' : 'bg-black/20'}`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <h3 className={`text-2xl font-bold mb-2 ${themeStyles.primaryColor}`}>
                        Join Our Community
                      </h3>
                      <p className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        10,000+ happy property owners
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className={`rounded-2xl shadow-xl p-6 ${themeStyles.cardBg} border`}>
                <h3 className={`text-xl font-bold mb-6 ${themeStyles.primaryColor}`}>
                  Member Benefits
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: <FaHome />, text: "Access to exclusive property listings" },
                    { icon: <FaChartLine />, text: "Real-time market insights and analytics" },
                    { icon: <FaHandshake />, text: "Direct connection with verified agents" },
                    { icon: <FaShieldAlt />, text: "Secure and transparent transactions" },
                    { icon: <Building />, text: "Save and compare favorite properties" },
                    { icon: <Briefcase />, text: "Investment opportunity alerts" }
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#3b82f6]/20' : 'bg-[#2563eb]/10'}`}>
                        <span className={themeStyles.primaryColor}>{benefit.icon}</span>
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Types */}
              <div className={`rounded-2xl shadow-xl p-6 ${themeStyles.cardBg} border`}>
                <h3 className={`text-xl font-bold mb-6 ${themeStyles.primaryColor}`}>
                  Popular Property Types
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {propertyTypes.map((type, index) => (
                    <div key={index} className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                        theme === 'dark' ? 'bg-[#3b82f6]/20' : 'bg-[#2563eb]/10'
                      }`}>
                        <span className={themeStyles.primaryColor}>{type.icon}</span>
                      </div>
                      <div className="text-sm font-medium">{type.title}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div className={`rounded-2xl shadow-xl p-6 ${themeStyles.cardBg} border`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    JD
                  </div>
                  <div>
                    <div className="font-semibold">John Doe</div>
                    <div className="text-sm text-gray-500">Happy Homeowner</div>
                  </div>
                </div>
                <p className="text-sm italic">
                  "RealEstate Pro made finding my dream home so easy! The platform is intuitive,
                  and the agents are incredibly helpful. Highly recommended!"
                </p>
                <div className="mt-3 flex text-yellow-400">
                  {'★★★★★'}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}