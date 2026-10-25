'use client';

import React from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import SettingsView from '@/components/settings/SettingsView';
import { useTheme } from '@/lib/theme-context';

export default function SettingsPage() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0a192f] text-white' : 'bg-[#f8fafc] text-gray-900'
    }`}>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-20 sm:pt-24 pb-16">
        <SettingsView isAdminContext={false} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
