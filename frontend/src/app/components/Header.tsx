'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function Header({ 
  toggleSidebar, 
  isSidebarOpen 
}: { 
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{
    employee_id?: string;
    username?: string;
    role?: string;
    assigned_division?: string;
    division?: string;
    assigned_region?: string;
    region?: string;
  } | null>(null);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    router.push('/login');
  };

  const displayName = user?.employee_id || user?.username || 'CO_ADMIN';
  const rawRole = user?.role || 'CO';
  const roleUpper = rawRole.toUpperCase();
  const roleDisplay = (roleUpper === 'DIVISION' || roleUpper === 'DO' || roleUpper === 'DIV') ? 'DO' : (roleUpper === 'RO' ? 'RO' : (roleUpper === 'ME' ? 'ME' : 'CO'));
  
  const roleFullName = roleDisplay === 'CO' 
    ? 'Central Office (CO)' 
    : roleDisplay === 'RO' 
    ? 'Regional Office (RO)' 
    : roleDisplay === 'DO' 
    ? 'Divisional Office (DO)' 
    : 'Marketing Executive (ME)';

  const jurisdiction = user?.assigned_division || user?.division 
    ? `${user?.assigned_division || user?.division} Division` 
    : user?.assigned_region || user?.region 
    ? `${user?.assigned_region || user?.region}` 
    : (roleDisplay === 'CO' ? 'Central Office • Karnataka Circle' : 'Karnataka Circle');

  return (
    <header className="bg-white border-b-[3px] border-[#D1242F] h-18 md:h-20 flex items-center px-4 md:px-8 justify-between shrink-0 shadow-xs relative z-30 select-none">
      
      {/* Left: India Post Logo and Department of Posts */}
      <div className="flex items-center space-x-3.5 shrink-0">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 text-slate-600 hover:text-[#D1242F] hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
            title="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        <div className="flex items-center gap-3">
          <img 
            src="/india-post-logo.png" 
            alt="India Post Logo" 
            className="h-10 w-auto object-contain shrink-0" 
          />
          <div className="flex flex-col">
            <span 
              className="text-[9px] font-bold text-[#A31D1D] tracking-wider leading-none mb-0.5"
              style={{ fontFamily: "'Noto Sans Devanagari', 'Segoe UI', system-ui, sans-serif" }}
            >
              भारतीय डाक
            </span>
            <span className="text-[#9E1B1B] font-black text-sm sm:text-base leading-tight tracking-tight">
              Department of Posts
            </span>
            <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium leading-tight">
              Government of India
            </span>
          </div>
        </div>
      </div>
      
      {/* Center: Karnataka Postal Circle */}
      <div className="flex-1 flex flex-col justify-center items-center px-2 text-center">
        <h1 
          className="text-red-700 font-serif font-bold text-lg sm:text-xl md:text-[24px] tracking-tight leading-none"
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
        >
          Karnataka Postal Circle
        </h1>
        <h2 className="text-slate-700 font-bold text-xs sm:text-sm tracking-normal leading-tight mt-1">
          {roleFullName} Operations Dashboard
        </h2>
      </div>
      
      {/* Right: Dynamic Profile with Quick Logout */}
      <div className="shrink-0 flex items-center justify-end gap-3">
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D1242F] to-[#9E1B1B] text-white flex items-center justify-center font-black text-xs shadow-xs">
            {roleDisplay}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-800">{displayName}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 leading-tight">
              {jurisdiction}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 text-slate-500 hover:text-[#D1242F] hover:bg-red-50 rounded-xl border border-slate-200/90 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}



