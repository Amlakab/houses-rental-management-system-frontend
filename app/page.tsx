'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { encryptionService } from '@/lib/encryptionUtils';
import { useTheme } from '@/lib/theme-context';
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
  FaShieldAlt,
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

// Define types for house - MATCH PublicHousesPage
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

// Import images for real estate
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

// Interface for Contact Form
interface ContactFormData {
  phone: string;
  email: string;
  name: string;
  subject: string;
  message: string;
}

// Slides data for real estate
const slides = [
  {
    image: images.hero1,
    title: "Find Your Dream Home",
    description: "Discover the perfect property that matches your lifestyle and budget.",
  },
  {
    image: images.hero2,
    title: "Luxury Properties",
    description: "Explore our exclusive collection of premium homes and estates.",
  },
  {
    image: images.hero3,
    title: "Expert Guidance",
    description: "Let our experienced agents guide you through every step.",
  },
  {
    image: images.hero4,
    title: "Smart Investments",
    description: "Make informed real estate decisions with our market insights.",
  },
  {
    image: images.hero5,
    title: "Your Trusted Partner",
    description: "Building lasting relationships through trust and integrity.",
  },
];

// Property Types
const propertyTypes = [
  { value: 'APARTMENT', label: 'Apartment', icon: <FaBuilding /> },
  { value: 'VILLA', label: 'Villa', icon: <FaHome /> },
  { value: 'CONDO', label: 'Condo', icon: <FaBuilding /> },
  { value: 'HOUSE', label: 'House', icon: <FaHome /> },
  { value: 'LAND', label: 'Land', icon: <FaCity /> },
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState("right");
  const [featuredProperties, setFeaturedProperties] = useState<House[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { theme } = useTheme();
  
  // Contact form state
  const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
  const [formData, setFormData] = useState<ContactFormData>({
    phone: '',
    email: '',
    name: '',
    subject: 'Real Estate Inquiry',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get image URL - SAME AS PublicHousesPage
  const getImageUrl = (houseId: string): string => {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${serverUrl}/api/public/houses/${houseId}/image`;
  };

  const handleImageError = (propertyId: string) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }));
  };

  // Format price function
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get property type label
  const getPropertyTypeLabel = (type: string) => {
    const prop = propertyTypes.find(p => p.value === type);
    return prop ? prop.label : type;
  };

  // Contact form handlers
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
        toast.success('Message sent successfully! Our agent will contact you soon.', {
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

  // Fetch featured properties - SAME AS PublicHousesPage (no status filters)
 // In your home page, replace the fetchFeaturedProperties with this:

useEffect(() => {
  const fetchFeaturedProperties = async () => {
    try {
      setLoadingProperties(true);
      console.log('🔍 Fetching featured properties...');
      
      // Fetch without any filters - get all houses
      const response = await api.get(`/public/houses?limit=3&sortBy=views&sortOrder=desc`);
      
      console.log('📦 API Response:', response.data);
      
      const houses = response.data.data.houses || [];
      const pagination = response.data.data.pagination;
      
      // console.log(`🏠 Houses returned: ${houses.length}`);
      // console.log(`📊 Total houses in DB: ${pagination?.totalHouses || 0}`);
      
      // if (houses.length === 0) {
      //   console.log('⚠️ No houses found. Trying to fetch without limit...');
      //   // Try to fetch all houses to see if any exist
      //   const allResponse = await api.get(`/public/houses?limit=100`);
      //   console.log('📦 All houses response:', allResponse.data);
      //   console.log(`🏠 All houses count: ${allResponse.data.data.houses?.length || 0}`);
      // }
      
      setFeaturedProperties(houses);
      setImageErrors({});
    } catch (error: any) {
      console.error('❌ Error fetching featured properties:', error);
      console.error('Error details:', error.response?.data);
      setFeaturedProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  fetchFeaturedProperties();
}, []);

  // Handle URL parameters
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

  // Slideshow navigation
  const nextImage = useCallback(() => {
    setSlideDirection("right");
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const prevImage = useCallback(() => {
    setSlideDirection("left");
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentImageIndex, nextImage]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-gray-50 to-white text-gray-900'
    }`}>
      <Navbar />
      
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
        {/* Hero Section with Slideshow */}
        <section className="relative h-screen overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ x: slideDirection === "right" ? "100%" : "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection === "right" ? "-100%" : "100%", opacity: 0 }}
              transition={{ duration: 0.5 }}
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
              <div className={`absolute inset-0 ${
                theme === 'dark' ? 'bg-black/60' : 'bg-black/50'
              }`}></div>
            </motion.div>
          </AnimatePresence>

          {/* Hero Content */}
          <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ x: slideDirection === "right" ? 100 : -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDirection === "right" ? -100 : 100, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                  {slides[currentImageIndex].title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-white/90">
                  {slides[currentImageIndex].description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/public/houses"
                      className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg font-medium text-lg transition-colors duration-300 shadow-lg"
                    >
                      Browse Properties
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/contact"
                      className="inline-block px-8 py-3 border-2 border-white hover:bg-white/10 text-white rounded-lg font-medium text-lg transition-colors duration-300"
                    >
                      Contact an Agent
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full ${
              theme === 'dark' 
                ? 'bg-gray-800/80 hover:bg-gray-700' 
                : 'bg-white/80 hover:bg-white'
            } transition-all duration-300`}
            aria-label="Previous Image"
          >
            <FaArrowLeft className={theme === 'dark' ? 'text-white' : 'text-gray-800'} size={20} />
          </button>
          <button
            onClick={nextImage}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full ${
              theme === 'dark' 
                ? 'bg-gray-800/80 hover:bg-gray-700' 
                : 'bg-white/80 hover:bg-white'
            } transition-all duration-300`}
            aria-label="Next Image"
          >
            <FaArrowRight className={theme === 'dark' ? 'text-white' : 'text-gray-800'} size={20} />
          </button>
        </section>

        {/* About Section */}
        <section className={`py-16 px-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="relative h-80 md:h-96 w-full lg:w-1/2 rounded-xl overflow-hidden shadow-xl"
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
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="lg:w-1/2"
              >
                <h2 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Your Trusted Real Estate Partner
                </h2>
                <p className={`mb-6 text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Welcome to <strong className="text-blue-600">RealEstate Pro</strong>, your premier destination for finding the perfect property. 
                  With over 15 years of experience in the real estate market, we've helped thousands of 
                  families and investors find their dream homes and make smart property investments.
                </p>
                <p className={`mb-6 text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Our mission is to provide exceptional service, expert guidance, and market insights 
                  to help you navigate the real estate journey with confidence and success.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center px-6 py-3 border-2 border-blue-600 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg font-medium transition-colors duration-300 text-base"
                >
                  Learn More About Us
                  <span className="ml-2">→</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className={`py-16 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Our Services
              </h2>
              <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
                Comprehensive real estate services tailored to your needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Services cards - keep as is */}
              {[
                { icon: <FaSearch className="text-3xl" />, title: "Property Search", description: "Find your perfect property with our advanced search tools and expert guidance.", color: "from-blue-500 to-blue-700" },
                { icon: <FaChartLine className="text-3xl" />, title: "Market Analysis", description: "Get detailed market insights and property value assessments.", color: "from-green-500 to-green-700" },
                { icon: <FaFileContract className="text-3xl" />, title: "Legal Support", description: "Full legal assistance for property transactions.", color: "from-purple-500 to-purple-700" },
                { icon: <FaHandHoldingUsd className="text-3xl" />, title: "Investment Advice", description: "Smart investment strategies to maximize returns.", color: "from-orange-500 to-orange-700" },
                { icon: <FaKey className="text-3xl" />, title: "Property Management", description: "Complete property management services.", color: "from-red-500 to-red-700" },
                { icon: <FaHandshake className="text-3xl" />, title: "Consultation", description: "Free consultation with experienced professionals.", color: "from-teal-500 to-teal-700" },
              ].map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className={`p-6 rounded-xl ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg hover:shadow-xl transition-all duration-300 text-center`}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-r ${service.color}`}>
                    <div className="text-white">{service.icon}</div>
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{service.title}</h3>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{service.description}</p>
                </motion.div>
              ))}
            </div>
             <div className="text-center mt-12">
              <Link
                href="/services"
                className="inline-flex items-center px-6 py-3 border-2 border-blue-600 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg font-medium transition-colors duration-300 text-base"
              >
               Read More About Our Services
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Property Types Section */}
        <section className={`py-16 px-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
          <div className="container mx-auto">
            <h2 className={`text-3xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Property Types
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {propertyTypes.map((type, index) => (
                <motion.div
                  key={type.value}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="text-center cursor-pointer"
                  onClick={() => window.location.href = `/public/houses?propertyType=${type.value}`}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <div className="text-2xl text-blue-600">{type.icon}</div>
                  </div>
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{type.label}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Properties Section */}
        <section className={`py-16 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="container mx-auto">
            <h2 className={`text-3xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Featured Properties
            </h2>
            
            {loadingProperties ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : featuredProperties.length === 0 ? (
              <div className="text-center py-12">
                <div className={`text-6xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}>
                  <FaHome />
                </div>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  No properties available. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredProperties.map((property, index) => {
                  const imageUrl = getImageUrl(property._id);
                  const hasImageError = imageErrors[property._id] || !imageUrl;
                  
                  return (
                    <motion.div
                      key={property._id}
                      initial={{ y: 50, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -5 }}
                      className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                        theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white'
                      }`}
                    >
                      <Link href={`/public/houses/${property._id}`} className="block">
                        {/* Property Image */}
                        <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                          {!hasImageError && imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={property.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={() => handleImageError(property._id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                              <FaHome className="text-4xl text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          {/* Property Type Badge */}
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              theme === 'dark' 
                                ? 'bg-gray-800 text-gray-300' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getPropertyTypeLabel(property.propertyType)}
                            </span>
                          </div>
                          {/* Popular Badge */}
                          {property.view > 100 && (
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-gray-900 rounded flex items-center gap-1">
                                <FaFire size={10} /> Hot Deal
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-lg font-semibold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {property.title.length > 30 
                                ? `${property.title.substring(0, 30)}...` 
                                : property.title}
                            </h3>
                            <span className={`text-lg font-bold ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {formatPrice(property.price)}
                            </span>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-center gap-1 mb-3">
                            <FaMapMarker className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {property.location.city}, {property.location.state}
                            </span>
                          </div>
                          
                          {/* Property Details */}
                          <div className="flex flex-wrap gap-3 mb-3">
                            <div className="flex items-center gap-1">
                              <FaBed className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {property.details.bedrooms} beds
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaBath className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {property.details.bathrooms} baths
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaSquare className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {property.details.area.toLocaleString()} sqft
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <FaStar className="text-yellow-500 mr-1 text-sm" />
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {property.view} views
                                </span>
                              </div>
                              <div className={`flex items-center ${
                                property.status === 'AVAILABLE' 
                                  ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                  : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-1 ${
                                  property.status === 'AVAILABLE' 
                                    ? theme === 'dark' ? 'bg-green-400' : 'bg-green-600'
                                    : theme === 'dark' ? 'bg-red-400' : 'bg-red-600'
                                }`}></div>
                                <span className="text-sm">
                                  {property.status === 'AVAILABLE' ? 'Available' : 
                                   property.status === 'SOLD' ? 'Sold' : 
                                   property.status === 'RENTED' ? 'Rented' : 'Unavailable'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/public/houses/${property._id}`;
                              }}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                theme === 'dark'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              } transition-colors duration-300 flex items-center gap-1`}
                            >
                              <FaSearch size={12} /> View Details
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div className="text-center mt-12">
              <Link
                href="/public/houses"
                className="inline-flex items-center px-6 py-3 border-2 border-blue-600 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg font-medium transition-colors duration-300 text-base"
              >
                View All Properties
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className={`py-16 px-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
          <div className="container mx-auto">
            <h2 className={`text-3xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: <FaUsers />, title: "Expert Agents", desc: "Our experienced agents provide personalized guidance." },
                { icon: <FaChartLine />, title: "Market Expertise", desc: "Deep local market knowledge and data-driven insights." },
                { icon: <FaHandshake />, title: "Integrity First", desc: "Transparent, honest, and ethical practices." },
                { icon: <FaAward />, title: "Proven Track Record", desc: "Thousands of satisfied clients and successful transactions." }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <div className="text-blue-600 text-xl">{item.icon}</div>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className={`py-16 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="container mx-auto">
            <h2 className={`text-3xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Get In Touch
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <FaMapMarker className="text-blue-600 text-xl" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Visit Our Office</h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>123 Real Estate Avenue<br />Downtown District<br />City Center, CC 12345</p>
              </motion.div>

              <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <FaClock className="text-blue-600 text-xl" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Office Hours</h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Mon-Fri: 9:00 AM - 6:00 PM<br />Sat: 10:00 AM - 4:00 PM<br />Sun: By Appointment</p>
              </motion.div>

              <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <FaPhone className="text-blue-600 text-xl" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Contact Us</h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>(123) 456-7890<br />info@realestatepro.com</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div initial={{ x: -100, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }} className="rounded-xl overflow-hidden shadow-xl">
                <div className="h-96">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215209132579!2d-73.98784468459363!3d40.75797897932689!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1648062964726!5m2!1sen!2sus" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
                </div>
              </motion.div>

              <motion.div initial={{ x: 100, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
                <h3 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Have Questions?</h3>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Send us a message and one of our agents will get back to you as soon as possible.</p>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input type="text" name="name" required value={formData.name} onChange={handleContactChange} className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Full Name *" />
                    </div>
                    <div>
                      <input type="text" name="contact" value={formData.email || formData.phone} onChange={(e) => { const value = e.target.value; if (value.includes('@')) { setFormData({...formData, email: value, phone: ''}); } else { setFormData({...formData, phone: value, email: ''}); } }} className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Email or Phone *" />
                    </div>
                  </div>
                  <div>
                    <select name="subject" required value={formData.subject} onChange={handleContactChange} className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <option value="Real Estate Inquiry">Real Estate Inquiry</option>
                      <option value="Property Viewing">Schedule Property Viewing</option>
                      <option value="Selling Property">Selling Property</option>
                      <option value="Investment Advice">Investment Advice</option>
                      <option value="Partnership">Partnership Opportunities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <textarea name="message" required rows={5} value={formData.message} onChange={handleContactChange} placeholder="Tell us about your property needs or questions *" className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}></textarea>
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full px-6 py-3 rounded-lg font-medium text-base transition-colors duration-300 flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white' : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white'} disabled:opacity-50`}>
                    {isSubmitting ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Sending...</>) : 'Send Message'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-16 px-4 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-800 to-blue-900' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>
          <div className="container mx-auto text-center">
            <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold mb-6 text-white">Ready to Find Your Dream Home?</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">Let our expert team guide you through the exciting journey of buying or selling your property.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/public/houses" className="px-8 py-3 bg-white hover:bg-gray-100 text-blue-600 rounded-lg font-medium text-lg transition-colors duration-300 shadow-lg">Browse Properties</Link>
                <Link href="/contact" className="px-8 py-3 border-2 border-white hover:bg-white/10 text-white rounded-lg font-medium text-lg transition-colors duration-300">Contact an Agent</Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}