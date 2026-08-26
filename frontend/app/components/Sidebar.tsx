import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          CRM Pro
        </h1>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          <li>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg transition-colors">
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
              <Users size={20} />
              <span className="font-medium">Leads</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      <div className="p-4 mt-auto">
        <button className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
