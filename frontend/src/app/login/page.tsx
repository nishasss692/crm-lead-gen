'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Server
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

const KARNATAKA_DIVISIONS: Record<string, { region: string; aliases: string[] }> = {
  // Bengaluru HQ Region
  'BG East': { region: 'Bengaluru HQ Region', aliases: ['bg east', 'bgeast', 'bg_east', 'bengaluru east', 'bangalore east'] },
  'BG South': { region: 'Bengaluru HQ Region', aliases: ['bg south', 'bgsouth', 'bg_south', 'bengaluru south', 'bangalore south'] },
  'BG West': { region: 'Bengaluru HQ Region', aliases: ['bg west', 'bgwest', 'bg_west', 'bengaluru west', 'bangalore west'] },
  'BG Central': { region: 'Bengaluru HQ Region', aliases: ['bg central', 'bgcentral', 'bg_central', 'bengaluru central', 'bangalore central'] },
  'BG GPO': { region: 'Bengaluru HQ Region', aliases: ['bg gpo', 'bggpo', 'bg_gpo', 'bengaluru gpo', 'bangalore gpo', 'gpo'] },
  'Channapatna': { region: 'Bengaluru HQ Region', aliases: ['channapatna', 'chanapatna', 'channapatana'] },

  // South Karnataka Region
  'Kolar': { region: 'South Karnataka Region', aliases: ['kolar', 'kolara'] },
  'Mysuru': { region: 'South Karnataka Region', aliases: ['mysuru', 'mysore'] },
  'Nanjangud': { region: 'South Karnataka Region', aliases: ['nanjangud', 'nanjanagudu'] },
  'Mandya': { region: 'South Karnataka Region', aliases: ['mandya'] },
  'Hassan': { region: 'South Karnataka Region', aliases: ['hassan', 'hasana'] },
  'Kodagu': { region: 'South Karnataka Region', aliases: ['kodagu', 'coorg', 'madikeri'] },
  'Mangaluru': { region: 'South Karnataka Region', aliases: ['mangaluru', 'mangalore'] },
  'Puttur': { region: 'South Karnataka Region', aliases: ['puttur', 'putturu'] },
  'Udupi': { region: 'South Karnataka Region', aliases: ['udupi', 'udapi'] },
  'Shivamogga': { region: 'South Karnataka Region', aliases: ['shivamogga', 'shimoga'] },
  'Chikkamagaluru': { region: 'South Karnataka Region', aliases: ['chikkamagaluru', 'chikmagalur', 'chikmagaluru'] },
  'Chitradurga': { region: 'South Karnataka Region', aliases: ['chitradurga'] },
  'Davangere': { region: 'South Karnataka Region', aliases: ['davangere', 'davanagere'] },
  'Tumakuru': { region: 'South Karnataka Region', aliases: ['tumakuru', 'tumkur'] },

  // North Karnataka Region
  'Dharwad': { region: 'North Karnataka Region', aliases: ['dharwad', 'hubli', 'hubballi'] },
  'Belagavi': { region: 'North Karnataka Region', aliases: ['belagavi', 'belgaum'] },
  'Gokak': { region: 'North Karnataka Region', aliases: ['gokak'] },
  'Chikodi': { region: 'North Karnataka Region', aliases: ['chikodi', 'chikkodi'] },
  'Bagalkote': { region: 'North Karnataka Region', aliases: ['bagalkote', 'bagalkot'] },
  'Vijayapura': { region: 'North Karnataka Region', aliases: ['vijayapura', 'vijayapur', 'bijapur'] },
  'Gadag': { region: 'North Karnataka Region', aliases: ['gadag'] },
  'Haveri': { region: 'North Karnataka Region', aliases: ['haveri'] },
  'Ballari': { region: 'North Karnataka Region', aliases: ['ballari', 'bellary'] },
  'Koppal': { region: 'North Karnataka Region', aliases: ['koppal'] },
  'Kalaburagi': { region: 'North Karnataka Region', aliases: ['kalaburagi', 'gulbarga'] },
  'Bidar': { region: 'North Karnataka Region', aliases: ['bidar'] },
  'Raichur': { region: 'North Karnataka Region', aliases: ['raichur'] },
  'Karwar': { region: 'North Karnataka Region', aliases: ['karwar', 'uttara kannada'] },
  'Sirsi': { region: 'North Karnataka Region', aliases: ['sirsi'] },
  'Yadgir': { region: 'North Karnataka Region', aliases: ['yadgir', 'yadagiri'] },
};

