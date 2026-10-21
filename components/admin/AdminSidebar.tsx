'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth';
import { 
  Home, Users, Gamepad2, BarChart3, Wallet, 
  X, Settings, LogOut, History, ChevronLeft, ChevronRight,
  FileText, MessageSquare, CreditCard, Database, Shield, 
  Bell, Calendar, Layers, TrendingUp, UserCheck,
  Users as UsersIcon, Wallet as WalletIcon, FileText as FileTextIcon,
  QrCode, PieChart, ShieldCheck, Cog
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define menu item interface
interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: string[];
}

// Define component props interface
interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Define user type
interface User {
  role: string;
  name?: string;
  phone?: string;
}

// Define all menu items with their allowed roles
const allMenuItems: MenuItem[] = [
  { 
    name: 'Home', 
    href: '/admin/dashboard',
    icon: Home,
    allowedRoles: ['admin', 'owner', 'agent', 'customer', 'user'] 
  },
  { 
    name: 'Houses', 
    href: '/public/houses',
    icon: Home,
    allowedRoles: ['customer', 'user'] 
  },
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: Users,
    allowedRoles: ['admin']
  },
  // { 
  //   name: 'Payments', 
  //   href: '/admin/payments',
  //   icon: WalletIcon,
  //   allowedRoles: ['admin', 'Priesedant', 'Vice-Priesedant', 'accountant', 'Secretary', 'Limat'] 
  // },
  { 
    name: 'Acounts', 
    href: '/admin/payments',
    icon: WalletIcon,
    allowedRoles: ['admin','accountant'] 
  },
  { 
    name: 'House', 
    href: '/admin/houses', 
    icon: FileTextIcon,
    allowedRoles: ['admin', 'owner', 'agent'] 
  },
  { 
    name: 'Approve House', 
    href: '/admin/manager/houses', 
    icon: FileTextIcon,
    allowedRoles: ['admin', 'manager'] 
  },
  { 
    name: 'Orders',
    href: '/admin/manager/orders',
    icon: FileText,
    allowedRoles: ['admin', 'owner', 'agent'] 
  },
  { 
    name: 'My Orders',
    href: '/admin/customer/orders',
    icon: FileText,
    allowedRoles: ['admin', 'owner', 'agent', 'customer', 'user'] 
  },
  { 
    name: 'My Payments',
    href: '/admin/customer/payments',
    icon: FileText,
    allowedRoles: ['admin', 'owner', 'agent', 'customer', 'user'] 
  },
  { 
    name: 'Transactions', 
    href: '/admin/transactions/complete', 
    icon: FileTextIcon,
    allowedRoles: ['admin', 'owner', 'agent'] 
  },
  { 
    name: 'Approve Transactions', 
    href: '/admin/transactions/approve', 
    icon: FileTextIcon,
    allowedRoles: ['admin', 'owner']
  },
  { 
    name: 'Calculator', 
    href: '/admin/calculator', 
    icon: FileTextIcon,
    allowedRoles: ['admin', 'accountant'] 
  },
  // { 
  //   name: 'Wallet', 
  //   href: '/admin/wallet',
  //   icon: Wallet,
  //   allowedRoles: ['admin', 'Priesedant', 'accountant', 'Limat'] 
  // },
  { 
    name: 'Messages', 
    href: '/admin/manager/messages',
    icon: MessageSquare,
    allowedRoles: ['admin', 'owner', 'manager', 'agent'] 
  },
  // { 
  //   name: 'QR code', 
  //   href: '/admin/qrcode', 
  //   icon: QrCode,
  //   allowedRoles: ['admin', 'Priesedant', 'Vice-Priesedant', 'accountant', 'Secretary'] 
  // },
  { 
    name: 'Reports', 
    href: '/admin/reports/transactions', 
    icon: TrendingUp,
    allowedRoles: ['admin', 'owner', 'manager', 'agent']
  },
  { 
    name: 'Security', 
    href: '/admin/security', 
    icon: Shield,
    allowedRoles: ['admin'] 
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    allowedRoles: ['admin', 'owner', 'agent', 'customer', 'user'] 
  }
];

