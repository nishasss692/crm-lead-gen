'use client';
import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  return (
    <header className="bg-white border-b-2 border-slate-200/80 h-20 flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm relative z-20">
      
      {/* Left side: India Post Logo & Toggle */}
      <div className="flex items-center space-x-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 text-slate-600 hover:text-[#D1242F] hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D1242F, #B01E28)' }}>
              <span className="text-white font-extrabold text-lg tracking-wider">IP</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-wider uppercase text-[#D1242F]">भारतीय डाक</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold tracking-wider uppercase text-slate-700">India Post</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">Department of Posts, Govt. of India</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Center: Karnataka Postal Circle Title */}
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#F7941D]"></span>
          <h1 className="text-[#1B2A4A] font-extrabold text-base sm:text-xl tracking-tight text-center">
            Karnataka Postal Circle
          </h1>
          <span className="h-2 w-2 rounded-full bg-[#D1242F]"></span>
        </div>
        <h2 className="text-[#D1242F] font-bold text-xs tracking-wider uppercase text-center mt-0.5">
          Operational Lead Management & Analytics CRM
        </h2>
      </div>
      
      {/* Right side: Official Badge */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
        <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
        <span className="text-xs font-semibold text-slate-700">Govt. Enterprise Portal</span>
      </div>
    </header>
  );
}
