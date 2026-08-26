import React from 'react';
import ExportButton from './ExportButton';
import { Bell, Search, UserCircle } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center flex-1">
        <div className="relative w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            placeholder="Search leads, agents, or divisions..."
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <ExportButton />
        
        <div className="flex items-center space-x-4 border-l border-slate-200 pl-6">
          <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center space-x-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold group-hover:ring-2 ring-indigo-400 transition-all">
              JD
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Jane Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
}
