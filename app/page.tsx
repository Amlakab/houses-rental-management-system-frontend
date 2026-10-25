'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { encryptionService } from '@/lib/encryptionUtils';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaMapMarker,
  FaPhone,
  FaEnvelope,
  FaArrowLeft,
  FaArrowRight,
  FaHome,
  FaBuilding,
  FaCity,
  FaChartLine,
  FaHandshake,
  FaStar,
  FaFire,
  FaBed,
  FaBath,
  FaSquare,
  FaSearch,
  FaUsers,
  FaClock,
  FaAward,
  FaFileContract,
  FaHandHoldingUsd,
  FaKey,
} from 'react-icons/fa';
import api from '@/app/utils/api';

interface House {
  _id: string;
  title: string;
  description: string;
  propertyType: 'APARTMENT' | 'VILLA' | 'CONDO' | 'HOUSE' | 'LAND';
  price: number;
  view: number;
  status: string;
  approvalStatus?: string;
  details: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    parkingSpaces: number;
    furnished: boolean;
    amenities?: string[];
  };
  location: {
    city: string;
    state: string;
  };
  images?: Array<{ data?: any; contentType?: string }>;
  created_at: string;
}

const images = {
  hero1: '/INSA/image1.jpg',
  hero2: '/INSA/image17.jpg',
  hero3: '/INSA/image21.jpg',
  hero4: '/INSA/image22.jpg',
  hero5: '/INSA/image23.jpg',
  about: '/INSA/image15.jpg',
  services: '/INSA/image11.jpg',
  office: '/INSA/image18.jpg',
};

