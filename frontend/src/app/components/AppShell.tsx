'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        {children}
      </div>
    </div>
  );
}
