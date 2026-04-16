'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import {
  FaSun,
  FaMoon,
  FaGlobe,
  FaChevronDown,
} from 'react-icons/fa';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isResourceOpenMobile, setIsResourceOpenMobile] = useState(false);
  const [isLanguageOpenMobile, setIsLanguageOpenMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      setIsResourceOpenMobile(false);
      setIsLanguageOpenMobile(false);
    }
  };

  const toggleResource = () => {
    setIsResourceOpen(!isResourceOpen);
    setIsLanguageOpen(false);
  };

  const toggleLanguage = () => {
    setIsLanguageOpen(!isLanguageOpen);
    setIsResourceOpen(false);
  };

  const toggleResourceMobile = () => {
    setIsResourceOpenMobile(!isResourceOpenMobile);
    setIsLanguageOpenMobile(false);
  };

  const toggleLanguageMobile = () => {
    setIsLanguageOpenMobile(!isLanguageOpenMobile);
    setIsResourceOpenMobile(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isResourceOpen || isLanguageOpen) {
        setIsResourceOpen(false);
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isResourceOpen, isLanguageOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsResourceOpenMobile(false);
        setIsLanguageOpenMobile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Prevent body scroll when mobile menu is open
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
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/public/houses', label: 'Visit Houses' },
    { href: '/contact', label: 'Contact' },
  ];


  const isActive = (href: string) => pathname === href;

  const navLinkClasses = (href: string) => `
    relative px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all duration-300
    ${isActive(href) 
      ? 'text-primary dark:text-primary after:scale-x-100' 
      : 'text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary'
    }
    after:absolute after:bottom-0 after:left-0 after:h-0.5 
    after:bg-primary dark:after:bg-primary after:transition-transform after:duration-300
    after:origin-left after:scale-x-0 hover:after:scale-x-100
  `;

  const mobileNavLinkClasses = (href: string) => `
    block px-4 py-3 text-base sm:text-lg font-medium transition-all duration-200
    ${isActive(href) 
      ? 'text-primary dark:text-primary bg-primary/5 dark:bg-primary/20 border-l-2 border-primary dark:border-primary' 
      : 'text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20'
    }
  `;

  if (!mounted) return null;

  return (
    <nav className="bg-surface dark:bg-surface border-b border-border dark:border-border shadow-md fixed w-full z-50 transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
          
          {/* Logo + Brand Name */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/images/hrms-logo.jpg"
                alt="Zelalem Cafterya Logo"
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 640px) 40px, (max-width: 768px) 56px, 80px"
                priority
              />
            </div>
            <span className="text-base sm:text-xl md:text-2xl font-bold text-text-primary dark:text-text-primary transition-colors duration-300 group-hover:text-primary dark:group-hover:text-primary">
              House Selling
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClasses(link.href)}
              >
                {link.label}
              </Link>
            ))}
            

            {/* User Section */}
            {user ? (
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-text-secondary dark:text-text-secondary text-sm px-2 truncate max-w-[150px]">
                  Welcome, {user.name || user.email}
                </span>
                <Link
                  href="/admin/dashboard"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border border-primary dark:border-primary text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-surface dark:hover:text-surface rounded-lg font-medium transition-all duration-300 text-sm hover:scale-105"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border border-error dark:border-error text-error dark:text-error hover:bg-error dark:hover:bg-error hover:text-surface dark:hover:text-surface rounded-lg font-medium transition-all duration-300 text-sm hover:scale-105"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  href="/auth/login"
                  className="px-3 sm:px-5 py-1.5 sm:py-2 border border-primary dark:border-primary text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-surface dark:hover:text-surface rounded-lg font-medium transition-all duration-300 text-sm hover:scale-105"
                >
                  Signin
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3 sm:px-5 py-1.5 sm:py-2 border border-primary dark:border-primary text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-surface dark:hover:text-surface rounded-lg font-medium transition-all duration-300 text-sm hover:scale-105"
                >
                  Signup
                </Link>
              </div>
              
            )}

            {/* Language Dropdown */}
            <div className="relative ml-2 sm:ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLanguage();
                }}
                className={`
                  relative px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all duration-300
                  flex items-center space-x-1.5 sm:space-x-2
                  ${isLanguageOpen ? 'text-primary dark:text-primary' : 'text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary'}
                  after:absolute after:bottom-0 after:left-0 after:h-0.5 
                  after:bg-primary dark:after:bg-primary after:transition-transform after:duration-300
                  after:origin-left after:scale-x-0 hover:after:scale-x-100
                `}
              >
                <FaGlobe size={14} className="text-text-primary dark:text-text-primary" />
                <span className="text-text-primary dark:text-text-primary text-sm">EN</span>
                <FaChevronDown 
                  className={`transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''} text-text-muted dark:text-text-muted`} 
                  size={12} 
                />
              </button>
              {isLanguageOpen && (
                <div 
                  className="absolute right-0 mt-2 w-36 sm:w-40 bg-surface dark:bg-surface border border-border dark:border-border rounded-lg shadow-lg py-2 animate-fadeIn z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors duration-200 text-sm sm:text-base">
                    English
                  </button>
                  <button className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors duration-200 text-sm sm:text-base">
                    Amharic
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-2 sm:ml-4 p-2 sm:p-3 rounded-lg hover:bg-border dark:hover:bg-border transition-all duration-300 hover:scale-110"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FaSun className="text-warning" size={16} />
              ) : (
                <FaMoon className="text-text-secondary" size={16} />
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-3 rounded-lg hover:bg-border dark:hover:bg-border transition-all duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FaSun className="text-warning" size={16} />
              ) : (
                <FaMoon className="text-text-secondary" size={16} />
              )}
            </button>
            <button
              onClick={toggleMenu}
              className="text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary p-2 rounded-lg hover:bg-border dark:hover:bg-border transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="lg:hidden fixed inset-0 top-16 sm:top-20 bg-surface dark:bg-surface z-40 overflow-y-auto animate-slideDown"
          >
            <div className="container mx-auto px-4 py-4 sm:py-6">
              {/* Main Navigation Links */}
              <div className="mb-5 sm:mb-6">
                <h3 className="text-text-muted dark:text-text-muted text-xs sm:text-sm font-medium uppercase mb-2 sm:mb-3 px-4">Menu</h3>
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
              <div className="mb-5 sm:mb-6">
                <button
                  onClick={toggleLanguageMobile}
                  className="w-full flex items-center justify-between px-4 py-3 text-base sm:text-lg font-medium text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <FaGlobe size={14} />
                    <span>Language</span>
                  </div>
                  <FaChevronDown 
                    className={`transition-transform duration-300 ${isLanguageOpenMobile ? 'rotate-180' : ''} text-text-muted dark:text-text-muted`} 
                    size={12} 
                  />
                </button>
                
                {isLanguageOpenMobile && (
                  <div className="mt-2 space-y-2 animate-fadeIn">
                    <button className="block w-full px-4 py-2.5 sm:py-3 text-left text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-lg transition-colors duration-200 text-sm sm:text-base">
                      English
                    </button>
                    <button className="block w-full px-4 py-2.5 sm:py-3 text-left text-text-primary dark:text-text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-lg transition-colors duration-200 text-sm sm:text-base">
                      Amharic
                    </button>
                  </div>
                )}
              </div>

              {/* User Section */}
              {user ? (
                <div className="mb-5 sm:mb-6">
                  <div className="px-4 py-3 border-t border-border dark:border-border mb-4">
                    <div className="text-xs sm:text-sm text-text-muted dark:text-text-muted mb-1">Welcome</div>
                    <div className="text-text-primary dark:text-text-primary font-medium text-base sm:text-lg truncate">{user.name || user.email}</div>
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className={mobileNavLinkClasses('/admin/dashboard')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 border border-error dark:border-error text-error dark:text-error hover:bg-error dark:hover:bg-error hover:text-surface dark:hover:text-surface rounded-lg font-medium transition-all duration-300 text-base sm:text-lg mt-4"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-text-muted dark:text-text-muted text-xs sm:text-sm font-medium uppercase mb-2 sm:mb-3 px-4">Account</h3>
                  <div className="space-y-3">
                    <Link
                      href="/auth/login"
                      className="block w-full px-4 py-3 border border-primary dark:border-primary text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-surface dark:hover:text-surface rounded-lg font-medium transition-all duration-300 text-base sm:text-lg text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Signin
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block w-full px-4 py-3 border border-primary dark:border-primary text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-surface dark:hover:text-surface rounded-lg font-medium transition-all duration-300 text-base sm:text-lg text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Signup
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;