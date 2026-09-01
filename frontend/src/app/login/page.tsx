'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId.trim(),
          password: password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('role', data.role);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
        router.push('/');
      } else {
        setError('Invalid Employee ID or Password.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (id: string, pass: string) => {
    setEmployeeId(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Central Login Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full p-8 relative overflow-hidden">
        
        {/* Top Decorative Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D1242F] via-[#A31D1D] to-[#114b79]" />

        {/* Official Header Branding */}
        <div className="text-center mb-7 pt-1">
          <div className="flex justify-center items-center gap-3 mb-3">
            <div className="relative w-12 h-12 shrink-0">
              <img 
                src="/india-post-logo.png" 
                alt="India Post Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <p 
                className="text-[10px] font-bold text-[#A31D1D] tracking-wider leading-none mb-0.5"
                style={{ fontFamily: "'Noto Sans Devanagari', 'Segoe UI', system-ui, sans-serif" }}
              >
                भारतीय डाक
              </p>
              <p className="text-[#9E1B1B] font-black text-base leading-tight tracking-tight">
                Department of Posts
              </p>
              <p className="text-slate-500 text-[11px] font-medium leading-none">
                Government of India
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Karnataka Postal Circle CRM
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Commercial Operations & Lead Management System
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
          <div>
            <label 
              htmlFor="employee_id" 
              className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              Employee ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="employee_id"
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter Employee ID (e.g. CO_ADMIN)"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
                suppressHydrationWarning
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Subtle Error Message Placeholder */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-600 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full bg-[#114b79] text-white font-semibold rounded-md py-2 mt-4 hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 4-Tier Quick Test Accounts */}
        <div className="mt-5 pt-4 border-t border-gray-200">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
            Official Role Quick Access Demo:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickFill('CO_ADMIN', 'password123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">CO (Central Office)</div>
              <div className="text-gray-500 text-[9px]">CO_ADMIN (Circle-wide)</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickFill('RO_BG', 'password123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">RO (Bengaluru HQ)</div>
              <div className="text-gray-500 text-[9px]">RO_BG (7 Divs)</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickFill('RO_SK', 'password123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">RO (South Karnataka)</div>
              <div className="text-gray-500 text-[9px]">RO_SK (14 Divs)</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickFill('RO_NK', 'password123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">RO (North Karnataka)</div>
              <div className="text-gray-500 text-[9px]">RO_NK (15 Divs)</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickFill('DIV_MYS', 'password123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">DO (Mysuru)</div>
              <div className="text-gray-500 text-[9px]">DIV_MYS (Divisional)</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickFill('DIV_BGE', 'password123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">DO (BG East)</div>
              <div className="text-gray-500 text-[9px]">DIV_BGE (Divisional)</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickFill('ME_MYS_01', 'password123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group col-span-2 sm:col-span-3 text-center"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">ME (Marketing Executive) • ME_MYS_01 (Mysuru)</div>
            </button>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-gray-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Department of Posts Authorized Access Only</span>
        </div>
      </div>
    </div>
  );
}