function findDivisionAccount(input: string): { division: string; region: string } | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  const stripped = clean.replace(/^(do|div|division)[\s_-]+/, '').replace(/[\s_-]+division$/, '').trim();
  const noSpaces = stripped.replace(/[\s_-]+/g, '');

  for (const [canonical, info] of Object.entries(KARNATAKA_DIVISIONS)) {
    const canClean = canonical.toLowerCase();
    const canNoSpaces = canClean.replace(/[\s_-]+/g, '');
    if (stripped === canClean || noSpaces === canNoSpaces || clean === canClean) {
      return { division: canonical, region: info.region };
    }
    for (const alias of info.aliases) {
      const aClean = alias.toLowerCase();
      const aNoSpaces = aClean.replace(/[\s_-]+/g, '');
      if (stripped === aClean || noSpaces === aNoSpaces || clean === aClean) {
        return { division: canonical, region: info.region };
      }
    }
  }
  return null;
}

const DEMO_ACCOUNTS: Record<string, { role: string; assigned_region: string | null; assigned_division: string | null }> = {
  'CO_ADMIN': { role: 'CO', assigned_region: null, assigned_division: null },
  'CO_USER': { role: 'CO', assigned_region: null, assigned_division: null },
  'R001': { role: 'RO', assigned_region: 'Bengaluru HQ Region', assigned_division: null },
  'R002': { role: 'RO', assigned_region: 'South Karnataka Region', assigned_division: null },
  'R003': { role: 'RO', assigned_region: 'North Karnataka Region', assigned_division: null },
  'r001': { role: 'RO', assigned_region: 'Bengaluru HQ Region', assigned_division: null },
  'r002': { role: 'RO', assigned_region: 'South Karnataka Region', assigned_division: null },
  'r003': { role: 'RO', assigned_region: 'North Karnataka Region', assigned_division: null },
  'RO_BG': { role: 'RO', assigned_region: 'Bengaluru HQ Region', assigned_division: null },
  'RO_USER': { role: 'RO', assigned_region: 'Bengaluru HQ Region', assigned_division: null },
  'RO_SK': { role: 'RO', assigned_region: 'South Karnataka Region', assigned_division: null },
  'RO_NK': { role: 'RO', assigned_region: 'North Karnataka Region', assigned_division: null },
  'DIV_MYS': { role: 'DO', assigned_region: 'South Karnataka Region', assigned_division: 'Mysuru' },
  'DIV_USER': { role: 'DO', assigned_region: 'South Karnataka Region', assigned_division: 'Mysuru' },
  'DO_MYS': { role: 'DO', assigned_region: 'South Karnataka Region', assigned_division: 'Mysuru' },
  'DIV_BGE': { role: 'DO', assigned_region: 'Bengaluru HQ Region', assigned_division: 'BG East' },
  'DIV_BGS': { role: 'DO', assigned_region: 'Bengaluru HQ Region', assigned_division: 'BG South' },
  'ME_MYS_01': { role: 'ME', assigned_region: 'South Karnataka Region', assigned_division: 'Mysuru' },
  'ME_USER': { role: 'ME', assigned_region: 'South Karnataka Region', assigned_division: 'Mysuru' },
};

// Register all 36 Karnataka divisions in DEMO_ACCOUNTS in all casings
for (const [divName, info] of Object.entries(KARNATAKA_DIVISIONS)) {
  DEMO_ACCOUNTS[divName.toUpperCase()] = { role: 'DO', assigned_region: info.region, assigned_division: divName };
  DEMO_ACCOUNTS[divName.toLowerCase()] = { role: 'DO', assigned_region: info.region, assigned_division: divName };
  DEMO_ACCOUNTS[divName] = { role: 'DO', assigned_region: info.region, assigned_division: divName };
  DEMO_ACCOUNTS[divName.toLowerCase().replace(/[\s_-]+/g, '')] = { role: 'DO', assigned_region: info.region, assigned_division: divName };
}

