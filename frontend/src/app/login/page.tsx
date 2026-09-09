'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Server,
  Eye,
  EyeOff,
  MapPin,
  Building2,
  Globe,
  Radio,
  CheckCircle2,
  TrendingUp,
  Layers
} from 'lucide-react';
import { API_BASE_URL, apiFetch, getApiBaseUrl, safeJson } from '@/lib/api';


export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    checked: boolean;
    online: boolean;
    database?: string;
    leadsCount?: number;
    url?: string;
  }>({ checked: false, online: false });
  const router = useRouter();

  const checkBackendHealth = async () => {
    try {
      const res = await apiFetch('/api/health');
      if (res.ok) {
        const data = await safeJson(res);
        setServerStatus({
          checked: true,
          online: true,
          database: data?.database || 'postgresql',
          leadsCount: data?.leads_count ?? 0,
          url: getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '')
        });
        return;
      }
    } catch {}
    setServerStatus({
      checked: true,
      online: false,
      url: getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '')
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('custom_backend_url') || '';
      setBackendUrl(saved);
    }
    checkBackendHealth();
  }, []);

  const saveCustomBackend = (url: string) => {
    const clean = url.trim().replace(/\/+$/, '').replace(/\/api$/, '');
    setBackendUrl(clean);
    if (typeof window !== 'undefined') {
      if (clean) {
        localStorage.setItem('custom_backend_url', clean);
      } else {
        localStorage.removeItem('custom_backend_url');
      }
    }
    setTimeout(() => {
      checkBackendHealth();
    }, 150);
  };

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
        const data = await res.json();
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
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || 'Invalid Employee ID or Password.');
      }
    } catch (err: any) {
      setShowConfig(true);
      setError('Cannot connect to backend server. If accessing from a different device, please configure the Backend Server URL below.');
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F0F5FD] via-[#F8FAFC] to-[#FFF3F3] text-slate-800 flex flex-col select-none overflow-hidden" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      
      {/* Top Signature Blue & Red Dual Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1B2A4A] via-blue-600 via-rose-500 to-[#D1242F] shrink-0 z-20" />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ══════════════════════════════════════════════════════════════
            LEFT PANEL: HIGH-TECH INDIA POST LOGISTICS MAP SHOWCASE (BLUE & RED THEMED)
           ══════════════════════════════════════════════════════════════ */}
        <div className="relative flex-1 min-h-[440px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 bg-gradient-to-br from-blue-50/40 via-white/80 to-red-50/30">
          
          {/* Background Image: Light Mode India Postal Logistics Network Map */}
          <div 
            className="absolute inset-0 bg-contain lg:bg-cover bg-center bg-no-repeat opacity-95 transition-transform duration-1000 scale-100 hover:scale-[1.02]"
            style={{ backgroundImage: "url('/india-post-map-light.jpg')" }}
          />

          {/* Ambient Gradient Overlays for Depth and Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-white/80 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-transparent to-blue-50/40 pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D1242F]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header Over Map: Proper India Post Logo */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5 bg-white/95 backdrop-blur-md border-l-4 border-l-[#D1242F] border border-blue-100 px-4 py-2.5 rounded-2xl shadow-sm shadow-slate-200/50">
              <img 
                src="/india-post-logo.png" 
                alt="India Post" 
                className="h-12 w-auto object-contain shrink-0"
              />
              <div className="border-l border-slate-200 pl-3">
                <p className="text-[10px] font-bold text-[#D1242F] tracking-widest uppercase leading-none">
                  भारतीय डाक • Department of Posts
                </p>
                <p className="text-[#1B2A4A] font-black text-sm sm:text-base tracking-tight leading-tight mt-1">
                  Karnataka Postal Circle
                </p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                  Government of India
                </p>
              </div>
            </div>
          </div>

          {/* Center Floating Hub Beacon Information */}
          <div className="relative z-10 my-auto py-8 max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1B2A4A] tracking-tight leading-tight">
              Connecting Commerce across <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-[#1B2A4A] to-[#D1242F]">Karnataka & India</span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-lg">
              Integrated Lead Operations & Commercial Outreach Dashboard for Department of Posts Marketing Executives, Divisional Officers, and Regional Leadership.
            </p>

            {/* Quick Metrics Grid: Dual Blue and Red Accents */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              <div className="bg-white/95 backdrop-blur-md border border-blue-100 hover:border-blue-400 p-3.5 rounded-xl shadow-xs hover:shadow-md transition-all">
                <span className="text-xl sm:text-2xl font-black text-[#1B2A4A] block">15,800+</span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Leads</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md border border-red-100 hover:border-red-400 p-3.5 rounded-xl shadow-xs hover:shadow-md transition-all">
                <span className="text-xl sm:text-2xl font-black text-[#D1242F] block">3</span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Regions</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md border border-blue-100 hover:border-blue-400 p-3.5 rounded-xl shadow-xs hover:shadow-md transition-all">
                <span className="text-xl sm:text-2xl font-black text-blue-700 block">30+</span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Divisions</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md border border-red-100 hover:border-red-400 p-3.5 rounded-xl shadow-xs hover:shadow-md transition-all">
                <span className="text-xl sm:text-2xl font-black text-[#D1242F] block">100%</span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pin Coverage</span>
              </div>
            </div>
          </div>

          {/* Bottom Postal Tagline */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D1242F]" />
              <span className="font-semibold text-slate-700">Central Hub: Bengaluru General Post Office (GPO)</span>
            </div>
            <span className="text-[11px] text-blue-700 font-mono font-bold">EMS • Speed Post • Parcel Network</span>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT PANEL: AUTHENTICATION FORM & OFFICIAL ACCESS (BLUE & RED THEMED)
           ══════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-white/95 lg:bg-gradient-to-b lg:from-white lg:via-[#F6FAFF] lg:to-red-50/20 p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-y-auto border-l border-slate-200 shadow-2xl">
          
          <div className="space-y-6 my-auto">
            {/* Header Branding: Proper India Post Logo with Red & Blue Header */}
            <div>
              <div className="flex items-center gap-3.5 mb-3">
                <img 
                  src="/india-post-logo.png" 
                  alt="India Post" 
                  className="h-14 w-auto object-contain shrink-0" 
                />
                <div className="border-l-2 border-l-[#D1242F] pl-3">
                  <span className="text-[11px] font-bold text-[#D1242F] uppercase tracking-widest block">
                    Department of Posts
                  </span>
                  <span className="text-xs text-[#1B2A4A] font-semibold block mt-0.5">
                    Ministry of Communications, Govt. of India
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A4A] tracking-tight mt-3">
                Official Portal Access
              </h1>
              <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-[#D1242F] rounded-full mt-2 mb-1" />
              <p className="text-xs text-slate-500 font-medium mt-1">
                Sign in to manage commercial leads, field meetings, and postal contracts.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4 pt-1" suppressHydrationWarning>
              {/* Employee ID / Division Field with Blue Accent */}
              <div>
                <label 
                  htmlFor="employee_id" 
                  className="block text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-1.5"
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
                    placeholder="Enter ID (e.g. Mysuru, CO_ADMIN, r001)"
                    className="w-full pl-10 pr-4 py-3 bg-white hover:bg-blue-50/20 focus:bg-white border border-slate-300 hover:border-blue-400 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all font-medium"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Password Field with Red Accent */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="password" 
                    className="block text-xs font-bold text-[#1B2A4A] uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <span className="text-[10px] text-slate-500">Default: <code className="text-[#1B2A4A] font-mono bg-gradient-to-r from-blue-50 to-red-50 px-2 py-0.5 rounded border border-slate-200 font-bold">Post@123</code></span>
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
                    className="w-full pl-10 pr-10 py-3 bg-white hover:bg-red-50/20 focus:bg-white border border-slate-300 hover:border-red-400 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#D1242F] focus:ring-2 focus:ring-red-500/20 shadow-xs transition-all font-medium"
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#D1242F] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <div className="font-semibold leading-relaxed">{error}</div>
                </div>
              )}

              {/* Submit Button with Signature Navy Blue to Crimson Red Gradient */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#1B2A4A] via-blue-800 via-[#D1242F] to-[#B01E28] hover:from-[#132038] hover:to-[#9E1B1B] text-white font-bold text-sm rounded-xl shadow-md shadow-slate-400/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* 1-Click Official Logins with Balanced Red and Blue */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  1-Click Role Direct Access:
                </p>
                <span className="text-[10px] font-bold text-[#1B2A4A] bg-gradient-to-r from-blue-50 to-red-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Post@123
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleQuickAccess('CO_ADMIN', 'Post@123')}
                  className="p-2.5 rounded-xl border border-red-100 hover:border-[#D1242F] bg-white hover:bg-red-50/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                >
                  <div className="font-bold text-[#D1242F] text-xs">CO (Circle)</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Circle-wide</div>
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleQuickAccess('r001', 'Post@123')}
                  className="p-2.5 rounded-xl border border-blue-100 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                >
                  <div className="font-bold text-blue-700 text-xs">RO Bengaluru</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Bengaluru HQ</div>
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleQuickAccess('r002', 'Post@123')}
                  className="p-2.5 rounded-xl border border-blue-100 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                >
                  <div className="font-bold text-blue-700 text-xs">RO South Kar</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Mysuru/Kolar</div>
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleQuickAccess('r003', 'Post@123')}
                  className="p-2.5 rounded-xl border border-blue-100 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                >
                  <div className="font-bold text-blue-700 text-xs">RO North Kar</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Dharwad/Belagavi</div>
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleQuickAccess('Mysuru', 'Post@123')}
                  className="p-2.5 rounded-xl border border-red-100 hover:border-[#D1242F] bg-white hover:bg-red-50/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                >
                  <div className="font-bold text-[#D1242F] text-xs">DO Mysuru</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Mysuru Division</div>
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleQuickAccess('10021758', 'Post@123')}
                  className="p-2.5 rounded-xl border border-red-100 hover:border-[#D1242F] bg-white hover:bg-red-50/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                >
                  <div className="font-bold text-[#D1242F] text-xs">ME Suresh</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Emp ID: 10021758</div>
                </button>
              </div>
            </div>

            {/* Backend Configuration & Live Status */}
            <div className="pt-3 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[11px] text-slate-600 hover:text-blue-700 flex items-center justify-center gap-1.5 mx-auto transition-colors font-medium cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Backend:{' '}
                  {serverStatus.checked ? (
                    serverStatus.online ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                        Connected ({serverStatus.leadsCount?.toLocaleString() ?? 0} leads)
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                        Not Connected (Click to set URL)
                      </span>
                    )
                  ) : (
                    <strong className="text-[#1B2A4A]">{backendUrl ? backendUrl.replace('https://', '').replace('http://', '') : 'Auto / Local'}</strong>
                  )}
                </span>
              </button>
              {showConfig && (
                <div className="mt-2.5 p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-left animate-in fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Backend Server URL:</label>
                    <span className="text-[10px] text-slate-500">For phone/cloud access</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="e.g. https://your-backend.onrender.com or http://192.168.0.104:8000"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => saveCustomBackend(backendUrl)}
                      className="px-3 py-1.5 bg-[#1B2A4A] hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                  {serverStatus.checked && (
                    <div className="mt-2 pt-2 border-t border-blue-100 text-[10px] flex items-center justify-between text-slate-600">
                      <span>Database: <strong className="text-slate-800">{serverStatus.database || 'offline'}</strong></span>
                      <span>Total Leads: <strong className="text-slate-800">{serverStatus.leadsCount?.toLocaleString() ?? 0}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Security Note */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-slate-600">256-bit Encrypted Government Portal</span>
            </div>
            <span className="font-mono text-[#D1242F] font-bold">v2.4 LeadOps</span>
          </div>

        </div>

      </div>

    </div>
  );
}
