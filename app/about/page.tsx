'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  FaUsers,
  FaLeaf,
  FaClock,
  FaStar,
  FaAward,
  FaHeart,
  FaHome,
  FaKey,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaBuilding,
  FaCity,
  FaChartLine,
  FaHandshake,
  FaShieldAlt,
  FaGlobe,
  FaTree,
  FaTrophy,
  FaUserTie,
  FaSearch,
} from 'react-icons/fa';

const images = {
  aboutHero: '/INSA/image22.jpg',
  team: '/INSA/image15.jpg',
  mission: '/INSA/image11.jpg',
  values: '/INSA/image12.jpg',
  facility1: '/INSA/image13.jpg',
  facility2: '/INSA/image14.jpg',
  timeline: '/INSA/image19.jpg',
  team1: '/images/amlakie1.jpg',
  team2: '/images/bezab1.jpg',
  team3: '/images/amlakie2.jpg',
  team4: '/images/bezabh2.jpg',
  office: '/INSA/image18.jpg',
  cityscape: '/INSA/image19.jpg',
};

const teamMembers = [
  {
    name: 'Amlakie Abebaw',
    role: 'Founder & CEO',
    bio: 'With over 20 years in real estate, Amlakie leads our company with vision and integrity, helping thousands find their dream homes.',
    image: images.team1,
  },
  {
    name: 'Bezabh Abebaw',
    role: 'Head of Sales',
    bio: 'Bezabh brings 15 years of luxury property experience, specializing in high-end residential and commercial real estate.',
    image: images.team2,
  },
  {
    name: 'Bruk Dessalegn',
    role: 'Property Manager',
    bio: 'Bruk oversees property management with exceptional attention to detail and commitment to client satisfaction.',
    image: images.team3,
  },
  {
    name: 'David Wilson',
    role: 'Investment Advisor',
    bio: 'David helps clients build wealth through strategic real estate investments and portfolio management.',
    image: images.team4,
  },
];

const values = [
  {
    icon: <FaHandshake />,
    title: 'Integrity First',
    description: 'We believe in honest, transparent transactions built on trust and ethical practices.',
  },
  {
    icon: <FaHeart />,
    title: 'Client Centric',
    description: 'Your goals are our priority. We are dedicated to finding the perfect property for your needs.',
  },
  {
    icon: <FaStar />,
    title: 'Excellence',
    description: 'We strive for excellence in every transaction, from first contact to final closing.',
  },
  {
    icon: <FaChartLine />,
    title: 'Market Expertise',
    description: 'Deep local market knowledge and data-driven insights to guide your decisions.',
  },
  {
    icon: <FaShieldAlt />,
    title: 'Trust & Security',
    description: 'Your investment is protected with our rigorous due diligence and legal expertise.',
  },
  {
    icon: <FaGlobe />,
    title: 'Global Reach',
    description: 'International network connecting you to opportunities worldwide.',
  },
];

const timelineEvents = [
  { year: '2005', title: 'Company Founded', description: 'Started as a boutique real estate agency serving local communities.' },
  { year: '2010', title: 'Expanded Operations', description: 'Opened 5 new offices across the region, growing our team to 50 agents.' },
  { year: '2015', title: 'Digital Transformation', description: 'Launched our online platform with virtual tours and digital transactions.' },
  { year: '2018', title: 'Luxury Division', description: 'Established luxury property division for high-end residential and commercial.' },
  { year: '2021', title: 'Sustainability Initiative', description: 'Launched green building and eco-friendly property certification program.' },
  { year: '2024', title: 'Global Network', description: 'Expanded internationally with partnerships across 15 countries.' },
];

const achievements = [
  { number: '15,000+', label: 'Happy Clients', icon: <FaUsers /> },
  { number: '2,500+', label: 'Properties Sold', icon: <FaHome /> },
  { number: '98%', label: 'Client Satisfaction', icon: <FaStar /> },
  { number: '$2.5B+', label: 'Total Sales Volume', icon: <FaChartLine /> },
];

