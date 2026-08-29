'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
    } else {
      if (pathname === '/login') {
        router.replace('/');
      }
    }
    setIsCheckingAuth(false);
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0b1b36]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#d1242f] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated and not on /login, display redirecting spinner
  if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0b1b36]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#d1242f] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden w-full">
      {/* Sidebar Container with sliding animation */}
      <div 
        className={`flex-shrink-0 h-full bg-slate-900 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0'}`}
      >
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
