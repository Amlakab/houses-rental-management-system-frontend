'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { FaSun, FaMoon, FaChevronDown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onMenuClick: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AdminHeader({
  onMenuClick,
  onSidebarToggle,
  isSidebarCollapsed = false,
}: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns on outside click — using refs so clicks inside don't close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsMobileUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!mounted) return null;

  const displayName =
    user?.name || user?.email || user?.phone || 'Admin User';
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Administrator';

  return (
    <header className="
      sticky top-0 z-30
      bg-surface dark:bg-surface
      border-b border-border dark:border-border
      px-3 sm:px-4 md:px-6 py-3 md:py-4
      flex items-center justify-between gap-2
      transition-colors duration-300 shadow-md
    ">
      {/* ── LEFT: menu toggle + title ─────────────────────────── */}
      <div className="flex items-center min-w-0 flex-1">
        {/* Mobile menu button (opens sidebar overlay) */}
        <button
          onClick={onMenuClick}
          className="
            mr-2 p-2 rounded-md transition-all duration-300
            hover:scale-105 text-text-primary dark:text-text-primary
            hover:bg-border dark:hover:bg-border
            lg:hidden flex-shrink-0
          "
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Desktop sidebar toggle */}
        {onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="
              hidden mr-4 p-2 rounded-md transition-all duration-300
              hover:scale-105 text-text-primary dark:text-text-primary
              hover:bg-border dark:hover:bg-border
              lg:flex items-center flex-shrink-0
            "
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        <h1 className="
          text-base sm:text-lg md:text-xl font-semibold
          transition-colors duration-300 truncate
          text-text-primary dark:text-text-primary
        ">
          Dashboard
        </h1>
      </div>

      {/* ── RIGHT: actions ────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
        {/* Theme toggle — always visible */}
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

        {/* Notifications — hidden on smallest screens to save space */}
        <button
          className="
            hidden sm:inline-flex p-2 rounded-full transition-all duration-300
            hover:scale-105 relative text-text-primary
            dark:text-text-primary hover:bg-border dark:hover:bg-border
          "
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="
            absolute top-1 right-1 h-2 w-2
            bg-error rounded-full animate-pulse
          " />
        </button>

        {/* Language dropdown — hidden on mobile (fits only on md+) */}
        <div className="relative hidden md:block" ref={languageRef}>
          <button
            onClick={() => setIsLanguageOpen((v) => !v)}
            className="
              flex items-center space-x-1.5 p-2 rounded-lg
              transition-all duration-300 hover:scale-105
              text-text-primary dark:text-text-primary
              hover:bg-border dark:hover:bg-border
            "
            aria-label="Change language"
            aria-expanded={isLanguageOpen}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            <span className="hidden md:inline text-sm">EN</span>
            <FaChevronDown
              className={`transition-transform duration-300 ${
                isLanguageOpen ? 'rotate-180' : ''
              }`}
              size={12}
            />
          </button>

          {isLanguageOpen && (
            <div className="
              absolute right-0 mt-2 w-40 bg-surface dark:bg-surface
              border border-border dark:border-border rounded-lg
              shadow-lg py-2 z-50 animate-fadeIn
            ">
              <button className="
                block w-full px-4 py-2 text-left text-sm
                transition-colors duration-200
                text-text-primary dark:text-text-primary
                hover:text-primary dark:hover:text-primary
                hover:bg-primary/5 dark:hover:bg-primary/20
              ">
                English
              </button>
              <button className="
                block w-full px-4 py-2 text-left text-sm
                transition-colors duration-200
                text-text-primary dark:text-text-primary
                hover:text-primary dark:hover:text-primary
                hover:bg-primary/5 dark:hover:bg-primary/20
              ">
                Amharic
              </button>
            </div>
          )}
        </div>

        {/* ── User profile ─────────────────────────────────── */}
        {/* Desktop: avatar + name/role inline */}
        <div className="hidden md:flex items-center">
          <div className="
            h-8 w-8 rounded-full flex items-center justify-center
            transition-all duration-300 bg-primary/10 dark:bg-primary/20
            flex-shrink-0
          ">
            <User className="h-5 w-5 text-primary dark:text-primary" />
          </div>
          <div className="ml-2 min-w-0">
            <p className="
              text-sm font-medium transition-colors duration-300 truncate max-w-[140px]
              text-text-primary dark:text-text-primary
            ">
              {displayName}
            </p>
            <p className="
              text-xs transition-colors duration-300 truncate max-w-[140px]
              text-text-secondary dark:text-text-secondary
            ">
              {displayRole}
            </p>
          </div>
        </div>

        {/* Mobile: avatar button opens a small dropdown with name/role/logout */}
        <div className="relative md:hidden" ref={userMenuRef}>
          <button
            onClick={() => setIsMobileUserMenuOpen((v) => !v)}
            className="
              h-8 w-8 rounded-full flex items-center justify-center
              bg-primary/10 dark:bg-primary/20
              transition-all duration-300 hover:scale-105
            "
            aria-label="User menu"
            aria-expanded={isMobileUserMenuOpen}
          >
            <User className="h-5 w-5 text-primary dark:text-primary" />
          </button>

          {isMobileUserMenuOpen && (
            <div className="
              absolute right-0 mt-2 w-56 bg-surface dark:bg-surface
              border border-border dark:border-border rounded-lg
              shadow-lg py-2 z-50 animate-fadeIn
            ">
              <div className="px-4 py-2 border-b border-border dark:border-border">
                <p className="text-sm font-medium text-text-primary dark:text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-xs text-text-secondary dark:text-text-secondary truncate">
                  {displayRole}
                </p>
              </div>

              {/* Notifications entry for mobile (since the icon is hidden) */}
              <button className="
                flex w-full items-center gap-2 px-4 py-2 text-sm text-left
                transition-colors duration-200
                text-text-primary dark:text-text-primary
                hover:bg-primary/5 dark:hover:bg-primary/20
              ">
                <Bell className="h-4 w-4" />
                Notifications
              </button>

              {/* Logout on mobile lives here so it's not crowded in header */}
              <button
                onClick={handleLogout}
                className="
                  flex w-full items-center gap-2 px-4 py-2 text-sm text-left
                  transition-colors duration-200 text-error
                  hover:bg-error/10 dark:hover:bg-error/20
                "
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Desktop logout — hidden on mobile (mobile uses dropdown) */}
        <button
          onClick={handleLogout}
          className="
            hidden md:inline-flex p-2 rounded-md transition-all duration-300
            hover:scale-105 text-error hover:bg-error/10
            dark:text-error dark:hover:bg-error/20
          "
          title="Logout"
          aria-label="Logout"
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