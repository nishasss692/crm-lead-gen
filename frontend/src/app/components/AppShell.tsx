'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
      <div className="flex h-screen w-full items-center justify-center bg-[#0d2238]">
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
      <div className="flex h-screen w-full items-center justify-center bg-[#0d2238]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#d1242f] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f4f7fa] overflow-hidden w-full">
      {/* Full-width Top Official Header */}
      <Header 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen} 
      />

      {/* Main Body Container: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Sidebar Container */}
        <div 
          className={`flex-shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
            isSidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          <div className="w-64 h-full">
            <Sidebar onToggleCollapse={() => setIsSidebarOpen(false)} />
          </div>
        </div>

        {/* Collapsed floating open button if sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-3 left-3 z-30 p-2 bg-[#0d2238] text-white rounded-lg shadow-md hover:bg-[#132c48] transition-colors"
            title="Expand Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Scrollable Dashboard / Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f4f7fa] min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

