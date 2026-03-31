'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useTheme } from '@/lib/theme-context';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaMapMarker,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';

export default function ContactPage() {
  const { theme } = useTheme();
  
  const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
  
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    subject: '',
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
      toast.error('Please provide either a phone number or email address', {
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
        toast.success('Message sent successfully! We will get back to you soon.', {
          position: "top-right",
          autoClose: 3000,
          theme: theme === 'dark' ? 'dark' : 'light',
        });
        
        // Reset form
        setFormData({
          phone: '',
          email: '',
          name: '',
          subject: '',
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
      console.error('Submission error:', error);
      toast.error('Network error. Please check your connection and try again.', {
        position: "top-right",
        autoClose: 3000,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-background text-text-primary'
    }`}>
      <Navbar />
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
      
      <div className="pt-16">
        <section className={`py-16 px-4 ${
          theme === 'dark' ? 'bg-transparent' : 'bg-background'
        }`}>
          <div className="container mx-auto">
            <h2 className={`text-3xl font-bold text-center mb-12 ${
              theme === 'dark' ? 'text-primary' : 'text-primary'
            }`}>
              Contact Us
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
                  <FaMapMarker className="text-primary text-xl" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-text-primary'
                }`}>
                  Location
                </h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-text-secondary'}>
                  Addis Abeba, Ethiopia
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
                  <FaPhone className="text-primary text-xl" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-text-primary'
                }`}>
                  Phone
                </h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-text-secondary'}>
                  +251 9 06 97 40 55
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
                  <FaEnvelope className="text-primary text-xl" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-text-primary'
                }`}>
                  Email
                </h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-text-secondary'}>
                  Zelalem@gmail.com
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="rounded-xl overflow-hidden shadow-xl"
              >
                <div className="h-96">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.869244319124!2d38.76321431536945!3d9.012326893541918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85f1a4b1f3b5%3A0x1c5b5b5b5b5b5b5b!2sAddis%20Ababa%2C%20Ethiopia!5e0!3m2!1sen!2set!4v1633080000000!5m2!1sen!2set"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <h3 className={`text-2xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-primary' : 'text-primary'
                }`}>
                  Send us a Message
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-surface/50 border-border text-white placeholder-gray-400' 
                            : 'bg-background border-border text-text-primary'
                        }`}
                        placeholder="Full Name *"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        id="contact"
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
                        className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-surface/50 border-border text-white placeholder-gray-400' 
                            : 'bg-background border-border text-text-primary'
                        }`}
                        placeholder="Email or Phone *"
                      />
                    </div>
                  </div>

                  <div>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-surface/50 border-border text-white' 
                          : 'bg-background border-border text-text-primary'
                      }`}
                    >
                      <option value="">Select Subject *</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="account-issues">Account Issues</option>
                      <option value="payment-issues">Payment Issues</option>
                      <option value="game-suggestions">Game Suggestions</option>
                      <option value="partnership">Partnership Opportunities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-surface/50 border-border text-white placeholder-gray-400' 
                          : 'bg-background border-border text-text-primary'
                      }`}
                      placeholder="Your Message *"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full px-6 py-3 rounded-lg font-medium text-base transition-colors duration-300 flex items-center justify-center ${
                      theme === 'dark' 
                        ? 'bg-primary hover:bg-secondary text-white' 
                        : 'bg-primary hover:bg-secondary text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true }}
              className={`mt-12 p-6 rounded-xl ${
                theme === 'dark' ? 'bg-surface/50 border border-border' : 'bg-gray-50 border'
              }`}
            >
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-primary' : 'text-primary'
              }`}>
                Response Time
              </h3>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-text-secondary'}>
                We typically respond to all inquiries within 24 hours. For urgent matters, 
                please call our support line during business hours (9 AM - 6 PM GMT+3).
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}