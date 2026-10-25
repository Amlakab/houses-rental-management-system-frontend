'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedin,
  FaMapMarker, 
  FaPhone, 
  FaEnvelope, 
  FaHome, 
  FaInfoCircle, 
  FaAddressBook,
  FaBuilding,
  FaKey,
  FaHandshake,
  FaShieldAlt,
  FaClock,
  FaSearch,
  FaChartLine,
  FaAward,
  FaEnvelopeOpenText
} from 'react-icons/fa';

const Footer: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { theme } = useTheme();

  const services = [
    { icon: <FaHome />, title: isAmharic ? 'ቤት ይግዙ' : 'Buy Property', link: '/public/houses?status=AVAILABLE' },
    { icon: <FaKey />, title: isAmharic ? 'ቤት ይከራዩ' : 'Rent Property', link: '/public/houses?status=RENTED' },
    { icon: <FaChartLine />, title: isAmharic ? 'የኢንቨስትመንት ንብረቶች' : 'Investment Properties', link: '/public/houses?propertyType=LAND' },
    { icon: <FaBuilding />, title: isAmharic ? 'የንግድ ሕንፃዎች' : 'Commercial Real Estate', link: '/public/houses?propertyType=COMMERCIAL' },
    { icon: <FaHandshake />, title: isAmharic ? 'ቤትዎን ይሽጡ' : 'Sell Your Home', link: '/contact' },
    { icon: <FaShieldAlt />, title: isAmharic ? 'የንብረት አስተዳደር' : 'Property Management', link: '/services' },
  ];

  const quickLinks = [
    { icon: <FaHome />, title: t('nav.home', 'Home'), href: '/' },
    { icon: <FaInfoCircle />, title: t('nav.about', 'About Us'), href: '/about' },
    { icon: <FaSearch />, title: t('nav.properties', 'Browse Properties'), href: '/public/houses' },
    { icon: <FaMapMarker />, title: t('nav.map_search', 'Map View'), href: '/public/map' },
    { icon: <FaAddressBook />, title: t('nav.contact', 'Contact Us'), href: '/contact' },
  ];

  const contactInfo = [
    { 
      icon: <FaMapMarker />, 
      text: isAmharic ? 'አድራሻ' : 'Office Location', 
      detail: isAmharic ? 'አዲስ አበባ፣ ቦሌ፣ ኢትዮጵያ' : 'Bole Sub-City, Addis Ababa, Ethiopia' 
    },
    { 
      icon: <FaPhone />, 
      text: isAmharic ? 'ስልክ' : 'Phone', 
      detail: '+251 906 974 055' 
    },
    { 
      icon: <FaEnvelope />, 
      text: isAmharic ? 'ኢሜይል' : 'Email', 
      detail: 'info@realestatepro.com' 
    },
    { 
      icon: <FaClock />, 
      text: isAmharic ? 'የስራ ሰዓት' : 'Office Hours', 
      detail: isAmharic ? 'ሰኞ - አርብ፡ 2:30 - 11:30\nቅዳሜ፡ 3:00 - 7:00' : 'Mon-Fri: 8:30AM - 5:30PM\nSat: 9:00AM - 1:00PM' 
    },
  ];

  const socialLinks = [
    { icon: <FaFacebook />, href: 'https://facebook.com', label: 'Facebook' },
    { icon: <FaInstagram />, href: 'https://instagram.com', label: 'Instagram' },
    { icon: <FaTwitter />, href: 'https://twitter.com', label: 'Twitter' },
    { icon: <FaLinkedin />, href: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <footer className={`transition-colors duration-300 border-t ${
      theme === 'dark' 
        ? 'bg-[#0a192f] border-slate-800 text-gray-300' 
        : 'bg-slate-900 border-blue-600 text-gray-200'
    }`}>
      <div className="container mx-auto px-4 py-10 sm:py-14">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Column 1: Brand & About */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-blue-400">
              RealEstate Pro
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.about_desc', 'RealEstate Pro is Ethiopia’s premier real estate management and property marketplace platform, ensuring trust and seamless transactions.')}
            </p>
            
            {/* Achievements */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-400">
                <FaAward className="text-yellow-400 shrink-0" />
                <span>{isAmharic ? '15,000+ ደስተኛ ደንበኞች' : '15,000+ Happy Clients'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-400">
                <FaHome className="text-blue-400 shrink-0" />
                <span>{isAmharic ? '2,500+ የተሸጡ ቤቶች' : '2,500+ Properties Listed'}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">
              {t('footer.quick_links', 'Quick Links')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <span className="text-blue-500 text-xs">{link.icon}</span>
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">
              {t('footer.services', 'Services')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {services.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.link}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <span className="text-blue-500 text-xs">{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & CTA */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">
              {t('footer.contact_info', 'Contact Info')}
            </h4>
            <div className="space-y-3 text-sm text-gray-400 mb-5">
              {contactInfo.map((info, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-blue-400 mt-1 shrink-0 text-sm">{info.icon}</span>
                  <div>
                    <span className="text-xs font-semibold text-gray-300 block">{info.text}</span>
                    <span className="text-xs text-gray-400 whitespace-pre-line">{info.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <FaEnvelopeOpenText />
              <span>{isAmharic ? 'ወኪል ያነጋግሩ' : 'Contact an Agent'}</span>
            </Link>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} RealEstate Pro. {t('footer.rights_reserved', 'All rights reserved.')}
          </p>
          <div className="flex items-center space-x-3">
            {socialLinks.map((s, idx) => (
              <a
                key={idx}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-slate-800 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;