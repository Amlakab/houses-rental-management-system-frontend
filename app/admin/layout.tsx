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

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebarCollapse = () => setSidebarCollapsed((collapsed) => !collapsed);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a192f]">
        <div className="h-16 border-b border-gray-200 dark:border-slate-800" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0a192f] text-white' : 'bg-[#f8fafc] text-gray-900'
    }`}>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16">
        <AdminHeader 
          onMenuClick={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          onSidebarToggle={toggleSidebarCollapse}
          isSidebarCollapsed={sidebarCollapsed}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16 min-h-screen">
        {/* Sidebar Component handles both desktop and mobile drawer cleanly */}
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content - Adjusted for desktop sidebar offset */}
        <main className={`flex-1 transition-all duration-300 w-full min-w-0 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
          <div className="p-3 sm:p-5 lg:p-6 min-h-[calc(100vh-64px)] w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer adjusted for desktop sidebar offset */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        <Footer />
      </div>
    </div>
  );
}