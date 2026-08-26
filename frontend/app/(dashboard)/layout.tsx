import React from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-background min-h-screen">
      {/* SideNavBar */}
      <nav className="hidden md:flex bg-inverse-surface text-primary font-body-medium text-body-medium fixed left-0 top-0 h-full w-[240px] flex-col py-6 z-50">
        <div className="px-6 mb-8 flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center font-display-lg text-display-lg text-surface-container-lowest tracking-tight">
            R
          </div>
          <div>
            <div className="font-title-lg text-title-lg text-surface-container-lowest font-semibold">RevOps</div>
            <div className="font-caption text-caption text-outline-variant">Lead Engine</div>
          </div>
        </div>
        
        <div className="flex-1 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center space-x-3 text-outline-variant hover:text-surface-bright mx-2 px-3 py-2 hover:bg-on-secondary-fixed-variant transition-colors active:scale-95 duration-150 rounded-lg">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/leads" className="flex items-center space-x-3 text-outline-variant hover:text-surface-bright mx-2 px-3 py-2 hover:bg-on-secondary-fixed-variant transition-colors active:scale-95 duration-150 rounded-lg">
            <span className="material-symbols-outlined fill">leaderboard</span>
            <span>Leads</span>
          </Link>
          <Link href="/analytics" className="flex items-center space-x-3 text-outline-variant hover:text-surface-bright mx-2 px-3 py-2 hover:bg-on-secondary-fixed-variant transition-colors active:scale-95 duration-150 rounded-lg">
            <span className="material-symbols-outlined">assessment</span>
            <span>Reports</span>
          </Link>
        </div>

        <div className="px-6 mb-6">
          <button className="w-full bg-primary text-on-primary py-2 rounded-lg font-body-medium hover:bg-primary-container transition-colors active:scale-95 duration-150 flex justify-center items-center space-x-2">
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add Lead</span>
          </button>
        </div>

        <div className="px-4 space-y-1">
          <Link href="#" className="flex items-center space-x-3 text-outline-variant hover:text-surface-bright mx-2 px-3 py-2 hover:bg-on-secondary-fixed-variant transition-colors active:scale-95 duration-150 rounded-lg">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <div className="w-full md:pl-[240px] min-h-screen flex flex-col">
        {/* TopNavBar */}
        <header className="bg-surface/80 backdrop-blur-md text-primary font-title-lg text-title-lg fixed top-0 right-0 w-full md:w-[calc(100%-240px)] h-16 border-b border-outline-variant shadow-sm flex justify-between items-center px-4 md:px-6 z-40">
          <div className="md:hidden flex items-center space-x-3">
            <button className="text-on-background p-2">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline-md text-headline-md font-bold text-on-background">Lead Manager</span>
          </div>
          
          <div className="hidden md:block font-headline-md text-headline-md font-bold text-on-background">
            Lead Manager
          </div>
          
          <div className="flex-1 max-w-md mx-4 hidden sm:block relative focus-within:ring-2 focus-within:ring-primary/15 rounded-lg">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline">search</span>
            <input className="w-full pl-10 pr-12 py-2 bg-slate-100 border border-slate-300 rounded-lg text-body-base focus:outline-none focus:border-primary" placeholder="Search leads..." type="text"/>
            <span className="absolute right-3 top-2.5 text-caption text-outline font-medium bg-slate-200 px-1.5 rounded">⌘K</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Icons removed as per user request */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
