'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error or server down');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#f8f9fa] overflow-hidden">
      
      {/* Left Panel: Visuals */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-[#0b1b36]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/india-map.jpg" 
            alt="India CRM Map" 
            fill 
            className="object-cover opacity-60 mix-blend-screen scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b1b36]/80 via-[#113254]/60 to-[#d1242f]/40 backdrop-blur-[2px]" />
        </div>

        {/* Top Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-[#d1242f] rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-500/20 border border-red-400/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-2xl tracking-tight leading-none">Apex<span className="text-red-400">CRM</span></h1>
            <p className="text-slate-300 text-sm font-medium">Enterprise Lead Management</p>
          </div>
        </div>

        {/* Middle/Bottom Content */}
        <div className="relative z-10 max-w-lg mb-10">
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Connecting <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-200">Opportunities</span> Across India.
          </h2>
          <p className="text-lg text-slate-300 font-medium mb-8 leading-relaxed">
            Empower your regional and division teams with real-time insights, analytics, and lead tracking. Unified operations from North to South.
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-semibold text-sm">Secure Access</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10">
               <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
               <span className="text-white font-semibold text-sm">Real-time Sync</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-20 w-64 h-64 bg-rose-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 sm:p-12 relative">
        <div className="w-full max-w-[420px] space-y-8 relative z-10">
          
          <div className="text-center lg:text-left mb-10">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#d1242f] rounded-xl flex items-center justify-center text-white shadow-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h1 className="text-[#113254] font-extrabold text-2xl tracking-tight leading-none">Apex<span className="text-red-500">CRM</span></h1>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Lead Management</p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#113254] tracking-tight mb-3">
              Welcome back
            </h2>
            <p className="text-slate-500 font-medium">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#d1242f] transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d1242f]/20 focus:border-[#d1242f] transition-all shadow-sm"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#d1242f] transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d1242f]/20 focus:border-[#d1242f] transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 font-bold text-xs">!</span>
                </div>
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#113254] hover:bg-[#0a1f35] focus:outline-none focus:ring-4 focus:ring-[#113254]/20 rounded-xl text-white text-sm font-bold shadow-lg shadow-[#113254]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 group"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  Sign in securely
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <p className="text-center text-sm font-medium text-slate-500 pt-6">
            Need help logging in? <a href="#" className="text-[#d1242f] hover:underline font-bold">Contact IT Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
