'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
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
  FaArrowRight,
  FaCheckCircle,
  FaUsers,
  FaClock,
  FaStar,
  FaAward,
} from 'react-icons/fa';

const images = {
  hero: '/INSA/image1.jpg',
};

export default function ServicePage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const [activeService, setActiveService] = useState<string | null>(null);

  const services = [
    {
      id: 'buying',
      icon: <FaHome />,
      title: isAmharic ? 'የቤት ግዢ' : 'Property Buying',
      description: isAmharic 
        ? 'የህልምዎን ቤት ከባለሙያዎቻችን ድጋፍ ጋር ይግዙ። ገበያውን በመገምገም እና ዋጋ በመደራደር ምርጥ ቤቶችን እናቀርብልዎታለን።'
        : 'Find your dream home with our expert guidance. We help you navigate the market, negotiate the best deals, and complete your purchase with confidence.',
      features: [
        isAmharic ? 'የግል ፍላጎት ተኮር የቤት ፍለጋ' : 'Personalized property search',
        isAmharic ? 'የገበያ ዋጋ እና አዝማሚያ ትንታኔ' : 'Market analysis and pricing guidance',
        isAmharic ? 'ሙያዊ የዋጋ ድርድር ድጋፍ' : 'Professional negotiation support',
        isAmharic ? 'ህጋዊ የሰነድ ዝግጅት እና ማረጋገጫ' : 'Legal documentation assistance',
        isAmharic ? 'የቤት ሁኔታ ፍተሻ ክትትል' : 'Home inspection coordination',
      ],
      cta: isAmharic ? 'ቤቶችን ይፈልጉ' : 'Start Your Search',
      ctaLink: '/public/houses',
      color: 'blue'
    },
    {
      id: 'selling',
      icon: <FaHandshake />,
      title: isAmharic ? 'የቤት ሽያጭ' : 'Property Selling',
      description: isAmharic 
        ? 'ቤትዎን በተሻለ ዋጋ እና በአጭር ጊዜ ውስጥ ለመሸጥ ከእኛ ጋር ይስሩ። ከግምገማ እስከ መጨረሻው ውል ድረስ በሙሉ ኃላፊነት እናከናውናለን።'
        : 'Get the best value for your property with our comprehensive selling service. From valuation to closing, we maximize your returns.',
      features: [
        isAmharic ? 'ነፃ የቤት ዋጋ ግምገማ' : 'Free property valuation',
        isAmharic ? 'ከፍተኛ ጥራት ያለው ፎቶግራፍ እና ማስታወቂያ' : 'Professional photography and staging',
        isAmharic ? 'በተለያዩ ማህበራዊ ሚዲያዎች ማስተዋወቅ' : 'Multi-platform marketing',
        isAmharic ? 'የተዋጣለት ድርድር እና ፈጣን ሽያጭ' : 'Negotiation expertise',
        isAmharic ? 'የባለቤትነት ስም ዝውውር ክትትል' : 'Closing coordination'
      ],
      cta: isAmharic ? 'ቤትዎን ይሽጡ' : 'Sell Your Property',
      ctaLink: '/contact',
      color: 'green'
    },
    {
      id: 'renting',
      icon: <FaKey />,
      title: isAmharic ? 'የቤት ኪራይ' : 'Property Renting',
      description: isAmharic 
        ? 'ተስማሚ የኪራይ ቤት ያግኙ ወይም ንብረትዎን አስተማማኝ ለሆኑ ተከራዮች ያከራዩ።'
        : 'Find the perfect rental property or lease your property to quality tenants. Our rental services make the process seamless.',
      features: [
        isAmharic ? 'የተከራይ ማንነትና ታሪክ ማረጋገጥ' : 'Tenant screening and verification',
        isAmharic ? 'ህጋዊ የኪራይ ውል ማዘጋጀት' : 'Lease agreement preparation',
        isAmharic ? 'ወቅታዊ የኪራይ ክፍያ ክትትል' : 'Rent collection management',
        isAmharic ? 'የጥገና እና የእንክብካቤ ድጋፍ' : 'Property maintenance coordination',
      ],
      cta: isAmharic ? 'የኪራይ ቤቶችን ይመልከቱ' : 'Find a Rental',
      ctaLink: '/public/houses?status=RENTED',
      color: 'purple'
    },
    {
      id: 'investment',
      icon: <FaChartLine />,
      title: isAmharic ? 'የሪል እስቴት ኢንቨስትመንት' : 'Real Estate Investment',
      description: isAmharic 
        ? 'በከፍተኛ ደረጃ ትርፋማ የሚሆኑ የሪል እስቴት ኢንቨስትመንት አማራጮችን ይለዩ እና ገቢዎን ያሳድጉ።'
        : 'Maximize your ROI with strategic property investment advisory tailored to your financial goals.',
      features: [
        isAmharic ? 'የኢንቨስትመንት እድሎች ትንተና' : 'Investment opportunity identification',
        isAmharic ? 'የገንዘብ ተመላሽ ስሌት (ROI)' : 'ROI and cash flow analysis',
        isAmharic ? 'የአደጋ ቅነሳ ስልቶች' : 'Risk assessment and mitigation',
        isAmharic ? 'የረጅም ጊዜ ንብረት ማሳደጊያ እቅድ' : 'Portfolio growth strategy',
      ],
      cta: isAmharic ? 'የኢንቨስትመንት አማካሪ ያነጋግሩ' : 'Invest With Us',
      ctaLink: '/contact',
      color: 'orange'
    },
    {
      id: 'commercial',
      icon: <FaBuilding />,
      title: isAmharic ? 'የንግድ ሕንፃዎች' : 'Commercial Real Estate',
      description: isAmharic 
        ? 'ለንግድዎ ምቹ የሆኑ ቢሮዎችን፣ ሱቆችን እና መጋዘኖችን ይግዙ ወይም ይከራዩ።'
        : 'Expert solutions for office spaces, retail outlets, and warehouses tailored for business growth.',
      features: [
        isAmharic ? 'ምቹ የቢሮ እና የሱቅ ቦታዎች ፍለጋ' : 'Office and retail space search',
        isAmharic ? 'የንግድ አካባቢ ትንታኔ' : 'Commercial location analysis',
        isAmharic ? 'የረጅም ጊዜ የንግድ ውል ድርድር' : 'Commercial lease negotiation',
      ],
      cta: isAmharic ? 'ንግድ ቦታዎችን ይመልከቱ' : 'Explore Commercial',
      ctaLink: '/contact',
      color: 'red'
    },
    {
      id: 'management',
      icon: <FaShieldAlt />,
      title: isAmharic ? 'የንብረት አስተዳደር' : 'Property Management',
      description: isAmharic 
        ? 'ከጭንቀት ነፃ የሆነ የተሟላ የሕንፃ እና የመኖሪያ ቤት አስተዳደር አገልግሎት።'
        : 'Full-service management solutions to preserve and grow the value of your real estate assets.',
      features: [
        isAmharic ? 'ተከራዮችን መቆጣጠርና መምረጥ' : 'Tenant management and placement',
        isAmharic ? 'የ24/7 የጥገና እና የደህንነት ቁጥጥር' : '24/7 maintenance coordination',
        isAmharic ? 'ወርሃዊ የገንዘብ ሪፖርት ማቅረብ' : 'Monthly financial reporting',
      ],
      cta: isAmharic ? 'አስተዳደር ያነጋግሩ' : 'Manage My Property',
      ctaLink: '/contact',
      color: 'teal'
    },
  ];

  const stats = [
    { number: '15,000+', label: isAmharic ? 'ደስተኛ ደንበኞች' : 'Happy Clients', icon: <FaUsers /> },
    { number: '2,500+', label: isAmharic ? 'የተሸጡ ቤቶች' : 'Properties Sold', icon: <FaHome /> },
    { number: '98%', label: isAmharic ? 'የደንበኞች እርካታ' : 'Client Satisfaction', icon: <FaStar /> },
    { number: '$2.5B+', label: isAmharic ? 'የሽያጭ መጠን' : 'Sales Volume', icon: <FaMoneyBillWave /> },
    { number: '24/7', label: isAmharic ? 'የደንበኞች ድጋፍ' : 'Client Support', icon: <FaClock /> },
    { number: '15+', label: isAmharic ? 'የልምድ ዓመታት' : 'Years Experience', icon: <FaAward /> },
  ];

  const processSteps = [
    {
      step: '01',
      title: isAmharic ? 'የመጀመሪያ ምክክር' : 'Initial Consultation',
      desc: isAmharic ? 'የእርስዎን ፍላጎት፣ በጀት እና ምርጫ በጥልቀት እንረዳለን።' : 'We discuss your needs and budget to understand exactly what you are looking for.',
      icon: <FaUsers />
    },
    {
      step: '02',
      title: isAmharic ? 'የቤት ፍለጋ እና ትንታኔ' : 'Property Search & Analysis',
      desc: isAmharic ? 'ለእርስዎ የሚስማሙ ምርጥ ቤቶችን ፈልገን ዝርዝር የገበያ መረጃ እናዘጋጃለን።' : 'Our team analyzes the market and selects top verified listings matching your criteria.',
      icon: <FaSearch />
    },
    {
      step: '03',
      title: isAmharic ? 'ድርድር እና ስምምነት' : 'Negotiation & Offer',
      desc: isAmharic ? 'ምርጥ ዋጋ እና ምቹ የክፍያ ሁኔታ እንዲያገኙ ጥብቅ ድርድር እናደርጋለን።' : 'We handle negotiations to ensure you secure the best price and terms.',
      icon: <FaHandshake />
    },
    {
      step: '04',
      title: isAmharic ? 'ህጋዊ ሰነድ እና ርክክብ' : 'Closing & Transfer',
      desc: isAmharic ? 'ሁሉም ህጋዊ ሰነዶች ተረጋግጠው በሰላም የቁልፍ ርክክብ ይከናወናል።' : 'All documentation is verified by legal experts for a smooth, worry-free handover.',
      icon: <FaFileSignature />
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-[#0a192f] text-gray-100' 
        : 'bg-[#f8fafc] text-gray-900'
    }`}>
      <Navbar />
      
      <div className="pt-16 sm:pt-20">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={images.hero}
              alt="Real Estate Services"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/40" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 text-white drop-shadow-md">
                {t('home.services_title', 'Our Services')}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-gray-200 max-w-2xl mx-auto px-2 leading-relaxed drop-shadow mb-8">
                {t('home.services_subtitle', 'Comprehensive real estate services tailored to your unique requirements')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg transition-all"
                >
                  {t('action.contact_agent', 'Contact an Agent')}
                </Link>
                <Link
                  href="/public/houses"
                  className="w-full sm:w-auto px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-xl font-bold text-sm sm:text-base transition-all"
                >
                  {t('action.browse_properties', 'Browse Properties')}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`py-12 sm:py-16 px-4 ${
          theme === 'dark' ? 'bg-[#112240]/60' : 'bg-slate-50'
        }`}>
          <div className="container mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {stat.number}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className={`py-12 sm:py-20 px-4 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-white'}`}>
          <div className="container mx-auto">
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isAmharic ? 'የምንሰጣቸው አገልግሎቶች' : 'What We Offer'}
              </h2>
              <p className={`text-sm sm:text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {isAmharic 
                  ? 'ለቤት ገዢዎች፣ ሻጮች፣ ተከራዮች እና ባለሀብቶች የተሟሉ መፍትሄዎች' 
                  : 'End-to-end solutions designed for home buyers, sellers, renters, and investors'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const isExpanded = activeService === service.id;
                return (
                  <div
                    key={service.id}
                    className={`p-6 sm:p-7 rounded-2xl border transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#112240] border-slate-700 hover:border-blue-500 shadow-md' 
                        : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <span className="text-2xl">{service.icon}</span>
                    </div>

                    <h3 className={`text-lg sm:text-xl font-bold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {service.title}
                    </h3>

                    <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {service.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2 mb-6 border-t border-gray-100 dark:border-slate-800 pt-3">
                      {service.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={service.ctaLink}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>{service.cta}</span>
                      <FaArrowRight size={10} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-[#112240]/60' : 'bg-slate-50'
        }`}>
          <div className="container mx-auto">
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isAmharic ? 'የስራ ሂደታችን' : 'Our Simple Process'}
              </h2>
              <p className={`text-sm sm:text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {isAmharic 
                  ? 'ከምክክር ጀምሮ እስከ ቁልፍ ርክክብ ድረስ ግልፅ እና ቀጥተኛ አሰራር' 
                  : 'A transparent, reliable 4-step path from first inquiry to property keys'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border relative ${
                    theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <span className="text-3xl font-black text-blue-600/30 dark:text-blue-400/20 absolute top-4 right-4">
                    {step.step}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="text-lg">{step.icon}</span>
                  </div>
                  <h3 className={`text-base font-bold mb-1.5 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-900 to-blue-950' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>
          <div className="container mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              {isAmharic ? 'ዛሬውኑ ከእኛ ጋር ይጀምሩ' : 'Ready to Start Your Real Estate Journey?'}
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto mb-6">
              {isAmharic 
                ? 'ምርጥ የቤት አማራጮችን ለማግኘት ወይም ቤትዎን ለመሸጥ ባለሙያዎቻችንን ያነጋግሩ።' 
                : 'Connect with our expert team to explore tailored buying, selling, or property management services.'}
            </p>
            <Link
              href="/contact"
              className="inline-block px-8 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md"
            >
              {isAmharic ? 'አሁን ያነጋግሩን' : 'Get in Touch Today'}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}