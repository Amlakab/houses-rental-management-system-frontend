'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useTheme } from '@/lib/theme-context';
import {
  FaPlayCircle,
  FaDownload,
  FaEnvelope,
  FaKey,
  FaUser,
  FaCity,
  FaUserTag,
} from 'react-icons/fa';
import Link from 'next/link';

// YouTube video data
const videos = [
  {
    id: 1,
    title: 'Tepi Giby Gubaye Video 1',
    description: 'This video provides an overview of Tepi Giby Gubaye\'s mission and activities.',
    videoId: '8etZEkL9P0M',
    thumbnail: 'https://img.youtube.com/vi/8etZEkL9P0M/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=8etZEkL9P0M',
  },
  {
    id: 2,
    title: 'Tepi Giby Gubaye Video 2',
    description: 'Learn about the cybersecurity initiatives of Tepi Giby Gubaye.',
    videoId: '9M1lA-TwO_k',
    thumbnail: 'https://img.youtube.com/vi/9M1lA-TwO_k/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=9M1lA-TwO_k',
  },
  {
    id: 3,
    title: 'Tepi Giby Gubaye Video 3',
    description: 'Explore the role of Tepi Giby Gubaye in national cybersecurity.',
    videoId: 'XsaoGxyGPDg',
    thumbnail: 'https://img.youtube.com/vi/XsaoGxyGPDg/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=XsaoGxyGPDg',
  },
  {
    id: 4,
    title: 'Tepi Giby Gubaye Video 4',
    description: 'This video highlights the achievements of Tepi Giby Gubaye.',
    videoId: 'hjDIwkn0wsA',
    thumbnail: 'https://img.youtube.com/vi/hjDIwkn0wsA/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=hjDIwkn0wsA',
  },
  {
    id: 5,
    title: 'Tepi Giby Gubaye Video 5',
    description: 'Understand the importance of cybersecurity in Ethiopia.',
    videoId: 'kyZsgIqxYR0',
    thumbnail: 'https://img.youtube.com/vi/kyZsgIqxYR0/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=kyZsgIqxYR0',
  },
  {
    id: 6,
    title: 'Tepi Giby Gubaye Video 6',
    description: 'This video showcases the work of Tepi Giby Gubaye in protecting national infrastructure.',
    videoId: 'nT_Ek5Qez30',
    thumbnail: 'https://img.youtube.com/vi/nT_Ek5Qez30/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=nT_Ek5Qez30',
  },
  {
    id: 7,
    title: 'Tepi Giby Gubaye Video 7',
    description: 'Additional video content about Tepi Giby Gubaye.',
    videoId: 'gEqON6U6keA',
    thumbnail: 'https://img.youtube.com/vi/gEqON6U6keA/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=gEqON6U6keA',
  },
  {
    id: 8,
    title: 'Tepi Giby Gubaye Video 8',
    description: 'More insights into Tepi Giby Gubaye\'s operations.',
    videoId: 'PbzeKJZ3C5U',
    thumbnail: 'https://img.youtube.com/vi/PbzeKJZ3C5U/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=PbzeKJZ3C5U',
  },
  {
    id: 9,
    title: 'Tepi Giby Gubaye Video 9',
    description: 'Further exploration of Tepi Giby Gubaye\'s contributions.',
    videoId: 'sEKwvfVuOms',
    thumbnail: 'https://img.youtube.com/vi/sEKwvfVuOms/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=sEKwvfVuOms',
  },
  {
    id: 10,
    title: 'Tepi Giby Gubaye Video 10',
    description: 'Detailed look at Tepi Giby Gubaye\'s strategies.',
    videoId: '9RSWGR3fSQI',
    thumbnail: 'https://img.youtube.com/vi/9RSWGR3fSQI/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=9RSWGR3fSQI',
  },
  {
    id: 11,
    title: 'Tepi Giby Gubaye Video 11',
    description: 'Understanding the impact of Tepi Giby Gubaye.',
    videoId: '4HoN29ix24A',
    thumbnail: 'https://img.youtube.com/vi/4HoN29ix24A/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=4HoN29ix24A',
  },
  {
    id: 12,
    title: 'Tepi Giby Gubaye Video 12',
    description: 'Insights into Tepi Giby Gubaye\'s cybersecurity measures.',
    videoId: 'hKtFnVEuhN4',
    thumbnail: 'https://img.youtube.com/vi/hKtFnVEuhN4/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=hKtFnVEuhN4',
  },
  {
    id: 13,
    title: 'Tepi Giby Gubaye Video 13',
    description: 'Exploring Tepi Giby Gubaye\'s role in national security.',
    videoId: 'sfqvhD6lTSs',
    thumbnail: 'https://img.youtube.com/vi/sfqvhD6lTSs/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=sfqvhD6lTSs',
  },
  {
    id: 14,
    title: 'Tepi Giby Gubaye Video 14',
    description: 'Highlighting Tepi Giby Gubaye\'s achievements.',
    videoId: 'Vm20dAQ_6tM',
    thumbnail: 'https://img.youtube.com/vi/Vm20dAQ_6tM/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=Vm20dAQ_6tM',
  },
  {
    id: 15,
    title: 'Tepi Giby Gubaye Video 15',
    description: 'Comprehensive overview of Tepi Giby Gubaye\'s initiatives.',
    videoId: 'y3pbTEEUSxQ',
    thumbnail: 'https://img.youtube.com/vi/y3pbTEEUSxQ/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=y3pbTEEUSxQ',
  },
  {
    id: 16,
    title: 'Tepi Giby Gubaye Video 16',
    description: 'Detailed analysis of Tepi Giby Gubaye\'s projects.',
    videoId: '44OKxHoliIg',
    thumbnail: 'https://img.youtube.com/vi/44OKxHoliIg/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=44OKxHoliIg',
  },
  {
    id: 17,
    title: 'Tepi Giby Gubaye Video 17',
    description: 'Exploring the future of Tepi Giby Gubaye.',
    videoId: 'B_Mp6oej01s',
    thumbnail: 'https://img.youtube.com/vi/B_Mp6oej01s/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=B_Mp6oej01s',
  },
  {
    id: 18,
    title: 'Tepi Giby Gubaye Video 18',
    description: 'Understanding Tepi Giby Gubaye\'s global impact.',
    videoId: 'vQ2I3DSojw4',
    thumbnail: 'https://img.youtube.com/vi/vQ2I3DSojw4/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=vQ2I3DSojw4',
  },
];

