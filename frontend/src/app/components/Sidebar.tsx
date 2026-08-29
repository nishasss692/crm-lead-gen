'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import ChangePasswordModal from './ChangePasswordModal';
import { 
  ChevronLeft,
  ChevronRight,
  LogOut,
  KeyRound
} from 'lucide-react';

function SidebarContent({ 
  onToggleCollapse 
}: { 
  onToggleCollapse?: () => void 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get('status');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string; full_name?: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    } else {
      setUser({ username: 'ME1', role: 'Marketing Executive', full_name: 'Marketing Executive' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', badge: 'HM', href: '/', isActive: pathname === '/' },
    { label: 'Contact pending', badge: 'CP', href: '/leads?status=pending', isActive: pathname === '/leads' && statusParam === 'pending' },
    { label: 'Contacted', badge: 'CT', href: '/leads?status=contacted', isActive: pathname === '/leads' && statusParam === 'contacted' },
    { label: 'Follow-up Required', badge: 'FU', href: '/leads?status=followup', isActive: pathname === '/leads' && statusParam === 'followup' },
    { label: 'Interested', badge: 'IN', href: '/leads?status=interested', isActive: pathname === '/leads' && statusParam === 'interested' },
    { label: 'Willing to onboard', badge: 'WO', href: '/leads?status=willing', isActive: pathname === '/leads' && statusParam === 'willing' },
    { label: 'Onboarded', badge: 'OC', href: '/leads?status=onboarded', isActive: pathname === '/leads' && statusParam === 'onboarded' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d2238] text-slate-300 select-none">
      {/* Top Section: Red Leads Management Icon */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D1242F] text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
            L
          </div>
          <div className="leading-tight">
            <h2 className="text-white font-bold text-sm tracking-tight">Leads</h2>
            <h2 className="text-white font-bold text-sm tracking-tight">Management</h2>
          </div>
        </div>

        {/* Collapse Sidebar Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5 w-full font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Collapse sidebar</span>
          </button>
        )}
      </div>

      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        <div>
          <div className="px-2 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Lead Operations
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  item.isActive
                    ? 'bg-white/10 text-white border border-white/20 shadow-xs'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    item.isActive
                      ? 'bg-white text-[#0d2238]'
                      : 'bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {item.badge}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="p-3 border-t border-white/10 bg-[#0a1b2d]">
        <div className="px-1 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          My Account
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#B8E986] text-[#1B4D1B] font-extrabold text-xs flex items-center justify-center shrink-0">
              AR
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.username || 'ME1'}</p>
              <p className="text-[10px] text-slate-400 truncate">Marketing Executive</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
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

export default function Sidebar({ 
  onToggleCollapse 
}: { 
  onToggleCollapse?: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}) {
  return (
    <aside className="w-64 bg-[#0d2238] text-slate-300 flex flex-col h-full shrink-0 shadow-xl z-20 relative select-none">
      <Suspense fallback={
        <div className="p-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#D1242F] rounded-lg"></div>
          <div className="w-32 h-8 bg-white/10 rounded"></div>
        </div>
      }>
        <SidebarContent onToggleCollapse={onToggleCollapse} />
      </Suspense>
    </aside>
  );
}

