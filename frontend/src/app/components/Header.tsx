'use client';
import React from 'react';
import { ShieldCheck, Database, Sparkles } from 'lucide-react';
import IndiaPostLogo from './IndiaPostLogo';

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  return (
    <header className="bg-white border-b-2 border-slate-200/80 h-20 flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm relative z-20">
      
      {/* Left side: India Post Logo & Toggle */}
      <div className="flex items-center space-x-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 text-slate-600 hover:text-[#D1242F] hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
            title="Toggle Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        <IndiaPostLogo size="md" variant="header" />
      </div>
      
      {/* Center: Karnataka Postal Circle Title */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-center px-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FAB52C] animate-pulse"></span>
          <h1 className="text-[#1B2A4A] font-black text-base sm:text-lg tracking-tight text-center">
            Karnataka Postal Circle
          </h1>
          <span className="h-2 w-2 rounded-full bg-[#D1242F]"></span>
        </div>
        <h2 className="text-[#D1242F] font-bold text-[11px] tracking-wider uppercase text-center mt-0.5">
          Operational Lead Management & Analytics CRM
        </h2>
      </div>
      
      {/* Right side: Official Badges & Live Status */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[11px] font-bold text-emerald-700">Live DB Connected</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          <span className="text-xs font-bold text-slate-700">Govt. of India</span>
        </div>
      </div>
    </header>
  );
}