export default function AdminSidebar({ 
  isOpen, 
  onClose, 
  isCollapsed = false,
  onToggleCollapse 
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter menu items based on user role
  useEffect(() => {
    if (user?.role) {
      const filtered = allMenuItems.filter(item => 
        item.allowedRoles.includes((user as User).role)
      );
      setFilteredMenuItems(filtered);
    } else {
      setFilteredMenuItems([]);
    }
  }, [user]);

  const handleLogout = () => {
    router.push('/');
    onClose?.();
  };

  if (!mounted) return null;

  const userRole = (user as User)?.role || 'unknown';
  const userDisplayName = (user as User)?.name || (user as User)?.phone || 'Admin User';
  const userRoleDisplay = (user as User)?.role ? 
    (user as User).role.charAt(0).toUpperCase() + (user as User).role.slice(1).replace('-', ' ') : 
    'Administrator';

  // Role-based sidebar title
  const getSidebarTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin Panel';
      case 'owner':
        return 'Owner Panel';
      case 'manager':
        return 'Manager Panel';
      case 'accountant':
        return 'Accountant Panel';
      case 'agent':
        return 'Agent Panel';
      case 'customer':
        return 'Customer Panel';
      case 'user':
        return 'User Panel';
      default:
        return 'Admin Panel';
    }
  };

  // Role badge color
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'admin': theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700',
      'owner': theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700',
      'manager': theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700',
      'accountant': theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
      'agent': theme === 'dark' ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700',
      'customer': theme === 'dark' ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700',
      'user': theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700',
    };
    return colors[role] || (theme === 'dark' ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full z-50 transform transition-all duration-300 ease-in-out",
        "lg:relative lg:translate-x-0 lg:z-auto lg:h-screen lg:sticky lg:top-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64",
        theme === 'dark' 
          ? "bg-[#0a192f] border-r border-[#00ffff]/20" 
          : "bg-white border-r border-gray-200"
      )}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 border-b transition-colors duration-300
          ${theme === 'dark' 
            ? 'border-[#00ffff]/20' 
            : 'border-gray-200'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className={`
                text-lg font-semibold transition-colors duration-300
                ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-900'}
              `}>
                {getSidebarTitle()}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full w-fit mt-1 ${getRoleColor(userRole)}`}>
                {userRoleDisplay}
              </span>
            </div>
          )}
          
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className={`
                p-1 rounded-md transition-all duration-300 hover:scale-105
                ${theme === 'dark' 
                  ? 'hover:bg-[#00ffff20] text-white' 
                  : 'hover:bg-gray-100 text-gray-900'
                }
                lg:hidden
              `}
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Collapse Toggle (Desktop) */}
          <button
            onClick={onToggleCollapse}
            className={`
              hidden lg:flex items-center justify-center p-1.5 rounded-md 
              transition-all duration-300 hover:scale-105
              ${theme === 'dark' 
                ? 'hover:bg-[#00ffff20] text-white' 
                : 'hover:bg-gray-100 text-gray-900'
              }
              ${isCollapsed ? 'w-full' : ''}
            `}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-140px)]">
          <ul className="space-y-2">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-3 rounded-lg transition-all duration-300 group",
                        isActive 
                          ? theme === 'dark'
                            ? "bg-[#00ffff20] border-l-2 border-[#00ffff] text-[#00ffff]" 
                            : "bg-blue-100 border-l-2 border-blue-600 text-blue-700"
                          : theme === 'dark'
                            ? "text-gray-300 hover:bg-[#00ffff10] hover:text-[#00ffff] hover:border-l-2 hover:border-[#00ffff]/50"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-l-2 hover:border-gray-300"
                      )}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          onClose?.();
                        }
                      }}
                    >
                      <Icon className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                        isCollapsed ? "mx-auto" : "mr-3"
                      )} />
                      
                      {!isCollapsed && (
                        <span className="font-medium text-sm truncate">
                          {item.name}
                        </span>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className={`
                          absolute left-full ml-2 px-3 py-2 rounded-md opacity-0 invisible 
                          group-hover:opacity-100 group-hover:visible transition-all duration-300
                          whitespace-nowrap z-50 shadow-lg
                          ${theme === 'dark' 
                            ? 'bg-[#0a192f] border border-[#00ffff]/20 text-white' 
                            : 'bg-white border border-gray-200 text-gray-900'
                          }
                        `}>
                          {item.name}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })
            ) : (
              // Show message if no menu items are accessible
              <li className="px-3 py-4 text-center">
                <div className={`
                  p-3 rounded-lg transition-colors duration-300
                  ${theme === 'dark' 
                    ? 'bg-[#00ffff10] text-[#a8b2d1]' 
                    : 'bg-blue-50 text-gray-600'
                  }
                `}>
                  <p className="text-sm font-medium">No Access</p>
                  <p className="text-xs mt-1">Contact administrator for permissions</p>
                </div>
              </li>
            )}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className={`
          absolute bottom-0 w-full p-4 border-t transition-colors duration-300
          ${theme === 'dark' 
            ? 'border-[#00ffff]/20' 
            : 'border-gray-200'
          }
          ${isCollapsed ? 'px-2' : ''}
        `}>
          {!isCollapsed ? (
            <div className="flex items-center px-3 py-2">
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center mr-3 transition-colors duration-300
                ${theme === 'dark' 
                  ? 'bg-[#00ffff20]' 
                  : 'bg-blue-100'
                }
              `}>
                <UsersIcon className={`
                  h-4 w-4 transition-colors duration-300
                  ${theme === 'dark' ? 'text-[#00ffff]' : 'text-blue-600'}
                `} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`
                  text-sm font-medium truncate transition-colors duration-300
                  ${theme === 'dark' ? 'text-[#ccd6f6]' : 'text-gray-900'}
                `}>
                  {userDisplayName}
                </p>
                <p className={`text-xs truncate px-2 py-0.5 rounded-full w-fit ${getRoleColor(userRole)}`}>
                  {userRoleDisplay}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className={`
                  p-1.5 rounded-md transition-all duration-300 hover:scale-105
                  ${theme === 'dark' 
                    ? 'hover:bg-[#ff000020] text-red-400 hover:text-red-300' 
                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                  }
                `}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300
                ${theme === 'dark' 
                  ? 'bg-[#00ffff20]' 
                  : 'bg-blue-100'
                }
              `}>
                <UsersIcon className={`
                  h-4 w-4 transition-colors duration-300
                  ${theme === 'dark' ? 'text-[#00ffff]' : 'text-blue-600'}
                `} />
              </div>
              <button
                onClick={handleLogout}
                className={`
                  p-1.5 rounded-md transition-all duration-300 hover:scale-105
                  ${theme === 'dark' 
                    ? 'hover:bg-[#ff000020] text-red-400 hover:text-red-300' 
                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                  }
                `}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Collapse Toggle (Mobile) */}
        <button
          onClick={onToggleCollapse}
          className={`
            hidden absolute -right-3 top-16 items-center justify-center p-1.5 rounded-full 
            transition-all duration-300 hover:scale-105 z-40 shadow-lg
            ${theme === 'dark' 
              ? 'bg-[#00ffff] hover:bg-[#00ffff] text-[#0a192f]' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
            lg:flex
          `}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </>
  );
}