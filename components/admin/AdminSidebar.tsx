'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth';
import {
  X, LogOut, ChevronLeft, ChevronRight,
  Users as UsersIcon,
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
  permissions: MenuDoc[]; // populated from /auth/me
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const u = user as SidebarUser | null;
  const userRole: Role = u?.role ?? 'user';
  const userDisplayName = u?.name || u?.phone || 'User';
  const userRoleDisplay =
    userRole.charAt(0).toUpperCase() + userRole.slice(1);

  // ── visible menus ───────────────────────────────────────────────
  // Admin bypasses the grant gate but still respects allowedRoles.
  // Everyone else needs the menu in their populated permissions AND
  // the role must be in the menu's allowedRoles.
  const visibleMenus: MenuDoc[] = (u?.permissions ?? [])
    .filter((m) => m.isActive)
    .filter((m) => m.allowedRoles.includes(userRole))
    .filter((m) => (userRole === 'admin' ? true : true)) // already populated = granted
    .sort((a, b) => a.order - b.order);

  const handleLogout = () => {
    router.push('/');
    onClose?.();
  };

  const getSidebarTitle = () => {
    switch (userRole) {
      case 'admin': return 'Admin Panel';
      case 'owner': return 'Owner Panel';
      case 'manager': return 'Manager Panel';
      case 'accountant': return 'Accountant Panel';
      case 'agent': return 'Agent Panel';
      case 'customer': return 'Customer Panel';
      case 'user': return 'User Panel';
      default: return 'Panel';
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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          'fixed top-0 left-0 h-full z-50 transform transition-all duration-300',
          'lg:relative lg:translate-x-0 lg:z-auto lg:h-screen lg:sticky lg:top-0',
          // Mobile drawer width stays usable; collapse applies on desktop only.
          isCollapsed ? 'w-72 lg:w-20' : 'w-72 lg:w-64',
          theme === 'dark'
            ? 'bg-[#0a192f] border-r border-[#00ffff]/20'
            : 'bg-white border-r border-gray-200'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between p-4 border-b',
            theme === 'dark' ? 'border-[#00ffff]/20' : 'border-gray-200',
            isCollapsed && 'justify-center'
          )}
        >
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className={cn('text-lg font-semibold', theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-900')}>
                {getSidebarTitle()}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full w-fit mt-1 ${getRoleColor(userRole)}`}>
                {userRoleDisplay}
              </span>
            </div>
          )}

          {(
            <button
              onClick={onClose}
              className={cn(
                'p-1 rounded-md transition-all',
                theme === 'dark' ? 'hover:bg-[#00ffff20] text-white' : 'hover:bg-gray-100 text-gray-900',
                'lg:hidden'
              )}
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex items-center justify-center p-1.5 rounded-md transition-all',
              theme === 'dark' ? 'hover:bg-[#00ffff20] text-white' : 'hover:bg-gray-100 text-gray-900',
              isCollapsed && 'w-full'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-140px)]">
          <ul className="space-y-2">
            {visibleMenus.length > 0 ? (
              visibleMenus.map((item) => {
                const Icon = resolveIcon(item.icon);
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <li key={item._id}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-3 rounded-lg transition-all group',
                        isActive
                          ? theme === 'dark'
                            ? 'bg-[#00ffff20] border-l-2 border-[#00ffff] text-[#00ffff]'
                            : 'bg-blue-100 border-l-2 border-blue-600 text-blue-700'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:bg-[#00ffff10] hover:text-[#00ffff]'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          onClose?.();
                        }
                      }}
                    >
                      <Icon className={cn('h-5 w-5 flex-shrink-0', isCollapsed ? 'mx-auto' : 'mr-3')} />
                      {!isCollapsed && (
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      )}
                      {isCollapsed && (
                        <div
                          className={cn(
                            'absolute left-full ml-2 px-3 py-2 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg',
                            theme === 'dark'
                              ? 'bg-[#0a192f] border border-[#00ffff]/20 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          )}
                        >
                          {item.name}
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
                    'p-3 rounded-lg',
                    theme === 'dark' ? 'bg-[#00ffff10] text-[#a8b2d1]' : 'bg-blue-50 text-gray-600'
                  )}
                >
                  <p className="text-sm font-medium">No Access</p>
                  <p className="text-xs mt-1">Contact administrator</p>
                </div>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            'absolute bottom-0 w-full p-4 border-t',
            theme === 'dark' ? 'border-[#00ffff]/20' : 'border-gray-200',
            isCollapsed && 'px-2'
          )}
        >
          {!isCollapsed ? (
            <div className="flex items-center px-3 py-2">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center mr-3',
                  theme === 'dark' ? 'bg-[#00ffff20]' : 'bg-blue-100'
                )}
              >
                <UsersIcon className={cn('h-4 w-4', theme === 'dark' ? 'text-[#00ffff]' : 'text-blue-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-900')}>
                  {userDisplayName}
                </p>
                <p className={`text-xs truncate px-2 py-0.5 rounded-full w-fit mt-1 ${getRoleColor(userRole)}`}>
                  {userRoleDisplay}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  theme === 'dark'
                    ? 'hover:bg-[#ff000020] text-red-400'
                    : 'hover:bg-red-50 text-red-600'
                )}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center',
                  theme === 'dark' ? 'bg-[#00ffff20]' : 'bg-blue-100'
                )}
              >
                <UsersIcon className={cn('h-4 w-4', theme === 'dark' ? 'text-[#00ffff]' : 'text-blue-600')} />
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}