export default function LoginPage() {
  const router = useRouter();

  // Credentials State
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  // Form State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState(API_BASE_URL);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('custom_backend_url');
      if (custom) setBackendUrl(custom);
    }
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
  };

  const getActiveBackend = () => {
    return (typeof window !== 'undefined' && localStorage.getItem('custom_backend_url')) || backendUrl || API_BASE_URL;
  };

  const handleLogin = async (e?: React.FormEvent, directId?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const targetId = (directId || employeeId).trim();
    const targetPass = directPass || password;
    const targetIdUpper = targetId.toUpperCase();
    const divMatch = findDivisionAccount(targetId);
    const isDemo = targetIdUpper in DEMO_ACCOUNTS || (targetId in DEMO_ACCOUNTS) || (targetId.toLowerCase() in DEMO_ACCOUNTS) || !!divMatch;
    const isDemoPass = ['password123', 'Post@123'].includes(targetPass) || !targetPass;

    const activeApiUrl = getActiveBackend();

    try {
      const res = await fetch(`${activeApiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: targetId,
          password: targetPass || 'Post@123',
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
        // Demo accounts fallback
        if (isDemo && (isDemoPass || targetPass === 'password123' || targetPass === 'Post@123')) {
          const divInfo = findDivisionAccount(targetId);
          const info = divInfo 
            ? { role: 'DO', assigned_region: divInfo.region, assigned_division: divInfo.division }
            : (DEMO_ACCOUNTS[targetIdUpper] || DEMO_ACCOUNTS[targetId] || DEMO_ACCOUNTS[targetId.toLowerCase()] || { role: 'DO', assigned_region: null, assigned_division: targetId });
          const finalEmpId = divInfo ? divInfo.division : targetIdUpper;
          const demoUser = {
            employee_id: finalEmpId,
            username: finalEmpId,
            name: `DO ${finalEmpId}`,
            role: info.role,
            assigned_region: info.assigned_region,
            assigned_division: info.assigned_division,
            region: info.assigned_region,
            division: info.assigned_division
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', 'demo_access_token_' + finalEmpId);
            localStorage.setItem('role', info.role);
            localStorage.setItem('user', JSON.stringify(demoUser));
          }
          router.push('/');
          return;
        }
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || 'Invalid Employee ID or Password.');
      }
    } catch (err) {
      if (isDemo && (isDemoPass || targetPass === 'password123' || targetPass === 'Post@123')) {
        const divInfo = findDivisionAccount(targetId);
        const info = divInfo 
          ? { role: 'DO', assigned_region: divInfo.region, assigned_division: divInfo.division }
          : (DEMO_ACCOUNTS[targetIdUpper] || DEMO_ACCOUNTS[targetId] || DEMO_ACCOUNTS[targetId.toLowerCase()] || { role: 'DO', assigned_region: null, assigned_division: targetId });
        const finalEmpId = divInfo ? divInfo.division : targetIdUpper;
        const demoUser = {
          employee_id: finalEmpId,
          username: finalEmpId,
          name: `DO ${finalEmpId}`,
          role: info.role,
          assigned_region: info.assigned_region,
          assigned_division: info.assigned_division,
          region: info.assigned_region,
          division: info.assigned_division
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', 'demo_access_token_' + finalEmpId);
          localStorage.setItem('role', info.role);
          localStorage.setItem('user', JSON.stringify(demoUser));
        }
        router.push('/');
        return;
      }
      setError('Unable to connect to backend server. Please verify your server URL.');
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
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Central Login Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full p-8 relative overflow-hidden">
        
        {/* Top Decorative Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D1242F] via-[#A31D1D] to-[#114b79]" />

        {/* Official Header Branding */}
        <div className="text-center mb-6 pt-1">
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

          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Karnataka Postal Circle CRM
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Commercial Operations & Field Executive Portal
            </p>
          </div>
        </div>

        {/* Employee ID & Password Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-4" suppressHydrationWarning>
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
                placeholder="Enter Employee ID (e.g. Mysuru, CO_ADMIN, r001)"
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
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-600 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="font-semibold leading-relaxed">{error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#114b79] hover:bg-[#0d3b60] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Official Logins */}
        <div className="mt-5 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              1-Click Official Logins:
            </p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Password: <code className="font-mono">Post@123</code>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickAccess('CO_ADMIN', 'Post@123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">CO (Circle Admin)</div>
              <div className="text-gray-500 text-[9px]">Circle-wide Access</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickAccess('r001', 'Post@123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">RO Bangalore (r001)</div>
              <div className="text-gray-500 text-[9px]">Bengaluru HQ Region</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickAccess('r002', 'Post@123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">RO South Kar (r002)</div>
              <div className="text-gray-500 text-[9px]">South Karnataka Region</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickAccess('r003', 'Post@123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">RO North Kar (r003)</div>
              <div className="text-gray-500 text-[9px]">North Karnataka Region</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickAccess('Mysuru', 'Post@123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#114b79] bg-gray-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#114b79]">DO (Mysuru)</div>
              <div className="text-gray-500 text-[9px]">Mysuru Division</div>
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleQuickAccess('ME_MYS_01', 'Post@123')}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-[#D1242F] bg-gray-50 hover:bg-red-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-gray-800 text-[11px] group-hover:text-[#D1242F]">ME Suresh M E</div>
              <div className="text-gray-500 text-[9px]">Mysuru ME</div>
            </button>
          </div>
        </div>

        {/* Backend Endpoint Config Section */}
        <div className="mt-5 pt-3 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
          >
            <Server className="w-3 h-3" />
            <span>Backend Server: {backendUrl ? backendUrl.replace('https://', '').replace('http://', '') : 'Not Configured'}</span>
          </button>
          {showConfig && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-left">
              <label className="block text-[10px] font-bold text-gray-600 mb-1">Backend URL:</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 px-2 py-1 text-xs border rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => saveCustomBackend(backendUrl)}
                  className="px-2 py-1 bg-[#114b79] text-white text-xs font-bold rounded"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Department of Posts Authorized Access Only</span>
        </div>
      </div>
    </div>
  );
}
