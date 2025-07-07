import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/toaster';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-background max-w-full overflow-x-hidden">
      <Header />
      <div className="flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={collapsed ? 'flex-1 min-w-0 md:ml-16 transition-all duration-200' : 'flex-1 min-w-0 md:ml-64 transition-all duration-200'}>
          <div className="min-w-0 px-4 md:px-8 lg:px-16 py-6 transition-all duration-200">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}