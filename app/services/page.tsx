'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  FaHome,
  FaKey,
  FaChartLine,
  FaBuilding,
  FaHandshake,
  FaShieldAlt,
  FaSearch,
  FaFileSignature,
  FaMoneyBillWave,
  FaCalculator,
  FaCamera,
  FaArrowRight,
  FaCheckCircle,
  FaUsers,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaMapMarker,
  FaStar,
  FaAward,
  FaGem,
} from 'react-icons/fa';

const images = {
  hero: '/INSA/image1.jpg',
  buying: '/INSA/image11.jpg',
  selling: '/INSA/image16.jpg',
  renting: '/INSA/image17.jpg',
  investment: '/INSA/image18.jpg',
  management: '/INSA/image21.jpg',
  valuation: '/INSA/image22.jpg',
  consultation: '/INSA/image20.jpg',
};

const services = [
  {
    id: 'buying',
    icon: <FaHome />,
    title: 'Property Buying',
    description: 'Find your dream home with our expert guidance. We help you navigate the market, negotiate the best deals, and complete your purchase with confidence.',
    features: [
      'Personalized property search',
      'Market analysis and pricing guidance',
      'Professional negotiation support',
      'Legal documentation assistance',
      'Home inspection coordination',
      'Mortgage and financing help'
    ],
    cta: 'Start Your Search',
    ctaLink: '/public/houses',
    color: 'blue'
  },
  {
    id: 'selling',
    icon: <FaHandshake />,
    title: 'Property Selling',
    description: 'Get the best value for your property with our comprehensive selling service. From valuation to closing, we maximize your returns.',
    features: [
      'Free property valuation',
      'Professional photography and staging',
      'Multi-platform marketing',
      'Open house organization',
      'Negotiation expertise',
      'Closing coordination'
    ],
    cta: 'Sell Your Property',
    ctaLink: '/contact',
    color: 'green'
  },
  {
    id: 'renting',
    icon: <FaKey />,
    title: 'Property Renting',
    description: 'Find the perfect rental property or lease your property to quality tenants. Our rental services make the process seamless.',
    features: [
      'Tenant screening and verification',
      'Lease agreement preparation',
      'Rent collection management',
      'Property maintenance coordination',
      'Legal compliance assistance',
      'Renewal and move-out services'
    ],
    cta: 'Find a Rental',
    ctaLink: '/public/houses?status=RENTED',
    color: 'purple'
  },
  {
    id: 'investment',
    icon: <FaChartLine />,
    title: 'Real Estate Investment',
    description: 'Build wealth through strategic real estate investments. Our experts identify opportunities that maximize your returns.',
    features: [
      'Market opportunity analysis',
      'ROI calculation and forecasting',
      'Property portfolio building',
      'Risk assessment',
      'Tax strategy optimization',
      'Exit strategy planning'
    ],
    cta: 'Start Investing',
    ctaLink: '/contact',
    color: 'orange'
  },
  {
    id: 'commercial',
    icon: <FaBuilding />,
    title: 'Commercial Real Estate',
    description: 'Find the perfect commercial space for your business or invest in commercial properties with high growth potential.',
    features: [
      'Office space search',
      'Retail location analysis',
      'Industrial property solutions',
      'Lease negotiation',
      'Investment property analysis',
      'Property management'
    ],
    cta: 'Explore Commercial',
    ctaLink: '/contact',
    color: 'red'
  },
  {
    id: 'management',
    icon: <FaShieldAlt />,
    title: 'Property Management',
    description: 'Maximize your property\'s value and minimize stress with our full-service property management solutions.',
    features: [
      'Tenant placement and screening',
      'Rent collection and financial reporting',
      '24/7 maintenance coordination',
      'Regular property inspections',
      'Legal compliance',
      'Eviction management'
    ],
    cta: 'Manage My Property',
    ctaLink: '/contact',
    color: 'teal'
  },
  {
    id: 'valuation',
    icon: <FaCalculator />,
    title: 'Property Valuation',
    description: 'Get accurate, data-driven property valuations to make informed decisions whether buying, selling, or investing.',
    features: [
      'Comparative market analysis',
      'Professional appraisal coordination',
      'Investment value assessment',
      'Tax assessment review',
      'Market trend analysis',
      'Future value projection'
    ],
    cta: 'Get Valuation',
    ctaLink: '/contact',
    color: 'pink'
  },
  {
    id: 'consultation',
    icon: <FaUsers />,
    title: 'Free Consultation',
    description: 'Start your real estate journey with a no-obligation consultation. Our experts answer your questions and guide your next steps.',
    features: [
      'One-on-one expert advice',
      'Market overview presentation',
      'Personalized action plan',
      'Timeline and budget planning',
      'Documentation checklist',
      'Resource recommendations'
    ],
    cta: 'Book Consultation',
    ctaLink: '/contact',
    color: 'indigo'
  }
];

