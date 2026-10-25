'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaMapMarker,
  FaPhone,
  FaEnvelope,
  FaClock,
} from 'react-icons/fa';

export default function ContactPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  
  const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
  
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    subject: 'Real Estate Inquiry',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.phone && !formData.email) {
      toast.error(isAmharic ? 'እባክዎ ስልክ ቁጥር ወይም ኢሜይል ያስገቡ' : 'Please provide either a phone number or email address', {
        position: "top-right",
        autoClose: 3000,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isAmharic ? 'መልእክትዎ በተሳካ ሁኔታ ተልኳል! በቅርቡ እናገኝዎታለን።' : 'Message sent successfully! We will get back to you soon.', {
          position: "top-right",
          autoClose: 3000,
          theme: theme === 'dark' ? 'dark' : 'light',
        });
        
        setFormData({
          phone: '',
          email: '',
          name: '',
          subject: 'Real Estate Inquiry',
          message: ''
        });
      } else {
        toast.error(`Error: ${result.error || 'Failed to send message'}`, {
          position: "top-right",
          autoClose: 3000,
          theme: theme === 'dark' ? 'dark' : 'light',
        });
      }
    } catch (error) {
      toast.error(isAmharic ? 'የኔትወርክ ችግር ተከስቷል። እባክዎ እንደገና ይሞክሩ።' : 'Network error. Please check your connection and try again.', {
        position: "top-right",
        autoClose: 3000,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
    } finally {
      setIsSubmitting(false);
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
      
      <div className="pt-16 sm:pt-20">
        <section className={`py-12 sm:py-16 px-4 ${
          theme === 'dark' ? 'bg-[#0a192f]' : 'bg-[#f8fafc]'
        }`}>
          <div className="container mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-2">
                {isAmharic ? 'ያግኙን' : 'Get in Touch'}
              </span>
              <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('contact.title', 'Contact Us')}
              </h1>
              <p className={`text-sm sm:text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t('contact.subtitle', 'Have questions? Get in touch with our expert real estate team today.')}
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
              {[
                { 
                  icon: <FaMapMarker className="text-xl" />, 
                  title: isAmharic ? 'አድራሻ' : 'Office Location', 
                  desc: isAmharic ? 'አዲስ አበባ፣ ቦሌ፣ ኢትዮጵያ' : 'Bole, Addis Ababa, Ethiopia' 
                },
                { 
                  icon: <FaPhone className="text-xl" />, 
                  title: isAmharic ? 'ስልክ ቁጥር' : 'Phone', 
                  desc: '+251 906 974 055' 
                },
                { 
                  icon: <FaEnvelope className="text-xl" />, 
                  title: isAmharic ? 'ኢሜይል' : 'Email', 
                  desc: 'info@realestatepro.com' 
                },
                { 
                  icon: <FaClock className="text-xl" />, 
                  title: isAmharic ? 'የስራ ሰዓት' : 'Office Hours', 
                  desc: isAmharic ? 'ሰኞ - አርብ፡ 2:30 - 11:30' : 'Mon - Fri: 8:30 AM - 5:30 PM' 
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3.5 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {card.icon}
                  </div>
                  <h3 className={`text-base font-bold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {card.title}
                  </h3>
                  <p className={`text-xs sm:text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Map and Form Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Google Map */}
              <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-800 h-72 sm:h-96 lg:h-[460px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.869244319124!2d38.76321431536945!3d9.012326893541918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85f1a4b1f3b5%3A0x1c5b5b5b5b5b5b5b!2sAddis%20Ababa%2C%20Ethiopia!5e0!3m2!1sen!2set!4v1633080000000!5m2!1sen!2set"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Location Map"
                />
              </div>

              {/* Contact Form Card */}
              <div className={`p-6 sm:p-8 rounded-3xl border ${
                theme === 'dark' ? 'bg-[#112240] border-slate-700 shadow-xl' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {t('contact.form_title', 'Send us a Message')}
                </h3>
                <p className={`text-xs sm:text-sm mb-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {isAmharic 
                    ? 'ጥያቄዎን ወይም አስተያየትዎን ይፃፉልን፤ ወኪሎቻችን በፍጥነት ምላሽ ይሰጡዎታል።' 
                    : 'Fill out the form below and an agent will respond within 24 hours.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        {isAmharic ? 'ሙሉ ስም *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          theme === 'dark' 
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder={isAmharic ? 'ሙሉ ስምዎን ያስገቡ' : 'Your name'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        {isAmharic ? 'ኢሜይል ወይም ስልክ *' : 'Email or Phone *'}
                      </label>
                      <input
                        type="text"
                        name="contact"
                        value={formData.email || formData.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.includes('@')) {
                            setFormData({...formData, email: value, phone: ''});
                          } else {
                            setFormData({...formData, phone: value, email: ''});
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          theme === 'dark' 
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder={isAmharic ? '+251 9... ወይም info@...' : '+251... or email@...'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      {isAmharic ? 'ርዕስ *' : 'Subject *'}
                    </label>
                    <select
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Real Estate Inquiry">{isAmharic ? 'የቤት ግዢ ወይም ኪራይ ጥያቄ' : 'Real Estate Inquiry'}</option>
                      <option value="Property Viewing">{isAmharic ? 'ቤት የመጎብኘት ቀጠሮ' : 'Schedule Property Viewing'}</option>
                      <option value="Selling Property">{isAmharic ? 'ቤት መሸጥ' : 'Selling Property'}</option>
                      <option value="Investment Advice">{isAmharic ? 'የኢንቨስትመንት ምክር' : 'Investment Advice'}</option>
                      <option value="Technical Support">{isAmharic ? 'ቴክኒካዊ ድጋፍ' : 'Technical Support'}</option>
                      <option value="Partnership">{isAmharic ? 'የትብብር እድሎች' : 'Partnership Opportunities'}</option>
                      <option value="Other">{isAmharic ? 'ሌላ' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      {isAmharic ? 'መልእክት *' : 'Message *'}
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder={isAmharic ? 'መልእክትዎን እዚህ ያስገቡ...' : 'Your message...'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting 
                      ? (isAmharic ? 'በመላክ ላይ...' : 'Sending...') 
                      : (isAmharic ? 'መልእክት ላክ' : 'Send Message')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}