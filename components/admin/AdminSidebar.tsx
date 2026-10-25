'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth';
import {
  X, LogOut, ChevronLeft, ChevronRight,
  Users as UsersIcon, Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/icon-map';
import type { MenuDoc, Role } from '@/lib/menu-types';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SidebarUser {
  _id?: string;
  name?: string;
  phone?: string;
  role: Role;
  permissions: MenuDoc[];
}

export default function AdminSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t, isAmharic } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const u = user as SidebarUser | null;
  const userRole: Role = u?.role ?? 'user';
  const userDisplayName = u?.name || u?.phone || (isAmharic ? 'ተጠቃሚ' : 'User');
  const userRoleDisplay = isAmharic 
    ? t(`role.${userRole}`, userRole) 
    : userRole.charAt(0).toUpperCase() + userRole.slice(1);

  // Visible menus based on permissions and allowedRoles
  const visibleMenus: MenuDoc[] = (u?.permissions ?? [])
    .filter((m) => m.isActive)
    .filter((m) => m.allowedRoles.includes(userRole))
    .sort((a, b) => a.order - b.order);

  const handleLogout = () => {
    router.push('/');
    onClose?.();
  };

  const getSidebarTitle = () => {
    switch (userRole) {
      case 'admin': return isAmharic ? 'የአስተዳዳሪ ክፍል' : 'Admin Panel';
      case 'owner': return isAmharic ? 'የባለቤት ክፍል' : 'Owner Panel';
      case 'manager': return isAmharic ? 'የስራ አስኪያጅ ክፍል' : 'Manager Panel';
      case 'accountant': return isAmharic ? 'የሂሳብ ክፍል' : 'Accountant Panel';
      case 'agent': return isAmharic ? 'የወኪል ክፍል' : 'Agent Panel';
      case 'customer': return isAmharic ? 'የደንበኛ ክፍል' : 'Customer Panel';
      case 'user': return isAmharic ? 'የተጠቃሚ ክፍል' : 'User Panel';
      default: return isAmharic ? 'ክፍል' : 'Panel';
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700',
      owner: theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700',
      manager: theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700',
      accountant: theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
      agent: theme === 'dark' ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700',
      customer: theme === 'dark' ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700',
      user: theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700',
    };
    return colors[role] || (theme === 'dark' ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700');
  };

  // Helper to translate menu item names
  const translateMenuName = (name: string): string => {
    if (!isAmharic) return name;
    const lower = name.toLowerCase();
    if (lower.includes('dashboard')) return 'ዳሽቦርድ';
    if (lower.includes('user')) return 'ተጠቃሚዎች';
    if (lower.includes('house') || lower.includes('propert')) return 'ቤቶች';
    if (lower.includes('transaction')) return 'የገንዘብ ዝውውሮች';
    if (lower.includes('order')) return 'ትዕዛዞች';
    if (lower.includes('message')) return 'መልዕክቶች';
    if (lower.includes('workflow')) return 'የስራ ሂደቶች';
    if (lower.includes('report')) return 'ሪፖርቶች';
    if (lower.includes('wallet')) return 'የገንዘብ ቦርሳ';
    if (lower.includes('menu')) return 'ምናሌዎች';
    if (lower.includes('qrcode') || lower.includes('qr')) return 'የQR ኮድ';
    if (lower.includes('feedback')) return 'አስተያየቶች';
    if (lower.includes('loan')) return 'ብድር';
    if (lower.includes('agent')) return 'ደላሎች';
    if (lower.includes('accountant')) return 'የሂሳብ ሹሞች';
    return name;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="admin-sidebar"
        className={cn(
          'h-full flex flex-col justify-between transition-all duration-300',
          // Desktop positioning: fixed below top-16 header
          'lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-30 lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile positioning: slide-out drawer on top of all content
          'fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw]',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          theme === 'dark'
            ? 'bg-[#0a192f] border-r border-slate-800 text-gray-200'
            : 'bg-white border-r border-gray-200 text-gray-800'
        )}
      >
        {/* Header Section */}
        <div>
          <div
            className={cn(
              'flex items-center justify-between p-3.5 sm:p-4 border-b',
              theme === 'dark' ? 'border-slate-800' : 'border-gray-200',
              isCollapsed && 'justify-center'
            )}
          >
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <h2 className={cn('text-base sm:text-lg font-bold truncate', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {getSidebarTitle()}
                </h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit mt-1 ${getRoleColor(userRole)}`}>
                  {userRoleDisplay}
                </span>
              </div>
            )}

            {/* Close button on mobile */}
            <button
              onClick={onClose}
              className={cn(
                'p-1.5 rounded-lg transition-all lg:hidden',
                theme === 'dark' ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              )}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={onToggleCollapse}
              className={cn(
                'hidden lg:flex items-center justify-center p-1.5 rounded-lg transition-all',
                theme === 'dark' ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700',
                isCollapsed && 'w-full'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 overflow-y-auto max-h-[calc(100vh-170px)]">
            <ul className="space-y-1 sm:space-y-1.5">
              {visibleMenus.length > 0 ? (
                visibleMenus.map((item) => {
                  const Icon = resolveIcon(item.icon);
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');
                  const displayName = translateMenuName(item.name);

                  return (
                    <li key={item._id}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2.5 rounded-xl transition-all group font-medium text-xs sm:text-sm',
                          isActive
                            ? theme === 'dark'
                              ? 'bg-blue-600/20 border-l-4 border-blue-400 text-blue-400 font-bold'
                              : 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-bold'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-slate-800/60 hover:text-white'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            onClose?.();
                          }
                        }}
                      >
                        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0', isCollapsed ? 'mx-auto' : 'mr-3')} />
                        {!isCollapsed && (
                          <span className="truncate">{displayName}</span>
                        )}
                        {isCollapsed && (
                          <div
                            className={cn(
                              'absolute left-full ml-2 px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl text-xs font-semibold',
                              theme === 'dark'
                                ? 'bg-[#112240] border border-slate-700 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            )}
                          >
                            {displayName}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-4 text-center">
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      theme === 'dark' ? 'bg-slate-800/40 text-gray-400' : 'bg-gray-50 text-gray-600'
                    )}
                  >
                    <p className="text-xs sm:text-sm font-semibold">{isAmharic ? 'መዳረሻ የለም' : 'No Access'}</p>
                    <p className="text-[11px] mt-0.5">{isAmharic ? 'አስተዳዳሪውን ያነጋግሩ' : 'Contact administrator'}</p>
                  </div>
                </li>
              )}

              {/* Settings Navigation Link */}
              <li className="pt-1.5 mt-1 border-t border-gray-100 dark:border-slate-800/80">
                <Link
                  href="/admin/settings"
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-xl transition-all group font-medium text-xs sm:text-sm',
                    pathname === '/admin/settings'
                      ? theme === 'dark'
                        ? 'bg-blue-600/20 border-l-4 border-blue-400 text-blue-400 font-bold'
                        : 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-bold'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-slate-800/60 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }}
                >
                  <SettingsIcon className={cn('h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0', isCollapsed ? 'mx-auto' : 'mr-3')} />
                  {!isCollapsed && (
                    <span className="truncate">{isAmharic ? 'ቅንብሮች' : 'Settings'}</span>
                  )}
                  {isCollapsed && (
                    <div
                      className={cn(
                        'absolute left-full ml-2 px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl text-xs font-semibold',
                        theme === 'dark'
                          ? 'bg-[#112240] border border-slate-700 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      )}
                    >
                      {isAmharic ? 'ቅንብሮች' : 'Settings'}
                    </div>
                  )}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div
          className={cn(
            'p-3 border-t mt-auto',
            theme === 'dark' ? 'border-slate-800 bg-[#0a192f]' : 'border-gray-200 bg-white',
            isCollapsed && 'px-2'
          )}
        >
          {!isCollapsed ? (
            <div className="flex items-center px-2 py-1.5 rounded-xl">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center mr-2.5 shrink-0',
                  theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                )}
              >
                <UsersIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 mr-1">
                <p className={cn('text-xs font-bold truncate', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  {userDisplayName}
                </p>
                <p className={`text-[10px] truncate px-1.5 py-0.2 rounded-full w-fit ${getRoleColor(userRole)}`}>
                  {userRoleDisplay}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className={cn(
                  'p-1.5 rounded-lg transition-all shrink-0',
                  theme === 'dark'
                    ? 'hover:bg-red-950/40 text-red-400'
                    : 'hover:bg-red-50 text-red-600'
                )}
                title={isAmharic ? 'ውጣ' : 'Logout'}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 py-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center',
                  theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                )}
              >
                <UsersIcon className="h-4 w-4" />
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                title={isAmharic ? 'ውጣ' : 'Logout'}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}