const stats = [
  { number: '15,000+', label: 'Happy Clients', icon: <FaUsers /> },
  { number: '2,500+', label: 'Properties Sold', icon: <FaHome /> },
  { number: '98%', label: 'Client Satisfaction', icon: <FaStar /> },
  { number: '$2.5B+', label: 'Sales Volume', icon: <FaMoneyBillWave /> },
  { number: '24/7', label: 'Client Support', icon: <FaClock /> },
  { number: '15+', label: 'Years Experience', icon: <FaAward /> },
];

const process = [
  {
    step: '01',
    title: 'Initial Consultation',
    description: 'We discuss your needs, goals, and preferences to understand exactly what you\'re looking for.',
    icon: <FaUsers />
  },
  {
    step: '02',
    title: 'Property Search/Analysis',
    description: 'Our team searches for properties or analyzes your property to determine market value and strategy.',
    icon: <FaSearch />
  },
  {
    step: '03',
    title: 'Negotiation & Offer',
    description: 'We handle all negotiations to ensure you get the best possible terms and price.',
    icon: <FaHandshake />
  },
  {
    step: '04',
    title: 'Documentation & Legal',
    description: 'Our legal experts ensure all paperwork is complete, accurate, and compliant.',
    icon: <FaFileSignature />
  },
  {
    step: '05',
    title: 'Closing & Transfer',
    description: 'We coordinate the final closing process and ensure smooth property transfer.',
    icon: <FaCheckCircle />
  }
];

const testimonials = [
  {
    name: 'Amlakie Abebaw',
    role: 'Home Buyer',
    image: '/images/amlakie1.jpg',
    content: 'The team at RealEstate Pro made buying our first home a breeze. Their expertise and guidance were invaluable throughout the entire process.',
    rating: 5
  },
  {
    name: 'Bezabh Abebaw',
    role: 'Property Seller',
    image: '/images/bezab1.jpg',
    content: 'Sold my property in just 2 weeks! Their marketing strategy and negotiation skills got me above asking price.',
    rating: 5
  },
  {
    name: 'Bruk Dessalegn',
    role: 'Investor',
    image: '/images/amlakie2.jpg',
    content: 'Their investment advice has been spot-on. My portfolio has grown significantly thanks to their market insights.',
    rating: 5
  }
];

