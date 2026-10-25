'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';
import { ShieldCheck, PhoneCall, ArrowLeft, RefreshCw } from 'lucide-react';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithOtp } = useAuth();
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  
  const phone = searchParams.get('phone');

  useEffect(() => {
    if (!phone) {
      router.push('/auth/login');
    }
  }, [phone, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      await loginWithOtp(phone, otp);
      router.push('/user/dashboard');
    } catch (error: any) {
      setMessage(error.message || (isAmharic ? 'የማረጋገጫ ኮድ ስህተት ነው' : 'OTP verification failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phone) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      
      if (response.ok) {
        setMessage(isAmharic ? 'አዲስ የማረጋገጫ ኮድ ወደ ስልክዎ ተልኳል' : 'OTP sent to your phone');
        setCountdown(60);
      } else {
        const error = await response.json();
        setMessage(error.message || (isAmharic ? 'ኮድ መላክ አልተቻለም' : 'Failed to send OTP'));
      }
    } catch (error) {
      setMessage(isAmharic ? 'ኮድ መላክ አልተቻለም' : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (!phone) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-28">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-6 sm:p-8 transition-colors duration-300">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {t('auth.verify_otp', 'Verify OTP')}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {isAmharic ? `ወደ ${phone} የተላከውን የማረጋገጫ ኮድ ያስገቡ` : `Enter the verification code sent to ${phone}`}
            </p>
          </div>
          
          {message && (
            <div className={`p-3.5 mb-6 rounded-xl text-sm font-medium border ${
              message.includes('sent') || message.includes('ተልኳል')
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {message}
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-text-secondary mb-1.5">
                {isAmharic ? 'የማረጋገጫ ኮድ (OTP)' : 'OTP Code'}
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted text-center tracking-widest text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.trim().length === 0}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading 
                ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Verifying...') 
                : (isAmharic ? 'ኮዱን አረጋግጥ' : 'Verify OTP')}
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
              <Link 
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('action.back', 'Back to Login')}
              </Link>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading}
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 disabled:text-text-muted transition-colors font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {countdown > 0 
                  ? (isAmharic ? `በ ${countdown} ሰከንድ ውስጥ ድጋሚ ላክ` : `Resend in ${countdown}s`) 
                  : (isAmharic ? 'ድጋሚ ኮድ ላክ' : 'Resend Code')}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}