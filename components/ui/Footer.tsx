import Link from "next/link";
import { motion } from "framer-motion";
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
  FaCity,
  FaKey,
  FaHandshake,
  FaShieldAlt,
  FaClock,
  FaSearch,
  FaChartLine,
  FaUsers,
  FaAward,
  FaEnvelopeOpenText
} from "react-icons/fa";

const Footer: React.FC = () => {
  // Real Estate Services
  const services = [
    { icon: <FaHome />, title: "Buy Property", link: "/public/houses?status=AVAILABLE" },
    { icon: <FaKey />, title: "Rent Property", link: "/public/houses?status=RENTED" },
    { icon: <FaChartLine />, title: "Investment Properties", link: "/public/houses?propertyType=LAND" },
    { icon: <FaBuilding />, title: "Commercial Real Estate", link: "/public/houses?propertyType=COMMERCIAL" },
    { icon: <FaHandshake />, title: "Sell Your Home", link: "/contact" },
    { icon: <FaShieldAlt />, title: "Property Management", link: "/services" },
  ];

  // Quick Links for Real Estate
  const quickLinks = [
    { icon: <FaHome />, title: "Home", href: "/" },
    { icon: <FaInfoCircle />, title: "About Us", href: "/about" },
    { icon: <FaSearch />, title: "Browse Properties", href: "/public/houses" },
    { icon: <FaMapMarker />, title: "Map View", href: "/public/map" },
    { icon: <FaAddressBook />, title: "Contact Us", href: "/contact" },
    { icon: <FaUsers />, title: "Meet Our Agents", href: "/about#team" },
  ];

  // Real Estate Contact Info
  const contactInfo = [
    { 
      icon: <FaMapMarker />, 
      text: "Office Location", 
      detail: "123 Real Estate Avenue\nDowntown District\nCity Center, CC 12345" 
    },
    { 
      icon: <FaPhone />, 
      text: "Phone", 
      detail: "+251 912 345 678" 
    },
    { 
      icon: <FaEnvelope />, 
      text: "Email", 
      detail: "info@realestatepro.com" 
    },
    { 
      icon: <FaClock />, 
      text: "Office Hours", 
      detail: "Mon-Fri: 9AM - 6PM\nSat: 10AM - 4PM\nSun: By Appointment" 
    },
  ];

  // Social Media Links
  const socialLinks = [
    { icon: <FaFacebook />, href: "https://facebook.com/realestatepro", label: "Facebook" },
    { icon: <FaInstagram />, href: "https://instagram.com/realestatepro", label: "Instagram" },
    { icon: <FaTwitter />, href: "https://twitter.com/realestatepro", label: "Twitter" },
    { icon: <FaLinkedin />, href: "https://linkedin.com/company/realestatepro", label: "LinkedIn" },
  ];

  return (
    <footer className={`transition-colors duration-300 border-t-4 border-blue-600 ${
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
        ? 'bg-gray-900 text-white'
        : 'bg-gray-900 text-white'
    }`}>
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Column 1: About Real Estate Company */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-blue-500 mb-4">
              RealEstate Pro
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted partner in real estate since 2005. We help families and investors 
              find their dream properties and make smart real estate investments with 
              confidence and peace of mind.
            </p>
            
            {/* Achievements */}
            <div className="mt-6">
              <h4 className="text-lg font-bold text-blue-500 mb-3">Our Achievements</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <FaAward className="text-yellow-500" />
                  <span>15,000+ Happy Clients</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <FaHome className="text-blue-500" />
                  <span>2,500+ Properties Sold</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <FaChartLine className="text-green-500" />
                  <span>$2.5B+ Total Sales Volume</span>
                </div>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="mt-6">
              <h4 className="text-lg font-bold text-blue-500 mb-3">Get Property Alerts</h4>
              <p className="text-gray-400 text-sm mb-3">
                Subscribe to receive new listings and market updates
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-2 bg-gray-800 border border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Column 2: Our Services */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="text-xl font-bold text-blue-500 mb-4">Our Services</h4>
            <div className="space-y-3">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3"
                >
                  <div className="text-blue-500">
                    {service.icon}
                  </div>
                  <Link
                    href={service.link}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {service.title}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <FaShieldAlt className="text-green-500" />
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                <FaHandshake className="text-blue-500" />
                <span>100% Client Satisfaction</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                <FaClock className="text-yellow-500" />
                <span>24/7 Virtual Consultations</span>
              </div>
            </div>
          </motion.div>

          {/* Column 3: Quick Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-xl font-bold text-blue-500 mb-4">Quick Links</h4>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3"
                >
                  <div className="text-blue-500">
                    {link.icon}
                  </div>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {link.title}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Resources for Buyers/Sellers */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h5 className="text-blue-500 font-bold mb-3">Resources</h5>
              <div className="space-y-2">
                <Link href="/buyers-guide" className="text-gray-400 hover:text-blue-400 text-sm block">
                  Buyer's Guide
                </Link>
                <Link href="/sellers-guide" className="text-gray-400 hover:text-blue-400 text-sm block">
                  Seller's Guide
                </Link>
                <Link href="/financing" className="text-gray-400 hover:text-blue-400 text-sm block">
                  Financing Options
                </Link>
                <Link href="/market-report" className="text-gray-400 hover:text-blue-400 text-sm block">
                  Market Report
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Column 4: Contact & Social */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="text-xl font-bold text-blue-500 mb-4">Contact Us</h4>
            <div className="space-y-4">
              {contactInfo.map((contact, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-3"
                >
                  <div className="text-blue-500 mt-1">
                    {contact.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-300 text-sm">{contact.text}</p>
                    <p className="text-gray-400 text-sm whitespace-pre-line">{contact.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Media */}
            <div className="pt-6 border-t border-gray-700">
              <h4 className="text-xl font-bold text-blue-500 mb-4">Follow Us</h4>
              <p className="text-gray-400 text-sm mb-4">
                Stay updated with new properties and market news
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    whileHover={{ scale: 1.2, y: -3 }}
                    className="text-blue-500 hover:text-blue-400 transition-colors bg-gray-800 p-3 rounded-full"
                  >
                    <span className="text-xl">{social.icon}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 text-center"
              >
                <p className="text-white text-sm mb-2">Need help finding a property?</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-white font-bold text-sm"
                >
                  <FaEnvelopeOpenText />
                  Contact an Agent Today
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Copyright & Bottom Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="pt-8 border-t border-gray-700"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} RealEstate Pro. All rights reserved.
              </p>
              <div className="flex gap-4">
                <Link href="/privacy" className="text-gray-400 hover:text-blue-400 text-sm">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-blue-400 text-sm">
                  Terms of Service
                </Link>
                <Link href="/sitemap" className="text-gray-400 hover:text-blue-400 text-sm">
                  Sitemap
                </Link>
              </div>
            </div>
            
            <div className="text-gray-500 text-xs">
              <p>Licensed Real Estate Broker | License #RE-12345</p>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;