export default function AboutPage() {
  const { theme } = useTheme();
  const [activeTeam, setActiveTeam] = useState(0);

  // Auto-rotate team members
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTeam((prev) => (prev + 1) % teamMembers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-b from-gray-50 to-white text-gray-900'
    }`}>
      <Navbar />
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={images.aboutHero}
              alt="Real Estate Agency"
              fill
              className="object-cover"
              priority
            />
            <div className={`absolute inset-0 ${
              theme === 'dark' ? 'bg-black/70' : 'bg-black/50'
            }`}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-center"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white px-2">
                Your Trusted Real Estate Partner
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto px-4">
                Helping you find the perfect place to call home since 2005. 
                Experience excellence in real estate with our dedicated team of professionals.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-12 sm:py-20 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="relative h-64 sm:h-80 md:h-96 w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-2xl"
              >
                <Image
                  src={images.mission}
                  alt="Modern Office Building"
                  fill
                  className="object-cover"
                />
              </motion.div>
              
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="lg:w-1/2"
              >
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  More Than Just Properties
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <p className={`text-sm sm:text-base md:text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Founded in 2005, <span className="font-semibold text-blue-600">RealEstate Pro</span> began with a simple vision: 
                    to revolutionize the real estate experience through integrity, expertise, and personalized service.
                  </p>
                  <p className={`text-sm sm:text-base md:text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    What started as a small local agency has grown into a trusted name in real estate, 
                    helping thousands of families and investors find their perfect properties. We've built 
                    our reputation on honest advice, market knowledge, and unwavering commitment to our clients.
                  </p>
                  <p className={`text-sm sm:text-base md:text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Today, we're more than just a real estate agency—we're your partner in building wealth, 
                    finding your dream home, and securing your family's future through strategic property investments.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'
        }`}>
          <div className="container mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mb-3 sm:mb-4 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <div className="text-xl sm:text-2xl text-blue-600">
                      {achievement.icon}
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {achievement.number}
                  </div>
                  <div className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {achievement.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-12 sm:py-20 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                    <FaStar className="text-xl sm:text-2xl" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold">Our Mission</h3>
                </div>
                <p className="text-base sm:text-lg mb-4 sm:mb-6">
                  To empower individuals and families to achieve their real estate dreams through 
                  expert guidance, innovative technology, and unwavering integrity.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></span>
                    Provide exceptional service with transparency
                  </li>
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></span>
                    Deliver market insights and data-driven advice
                  </li>
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></span>
                    Build lasting relationships through trust
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 sm:p-8 shadow-2xl ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className={`p-2 sm:p-3 rounded-full ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <FaBuilding className="text-xl sm:text-2xl text-blue-600" />
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Our Vision
                  </h3>
                </div>
                <p className={`text-base sm:text-lg mb-4 sm:mb-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  To be the most trusted and innovative real estate company, setting new standards 
                  for excellence in property services across the nation.
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <div className={`p-3 sm:p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h4 className={`font-bold mb-1 sm:mb-2 text-sm sm:text-base ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Industry Leadership
                    </h4>
                    <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Setting benchmarks for excellence in real estate services
                    </p>
                  </div>
                  <div className={`p-3 sm:p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h4 className={`font-bold mb-1 sm:mb-2 text-sm sm:text-base ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Technology Innovation
                    </h4>
                    <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Leveraging cutting-edge tools to enhance your property journey
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'
        }`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Our Core Values
              </h2>
              <p className={`text-base sm:text-xl ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              } max-w-3xl mx-auto px-2`}>
                The principles that guide every interaction and transaction
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className={`p-5 sm:p-6 rounded-xl ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-3 sm:mb-4 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <div className="text-lg sm:text-xl text-blue-600">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {value.title}
                  </h3>
                  <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Journey Timeline - Mobile Responsive */}
        <section className="py-12 sm:py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Our Journey
              </h2>
              <p className={`text-base sm:text-xl ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                19 years of excellence in real estate
              </p>
            </motion.div>

            {/* Mobile Timeline (Vertical) */}
            <div className="lg:hidden space-y-6">
              {timelineEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-5 sm:p-6 rounded-xl ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } shadow-lg relative pl-12`}
                >
                  <div className={`absolute left-3 top-5 w-8 h-8 rounded-full flex items-center justify-center ${
                    theme === 'dark' ? 'bg-blue-500' : 'bg-blue-500'
                  }`}>
                    <span className="text-white text-xs font-bold">{event.year.slice(-2)}</span>
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {event.title}
                  </h3>
                  <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {event.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Desktop Timeline (Horizontal Line) */}
            <div className="hidden lg:block relative">
              <div className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
              }`}></div>

              <div className="space-y-12">
                {timelineEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative flex items-center w-full ${
                      index % 2 === 0 ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div className={`w-5/12 ${
                      index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'
                    }`}>
                      <div className={`p-6 rounded-xl ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                      } shadow-lg`}>
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                          theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}>
                          <span className={`text-lg font-bold ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {event.year}
                          </span>
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {event.title}
                        </h3>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-4 ${
                      theme === 'dark' ? 'bg-gray-900 border-blue-500' : 'bg-white border-blue-400'
                    }`}></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Meet Our Team */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'
        }`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Meet Our Expert Team
              </h2>
              <p className={`text-base sm:text-xl ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              } max-w-3xl mx-auto px-2`}>
                Dedicated professionals committed to your real estate success
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="text-center"
                >
                  <div className="relative h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden shadow-xl">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className={`text-lg sm:text-xl font-bold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {member.name}
                  </h3>
                  <p className={`mb-2 sm:mb-3 text-sm sm:text-base ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  } font-medium`}>
                    {member.role}
                  </p>
                  <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} px-2`}>
                    {member.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="py-12 sm:py-20 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="lg:w-1/2"
              >
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Our Commitment to You
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      <FaShieldAlt className="text-blue-600 text-sm sm:text-base" /> Transparency
                    </h3>
                    <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Full disclosure of property details, market analysis, and transaction processes.
                    </p>
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      <FaChartLine className="text-blue-600 text-sm sm:text-base" /> Market Expertise
                    </h3>
                    <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Deep local market knowledge and data-driven insights to maximize your investment.
                    </p>
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      <FaTree className="text-blue-600 text-sm sm:text-base" /> Sustainability
                    </h3>
                    <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Promoting eco-friendly properties and sustainable building practices.
                    </p>
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      <FaTrophy className="text-blue-600 text-sm sm:text-base" /> Excellence
                    </h3>
                    <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Award-winning service recognized by industry leaders and satisfied clients.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="relative h-64 sm:h-80 md:h-96 w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-xl"
              >
                <Image
                  src={images.office}
                  alt="Modern Office"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'
        }`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Get In Touch
              </h2>
              <p className={`text-base sm:text-xl ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Let's start your real estate journey together
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-3 sm:mb-4 ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <FaMapMarkerAlt className="text-blue-600 text-base sm:text-xl" />
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Visit Our Office
                </h3>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  123 Real Estate Avenue<br />
                  Downtown District<br />
                  City Center, CC 12345
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-3 sm:mb-4 ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <FaPhone className="text-blue-600 text-base sm:text-xl" />
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Contact Us
                </h3>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Phone: (123) 456-7890<br />
                  Email: info@realestatepro.com<br />
                  Fax: (123) 456-7891
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-3 sm:mb-4 ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <FaClock className="text-blue-600 text-base sm:text-xl" />
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Office Hours
                </h3>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: 10:00 AM - 4:00 PM<br />
                  Sunday: By Appointment<br />
                  <span className="text-xs sm:text-sm">24/7 Virtual Consultations Available</span>
                </p>
              </motion.div>
            </div>

            {/* Social Media */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mt-10 sm:mt-12"
            >
              <h3 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Connect With Us
              </h3>
              <div className="flex justify-center gap-4 sm:gap-6">
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 sm:p-3 rounded-full ${
                      theme === 'dark' 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    } transition-colors duration-300`}
                  >
                    <Icon className="text-base sm:text-xl" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-blue-600 to-blue-800' 
            : 'bg-gradient-to-r from-blue-500 to-blue-700'
        }`}>
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-white px-2">
                Ready to Find Your Dream Home?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 max-w-2xl mx-auto px-4">
                Let our expert team guide you through the exciting journey of buying or selling your property.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <Link
                  href="/public/houses"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white hover:bg-gray-100 text-blue-600 font-bold rounded-lg text-sm sm:text-base md:text-lg transition-colors duration-300 shadow-lg"
                >
                  Browse Properties
                </Link>
                <Link
                  href="/contact"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-white hover:bg-white/10 text-white font-bold rounded-lg text-sm sm:text-base md:text-lg transition-colors duration-300"
                >
                  Contact an Agent
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}