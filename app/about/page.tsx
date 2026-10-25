'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  FaUsers,
  FaStar,
  FaAward,
  FaHeart,
  FaHome,
  FaMapMarkerAlt,
  FaPhone,
  FaBuilding,
  FaChartLine,
  FaHandshake,
  FaShieldAlt,
  FaGlobe,
  FaTree,
  FaTrophy,
} from 'react-icons/fa';

const images = {
  aboutHero: '/INSA/image22.jpg',
  team: '/INSA/image15.jpg',
  mission: '/INSA/image11.jpg',
  values: '/INSA/image12.jpg',
  office: '/INSA/image18.jpg',
  team1: '/images/amlakie1.jpg',
  team2: '/images/bezab1.jpg',
  team3: '/images/amlakie2.jpg',
  team4: '/images/bezabh2.jpg',
};

export default function AboutPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const [activeTeam, setActiveTeam] = useState(0);

  const teamMembers = [
    {
      name: 'Amlakie Abebaw',
      role: isAmharic ? 'መስራች እና ዋና ሥራ አስፈፃሚ' : 'Founder & CEO',
      bio: isAmharic 
        ? 'በሪል እስቴት ዘርፍ ከ20 ዓመታት በላይ ባካበቱት ልምድ፣ ኩባንያችንን በታማኝነት እና በራዕይ ይመራሉ፤ በሺዎች የሚቆጠሩ ቤተሰቦች የህልም ቤታቸውን እንዲያገኙ ረድተዋል።'
        : 'With over 20 years in real estate, Amlakie leads our company with vision and integrity, helping thousands find their dream homes.',
      image: images.team1,
    },
    {
      name: 'Bezabh Abebaw',
      role: isAmharic ? 'የሽያጭ ኃላፊ' : 'Head of Sales',
      bio: isAmharic 
        ? 'በከፍተኛ የንግድ እና የመኖሪያ ቤቶች ሽያጭ የ15 ዓመታት ልምድ አላቸው።'
        : 'Bezabh brings 15 years of luxury property experience, specializing in high-end residential and commercial real estate.',
      image: images.team2,
    },
    {
      name: 'Bruk Dessalegn',
      role: isAmharic ? 'የንብረት አስተዳዳሪ' : 'Property Manager',
      bio: isAmharic 
        ? 'የደንበኞችን እርካታ በማስቀደም የንብረት አስተዳደር አገልግሎትን በጥራት ይመራሉ።'
        : 'Bruk oversees property management with exceptional attention to detail and commitment to client satisfaction.',
      image: images.team3,
    },
    {
      name: 'David Wilson',
      role: isAmharic ? 'የኢንቨስትመንት አማካሪ' : 'Investment Advisor',
      bio: isAmharic 
        ? 'ደንበኞች አዋጭ የሪል እስቴት ኢንቨስትመንት እንዲያደርጉ ስልታዊ ምክር ይሰጣሉ።'
        : 'David helps clients build wealth through strategic real estate investments and portfolio management.',
      image: images.team4,
    },
  ];

  const values = [
    {
      icon: <FaHandshake />,
      title: isAmharic ? 'ቀዳሚ ታማኝነት' : 'Integrity First',
      description: isAmharic ? 'በእምነት እና በስነ-ምግባር ላይ የተመሰረተ ግልፅ እና ሐቀኛ አሰራርን እንከተላለን።' : 'We believe in honest, transparent transactions built on trust and ethical practices.',
    },
    {
      icon: <FaHeart />,
      title: isAmharic ? 'ደንበኛ ተኮር' : 'Client Centric',
      description: isAmharic ? 'የደንበኞቻችን ፍላጎት የእኛ ቀዳሚ ግብ ነው። ለፍላጎትዎ ትክክለኛውን ቤት እናዘጋጃለን።' : 'Your goals are our priority. We are dedicated to finding the perfect property for your needs.',
    },
    {
      icon: <FaStar />,
      title: isAmharic ? 'የላቀ ጥራት' : 'Excellence',
      description: isAmharic ? 'ከመጀመሪያው ግንኙነት ጀምሮ እስከ መጨረሻው የውል ፊርማ ድረስ የላቀ አገልግሎት እናቀርባለን።' : 'We strive for excellence in every transaction, from first contact to final closing.',
    },
    {
      icon: <FaChartLine />,
      title: isAmharic ? 'የገበያ እውቀት' : 'Market Expertise',
      description: isAmharic ? 'ትክክለኛ ውሳኔ እንዲያደርጉ የሚያግዝ ጥልቅ የአካባቢ ገበያ መረጃ።' : 'Deep local market knowledge and data-driven insights to guide your decisions.',
    },
    {
      icon: <FaShieldAlt />,
      title: isAmharic ? 'ደህንነት እና ጥበቃ' : 'Trust & Security',
      description: isAmharic ? 'የእርስዎ ኢንቨስትመንት በህጋዊ ጥንቃቄ እና ቁጥጥር የተጠበቀ ነው።' : 'Your investment is protected with our rigorous due diligence and legal expertise.',
    },
    {
      icon: <FaGlobe />,
      title: isAmharic ? 'ሰፊ ተደራሽነት' : 'Global Reach',
      description: isAmharic ? 'በሀገር ውስጥና በውጭ ሀገር የሚገኙ ደንበኞችን የሚያገናኝ ዘመናዊ መረብ።' : 'International network connecting you to opportunities worldwide.',
    },
  ];

  const achievements = [
    { number: '15,000+', label: isAmharic ? 'ደስተኛ ደንበኞች' : 'Happy Clients', icon: <FaUsers /> },
    { number: '2,500+', label: isAmharic ? 'የተሸጡ ቤቶች' : 'Properties Sold', icon: <FaHome /> },
    { number: '98%', label: isAmharic ? 'የደንበኞች እርካታ' : 'Client Satisfaction', icon: <FaStar /> },
    { number: '$2.5B+', label: isAmharic ? 'ጠቅላላ የሽያጭ መጠን' : 'Total Sales Volume', icon: <FaChartLine /> },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTeam((prev) => (prev + 1) % teamMembers.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [teamMembers.length]);

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
              src={images.aboutHero}
              alt="Real Estate Agency"
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
                {t('about.title', 'About RealEstate Pro')}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-gray-200 max-w-2xl mx-auto px-2 leading-relaxed drop-shadow">
                {t('about.subtitle', 'Helping you find the perfect place to call home since 2005. Experience excellence in real estate with our dedicated team of professionals.')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className={`py-12 sm:py-20 px-4 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-white'}`}>
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative h-64 sm:h-80 md:h-96 w-full lg:w-1/2 rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-800"
              >
                <Image
                  src={images.mission}
                  alt="Modern Office Building"
                  fill
                  className="object-cover"
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
                  {isAmharic ? 'ታሪካችን' : 'Our Story'}
                </span>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 sm:mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {t('about.story_title', 'More Than Just Properties')}
                </h2>
                <div className={`space-y-4 text-sm sm:text-base leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <p>
                    {isAmharic 
                      ? 'እ.ኤ.አ. በ2005 የተመሰረተው ሪል እስቴት ፕሮ (RealEstate Pro)፣ የሪል እስቴት ዘርፉን በታማኝነት፣ በሙያዊ ብቃት እና በላቀ አገልግሎት የመቀየር ራዕይ ይዞ ተነሳ።' 
                      : 'Founded in 2005, RealEstate Pro began with a simple vision: to revolutionize the real estate experience through integrity, expertise, and personalized service.'}
                  </p>
                  <p>
                    {isAmharic 
                      ? 'ዛሬ በሺዎች የሚቆጠሩ ቤተሰቦችን እና ባለሀብቶችን ከህልም ቤቶቻቸው ጋር ያገናኘ ታማኝ ስም ሆኗል። እምነታችንን የገነባነው በግልፅ ምክር፣ ጥልቅ የገበያ እውቀት እና ለደንበኞቻችን ባለን ጽኑ ቁርጠኝነት ነው።' 
                      : 'Today, we have grown into a trusted name in real estate, helping thousands of families and investors find their perfect properties through honest advice, market knowledge, and dedication.'}
                  </p>
                  <p>
                    {isAmharic 
                      ? 'ከሪል እስቴት ኤጀንሲ በላይ፣ የሀብት ግንባታ፣ የመኖሪያ ቤት ማግኛ እና የወደፊት አስተማማኝ ኢንቨስትመንት ረዳት አጋርዎ ነን።' 
                      : 'We are more than just a real estate agency—we are your partner in building wealth and securing your family’s future through strategic property investments.'}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className={`py-12 sm:py-16 px-4 ${
          theme === 'dark' ? 'bg-[#112240]/60' : 'bg-slate-50'
        }`}>
          <div className="container mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {achievements.map((item, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-extrabold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.number}
                  </h3>
                  <p className={`text-xs sm:text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className={`py-12 sm:py-20 px-4 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-white'}`}>
          <div className="container mx-auto">
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('about.values_title', 'Our Core Values')}
              </h2>
              <p className={`text-sm sm:text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {isAmharic 
                  ? 'በእያንዳንዱ ግንኙነት እና የሥራ ሂደት ውስጥ የምንከተላቸው መርሆዎች' 
                  : 'The principles that guide every interaction and transaction'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border ${
                    theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="text-xl">{value.icon}</span>
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {value.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership Team Section */}
        <section className={`py-12 sm:py-20 px-4 ${
          theme === 'dark' ? 'bg-[#112240]/60' : 'bg-slate-50'
        }`}>
          <div className="container mx-auto">
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('about.team_title', 'Meet Our Leadership Team')}
              </h2>
              <p className={`text-sm sm:text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {isAmharic 
                  ? 'ልምድ ያላቸው እና ቁርጠኛ የሆኑ የአመራር አባሎቻችን' 
                  : 'Experienced professionals dedicated to your real estate success'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className={`rounded-2xl overflow-hidden border transition-all ${
                    theme === 'dark' ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="relative h-64 sm:h-72 w-full bg-gray-200 dark:bg-slate-800">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className={`text-base font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {member.name}
                    </h3>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block mb-2">
                      {member.role}
                    </span>
                    <p className={`text-xs leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commitment & Office Section */}
        <section className={`py-12 sm:py-20 px-4 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-white'}`}>
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">
              <div className="lg:w-1/2">
                <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase block mb-2">
                  {isAmharic ? 'ቁርጠኝነታችን' : 'Our Commitment'}
                </span>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isAmharic ? 'ለደንበኞቻችን ያለን ጽኑ ቃል ኪዳን' : 'Our Commitment to You'}
                </h2>
                <div className="space-y-4">
                  {[
                    { icon: <FaShieldAlt className="text-blue-500" />, title: isAmharic ? 'ግልፅነት' : 'Transparency', desc: isAmharic ? 'የተሟላ የንብረት መረጃ፣ የገበያ ዋጋ እና ህጋዊ የውል ሂደቶች።' : 'Full disclosure of property details, market analysis, and legal processes.' },
                    { icon: <FaChartLine className="text-blue-500" />, title: isAmharic ? 'የገበያ እውቀት' : 'Market Expertise', desc: isAmharic ? 'ኢንቨስትመንትዎን የሚያሳድግ ጥልቅ የአካባቢ ገበያ ትንታኔ።' : 'Deep local market knowledge to maximize your investment return.' },
                    { icon: <FaTree className="text-blue-500" />, title: isAmharic ? 'ዘላቂነት' : 'Sustainability', desc: isAmharic ? 'ለአካባቢ ተስማሚ የሆኑ እና ዘመናዊ ቤቶችን እናበረታታለን።' : 'Promoting eco-friendly properties and sustainable building practices.' },
                    { icon: <FaTrophy className="text-blue-500" />, title: isAmharic ? 'የላቀ ደረጃ' : 'Excellence', desc: isAmharic ? 'በኢንዱስትሪው ውስጥ በተደጋጋሚ የተመሰገነ የደንበኞች እርካታ።' : 'Award-winning service recognized by industry leaders and satisfied clients.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                        theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'
                      }`}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className={`text-sm sm:text-base font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {item.title}
                        </h3>
                        <p className={`text-xs sm:text-sm mt-0.5 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative h-64 sm:h-80 md:h-96 w-full lg:w-1/2 rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-800">
                <Image
                  src={images.office}
                  alt="Modern Office"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Contact CTA */}
        <section className={`py-12 sm:py-16 px-4 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-900 to-blue-950' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>
          <div className="container mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              {isAmharic ? 'የህልምዎን ቤት አብረን እንፈልግ' : 'Let’s Find Your Dream Property Together'}
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto mb-6">
              {isAmharic 
                ? 'ዛሬውኑ ከባለሙያዎቻችን ጋር ይገናኙ እና ፍላጎትዎን ያሳኩ።' 
                : 'Connect with our expert team today to start your journey.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/public/houses"
                className="w-full sm:w-auto px-6 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md"
              >
                {t('action.browse_properties', 'Browse Properties')}
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-6 py-3 border-2 border-white hover:bg-white/10 text-white rounded-xl font-bold text-sm sm:text-base transition-all"
              >
                {t('nav.contact', 'Contact Us')}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}