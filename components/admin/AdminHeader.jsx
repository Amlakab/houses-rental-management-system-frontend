'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { FaSun, FaMoon, FaChevronDown, FaCheck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import NotificationCenter from '@/components/NotificationCenter';

export default function AdminHeader({ onMenuClick, onSidebarToggle, isSidebarCollapsed, isSidebarOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isAmharic } = useLanguage();
  const router = useRouter();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const languageMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLanguageOpen && languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
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

  if (!mounted) return null;

  const roleDisplay = user?.role ? (
    isAmharic 
      ? t(`role.${user.role}`, user.role) 
      : user.role.charAt(0).toUpperCase() + user.role.slice(1)
  ) : (isAmharic ? 'አስተዳዳሪ' : 'Administrator');

  return (
    <header className="
      w-full min-w-0 bg-white dark:bg-[#0a192f]
      border-b border-gray-200 dark:border-slate-800
      px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3.5
      flex items-center justify-between gap-2
      transition-colors duration-200 shadow-sm
    ">
      <div className="flex min-w-0 items-center flex-1">
        {/* Mobile menu hamburger button */}
        <button
          onClick={onMenuClick}
          aria-label="Toggle navigation drawer"
          aria-controls="admin-sidebar"
          aria-expanded={Boolean(isSidebarOpen)}
          className="
            mr-2 p-2 shrink-0 rounded-lg transition-all 
            text-gray-700 dark:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-slate-800
            border border-gray-200 dark:border-slate-700
            lg:hidden
          "
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          onClick={onSidebarToggle}
          className="
            hidden mr-3 p-2 shrink-0 rounded-lg transition-all 
            text-gray-700 dark:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-slate-800
            border border-gray-200 dark:border-slate-700
            lg:flex items-center
          "
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="
          truncate text-sm sm:text-base lg:text-lg font-bold transition-colors
          text-gray-900 dark:text-white
        ">
          {t('dashboard.title', 'Dashboard')}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {/* Notifications */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            shrink-0 p-2 rounded-lg transition-all 
            border border-gray-200 dark:border-slate-700
            text-gray-700 dark:text-gray-200
            hover:bg-gray-100 dark:hover:bg-slate-800
          "
          aria-label="Toggle theme"
          title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === 'dark' ? (
            <FaSun className="text-amber-400 h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <FaMoon className="text-slate-600 h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {/* Language Dropdown */}
        <div className="relative" ref={languageMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLanguageOpen(!isLanguageOpen);
            }}
            className="
              flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-lg 
              transition-all border border-gray-200 dark:border-slate-700
              text-gray-700 dark:text-gray-200 
              hover:bg-gray-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold
            "
            title="Switch Language"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
              />
            </svg>
            <span>{language.toUpperCase()}</span>
            <FaChevronDown 
              className={`transition-transform duration-200 text-gray-400 ${isLanguageOpen ? 'rotate-180' : ''}`} 
              size={10} 
            />
          </button>
          {isLanguageOpen && (
            <div 
              className="
                absolute right-0 mt-2 w-44 bg-white dark:bg-[#112240] 
                border border-gray-200 dark:border-slate-700 rounded-xl 
                shadow-xl py-1.5 z-50 animate-fadeIn
              "
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => {
                  setLanguage('en');
                  setIsLanguageOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 text-left text-xs sm:text-sm transition-colors
                  ${language === 'en' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'}
                `}
              >
                <span>English</span>
                {language === 'en' && <FaCheck size={12} className="text-blue-600 dark:text-blue-400" />}
              </button>
              <button 
                onClick={() => {
                  setLanguage('am');
                  setIsLanguageOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 text-left text-xs sm:text-sm transition-colors
                  ${language === 'am' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'}
                `}
              >
                <span>አማርኛ (Amharic)</span>
                {language === 'am' && <FaCheck size={12} className="text-blue-600 dark:text-blue-400" />}
              </button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center">
          <div className="
            h-8 w-8 shrink-0 rounded-full flex items-center justify-center 
            bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800
          ">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-2 hidden md:block min-w-0 max-w-[120px] lg:max-w-[160px]">
            <p className="
              text-xs sm:text-sm font-semibold truncate
              text-gray-900 dark:text-white
            ">
              {user?.name || user?.email || user?.phone || (isAmharic ? 'ተጠቃሚ' : 'User')}
            </p>
            <p className="
              text-[11px] truncate
              text-gray-500 dark:text-gray-400
            ">
              {roleDisplay}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="
            shrink-0 p-2 rounded-lg transition-all 
            border border-red-200 dark:border-red-900/40
            text-red-600 hover:bg-red-50 
            dark:text-red-400 dark:hover:bg-red-950/30
          "
          title={isAmharic ? 'ውጣ' : 'Logout'}
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </header>
  );
}