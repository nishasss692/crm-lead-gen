'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LeadsTable, { Lead } from './components/LeadsTable';
import PincodePerformanceTable from './components/PincodePerformanceTable';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Users, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  Upload, 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Target, 
  UserCheck, 
  ArrowUpRight, 
  Filter, 
  Briefcase, 
  Download, 
  RotateCcw, 
  ChevronDown, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle,
  Activity,
  Award,
  User,
  SlidersHorizontal
} from 'lucide-react';

interface AnalyticsData {
  total_leads: number;
  contact_pending: number;
  contacted: number;
  interested: number;
  not_interested: number;
  follow_up: number;
  willing_to_onboard: number;
  onboarded: number;
  onboard_pending: number;
  contacted_rate: number;
  onboarding_rate: number;
  time_series?: { date: string; meetings: number }[];
  funnel?: { stage: string; value: number }[];
  agent_performance?: {
    name: string;
    leads: number;
    contacted: number;
    converted: number;
    conversion_rate: number;
  }[];
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════ */
function useAnimatedCounter(target: number, duration: number = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const startTime = Date.now();
    const startVal = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (target - startVal) * eased);
      setCount(current);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

export default function Dashboard() {
  const router = useRouter();

  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  // Filter States
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('all');

  // Data states
  const [divisions, setDivisions] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load authenticated user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {}
    }
  }, []);

  // Fetch divisions list from backend
  const fetchDivisions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/divisions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDivisions(data);
      }
    } catch (err) {
      console.error('Failed to fetch divisions', err);
    }
  };

  // Fetch leads from backend
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const rawData = await res.json();
        const data: Lead[] = rawData.map((item: any) => ({
          id: item.id,
          slNo: item.sl_no,
          exporterName: item.exporter_name,
          address: item.address,
          pincode: item.pincode,
          divisionId: item.division_id,
          division: item.division,
          region: item.region,
          assignedMeName: item.assigned_agent,
          dateOfMeeting: item.date_of_meeting,
          customerMet: item.customer_met,
          contactNumber: item.contact_number,
          email: item.email,
          serviceUsing: item.service_using,
          monthlyVolume: item.monthly_volume,
          meetingOutcome: item.meeting_outcome,
          contractId: item.contract_id,
          remarks: item.remarks
        }));
        setLeads(data);
      }
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics metrics
  const fetchAnalytics = async (division = '') => {
    try {
      const url = division
        ? `http://localhost:8000/api/analytics?division_name=${encodeURIComponent(division)}`
        : 'http://localhost:8000/api/analytics';
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDivisions();
    fetchLeads();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedDivision);
  }, [selectedDivision]);

  // Handle Excel upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/upload-excel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchDivisions();
        fetchLeads();
        fetchAnalytics(selectedDivision);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  // Extract unique regions
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.region && l.region !== 'nan' && l.region.trim() !== '') {
        set.add(l.region.trim());
      }
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filtered dataset
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (selectedDivision && lead.division !== selectedDivision) return false;
      if (selectedRegion && lead.region !== selectedRegion) return false;

      if (selectedOutcome !== 'all') {
        const out = (lead.meetingOutcome || '').trim().toLowerCase();
        const hasContract = !!(lead.contractId || '').trim();

        if (selectedOutcome === 'onboarded' && !hasContract) return false;
        if (selectedOutcome === 'interested' && out !== 'positive') return false;
        if (selectedOutcome === 'followup' && out !== 'followup') return false;
        if (selectedOutcome === 'not_interested' && out !== 'not interested') return false;
        if (selectedOutcome === 'pending' && out !== '') return false;
        if (selectedOutcome === 'contacted' && out === '') return false;
      }
      return true;
    });
  }, [leads, selectedDivision, selectedRegion, selectedOutcome]);

  const handleResetFilters = () => {
    setSelectedRole('All');
    setSelectedRegion('');
    setSelectedDivision('');
    setSelectedOutcome('all');
  };

  const hasActiveFilters = selectedRole !== 'All' || selectedRegion !== '' || selectedDivision !== '' || selectedOutcome !== 'all';

  // Export filtered leads to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = Object.keys(filteredLeads[0]).join(',');
    const rows = filteredLeads
      .map(lead =>
        Object.values(lead)
          .map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karnataka_postal_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Outcome distribution pie chart data
  const pieData = analytics
    ? [
        { name: 'Interested (Positive)', value: analytics.interested, color: '#10b981' },
        { name: 'Follow-up Required', value: analytics.follow_up, color: '#f59e0b' },
        { name: 'Contacted', value: analytics.contacted - analytics.interested - analytics.not_interested - analytics.follow_up > 0 ? analytics.contacted - analytics.interested - analytics.not_interested - analytics.follow_up : 0, color: '#3b82f6' },
        { name: 'Not Interested', value: analytics.not_interested, color: '#ef4444' },
        { name: 'Action Pending', value: analytics.contact_pending, color: '#94a3b8' },
        { name: 'Onboarded (Contracted)', value: analytics.onboarded, color: '#6366f1' }
      ].filter(item => item.value > 0)
    : [];

  // Service distribution data
  const serviceCounts: Record<string, number> = {};
  filteredLeads.forEach(lead => {
    const service = lead.serviceUsing ? lead.serviceUsing.trim() : 'Unknown';
    if (service && service.toLowerCase() !== 'null' && service.toLowerCase() !== 'none') {
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    }
  });

  const serviceData = Object.entries(serviceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ═══════════════════════════════════════════════════════════
            1. THE OFFICIAL HEADER (Department of Posts Branding)
            ═══════════════════════════════════════════════════════════ */}
        <header className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left side: India Post Logo Placeholder & Govt text */}
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center justify-center">
              <img 
                src="/india-post-logo.png" 
                alt="India Post" 
                className="h-11 w-auto object-contain drop-shadow-xs" 
                onError={(e) => {
                  // Fallback if image file is not yet dropped in public folder
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.ip-logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="ip-logo-fallback hidden w-10 h-10 rounded-lg bg-red-700 text-white font-extrabold text-sm items-center justify-center shadow-xs">
                IP
              </div>
            </div>

            <div className="border-l border-gray-200 pl-3 leading-tight">
              <div className="text-xs font-bold text-red-800 tracking-wide uppercase">
                Department of Posts
              </div>
              <div className="text-[11px] font-semibold text-red-700/80 uppercase">
                Government of India
              </div>
            </div>
          </div>

          {/* Center: Karnataka Postal Circle & Dashboard Title */}
          <div className="text-center md:flex-1 md:px-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-red-700 tracking-tight">
              Karnataka Postal Circle
            </h1>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
              Advanced Lead Management Dashboard
            </h2>
          </div>

          {/* Right side: Action Buttons & User Profile Indicator */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <input
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{uploading ? 'Importing...' : 'Upload Excel'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-700 flex items-center justify-center font-bold text-xs">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 block capitalize">
                  {user?.username || 'Officer'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>

        </header>

        {/* ═══════════════════════════════════════════════════════════
            2. THE MAIN LAYOUT (3/4 Left Content, 1/4 Right Sidebar)
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* ═══════════════════════════════════════════════════════════
              LEFT SIDE: MAIN CONTENT AREA (3/4 Width)
              ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-6">

            {/* KPI Cards Row (6 Crisp White Cards with Subtle Top Blue Border) */}
            {analytics ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
                
                <KPICard
                  label="Total Leads"
                  value={analytics.total_leads}
                  icon={<Users className="w-4 h-4 text-blue-600" />}
                  iconBg="bg-blue-50"
                  trend="+4.8% MoM"
                  trendUp={true}
                />

                <KPICard
                  label="Contacted"
                  value={analytics.contacted}
                  icon={<PhoneCall className="w-4 h-4 text-cyan-600" />}
                  iconBg="bg-cyan-50"
                  rate={`${analytics.contacted_rate}%`}
                  trendUp={true}
                />

                <KPICard
                  label="Interested"
                  value={analytics.interested}
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  trend="+8.2% Conv"
                  trendUp={true}
                />

                <KPICard
                  label="Onboarded"
                  value={analytics.onboarded}
                  icon={<Award className="w-4 h-4 text-indigo-600" />}
                  iconBg="bg-indigo-50"
                  rate={`${analytics.onboarding_rate}%`}
                  trendUp={true}
                />

                <KPICard
                  label="Follow-up Req."
                  value={analytics.follow_up}
                  icon={<Clock className="w-4 h-4 text-amber-600" />}
                  iconBg="bg-amber-50"
                  trend="In Progress"
                  trendUp={null}
                />

                <KPICard
                  label="Action Pending"
                  value={analytics.contact_pending}
                  icon={<Target className="w-4 h-4 text-rose-600" />}
                  iconBg="bg-rose-50"
                  trend="Queue"
                  trendUp={null}
                />

              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-28 animate-pulse shadow-sm">
                    <div className="h-3 bg-slate-100 rounded w-16 mb-4"></div>
                    <div className="h-7 bg-slate-100 rounded w-20"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Middle Section: Clean White Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Chart 1: Leads & Meetings Over Time (Line/Area Chart) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Leads & Meetings Over Time</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Daily meeting engagement volume</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Trend Line
                  </span>
                </div>

                {analytics && analytics.time_series && analytics.time_series.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={analytics.time_series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="meetings"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#blueGradient)"
                        dot={{ fill: '#2563eb', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: '#1d4ed8' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-slate-400 text-xs font-medium">
                    No meeting timeline data available
                  </div>
                )}
              </div>

              {/* Chart 2: Meeting Outcome Distribution (Donut Chart) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Meeting Outcome Distribution</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Status ratio of recorded lead interactions</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Ratio Donut
                  </span>
                </div>

                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={88}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: any) => [`${value} Leads`, '']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          fontSize: '12px'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={7}
                        formatter={(value: string) => (
                          <span className="text-xs font-semibold text-slate-600 ml-1">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-slate-400 text-xs font-medium">
                    No status data available
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Section: Leads Data Grid Preview with Clean Zebra Striping */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Leads Directory Preview</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Showing {filteredLeads.length} record{filteredLeads.length === 1 ? '' : 's'} matching current filters
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Filter Constraints</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-red-200 border-t-red-700 rounded-full animate-spin"></div>
                  <p className="mt-3 text-slate-400 text-xs font-medium">Loading leads data...</p>
                </div>
              ) : (
                <div className="p-5">
                  <LeadsTable data={filteredLeads} />
                </div>
              )}
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════
              3. THE FILTER SIDEBAR (1/4 Width Clean White Panel)
              ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-6">
            
            {/* Global Filters Panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-red-50 text-red-700 flex items-center justify-center">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Global Filters</h3>
                </div>
                {hasActiveFilters && (
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              {/* Dropdown 1: Role Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Role Filter
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 w-full outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    <option value="CO">CO (Central Officer)</option>
                    <option value="RO">RO (Regional Officer)</option>
                    <option value="Division">Division Officer</option>
                    <option value="ME">Marketing Executive (ME)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Dropdown 2: Region Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Region Filter
                </label>
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 w-full outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Karnataka Regions</option>
                    {availableRegions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Dropdown 3: Division Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Division Filter
                </label>
                <div className="relative">
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 w-full outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Postal Divisions</option>
                    {divisions.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Dropdown 4: Meeting Outcome */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Meeting Outcome
                </label>
                <div className="relative">
                  <select
                    value={selectedOutcome}
                    onChange={(e) => setSelectedOutcome(e.target.value)}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 w-full outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Outcomes</option>
                    <option value="interested">Positive / Interested</option>
                    <option value="contacted">Contacted</option>
                    <option value="followup">Follow-up Required</option>
                    <option value="onboarded">Onboarded</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="pending">Action Pending</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Reset Action */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Filter Settings</span>
                </button>
              )}

              {/* Pipeline Progress Metrics */}
              {analytics && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Circle Conversion
                    </span>
                    <span className="text-xs font-bold text-red-700">
                      {analytics.onboarding_rate}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Contact Reach</span>
                        <span className="font-semibold text-slate-700">{analytics.contacted_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(analytics.contacted_rate, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Onboarded Leads</span>
                        <span className="font-semibold text-slate-700">{analytics.onboarding_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(analytics.onboarding_rate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Assistance Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Support & Guidance</p>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Circle operational support
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   KPI CARD COMPONENT (Crisp White with Subtle Blue Top Border)
   ═══════════════════════════════════════════════════════════ */
function KPICard({
  label,
  value,
  icon,
  iconBg,
  rate,
  trend,
  trendUp
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  rate?: string;
  trend?: string;
  trendUp?: boolean | null;
}) {
  const animatedValue = useAnimatedCounter(value, 800);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-t-4 border-t-blue-600 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none tabular-nums mb-2">
        {animatedValue.toLocaleString()}
      </p>
      <div className="flex items-center justify-between text-[11px]">
        {rate && (
          <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
            {rate} rate
          </span>
        )}
        {trend && (
          <span className={`font-semibold flex items-center gap-0.5 ${
            trendUp === true ? 'text-emerald-600' : trendUp === false ? 'text-rose-600' : 'text-slate-400'
          }`}>
            {trendUp === true && <ArrowUpRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
