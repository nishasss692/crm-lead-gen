'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import ChangePasswordModal from './ChangePasswordModal';
import UploadMEModal from './UploadMEModal';
import ManageOfficersModal from './ManageOfficersModal';
import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  Clock, 
  Heart, 
  Star, 
  Briefcase, 
  KeyRound, 
  LogOut,
  XCircle,
  UserPlus,
  ShieldCheck,
  Building2,
  MapPin
} from 'lucide-react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get('status');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUploadMEModalOpen, setIsUploadMEModalOpen] = useState(false);
  const [isManageOfficersModalOpen, setIsManageOfficersModalOpen] = useState(false);
  const [officersTargetRole, setOfficersTargetRole] = useState<'RO' | 'DO' | 'ALL'>('ALL');
  const [user, setUser] = useState<{username: string, role: string} | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getLinkClass = (path: string, status?: string) => {
    let isActive = false;
    if (path === '/') {
      isActive = pathname === '/';
    } else if (path === '/leads') {
      isActive = pathname === '/leads' && (statusParam === status || (!statusParam && !status));
    }
    
    return `flex items-center px-3.5 py-2.5 rounded-xl group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
      isActive 
        ? 'bg-blue-600/20 text-white shadow-sm font-semibold border-l-4 border-blue-400' 
        : 'text-slate-300 hover:bg-white/5 hover:text-white font-medium'
    }`;
  };

  return (
    <div className="flex flex-col h-full bg-[#1B2A4A] text-white select-none pt-2">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-6 custom-scrollbar">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Executive Analytics
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/" className={getLinkClass('/')}>
                <LayoutDashboard className="w-4 h-4 mr-3 shrink-0 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <span className="text-sm">Overview Dashboard</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Lead Management
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/leads" className={getLinkClass('/leads')}>
                <Users className="w-4 h-4 mr-3 shrink-0 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                <span className="text-sm">All Leads Directory</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=pending" className={getLinkClass('/leads', 'pending')}>
                <Users className="w-4 h-4 mr-3 shrink-0 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <span className="text-sm">Contact Pending</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=contacted" className={getLinkClass('/leads', 'contacted')}>
                <PhoneCall className="w-4 h-4 mr-3 shrink-0 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                <span className="text-sm">Contacted</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=followup" className={getLinkClass('/leads', 'followup')}>
                <Clock className="w-4 h-4 mr-3 shrink-0 text-orange-400 group-hover:text-orange-300 transition-colors" />
                <span className="text-sm">Follow-up Required</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=interested" className={getLinkClass('/leads', 'interested')}>
                <Heart className="w-4 h-4 mr-3 shrink-0 text-rose-400 group-hover:text-rose-300 transition-colors" />
                <span className="text-sm">Interested</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=willing" className={getLinkClass('/leads', 'willing')}>
                <Star className="w-4 h-4 mr-3 shrink-0 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                <span className="text-sm">Willing to Onboard</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=onboarded" className={getLinkClass('/leads', 'onboarded')}>
                <Briefcase className="w-4 h-4 mr-3 shrink-0 text-teal-400 group-hover:text-teal-300 transition-colors" />
                <span className="text-sm">Onboarded</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=not_interested" className={getLinkClass('/leads', 'not_interested')}>
                <XCircle className="w-4 h-4 mr-3 shrink-0 text-red-400 group-hover:text-red-300 transition-colors" />
                <span className="text-sm">Not Interested</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Circle Administration for CO */}
        {user?.role && ['CO', 'ADMIN', 'CO_ADMIN'].includes(String(user.role).toUpperCase()) && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Circle Operations</span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">CO</span>
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setIsUploadMEModalOpen(true)}
                  className="w-full flex items-center px-3.5 py-2.5 rounded-xl group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-slate-300 hover:bg-white/5 hover:text-white font-medium cursor-pointer text-left"
                >
                  <UserPlus className="w-4 h-4 mr-3 shrink-0 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">Manage & Add ME</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">ME</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setOfficersTargetRole('RO');
                    setIsManageOfficersModalOpen(true);
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 rounded-xl group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-slate-300 hover:bg-white/5 hover:text-white font-medium cursor-pointer text-left"
                >
                  <Building2 className="w-4 h-4 mr-3 shrink-0 text-sky-400 group-hover:text-sky-300 transition-colors" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">Manage & Add RO</span>
                    <span className="text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-bold">RO</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setOfficersTargetRole('DO');
                    setIsManageOfficersModalOpen(true);
                  }}
                  className="w-full flex items-center px-3.5 py-2.5 rounded-xl group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-slate-300 hover:bg-white/5 hover:text-white font-medium cursor-pointer text-left"
                >
                  <MapPin className="w-4 h-4 mr-3 shrink-0 text-amber-400 group-hover:text-amber-300 transition-colors" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">Manage & Add DO</span>
                    <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">DO</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* User Account Info */}
      <div className="p-4 border-t border-white/10 bg-black/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white capitalize truncate">{user?.username || 'Officer'}</p>
            <p className="text-xs text-blue-200/75 font-medium truncate">
              {user?.role 
                ? (['DIVISION', 'DO', 'DIV'].includes(String(user.role).toUpperCase()) 
                    ? 'DO Division Officer' 
                    : String(user.role).toUpperCase() === 'RO' 
                    ? 'RO Regional Officer' 
                    : String(user.role).toUpperCase() === 'CO' 
                    ? 'CO Circle Officer' 
                    : 'ME Marketing Executive') 
                : 'Authorized Officer'}
            </p>
          </div>
        </div>
        
        <div className="mt-3 space-y-1">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 group"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
            <span>Change Password</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 group"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      <UploadMEModal
        isOpen={isUploadMEModalOpen}
        onClose={() => setIsUploadMEModalOpen(false)}
      />

      <ManageOfficersModal
        isOpen={isManageOfficersModalOpen}
        onClose={() => setIsManageOfficersModalOpen(false)}
        targetRole={officersTargetRole}
      />
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1B2A4A] text-white flex flex-col h-full shrink-0 shadow-2xl z-20 relative" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      <Suspense fallback={
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
          <div className="w-32 h-10 bg-white/10 rounded"></div>
        </div>
      }>
        <SidebarContent />
      </Suspense>
    </aside>
  );
}


