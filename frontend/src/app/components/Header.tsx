'use client';
import React from 'react';
import IndiaPostLogo from './IndiaPostLogo';

export default function Header({ 
  toggleSidebar, 
  isSidebarOpen 
}: { 
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}) {
  return (
    <header className="bg-white border-b-[3px] border-[#D1242F] h-18 md:h-20 flex items-center px-4 md:px-8 justify-between shrink-0 shadow-xs relative z-30">
      
      {/* Left side: India Post Logo with Sanskrit & Department of Posts */}
      <div className="flex items-center space-x-3 shrink-0">
        <IndiaPostLogo size="md" variant="official" />
      </div>
      
      {/* Center: Karnataka Postal Circle Title & Subtitle */}
      <div className="flex-1 flex flex-col justify-center items-center px-2 text-center">
        <h1 
          className="text-[#9E1B1B] font-serif font-bold text-xl sm:text-2xl md:text-[26px] tracking-tight leading-none"
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
        >
          Karnataka Postal Circle
        </h1>
        <h2 className="text-[#9E1B1B] font-bold text-xs sm:text-sm tracking-normal leading-tight mt-1">
          Advanced Lead Management Dashboard
        </h2>
      </div>
      
      {/* Right side spacer to keep center aligned */}
      <div className="shrink-0 w-16 md:w-32 flex justify-end items-center">
        {/* Subtle circle status or space reservation */}
      </div>
    </header>
  );
}

