'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import {
  Bell,
  LogOut,
  User,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { FaSun, FaMoon, FaChevronDown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  // Close dropdowns on outside click
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

  const handleSidebarToggleClick = () => {
    if (typeof onSidebarToggle !== 'function') {
      console.warn(
        '[AdminHeader] onSidebarToggle is not provided. ' +
          'Pass it from the parent layout to enable desktop collapse.'
      );
      return;
    }
    onSidebarToggle();
  };

  if (!mounted) return null;

  const displayName =
    user?.name || user?.email || user?.phone || 'Admin User';
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Administrator';

  return (
    <header
      className="
        sticky top-0 z-30
        bg-surface dark:bg-surface
        border-b border-border dark:border-border
        px-3 sm:px-4 md:px-6 py-2 md:py-3
        flex items-center justify-between gap-2
        transition-colors duration-300 shadow-md
        w-full
      "
    >
      {/* ── LEFT ─────────────────────────────────────────── */}
      <div className="flex items-center min-w-0 flex-1">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="
            mr-1.5 p-2 rounded-md transition-all duration-300
            hover:scale-105 text-text-primary dark:text-text-primary
            hover:bg-border dark:hover:bg-border
            lg:hidden flex-shrink-0
          "
          aria-label="Open navigation menu"
        >
          <MenuIcon className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        {/* Desktop sidebar toggle — distinct icon so users know it's not the hamburger */}
        <button
          onClick={handleSidebarToggleClick}
          className="
            hidden lg:flex mr-3 p-2 rounded-md transition-all duration-300
            hover:scale-105 text-text-primary dark:text-text-primary
            hover:bg-border dark:hover:bg-border
            flex-shrink-0
          "
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        {/* Title — truncate so it never pushes actions off-screen */}
        <h1
          className="
            text-sm sm:text-base md:text-lg lg:text-xl font-semibold
            transition-colors duration-300
            text-text-primary dark:text-text-primary
            truncate min-w-0
          "
        >
          Dashboard
        </h1>
      </div>

      {/* ── RIGHT ────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
        {/* Theme toggle — always visible */}
        <button
          onClick={toggleTheme}
          className="
            p-1.5 md:p-2 rounded-lg transition-all duration-300
            hover:scale-110 hover:bg-border dark:hover:bg-border
          "
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <FaSun className="text-warning h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <FaMoon className="text-text-primary h-4 w-4 md:h-5 md:w-5" />
          )}
        </button>

        {/* Notifications — hidden on very small screens (moved into avatar dropdown) */}
        <button
          className="
            hidden sm:inline-flex p-1.5 md:p-2 rounded-full transition-all duration-300
            hover:scale-105 relative text-text-primary
            dark:text-text-primary hover:bg-border dark:hover:bg-border
          "
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          <span
            className="
              absolute top-1 right-1 h-2 w-2
              bg-error rounded-full animate-pulse
            "
          />
        </button>

        {/* Language — hidden on mobile (moved into avatar dropdown) */}
        <div className="relative hidden md:block" ref={languageRef}>
          <button
            onClick={() => setIsLanguageOpen(v => !v)}
            className="
              flex items-center space-x-1.5 p-1.5 md:p-2 rounded-lg
              transition-all duration-300 hover:scale-105
              text-text-primary dark:text-text-primary
              hover:bg-border dark:hover:bg-border
            "
            aria-label="Change language"
            aria-expanded={isLanguageOpen}
          >
            <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            <span className="text-sm">EN</span>
            <FaChevronDown
              className={`transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`}
              size={12}
            />
          </button>

          {isLanguageOpen && (
            <div
              className="
                absolute right-0 mt-2 w-40 bg-surface dark:bg-surface
                border border-border dark:border-border rounded-lg
                shadow-lg py-2 z-50 animate-fadeIn
              "
            >
              <button className="block w-full px-4 py-2 text-left text-sm text-text-primary dark:text-text-primary hover:bg-primary/5 dark:hover:bg-primary/20">
                English
              </button>
              <button className="block w-full px-4 py-2 text-left text-sm text-text-primary dark:text-text-primary hover:bg-primary/5 dark:hover:bg-primary/20">
                Amharic
              </button>
            </div>
          )}
        </div>

        {/* Desktop name + role — hidden below md */}
        <div className="hidden md:flex items-center">
          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 dark:bg-primary/20 flex-shrink-0">
            <User className="h-5 w-5 text-primary dark:text-primary" />
          </div>
          <div className="ml-2 min-w-0">
            <p className="text-sm font-medium text-text-primary dark:text-text-primary truncate max-w-[140px]">
              {displayName}
            </p>
            <p className="text-xs text-text-secondary dark:text-text-secondary truncate max-w-[140px]">
              {displayRole}
            </p>
          </div>
        </div>

        {/* Mobile: avatar dropdown — contains name/role, notifications, language, logout */}
        <div className="relative md:hidden" ref={userMenuRef}>
          <button
            onClick={() => setIsMobileUserMenuOpen(v => !v)}
            className="
              h-8 w-8 rounded-full flex items-center justify-center
              bg-primary/10 dark:bg-primary/20
              transition-all duration-300 hover:scale-105
            "
            aria-label="Open user menu"
            aria-expanded={isMobileUserMenuOpen}
          >
            <User className="h-4 w-4 md:h-5 md:w-5 text-primary dark:text-primary" />
          </button>

          {isMobileUserMenuOpen && (
            <div
              className="
                absolute right-0 mt-2 w-60 bg-surface dark:bg-surface
                border border-border dark:border-border rounded-lg
                shadow-lg py-2 z-50 animate-fadeIn
              "
            >
              {/* Header row: name + role */}
              <div className="px-4 py-2 border-b border-border dark:border-border">
                <p className="text-sm font-medium text-text-primary dark:text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-xs text-text-secondary dark:text-text-secondary truncate">
                  {displayRole}
                </p>
              </div>

              {/* Notifications — accessible on mobile here since icon is hidden */}
              <Link
                href="/notifications"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left text-text-primary dark:text-text-primary hover:bg-primary/5 dark:hover:bg-primary/20"
                onClick={() => setIsMobileUserMenuOpen(false)}
              >
                <Bell className="h-4 w-4" />
                Notifications
              </Link>

              {/* Language — mobile substitute for the hidden dropdown */}
              <div className="px-4 py-2 border-t border-border dark:border-border">
                <p className="text-xs font-medium text-text-secondary dark:text-text-secondary mb-1.5">
                  Language
                </p>
                <div className="flex gap-2">
                  <button className="px-2 py-1 text-xs rounded border border-border dark:border-border text-text-primary dark:text-text-primary">
                    EN
                  </button>
                  <button className="px-2 py-1 text-xs rounded border border-border dark:border-border text-text-primary dark:text-text-primary">
                    አማ
                  </button>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-left text-error hover:bg-error/10 dark:hover:bg-error/20 border-t border-border dark:border-border"
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
            hidden md:inline-flex p-1.5 md:p-2 rounded-md transition-all duration-300
            hover:scale-105 text-error hover:bg-error/10
            dark:text-error dark:hover:bg-error/20
          "
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4 md:h-5 md:w-5" />
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