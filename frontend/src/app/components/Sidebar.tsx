'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');

  const getLinkClass = (path: string, status?: string) => {
    let isActive = false;
    if (path === '/') {
      isActive = pathname === '/';
    } else if (path === '/leads') {
      isActive = pathname === '/leads' && (statusParam === status || (!statusParam && !status));
    }
    
    return `flex items-center px-3 py-2.5 rounded-lg group transition-all duration-200 ${
      isActive 
        ? 'bg-white/10 text-white shadow-[inset_4px_0_0_0_#d1242f] font-bold' 
        : 'text-[#90b4d4] hover:bg-white/5 hover:text-white'
    }`;
  };

  return (
    <aside className="w-64 bg-[#113254] text-slate-300 flex flex-col h-full shrink-0 shadow-xl z-10 relative">
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#d1242f] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md border border-red-500/30">
          L
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm leading-tight tracking-wide">Leads</span>
          <span className="text-white font-bold text-sm leading-tight tracking-wide">Management</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Lead Operations
        </div>
        <ul className="space-y-1 px-2">
          <li>
            <Link href="/" className={getLinkClass('/')}>
              <Icons.Dashboard />
              <span className="ml-3 font-medium">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/leads?status=pending" className={getLinkClass('/leads', 'pending')}>
              <Icons.Users />
              <span className="ml-3 font-medium">Contact pending</span>
            </Link>
          </li>
          <li>
            <Link href="/leads?status=contacted" className={getLinkClass('/leads', 'contacted')}>
              <Icons.Phone />
              <span className="ml-3 font-medium">Contacted</span>
            </Link>
          </li>
          <li>
            <Link href="/leads?status=followup" className={getLinkClass('/leads', 'followup')}>
              <Icons.Clock />
              <span className="ml-3 font-medium">Follow-up Required</span>
            </Link>
          </li>
          <li>
            <Link href="/leads?status=interested" className={getLinkClass('/leads', 'interested')}>
              <Icons.Heart />
              <span className="ml-3 font-medium">Interested</span>
            </Link>
          </li>
          <li>
            <Link href="/leads?status=willing" className={getLinkClass('/leads', 'willing')}>
              <Icons.Star />
              <span className="ml-3 font-medium">Willing to onboard</span>
            </Link>
          </li>
          <li>
            <Link href="/leads?status=onboarded" className={getLinkClass('/leads', 'onboarded')}>
              <Icons.Briefcase />
              <span className="ml-3 font-medium">Onboarded</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          My Account
        </div>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold">
            JD
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Jane Doe</p>
            <p className="text-xs text-slate-400">Marketing Executive</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
