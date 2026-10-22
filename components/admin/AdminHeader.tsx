'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { FaSun, FaMoon, FaChevronDown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function AdminHeader({ onMenuClick, onSidebarToggle, isSidebarCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLanguageOpen) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isLanguageOpen]);

  if (!mounted) return null;

  return (
    <header className="
      bg-surface dark:bg-surface 
      border-b border-border dark:border-border 
      px-6 py-4 flex items-center justify-between 
      transition-colors duration-300 shadow-md
    ">
      <div className="flex items-center">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="
            mr-4 p-2 rounded-md transition-all duration-300 
            hover:scale-105 text-text-primary dark:text-text-primary 
            hover:bg-border dark:hover:bg-border
            lg:hidden
          "
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onSidebarToggle}
          className="
            hidden mr-4 p-2 rounded-md transition-all duration-300 
            hover:scale-105 text-text-primary dark:text-text-primary 
            hover:bg-border dark:hover:bg-border
            lg:flex items-center
          "
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-6 w-6" />
        </button>

        <h1 className="
          text-xl font-semibold transition-colors duration-300
          text-text-primary dark:text-text-primary
        ">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            p-2 rounded-lg transition-all duration-300 
            hover:scale-110 hover:bg-border dark:hover:bg-border
          "
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <FaSun className="text-warning h-5 w-5" />
          ) : (
            <FaMoon className="text-text-primary h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="
          p-2 rounded-full transition-all duration-300 
          hover:scale-105 relative text-text-primary 
          dark:text-text-primary hover:bg-border dark:hover:bg-border
        ">
          <Bell className="h-5 w-5" />
          <span className="
            absolute top-0 right-0 h-3 w-3 
            bg-error rounded-full animate-pulse
          "></span>
        </button>

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLanguageOpen(!isLanguageOpen);
            }}
            className="
              flex items-center space-x-2 p-2 rounded-lg 
              transition-all duration-300 hover:scale-105
              text-text-primary dark:text-text-primary 
              hover:bg-border dark:hover:bg-border
            "
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
              />
            </svg>
            <span className="hidden md:inline">EN</span>
            <FaChevronDown 
              className={`transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`} 
              size={14} 
            />
          </button>
          {isLanguageOpen && (
            <div 
              className="
                absolute right-0 mt-2 w-40 bg-surface dark:bg-surface 
                border border-border dark:border-border rounded-lg 
                shadow-lg py-2 animate-fadeIn z-50
              "
              onClick={(e) => e.stopPropagation()}
            >
              <button className="
                block w-full px-4 py-2 text-left transition-colors duration-200
                text-text-primary dark:text-text-primary 
                hover:text-primary dark:hover:text-primary 
                hover:bg-primary/5 dark:hover:bg-primary/20
              ">
                English
              </button>
              <button className="
                block w-full px-4 py-2 text-left transition-colors duration-200
                text-text-primary dark:text-text-primary 
                hover:text-primary dark:hover:text-primary 
                hover:bg-primary/5 dark:hover:bg-primary/20
              ">
                Amharic
              </button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center">
          <div className="
            h-8 w-8 rounded-full flex items-center justify-center 
            transition-all duration-300 bg-primary/10 dark:bg-primary/20
          ">
            <User className="h-5 w-5 text-primary dark:text-primary" />
          </div>
          <div className="ml-2 hidden md:block">
            <p className="
              text-sm font-medium transition-colors duration-300
              text-text-primary dark:text-text-primary
            ">
              {user?.name || user?.email || user?.phone || 'Admin User'}
            </p>
            <p className="
              text-xs transition-colors duration-300
              text-text-secondary dark:text-text-secondary
            ">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator'}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            p-2 rounded-md transition-all duration-300 
            hover:scale-105 text-error hover:bg-error/10 
            dark:text-error dark:hover:bg-error/20
          "
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <style jsx>{`
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
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </header>
  );
}