'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import ChangePasswordModal from './ChangePasswordModal';
import IndiaPostLogo from './IndiaPostLogo';
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
  Sparkles
} from 'lucide-react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get('status');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
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
    
    return `flex items-center px-3.5 py-2.5 rounded-xl group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
      isActive 
        ? 'bg-gradient-to-r from-[#D1242F] to-[#B01E28] text-white shadow-md shadow-red-900/30 font-bold' 
        : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium'
    }`;
  };

  return (
    <div className="flex flex-col h-full bg-[#1B2A4A] text-slate-300 select-none pt-2">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-6 custom-scrollbar">
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Executive Analytics
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/" className={getLinkClass('/')}>
                <LayoutDashboard className="w-4 h-4 mr-3 shrink-0 text-[#FAB52C]" />
                <span className="text-sm">Overview Dashboard</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Lead Management
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/leads" className={getLinkClass('/leads')}>
                <Users className="w-4 h-4 mr-3 shrink-0 text-slate-300" />
                <span className="text-sm">All Leads Directory</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=pending" className={getLinkClass('/leads', 'pending')}>
                <Users className="w-4 h-4 mr-3 shrink-0 text-amber-400" />
                <span className="text-sm">Contact Pending</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=contacted" className={getLinkClass('/leads', 'contacted')}>
                <PhoneCall className="w-4 h-4 mr-3 shrink-0 text-blue-400" />
                <span className="text-sm">Contacted</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=followup" className={getLinkClass('/leads', 'followup')}>
                <Clock className="w-4 h-4 mr-3 shrink-0 text-orange-400" />
                <span className="text-sm">Follow-up Required</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=interested" className={getLinkClass('/leads', 'interested')}>
                <Heart className="w-4 h-4 mr-3 shrink-0 text-emerald-400" />
                <span className="text-sm">Interested</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=willing" className={getLinkClass('/leads', 'willing')}>
                <Star className="w-4 h-4 mr-3 shrink-0 text-yellow-400" />
                <span className="text-sm">Willing to Onboard</span>
              </Link>
            </li>
            <li>
              <Link href="/leads?status=onboarded" className={getLinkClass('/leads', 'onboarded')}>
                <Briefcase className="w-4 h-4 mr-3 shrink-0 text-cyan-400" />
                <span className="text-sm">Onboarded</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* User Account Info */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ background: 'linear-gradient(135deg, #F7941D, #D1242F)' }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white capitalize truncate">{user?.username || 'Officer'}</p>
            <p className="text-xs text-slate-400 font-medium truncate">
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
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1B2A4A] text-slate-300 flex flex-col h-full shrink-0 shadow-2xl z-20 relative" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      <Suspense fallback={
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D1242F] rounded-lg"></div>
          <div className="w-32 h-10 bg-white/10 rounded"></div>
        </div>
      }>
        <SidebarContent />
      </Suspense>
    </aside>
  );
}


