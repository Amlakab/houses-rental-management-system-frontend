'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  FaSun,
  FaMoon,
  FaGlobe,
  FaChevronDown,
  FaCheck,
} from 'react-icons/fa';
import NotificationCenter from '@/components/NotificationCenter';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isLanguageOpenMobile, setIsLanguageOpenMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const languageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu whenever the route/pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsLanguageOpenMobile(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Close desktop language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isLanguageOpen && languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageOpen]);

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setIsLanguageOpenMobile(false);
  };

  const toggleLanguage = () => {
    setIsLanguageOpen((prev) => !prev);
  };

  const toggleLanguageMobile = () => {
    setIsLanguageOpenMobile((prev) => !prev);
  };

  const navLinks = [
    { href: '/', label: t('nav.home', 'Home') },
    { href: '/public/houses', label: t('nav.properties', 'Properties') },
    { href: '/public/map', label: t('nav.map_search', 'Map Search') },
    { href: '/admin/customer', label: t('nav.my_portal', 'My Portal') },
    { href: '/about', label: t('nav.about', 'About') },
    { href: '/contact', label: t('nav.contact', 'Contact') },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinkClasses = (href: string) => `
    relative px-3 py-2 text-sm lg:text-base font-medium transition-all duration-200 rounded-lg
    ${isActive(href) 
      ? 'text-blue-600 dark:text-blue-400 font-semibold' 
      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    }
  `;

  const mobileNavLinkClasses = (href: string) => `
    flex items-center justify-between px-4 py-3 text-base font-semibold rounded-xl transition-all duration-200
    ${isActive(href) 
      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600 shadow-xs' 
      : 'text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800/80 active:bg-gray-200 dark:active:bg-slate-800'
    }
  `;

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-[9999] h-16 sm:h-20 bg-white dark:bg-[#0a192f] border-b border-gray-200 dark:border-slate-800" />
    );
  }

  return (
    <>
      {/* Fixed Top Navbar Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-[9999] h-16 sm:h-20 bg-white/95 dark:bg-[#0a192f]/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* Logo + Brand Name */}
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800 shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/images/hrms-logo.jpg"
                  alt="HRMS Real Estate Logo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 36px, 48px"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  RealEstate Pro
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 hidden sm:block">
                  HRMS Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={navLinkClasses(link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Section: Auth, Language, Theme (Desktop) */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
              {/* User Section */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 dark:text-gray-300 text-xs xl:text-sm px-2 truncate max-w-[130px] font-medium">
                    {user.name || user.email}
                  </span>
                  <Link
                    href="/admin/dashboard"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs xl:text-sm shadow-sm transition-all hover:shadow"
                  >
                    {t('nav.dashboard', 'Dashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium text-xs xl:text-sm transition-all cursor-pointer"
                  >
                    {t('nav.logout', 'Logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/auth/login"
                    className="px-3.5 py-1.5 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-xs xl:text-sm transition-all"
                  >
                    {t('nav.signin', 'Sign In')}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs xl:text-sm shadow-sm transition-all hover:shadow"
                  >
                    {t('nav.signup', 'Sign Up')}
                  </Link>
                </div>
              )}

              {/* In-App Notifications */}
              {user && (
                <div className="ml-1">
                  <NotificationCenter />
                </div>
              )}

              {/* Language Selector Desktop */}
              <div className="relative" ref={languageMenuRef}>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 transition-all text-xs xl:text-sm font-medium cursor-pointer"
                  aria-label="Change Language"
                  title="Change Language"
                >
                  <FaGlobe className="text-blue-600 dark:text-blue-400" size={14} />
                  <span className="font-semibold">{language.toUpperCase()}</span>
                  <FaChevronDown
                    className={`transition-transform duration-200 text-gray-500 ${isLanguageOpen ? 'rotate-180' : ''}`}
                    size={10}
                  />
                </button>

                {isLanguageOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#112240] border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>English</span>
                      {language === 'en' && <FaCheck size={12} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('am');
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                        language === 'am'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>አማርኛ (Amharic)</span>
                      {language === 'am' && <FaCheck size={12} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Toggle Desktop */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <FaSun className="text-amber-400" size={16} />
                ) : (
                  <FaMoon className="text-slate-600" size={16} />
                )}
              </button>
            </div>

            {/* Mobile Controls: Language Quick Toggle + Theme Toggle + Hamburger Button */}
            <div className="lg:hidden flex items-center space-x-1.5 sm:space-x-2">
              {/* Notification icon on mobile if logged in */}
              {user && (
                <div className="mr-0.5">
                  <NotificationCenter />
                </div>
              )}

              {/* Language quick toggle */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title="Toggle Language"
                aria-label="Toggle Language"
              >
                {language === 'en' ? 'አማ' : 'EN'}
              </button>

              {/* Theme Toggle Mobile */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <FaSun className="text-amber-400" size={16} />
                ) : (
                  <FaMoon className="text-slate-600" size={16} />
                )}
              </button>

              {/* Mobile Hamburger Menu Toggle Button */}
              <button
                type="button"
                onClick={toggleMenu}
                className="p-2 sm:p-2.5 rounded-xl text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                aria-label={isMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[9995] bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            setIsMenuOpen(false);
            setIsLanguageOpenMobile(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <nav
          aria-label="Mobile Navigation Drawer"
          className="lg:hidden fixed top-16 sm:top-20 inset-x-0 bottom-0 z-[9998] bg-white dark:bg-[#0a192f] border-t border-gray-200 dark:border-slate-800 shadow-2xl overflow-y-auto overscroll-contain animate-slideDown"
        >
          <div className="container mx-auto px-4 py-5 flex flex-col min-h-full justify-between pb-12">
            <div>
              {/* Navigation Links */}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-4 mb-2.5 block">
                  {t('nav.menu', 'Menu')}
                </span>
                <div className="space-y-1.5">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={mobileNavLinkClasses(link.href)}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{link.label}</span>
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Language Selector Mobile */}
              <div className="mb-6 border-t border-gray-200 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={toggleLanguageMobile}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium transition-colors border border-gray-200/60 dark:border-slate-700/60 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <FaGlobe className="text-blue-600 dark:text-blue-400" size={16} />
                    <span className="font-semibold">{t('nav.language', 'Language')} ({language.toUpperCase()})</span>
                  </div>
                  <FaChevronDown
                    className={`transition-transform duration-200 text-gray-400 ${isLanguageOpenMobile ? 'rotate-180' : ''}`}
                    size={12}
                  />
                </button>

                {isLanguageOpenMobile && (
                  <div className="mt-2 space-y-1.5 pl-2 pr-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setIsLanguageOpenMobile(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>English</span>
                      {language === 'en' && <FaCheck size={14} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('am');
                        setIsLanguageOpenMobile(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        language === 'am'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>አማርኛ (Amharic)</span>
                      {language === 'am' && <FaCheck size={14} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account / User Section in Mobile Menu */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-5 pb-4">
              {user ? (
                <div className="space-y-3">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">{t('nav.welcome', 'Welcome')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate block text-sm">
                      {user.name || user.email}
                    </span>
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className="block w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.dashboard', 'Dashboard')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-3 border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    {t('nav.logout', 'Logout')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    href="/auth/login"
                    className="block w-full text-center px-4 py-3 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.signin', 'Sign In')}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.signup', 'Sign Up')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;