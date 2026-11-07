'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  MapPin, 
  Building2, 
  Globe, 
  Radio, 
  Users,
  Package,
  Truck,
  FileText,
  Network,
  Coins
} from 'lucide-react';
import { apiFetch, safeJson } from '@/lib/api';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const targetId = employeeId.trim();
    const targetPass = password;

    if (!targetId) {
      setError('Please enter your Employee ID or Division Name.');
      return;
    }

    if (!targetPass) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: targetId,
          password: targetPass,
        }),
      });

      if (res.ok) {
        const data = await safeJson(res);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('role', data.role);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
        router.push('/');
        return;
      } else {
        const errData = await safeJson(res);
        setError(errData?.detail || 'Invalid Employee ID or Password.');
      }
    } catch {
      setError('Cannot connect to backend server. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      
      {/* ── Top Official Header Bar ── */}
      <header className="w-full bg-white border-b border-slate-200/80 px-6 sm:px-10 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Government of India & Department of Posts */}
          <div className="flex items-center gap-3">
            <img 
              src="/india-post-logo.png" 
              alt="India Post" 
              className="h-10 w-auto object-contain shrink-0" 
            />
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] font-bold text-[#D1242F] uppercase tracking-wider leading-tight">
                भारत सरकार • Government of India
              </p>
              <p className="text-[11px] font-bold text-[#1B2A4A] leading-tight mt-0.5">
                Department of Posts • डाक विभाग
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200" />

          {/* Karnataka Postal Circle */}
          <div className="hidden md:block">
            <p className="text-xs font-bold text-[#1B2A4A] tracking-tight leading-tight">
              Karnataka Postal Circle
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              कर्नाटक डाक परिमंडल
            </p>
          </div>
        </div>

        {/* India Post International Mails */}
        <div className="flex items-center gap-2 text-right">
          <Globe className="w-5 h-5 text-[#D1242F]" />
          <div>
            <p className="text-xs font-bold text-[#1B2A4A] tracking-tight leading-tight">
              India Post
            </p>
            <p className="text-[10px] font-semibold text-[#D1242F] tracking-wider uppercase leading-tight">
              International Mails
            </p>
          </div>
        </div>
      </header>

      {/* ── Main Hero & Login Split ── */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-14 py-8 lg:py-10 gap-10 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Minimal Branding & Key Metrics */}
        <div className="flex-1 max-w-xl space-y-6">
          
          {/* DNK Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-[#D1242F] text-xs font-bold uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D1242F]" />
            Dak Ghar Niryat Kendra (DNK)
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#1B2A4A] tracking-tight leading-[1.15]">
              Connecting Commerce across <span className="text-[#D1242F]">Karnataka & India</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Integrated Lead Operations & Commercial Outreach Dashboard for Export Promotion through <strong className="text-slate-800 font-semibold">India Post</strong>.
            </p>
          </div>

          {/* 4 Minimal Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leads</span>
              </div>
              <p className="text-xl font-bold text-[#1B2A4A] tracking-tight">15,800+</p>
              <p className="text-[10px] text-slate-400 font-medium">Active Leads</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Regions</span>
              </div>
              <p className="text-xl font-bold text-[#1B2A4A] tracking-tight">3</p>
              <p className="text-[10px] text-slate-400 font-medium">Circle Regions</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Divisions</span>
              </div>
              <p className="text-xl font-bold text-[#1B2A4A] tracking-tight">30+</p>
              <p className="text-[10px] text-slate-400 font-medium">Postal Divisions</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coverage</span>
              </div>
              <p className="text-xl font-bold text-[#1B2A4A] tracking-tight">100%</p>
              <p className="text-[10px] text-slate-400 font-medium">Pin Coverage</p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Minimal Login Card */}
        <div className="w-full sm:w-[420px] bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 shadow-sm">
          
          {/* Card Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#1B2A4A] text-xs font-semibold mb-4">
            <Users className="w-3.5 h-3.5 text-[#D1242F]" />
            <span>DNK Lead Generation Portal</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">
              Official Portal Access
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Sign in to manage commercial leads, field meetings, and postal contracts.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Employee ID Input */}
            <div>
              <label 
                htmlFor="employee_id" 
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Employee ID / Territory Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="employee_id"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter Employee ID (e.g. CO_ADMIN, r001)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1B2A4A] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="password" 
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Default: <strong className="text-slate-600">Post@123</strong>
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1B2A4A] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {/* Submit Button - Solid Dark Blue (#1B2A4A), NO gradient */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#142038] active:bg-[#0f172a] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Footer note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Encrypted Government Portal</span>
          </div>

        </div>

      </main>

      {/* ── Bottom Logistics Services Strip ── */}
      <footer className="w-full bg-white border-t border-slate-200/80 px-6 sm:px-10 py-3.5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#D1242F]" />
            <span className="font-semibold text-slate-700">EMS, Air Parcel & ITPS</span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>More than 220 Countries</span>
          </div>

          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>Competitive Tariffs (No Fuel Surcharge)</span>
          </div>

          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Free Doorstep Pickup</span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Paperless Onboarding</span>
          </div>

          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-600" />
            <span>Customs EDI & DGFT Integration</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
