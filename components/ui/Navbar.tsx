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

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Close desktop dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (isLanguageOpen && languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isLanguageOpen]);

  // Close mobile menu when clicking outside (ignoring clicks on the toggle button itself!)
  useEffect(() => {
    const handleOutsideMenuClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        isMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
        setIsLanguageOpenMobile(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideMenuClick);
    document.addEventListener('touchstart', handleOutsideMenuClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideMenuClick);
      document.removeEventListener('touchstart', handleOutsideMenuClick);
    };
  }, [isMenuOpen]);

  // Lock body scroll when mobile menu is active
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
    block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200
    ${isActive(href) 
      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600 font-semibold' 
      : 'text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800'
    }
  `;

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-50 h-16 sm:h-20 bg-white dark:bg-[#0a192f] border-b border-gray-200 dark:border-slate-800" />
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 dark:bg-[#0a192f]/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
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
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClasses(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section: Auth, Language, Theme */}
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
                  className="px-3 py-1.5 border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium text-xs xl:text-sm transition-all"
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
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLanguage();
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 transition-all text-xs xl:text-sm font-medium"
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
                    onClick={() => {
                      setLanguage('en');
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      language === 'en'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <FaCheck size={12} className="text-blue-600 dark:text-blue-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('am');
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
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
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-all"
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

          {/* Mobile Right Controls: Theme + Hamburger Toggle */}
          <div className="lg:hidden flex items-center space-x-1.5 sm:space-x-2">
            {/* Mobile Language Button quick toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-gray-200"
              title="Toggle Language"
            >
              {language === 'en' ? 'አማ' : 'EN'}
            </button>

            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FaSun className="text-amber-400" size={16} />
              ) : (
                <FaMoon className="text-slate-600" size={16} />
              )}
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              ref={mobileToggleRef}
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden fixed inset-x-0 top-16 sm:top-20 bottom-0 bg-white dark:bg-[#0a192f] border-t border-gray-200 dark:border-slate-800 z-50 overflow-y-auto animate-slideDown shadow-2xl"
        >
          <div className="container mx-auto px-4 py-4 sm:py-6 flex flex-col min-h-full justify-between">
            <div>
              {/* Navigation Links */}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-4 mb-2 block">
                  {t('nav.menu', 'Menu')}
                </span>
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={mobileNavLinkClasses(link.href)}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Language Selector Mobile */}
              <div className="mb-6 border-t border-gray-200 dark:border-slate-800 pt-4">
                <button
                  onClick={toggleLanguageMobile}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FaGlobe className="text-blue-600 dark:text-blue-400" size={16} />
                    <span>{t('nav.language', 'Language')} ({language.toUpperCase()})</span>
                  </div>
                  <FaChevronDown
                    className={`transition-transform duration-200 text-gray-400 ${isLanguageOpenMobile ? 'rotate-180' : ''}`}
                    size={12}
                  />
                </button>

                {isLanguageOpenMobile && (
                  <div className="mt-2 space-y-1 pl-4 pr-2">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setIsLanguageOpenMobile(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors ${
                        language === 'en'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>English</span>
                      {language === 'en' && <FaCheck size={12} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('am');
                        setIsLanguageOpenMobile(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors ${
                        language === 'am'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>አማርኛ (Amharic)</span>
                      {language === 'am' && <FaCheck size={12} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account / User Section in Mobile Menu */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-4 pb-6">
              {user ? (
                <div className="space-y-3">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">{t('nav.welcome', 'Welcome')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate block">
                      {user.name || user.email}
                    </span>
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.dashboard', 'Dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-2.5 border border-red-500 text-red-600 dark:text-red-400 rounded-lg font-medium"
                  >
                    {t('nav.logout', 'Logout')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/login"
                    className="block w-full text-center px-4 py-3 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.signin', 'Sign In')}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.signup', 'Sign Up')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.18s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.22s ease-out forwards;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;