const ServicePage = () => {
  const { theme } = useTheme();
  const [activeService, setActiveService] = useState<string | null>(null);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', border: 'border-blue-600' },
      green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-green-600', border: 'border-green-600' },
      purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-600', border: 'border-purple-600' },
      orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', text: 'text-orange-600', border: 'border-orange-600' },
      red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', text: 'text-red-600', border: 'border-red-600' },
      teal: { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', text: 'text-teal-600', border: 'border-teal-600' },
      pink: { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', text: 'text-pink-600', border: 'border-pink-600' },
      indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-600', border: 'border-indigo-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-gray-50 to-white text-gray-900'
    }`}>
      <Navbar />
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={images.hero}
              alt="Real Estate Services"
              fill
              className="object-cover"
              priority
            />
            <div className={`absolute inset-0 ${
              theme === 'dark' ? 'bg-black/70' : 'bg-black/60'
            }`}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white px-2">
                Comprehensive Real Estate Services
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 px-4">
                From buying and selling to property management and investment consulting, 
                we offer end-to-end solutions for all your real estate needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-lg font-medium text-sm sm:text-base md:text-lg transition-all duration-300 shadow-lg"
                >
                  Get Free Consultation
                  <FaArrowRight className="ml-2 text-sm sm:text-base" />
                </Link>
                <Link
                  href="/public/houses"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-white hover:bg-white/10 text-white rounded-lg font-medium text-sm sm:text-base md:text-lg transition-all duration-300"
                >
                  Browse Properties
                  <FaSearch className="ml-2 text-sm sm:text-base" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`py-12 sm:py-16 px-4 ${
          theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
        }`}>
          <div className="container mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 sm:mb-3 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <div className="text-xl sm:text-2xl text-blue-600">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-12 sm:py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                What We Offer
              </h2>
              <p className={`text-base sm:text-lg max-w-3xl mx-auto px-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Comprehensive real estate solutions tailored to your unique needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {services.map((service, index) => {
                const colors = getColorClasses(service.color);
                return (
                  <motion.div
                    key={service.id}
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white'
                    }`}
                    onClick={() => setActiveService(activeService === service.id ? null : service.id)}
                  >
                    <div className="p-4 sm:p-6">
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full mb-3 sm:mb-4 ${colors.bg} bg-opacity-20`}>
                        <div className={`text-xl sm:text-2xl ${colors.text}`}>
                          {service.icon}
                        </div>
                      </div>
                      <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 ${colors.text}`}>
                        {service.title}
                      </h3>
                      <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {service.description}
                      </p>
                      
                      {/* Expandable Features */}
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                          height: activeService === service.id ? 'auto' : 0,
                          opacity: activeService === service.id ? 1 : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
                          {service.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                              <FaCheckCircle className={`text-green-500 text-[10px] sm:text-xs flex-shrink-0`} />
                              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                {feature}
                              </span>
                            </div>
                          ))}
                          <Link
                            href={service.ctaLink}
                            className={`inline-flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 text-xs sm:text-sm font-medium ${colors.text} hover:underline`}
                          >
                            {service.cta} <FaArrowRight size={10} />
                          </Link>
                        </div>
                      </motion.div>
                      
                      <button
                        className={`mt-3 sm:mt-4 text-xs sm:text-sm font-medium ${colors.text} hover:underline flex items-center gap-1`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveService(activeService === service.id ? null : service.id);
                        }}
                      >
                        {activeService === service.id ? 'Show Less' : 'Learn More'}
                        <FaArrowRight size={10} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Process - Mobile Responsive */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
        }`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                How It Works
              </h2>
              <p className={`text-base sm:text-lg max-w-3xl mx-auto px-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                A simple, transparent process designed for your convenience
              </p>
            </motion.div>

            {/* Mobile Process (Vertical Cards) */}
            <div className="lg:hidden space-y-5 sm:space-y-6">
              {process.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-5 sm:p-6 rounded-xl ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-xl">
                      {step.step}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">{step.title}</h3>
                  </div>
                  <p className={`text-sm sm:text-base ml-0 sm:ml-16 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Desktop Process (Timeline) */}
            <div className="hidden lg:block relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-600"></div>
              
              <div className="space-y-12">
                {process.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex flex-col lg:flex-row items-center gap-8 ${
                      index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    }`}
                  >
                    <div className="lg:w-1/2">
                      <div className={`p-6 rounded-xl ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                      } shadow-lg`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                            {step.step}
                          </div>
                          <h3 className="text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="lg:w-1/2 flex justify-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${
                        theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {step.icon}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-12 sm:py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Why Choose RealEstate Pro?
              </h2>
              <p className={`text-base sm:text-lg max-w-3xl mx-auto px-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Experience the difference with our award-winning service
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4 ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <FaGem className="text-xl sm:text-2xl text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">Expert Agents</h3>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} px-2`}>
                  Our team brings years of experience and deep market knowledge to every transaction.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4 ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <FaHandshake className="text-xl sm:text-2xl text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">Client First Approach</h3>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} px-2`}>
                  Your goals are our priority. We're committed to your success and satisfaction.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4 ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <FaChartLine className="text-xl sm:text-2xl text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">Market Leadership</h3>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} px-2`}>
                  We lead with data-driven insights and innovative marketing strategies.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
        }`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                What Our Clients Say
              </h2>
              <p className={`text-base sm:text-lg max-w-3xl mx-auto px-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Real stories from satisfied clients we've helped
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className={`p-5 sm:p-6 rounded-xl ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg`}
                >
                  <div className="flex items-center gap-1 mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-500 text-xs sm:text-sm" />
                    ))}
                  </div>
                  <p className={`mb-3 sm:mb-4 italic text-sm sm:text-base ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    "{testimonial.content}"
                  </p>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold">{testimonial.name}</h4>
                    <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {testimonial.role}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-white px-2">
                Ready to Get Started?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-white/90 px-4">
                Contact us today for a free consultation. Let's discuss how we can help you achieve your real estate goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <Link
                  href="/contact"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white hover:bg-gray-100 text-blue-600 rounded-lg font-medium text-sm sm:text-base md:text-lg transition-all duration-300 shadow-lg"
                >
                  Schedule Consultation
                </Link>
                <Link
                  href="/public/houses"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-white hover:bg-white/10 text-white rounded-lg font-medium text-sm sm:text-base md:text-lg transition-all duration-300"
                >
                  Browse Properties
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default ServicePage;