export default function VideoPage() {
  const { theme } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('USER');
  const [otp, setOtp] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Login logic here
    setShowOtpModal(true);
    setShowLogin(false);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Signup logic here
    setShowSignup(false);
    setShowLogin(true);
  };

  const handleOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // OTP verification logic here
    setShowOtpModal(false);
  };

  const openVideoModal = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-background text-text-primary'
    }`}>
      <Navbar />
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className={`py-12 px-4 ${
          theme === 'dark' ? 'bg-transparent' : 'bg-background'
        }`}>
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${
                theme === 'dark' ? 'text-primary' : 'text-primary'
              }`}>
                Tepi Giby Gubaye Video Library
              </h1>
              <p className={`text-lg max-w-3xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-text-secondary'
              }`}>
                Watch our collection of videos showcasing INSA Ethiopia's mission, achievements, 
                and cybersecurity initiatives.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Video Grid Sections */}
        {videos.map((video, index) => (
          <section
            key={video.id}
            className={`py-12 px-4 ${
              index % 2 === 0 
                ? (theme === 'dark' ? 'bg-surface/20' : 'bg-surface')
                : (theme === 'dark' ? 'bg-transparent' : 'bg-background')
            }`}
          >
            <div className="container mx-auto">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
                index % 2 === 0 ? '' : 'lg:flex-row-reverse'
              }`}>
                {/* Content Column */}
                <motion.div
                  initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 1 }}
                  viewport={{ once: true }}
                  className={`${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'} text-center lg:text-left`}
                >
                  <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    {video.title}
                  </h2>
                  <p className={`text-base mb-6 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-text-secondary'
                  }`}>
                    {video.description}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <button
                      onClick={() => openVideoModal(video.videoId)}
                      className="inline-flex items-center px-5 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg font-medium text-sm transition-colors duration-300"
                    >
                      <FaPlayCircle className="mr-2" />
                      Watch Video
                    </button>
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors duration-300"
                    >
                      <FaDownload className="mr-2" />
                      Watch on YouTube
                    </a>
                  </div>
                </motion.div>

                {/* Video Thumbnail Column */}
                <motion.div
                  initial={{ x: index % 2 === 0 ? 100 : -100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 1 }}
                  viewport={{ once: true }}
                  className={`${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'} cursor-pointer`}
                  onClick={() => openVideoModal(video.videoId)}
                >
                  <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
                    {/* Thumbnail */}
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors duration-300">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/90 hover:bg-primary rounded-full flex items-center justify-center transition-colors duration-300">
                          <FaPlayCircle className="text-white text-3xl md:text-4xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-4xl"
          >
            <button
              onClick={closeVideoModal}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-primary transition-colors duration-300"
            >
              ✕
            </button>
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
                title="YouTube video player"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full max-w-md rounded-xl shadow-xl ${
              theme === 'dark' ? 'bg-surface border-border' : 'bg-white border'
            }`}
          >
            <div className={`p-6 border-b ${
              theme === 'dark' ? 'border-border' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-primary' : 'text-primary'
              }`}>
                Login
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={`flex items-center space-x-2 mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    <FaEnvelope />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`flex items-center space-x-2 mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    <FaKey />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium text-base transition-colors duration-300"
                >
                  Login
                </button>
                <p className={`text-center mt-4 ${
                  theme === 'dark' ? 'text-primary' : 'text-primary'
                }`}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogin(false);
                      setShowSignup(true);
                    }}
                    className="underline hover:text-secondary transition-colors"
                  >
                    Signup
                  </button>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full max-w-md rounded-xl shadow-xl ${
              theme === 'dark' ? 'bg-surface border-border' : 'bg-white border'
            }`}
          >
            <div className={`p-6 border-b ${
              theme === 'dark' ? 'border-border' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-primary' : 'text-primary'
              }`}>
                Signup
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className={`flex items-center space-x-2 mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    <FaUser />
                    <span>Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`flex items-center space-x-2 mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    <FaEnvelope />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`flex items-center space-x-2 mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    <FaCity />
                    <span>City</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter City"
                    value={signupCity}
                    onChange={(e) => setSignupCity(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`flex items-center space-x-2 mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'}`}>
                    <FaKey />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`flex items-center space-x-2 mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    <FaUserTag />
                    <span>Role</span>
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium text-base transition-colors duration-300"
                >
                  Signup
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full max-w-md rounded-xl shadow-xl ${
              theme === 'dark' ? 'bg-surface border-border' : 'bg-white border'
            }`}
          >
            <div className={`p-6 border-b ${
              theme === 'dark' ? 'border-border' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-primary' : 'text-primary'
              }`}>
                OTP Verification
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleOtp} className="space-y-4">
                <div>
                  <label className={`block mb-2 ${
                    theme === 'dark' ? 'text-primary' : 'text-primary'
                  }`}>
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-surface/50 border-border text-white' 
                        : 'bg-background border-border text-text-primary'
                    }`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium text-base transition-colors duration-300"
                >
                  Verify OTP
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}