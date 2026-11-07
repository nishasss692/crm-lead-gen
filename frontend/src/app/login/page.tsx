'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
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
  Coins,
  Send,
  Landmark
} from 'lucide-react';
import { apiFetch, safeJson } from '@/lib/api';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('CO_ADMIN');
  const [password, setPassword] = useState('Post@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, directId?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setError('');

    const targetId = (directId !== undefined ? directId : employeeId).trim();
    const targetPass = directPass !== undefined ? directPass : password;

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

  const handleQuickAccess = (id: string, pass: string) => {
    setEmployeeId(id);
    setPassword(pass);
    setError('');
    handleLogin(undefined, id, pass);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      
      {/* ══════════════════════════════════════════════════════════════
          1. TOP OFFICIAL HEADER BAR WITH DUAL EMBLEM & GOVT BRANDING
         ══════════════════════════════════════════════════════════════ */}
      <header className="w-full bg-white border-b border-slate-200/90 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 shadow-xs z-20">
        
        {/* Left: State Emblem of India, India Post & Karnataka Postal Circle */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          
          {/* Government of India / Department of Posts */}
          <div className="flex items-center gap-2.5">
            <img 
              src="/emblem-india.svg" 
              alt="State Emblem of India" 
              className="h-9 w-auto object-contain shrink-0" 
            />
            <div>
              <p className="text-[10px] font-bold text-[#D1242F] uppercase tracking-wider leading-tight">
                भारत सरकार • Government of India
              </p>
              <p className="text-[11px] font-bold text-[#1B2A4A] leading-tight">
                Department of Posts • डाक विभाग
              </p>
            </div>
          </div>

          <div className="hidden md:block h-7 w-px bg-slate-300" />

          {/* India Post Logo with Dak Seva Jan Seva */}
          <div className="flex items-center gap-2.5">
            <img 
              src="/india-post-logo.png" 
              alt="India Post" 
              className="h-8 w-auto object-contain shrink-0" 
            />
            <div className="hidden sm:block">
              <p className="text-[11px] font-black text-[#D1242F] uppercase tracking-wider leading-tight">
                भारतीय डाक • India Post
              </p>
              <p className="text-[9px] text-slate-500 font-semibold leading-tight">
                Dak Seva Jan Seva
              </p>
            </div>
          </div>

          <div className="hidden lg:block h-7 w-px bg-slate-300" />

          {/* Karnataka Postal Circle */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[#1B2A4A]">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B2A4A] tracking-tight leading-tight">
                Karnataka Postal Circle
              </p>
              <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                कर्नाटक डाक परिमंडल
              </p>
            </div>
          </div>
        </div>

        {/* Right: India Post International Mails with Official Badge */}
        <div className="flex items-center gap-2.5 bg-[#8B0000] text-white px-4 py-1.5 rounded-full shadow-sm">
          <Globe className="w-4 h-4 text-amber-200 shrink-0" />
          <div className="text-right">
            <p className="text-xs font-black tracking-tight leading-tight text-white">
              India Post
            </p>
            <p className="text-[9px] font-bold text-amber-200 tracking-wider uppercase leading-tight">
              International Mails
            </p>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          2. MAIN STAGE: HERO LEFT & OFFICIAL LOGIN CARD RIGHT
         ══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 lg:px-12 py-6 lg:py-8 gap-8 max-w-[1550px] mx-auto w-full">
        
        {/* ── Left Hero Section: DNK Mission & Visual Graphics ── */}
        <div className="flex-1 w-full max-w-2xl flex flex-col justify-between space-y-5">
          
          {/* DNK Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D1242F] text-white text-xs font-extrabold uppercase tracking-wide shadow-sm w-fit">
            <span>Dak Ghar Niryat Kendra (DNK)</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#1B2A4A] tracking-tight leading-[1.14]">
              Connecting Commerce <br className="hidden sm:inline" />
              across <span className="text-[#D1242F]">Karnataka & India</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
              Integrated Lead Operations & Commercial Outreach Dashboard for Export Promotion through <strong className="text-slate-800 font-bold">India Post</strong>
            </p>
          </div>

          {/* Center Visual Art: Globe, Flight Paths, India Post Aircraft & Vidhana Soudha */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-blue-100/80 bg-white/70 p-2 sm:p-3 flex items-center justify-center">
            <img 
              src="/dnk-center-art.png" 
              alt="DNK Export Network across Karnataka and Worldwide"
              className="w-full max-h-[250px] sm:max-h-[290px] object-contain rounded-xl"
            />
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-black text-[#1B2A4A] leading-tight">15,800+</p>
                <p className="text-[11px] font-semibold text-slate-500">Active Leads</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-black text-[#1B2A4A] leading-tight">3</p>
                <p className="text-[11px] font-semibold text-slate-500">Regions</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-black text-[#1B2A4A] leading-tight">30+</p>
                <p className="text-[11px] font-semibold text-slate-500">Divisions</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-black text-[#1B2A4A] leading-tight">100%</p>
                <p className="text-[11px] font-semibold text-slate-500">Pin Coverage</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Login Card: Exact Match with 1-Click Role Direct Access ── */}
        <div className="w-full sm:w-[460px] bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-lg shadow-blue-950/5 shrink-0">
          
          {/* Card Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[#1B2A4A] text-xs font-bold mb-4">
            <div className="w-5 h-5 rounded-full bg-[#D1242F] text-white flex items-center justify-center">
              <Users className="w-3 h-3" />
            </div>
            <span>DNK Lead Generation Portal</span>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl font-black text-[#1B2A4A] tracking-tight">
              Official Portal Access
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Sign in to manage commercial leads, field meetings, and postal contracts.
            </p>
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
            
            {/* Employee ID Input */}
            <div>
              <label 
                htmlFor="employee_id" 
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Employee ID / Territory Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="employee_id"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="CO_ADMIN"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#1B2A4A] rounded-xl text-sm text-slate-900 placeholder-slate-400 font-medium outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
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
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D1242F]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#1B2A4A] rounded-xl text-sm text-slate-900 placeholder-slate-400 font-medium outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right mt-1">
                <span className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="font-semibold leading-relaxed">{error}</div>
              </div>
            )}

            {/* Submit Button - Solid Dark Blue (#1B2A4A / #162E51) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1B2A4A] hover:bg-[#132038] active:bg-[#0B1528] text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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

          {/* 1-Click Role Direct Access Section */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                1-Click Role Direct Access
              </span>
              <span className="h-px bg-slate-200 flex-1" />
            </div>

            {/* 6 Role Buttons (2x3 Grid) matching reference */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              
              {/* 1. CO Circle Officer */}
              <button
                type="button"
                onClick={() => handleQuickAccess('CO_ADMIN', 'Post@123')}
                className="p-2 rounded-xl border border-red-200 bg-red-50/40 hover:bg-red-50 text-center transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-1">
                  <User className="w-3.5 h-3.5 text-[#D1242F]" />
                </div>
                <div className="font-bold text-[#D1242F] text-[11px] leading-tight">CO (Circle Officer)</div>
              </button>

              {/* 2. RO Bengaluru */}
              <button
                type="button"
                onClick={() => handleQuickAccess('r001', 'Post@123')}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-center transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="font-bold text-blue-700 text-[11px] leading-tight">RO Bengaluru</div>
              </button>

              {/* 3. RO South Kar */}
              <button
                type="button"
                onClick={() => handleQuickAccess('r002', 'Post@123')}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-center transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="font-bold text-blue-700 text-[11px] leading-tight">RO South Kar</div>
              </button>

              {/* 4. RO North Kar */}
              <button
                type="button"
                onClick={() => handleQuickAccess('r003', 'Post@123')}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 text-center transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <div className="font-bold text-emerald-700 text-[11px] leading-tight">RO North Kar</div>
              </button>

              {/* 5. DO Mysuru */}
              <button
                type="button"
                onClick={() => handleQuickAccess('Mysuru', 'Post@123')}
                className="p-2 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-center transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-800" />
                </div>
                <div className="font-bold text-amber-800 text-[11px] leading-tight">DO Mysuru</div>
              </button>

              {/* 6. ME Suresh */}
              <button
                type="button"
                onClick={() => handleQuickAccess('10021758', 'Post@123')}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 text-center transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-1">
                  <Users className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <div className="font-bold text-purple-700 text-[11px] leading-tight">ME Suresh</div>
              </button>

            </div>
          </div>

        </div>

      </main>

      {/* ══════════════════════════════════════════════════════════════
          3. BOTTOM SERVICES FOOTER: DEEP NAVY BLUE WITH GOLD TRIM
         ══════════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-[#0B1E36] border-t-2 border-amber-400 px-4 sm:px-8 py-3 shrink-0 text-white">
        <div className="max-w-[1550px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-300 shrink-0" />
            <span>EMS, Air Parcel & ITPS Services</span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-300 shrink-0" />
            <span>More than 220 Countries</span>
          </div>

          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Competitive Tariffs (No Fuel Surcharge)</span>
          </div>

          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Free Doorstep Pickup</span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-300 shrink-0" />
            <span>Paperless Onboarding</span>
          </div>

          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-300 shrink-0" />
            <span>Integration with DGFT, ICEGATE & Customs EDI</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