interface ContactFormData {
  phone: string;
  email: string;
  name: string;
  subject: string;
  message: string;
}

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('right');
  const [featuredProperties, setFeaturedProperties] = useState<House[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();

  const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
  const [formData, setFormData] = useState<ContactFormData>({
    phone: '',
    email: '',
    name: '',
    subject: 'Real Estate Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Slides data with bilingual support
  const slides = [
    {
      image: images.hero1,
      title: isAmharic ? 'የህልምዎን ቤት ያግኙ' : 'Find Your Dream Home',
      description: isAmharic 
        ? 'ከአኗኗርዎ እና ከአቅምዎ ጋር የሚስማማውን ምርጥ ቤት በቀላሉ ይፈልጉ።' 
        : 'Discover the perfect property that matches your lifestyle and budget.',
    },
    {
      image: images.hero2,
      title: isAmharic ? 'ዘመናዊ የቅንጦት ቤቶች' : 'Luxury Properties',
      description: isAmharic 
        ? 'የተመረጡ ዘመናዊ ቪላዎች እና የቅንጦት አፓርታማዎችን ያስሱ።' 
        : 'Explore our exclusive collection of premium homes and estates.',
    },
    {
      image: images.hero3,
      title: isAmharic ? 'የባለሙያ ድጋፍ እና ምክር' : 'Expert Guidance',
      description: isAmharic 
        ? 'በእያንዳንዱ የቤት ግዢ እና ኪራይ ሂደት ውስጥ ባለሙያዎቻችን ያግዙዎታል።' 
        : 'Let our experienced agents guide you through every step.',
    },
    {
      image: images.hero4,
      title: isAmharic ? 'አዋጭ ኢንቨስትመንት' : 'Smart Investments',
      description: isAmharic 
        ? 'በእውነተኛ የገበያ መረጃ ላይ የተመሰረተ ትክክለኛ የሪል እስቴት ውሳኔ ያድርጉ።' 
        : 'Make informed real estate decisions with our market insights.',
    },
    {
      image: images.hero5,
      title: isAmharic ? 'የታመነ የረጅም ጊዜ አጋር' : 'Your Trusted Partner',
      description: isAmharic 
        ? 'በእምነት እና በታማኝነት ላይ የተመሰረተ ዘላቂ ግንኙነት እንገነባለን።' 
        : 'Building lasting relationships through trust and integrity.',
    },
  ];

  const propertyTypes = [
    { value: 'APARTMENT', label: isAmharic ? 'አፓርታማ' : 'Apartment', icon: <FaBuilding /> },
    { value: 'VILLA', label: isAmharic ? 'ቪላ' : 'Villa', icon: <FaHome /> },
    { value: 'CONDO', label: isAmharic ? 'ኮንዶሚኒየም' : 'Condo', icon: <FaBuilding /> },
    { value: 'HOUSE', label: isAmharic ? 'መኖሪያ ቤት' : 'House', icon: <FaHome /> },
    { value: 'LAND', label: isAmharic ? 'መሬት' : 'Land', icon: <FaCity /> },
  ];

  const getImageUrl = (propertyId: string): string => {
    return `${BASE_URL}/public/houses/${propertyId}/image`;
  };

  const handleImageError = (propertyId: string) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPropertyTypeLabel = (type: string) => {
    const prop = propertyTypes.find(p => p.value === type);
    return prop ? prop.label : type;
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.phone && !formData.email) {
      toast.error(isAmharic ? 'እባክዎ ስልክ ቁጥር ወይም ኢሜይል ያስገቡ' : 'Please provide either a phone number or email address', {
        position: 'top-right',
        autoClose: 3000,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isAmharic ? 'መልእክትዎ በተሳካ ሁኔታ ተልኳል! ወኪላችን በቅርቡ ያነጋግርዎታል።' : 'Message sent successfully! Our agent will contact you soon.', {
          position: 'top-right',
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
          position: 'top-right',
          autoClose: 3000,
          theme: theme === 'dark' ? 'dark' : 'light',
        });
      }
    } catch (error) {
      toast.error(isAmharic ? 'የኔትወርክ ችግር ተከስቷል። እባክዎ እንደገና ይሞክሩ።' : 'Network error. Please check your connection and try again.', {
        position: 'top-right',
        autoClose: 3000,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoadingProperties(true);
        const response = await api.get(`/public/houses?limit=3&sortBy=views&sortOrder=desc`);
        const housesData = response.data.data?.houses || response.data.houses || [];
        setFeaturedProperties(housesData.slice(0, 3));
      } catch (error) {
        console.error('Error fetching featured properties:', error);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  useEffect(() => {
    const handleUrlParams = async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const encryptedId = urlParams.get('agent_id');
        const agentId = encryptedId ? await encryptionService.decryptId(encryptedId) : null;
        const tgId = urlParams.get('tg_id');
        
        if (agentId || tgId) {
          const currentStorage = {
            agent_id: localStorage.getItem('agent_id'),
            tg_id: localStorage.getItem('tg_id')
          };
          
          if (agentId && agentId !== currentStorage.agent_id) {
            localStorage.setItem('agent_id', agentId);
          }
          
          if (tgId && tgId !== currentStorage.tg_id) {
            localStorage.setItem('tg_id', tgId);
          }
        }
      }
    };

    handleUrlParams();
  }, []);

  const nextImage = useCallback(() => {
    setSlideDirection('right');
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const prevImage = useCallback(() => {
    setSlideDirection('left');
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 6000);

    return () => clearInterval(interval);
  }, [nextImage]);

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
        {/* Hero Section with Slideshow */}
        <section className="relative min-h-[520px] sm:h-[600px] lg:h-[700px] overflow-hidden flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ x: slideDirection === 'right' ? '100%' : '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection === 'right' ? '-100%' : '100%', opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={slides[currentImageIndex].image}
                alt={slides[currentImageIndex].title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
            </motion.div>
          </AnimatePresence>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto"
              >
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-5 text-white tracking-tight drop-shadow-md">
                  {slides[currentImageIndex].title}
                </h1>
                <p className="text-sm sm:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-200 px-2 leading-relaxed drop-shadow">
                  {slides[currentImageIndex].description}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                  <Link
                    href="/public/houses"
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    {t('action.browse_properties', 'Browse Properties')}
                  </Link>
                  <Link
                    href="/contact"
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 border-2 border-white/90 hover:bg-white hover:text-gray-900 text-white rounded-xl font-bold text-sm sm:text-base transition-all duration-200 backdrop-blur-sm"
                  >
                    {t('action.contact_agent', 'Contact an Agent')}
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all backdrop-blur-sm border border-white/20"
            aria-label="Previous Image"
          >
            <FaArrowLeft size={16} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all backdrop-blur-sm border border-white/20"
            aria-label="Next Image"
          >
            <FaArrowRight size={16} />
          </button>
        </section>

        {/* About Section */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-white'}`}>
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative h-64 sm:h-80 md:h-96 w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-800"
              >
                <Image
                  src={images.about}
                  alt="About Real Estate Pro"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </motion.div>
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="lg:w-1/2"
              >
                <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase block mb-2">
                  {t('nav.about', 'About Us')}
                </span>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('home.about_title', 'Your Trusted Real Estate Partner')}
                </h2>
                <p className={`mb-4 text-sm sm:text-base leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('home.about_p1', 'With over 15 years of trusted experience in Ethiopia, we have connected thousands of families and investors with exceptional properties and secure investments.')}
                </p>
                <p className={`mb-6 text-sm sm:text-base leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('home.about_p2', 'Our mission is to provide transparent, modern, and reliable property management and house sales services.')}
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl font-bold transition-all text-sm sm:text-base"
                >
                  {t('action.learn_more', 'Learn More About Us')}
                  <span className="ml-2">→</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-[#112240]/60' : 'bg-slate-50'}`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('home.services_title', 'Our Services')}
              </h2>
              <p className={`text-sm sm:text-base md:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto px-4`}>
                {t('home.services_subtitle', 'Comprehensive real estate services tailored to your unique requirements')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[
                { 
                  icon: <FaSearch className="text-xl sm:text-2xl" />, 
                  title: isAmharic ? 'የቤት ፍለጋ' : 'Property Search', 
                  description: isAmharic ? 'በዘመናዊ የፍለጋ ዘዴዎቻችን አማካኝነት ትክክለኛውን ቤት በፍጥነት ያግኙ።' : 'Find your perfect property with our advanced search tools and expert guidance.', 
                  color: 'from-blue-500 to-blue-700' 
                },
                { 
                  icon: <FaChartLine className="text-xl sm:text-2xl" />, 
                  title: isAmharic ? 'የገበያ ትንተና' : 'Market Analysis', 
                  description: isAmharic ? 'ትክክለኛውን የቤት ዋጋ እና የገበያ ሁኔታ የተመለከተ ዝርዝር ትንታኔ ያግኙ።' : 'Get detailed market insights and property value assessments.', 
                  color: 'from-green-500 to-green-700' 
                },
                { 
                  icon: <FaFileContract className="text-xl sm:text-2xl" />, 
                  title: isAmharic ? 'የህግ ድጋፍ' : 'Legal Support', 
                  description: isAmharic ? 'ለሁሉም የቤት ግዢ እና ሽያጭ ውሎች አስተማማኝ የህግ ድጋፍ እንሰጣለን።' : 'Full legal assistance for property transactions.', 
                  color: 'from-purple-500 to-purple-700' 
                },
                { 
                  icon: <FaHandHoldingUsd className="text-xl sm:text-2xl" />, 
                  title: isAmharic ? 'የኢንቨስትመንት ምክር' : 'Investment Advice', 
                  description: isAmharic ? 'አዋጭ እና ተመራጭ የሪል እስቴት ኢንቨስትመንት ስልቶች።' : 'Smart investment strategies to maximize returns.', 
                  color: 'from-orange-500 to-orange-700' 
                },
                { 
                  icon: <FaKey className="text-xl sm:text-2xl" />, 
                  title: isAmharic ? 'የንብረት አስተዳደር' : 'Property Management', 
                  description: isAmharic ? 'የኪራይ ቤቶች እና ሕንፃዎች የተሟላ አስተዳደር አገልግሎት።' : 'Complete property management services.', 
                  color: 'from-red-500 to-red-700' 
                },
                { 
                  icon: <FaHandshake className="text-xl sm:text-2xl" />, 
                  title: isAmharic ? 'ነፃ የምክር አገልግሎት' : 'Free Consultation', 
                  description: isAmharic ? 'ከባለሙያዎቻችን ጋር ነፃ የምክር ጊዜ ይውሰዱ።' : 'Free consultation with experienced real estate professionals.', 
                  color: 'from-teal-500 to-teal-700' 
                },
              ].map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className={`p-6 rounded-2xl ${
                    theme === 'dark' ? 'bg-[#112240] border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'
                  } hover:shadow-md transition-all text-center`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-4 bg-gradient-to-r ${service.color} text-white shadow-md`}>
                    {service.icon}
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{service.title}</h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{service.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Property Types Section */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-white'}`}>
          <div className="container mx-auto">
            <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('property.types', 'Property Types')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-5">
              {propertyTypes.map((type) => (
                <Link
                  key={type.value}
                  href={`/public/houses?propertyType=${type.value}`}
                  className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border transition-all text-center ${
                    theme === 'dark'
                      ? 'bg-[#112240] border-slate-700 hover:border-blue-400 text-white'
                      : 'bg-white border-gray-200 hover:border-blue-500 text-gray-800 shadow-sm'
                  } hover:scale-105`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="text-2xl">{type.icon}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold">{type.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Properties Section */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-[#112240]/60' : 'bg-slate-50'}`}>
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <div>
                <h2 className={`text-2xl sm:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('property.featured', 'Featured Properties')}
                </h2>
                <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isAmharic ? 'በከፍተኛ ደረጃ ተፈላጊ የሆኑ ምርጥ ቤቶች' : 'Hand-picked premier properties with verified status'}
                </p>
              </div>
              <Link
                href="/public/houses"
                className="px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
              >
                {t('action.view_details', 'View All')} →
              </Link>
            </div>
            
            {loadingProperties ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : featuredProperties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 text-gray-400">
                  <FaHome className="mx-auto" />
                </div>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isAmharic ? 'በአሁኑ ሰዓት የሚገኙ ቤቶች የሉም። እባክዎ እንደገና ይመልከቱ።' : 'No properties currently listed. Check back soon!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProperties.map((property) => {
                  const imageUrl = getImageUrl(property._id);
                  const hasImageError = imageErrors[property._id] || !imageUrl;
                  
                  return (
                    <div
                      key={property._id}
                      className={`rounded-2xl overflow-hidden border transition-all duration-200 ${
                        theme === 'dark' 
                          ? 'bg-[#112240] border-slate-700 shadow-lg' 
                          : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <Link href={`/public/houses/${property._id}`} className="block">
                        {/* Property Image */}
                        <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-200 dark:bg-slate-700">
                          {!hasImageError && imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={property.title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={() => handleImageError(property._id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                              <FaHome className="text-4xl text-gray-400" />
                            </div>
                          )}

                          {/* Property Type Badge */}
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-black/60 text-white backdrop-blur-sm">
                              {getPropertyTypeLabel(property.propertyType)}
                            </span>
                          </div>

                          {/* Hot Deal Badge */}
                          {property.view > 50 && (
                            <div className="absolute top-3 right-3">
                              <span className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-gray-900 rounded-lg flex items-center gap-1 shadow-sm">
                                <FaFire size={11} /> {t('property.hot_deal', 'Hot Deal')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`text-base font-bold truncate flex-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {property.title}
                            </h3>
                            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                              {formatPrice(property.price)}
                            </span>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <FaMapMarker className="shrink-0 text-blue-500" />
                            <span className="truncate">
                              {property.location.city}, {property.location.state}
                            </span>
                          </div>
                          
                          {/* Property Details Specs */}
                          <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-300 py-2.5 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-1">
                              <FaBed className="text-blue-500" />
                              <span>{property.details?.bedrooms || 0} {t('property.beds', 'beds')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaBath className="text-blue-500" />
                              <span>{property.details?.bathrooms || 0} {t('property.baths', 'baths')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaSquare className="text-blue-500" />
                              <span>{(property.details?.area || 0).toLocaleString()} {t('property.sqft', 'sqft')}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-400">
                              <FaStar className="text-amber-400 mr-1" />
                              <span>{property.view} {t('property.views', 'views')}</span>
                            </div>
                            <span className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                              {t('action.view_details', 'View Details')}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-white'}`}>
          <div className="container mx-auto">
            <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-8 sm:mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('home.why_choose_us', 'Why Choose Us')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: <FaUsers />, title: isAmharic ? 'የሰለጠኑ ወኪሎች' : 'Expert Agents', desc: isAmharic ? 'ልምድ ያላቸው ባለሙያዎቻችን በሙሉ ልብ ያግዙዎታል።' : 'Experienced agents providing personalized guidance.' },
                { icon: <FaChartLine />, title: isAmharic ? 'የገበያ እውቀት' : 'Market Expertise', desc: isAmharic ? 'ጥልቅ የአካባቢ ገበያ መረጃ እና ትክክለኛ ዋጋዎች።' : 'Deep local market knowledge and data-driven insights.' },
                { icon: <FaHandshake />, title: isAmharic ? 'ቀዳሚ ታማኝነት' : 'Integrity First', desc: isAmharic ? 'ግልፅ፣ ታማኝ እና ከስህተት የጸዳ አሰራር።' : 'Transparent, honest, and ethical practices.' },
                { icon: <FaAward />, title: isAmharic ? 'አስተማማኝ ውጤት' : 'Proven Track Record', desc: isAmharic ? 'በሺዎች የሚቆጠሩ ደስተኛ ደንበኞች ምስክርነት።' : 'Thousands of satisfied clients and transactions.' }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-2xl border text-center ${
                    theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <h3 className={`text-base font-bold mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-[#112240]/60' : 'bg-slate-50'}`}>
          <div className="container mx-auto max-w-4xl">
            <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('contact.title', 'Contact Us')}
            </h2>
            
            <div className={`p-6 sm:p-8 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#112240] border-slate-700 shadow-xl' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <form onSubmit={handleContactSubmit} className="space-y-4">
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
                      onChange={handleContactChange} 
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
                    onChange={handleContactChange} 
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Real Estate Inquiry">{isAmharic ? 'የቤት ጥያቄ' : 'Real Estate Inquiry'}</option>
                    <option value="Property Viewing">{isAmharic ? 'ቤት የመጎብኘት ቀጠሮ' : 'Schedule Property Viewing'}</option>
                    <option value="Selling Property">{isAmharic ? 'ቤት መሸጥ' : 'Selling Property'}</option>
                    <option value="Investment Advice">{isAmharic ? 'የኢንቨስትመንት ምክር' : 'Investment Advice'}</option>
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
                    onChange={handleContactChange} 
                    placeholder={isAmharic ? 'የሚፈልጉትን የቤት ዓይነት ወይም ጥያቄዎን ይፃፉ...' : 'Tell us about your property needs...'} 
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
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
        </section>
      </div>

      <Footer />
    </div>
  );
}