import React from 'react';

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  return (
    <header className="bg-white border-b-[3px] border-[#d1242f] h-20 flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm relative z-20">
      
      {/* Left side: India Post Logo */}
      <div className="flex items-center space-x-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 text-slate-500 hover:text-[#d1242f] hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        <div className="flex items-center space-x-3">
          <img 
            src="/india-post-logo.svg" 
            alt="India Post" 
            className="h-14 w-auto" 
          />
        </div>
      </div>
      
      {/* Center: Karnataka Postal Circle */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <h1 className="text-[#d1242f] font-extrabold text-lg sm:text-2xl tracking-tight">Karnataka Postal Circle</h1>
        <h2 className="text-[#d1242f] font-bold text-xs sm:text-sm tracking-wide">Advanced Lead Management Dashboard</h2>
      </div>
      
      {/* Right side spacer for exact centering */}
      <div className="w-12 sm:w-48 hidden sm:block"></div> 
    </header>
  );
}
