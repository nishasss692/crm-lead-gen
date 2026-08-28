import React from 'react';

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 justify-between shrink-0">
      <div className="flex items-center space-x-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="hidden sm:flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="text-slate-800 font-bold text-lg">LeadGen Inc.</span>
        </div>
      </div>
      <div className="flex-1 flex justify-center">
        <h1 className="text-slate-700 font-semibold text-lg sm:text-xl truncate ml-2">Advanced Lead Management</h1>
      </div>
      <div className="w-12 sm:w-32"></div> {/* Spacer for centering */}
    </header>
  );
}
