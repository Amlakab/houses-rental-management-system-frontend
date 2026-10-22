// app/admin/layout.tsx
'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Footer from '@/components/ui/Footer';
import { useTheme } from '@/lib/theme-context';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AdminHeader 
          onMenuClick={toggleSidebar}
          onSidebarToggle={toggleSidebarCollapse}
          isSidebarCollapsed={sidebarCollapsed}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16"> {/* pt-16 to account for fixed header height */}
        {/* Fixed Sidebar */}
        <div className={`fixed top-16 left-0 bottom-0 z-40 transition-transform duration-300 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <AdminSidebar 
            isOpen={sidebarOpen} 
            onClose={closeSidebar}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
        </div>

        {/* Main Content - Adjusted for sidebar width */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        } w-full min-h-[calc(100vh-64px)]`}>
          <div className={`h-full transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' 
              : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
          }`}>
            <div className="pt-2">
              <div className={`rounded-xl shadow-lg transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-[#0f172a80] backdrop-blur-sm border border-[#00ffff]/20 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <div className="pt-2">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}