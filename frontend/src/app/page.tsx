'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LeadsTable, { Lead } from './components/LeadsTable';
import PincodePerformanceTable from './components/PincodePerformanceTable';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';
import { 
  Building2, 
  Users, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Mail,
  AlertCircle,
  Medal,
  Briefcase,
  Target,
  UserCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Filter,
  Globe,
  CalendarDays,
  Sparkles,
  ArrowRight,
  FileText,
  Eye,
  Package,
  Truck,
  MailCheck,
  CircleDot,
  ChevronRight,
  BadgeCheck
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
  time_series?: {date: string, meetings: number}[];
  funnel?: {stage: string, value: number}[];
  agent_performance?: {name: string, leads: number, contacted: number, converted: number, conversion_rate: number}[];
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK — counts from 0 to target value
   ═══════════════════════════════════════════════════════════ */
function useAnimatedCounter(target: number, duration: number = 1200) {
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
  const [selectedDivision, setSelectedDivision] = useState('');
  const [divisions, setDivisions] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserName(u.username || '');
      } catch {}
    }
  }, []);

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchDivisions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/divisions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDivisions(data);
      }
    } catch (err) {
      console.error("Failed to fetch divisions", err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let data: Lead[] = await res.json();
        data = data.map((item: any) => ({
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
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (division = '') => {
    try {
      const url = division 
        ? `http://localhost:8000/api/analytics?division_name=${encodeURIComponent(division)}` 
        : 'http://localhost:8000/api/analytics';
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
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
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        fetchDivisions();
        fetchLeads();
        fetchAnalytics(selectedDivision);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const filteredLeads = selectedDivision
    ? leads.filter(lead => lead.division === selectedDivision)
    : leads;

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

  // Region distribution data
  const regionCounts: Record<string, number> = {};
  filteredLeads.forEach(lead => {
    const region = lead.region ? lead.region.trim() : 'Unknown';
    if (region && region.toLowerCase() !== 'null' && region.toLowerCase() !== 'none' && region !== '') {
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
  });
  const regionData = Object.entries(regionCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Recent activity
  const recentActivity = filteredLeads
    .filter(l => l.dateOfMeeting && l.dateOfMeeting.trim() && l.dateOfMeeting !== 'nan' && l.dateOfMeeting !== 'None')
    .sort((a, b) => {
      try {
        return new Date(b.dateOfMeeting).getTime() - new Date(a.dateOfMeeting).getTime();
      } catch { return 0; }
    })
    .slice(0, 5);

  const pieData = analytics ? [
    { name: 'Interested', value: analytics.interested, color: '#2E7D32' },
    { name: 'Follow-up', value: analytics.follow_up, color: '#F7941D' },
    { name: 'Not Interested', value: analytics.not_interested, color: '#D1242F' },
    { name: 'Contact Pending', value: analytics.contact_pending, color: '#64748b' },
    { name: 'Onboarded', value: analytics.onboarded, color: '#1565C0' },
  ].filter(item => item.value > 0) : [];

  const funnelColors = ['#1B2A4A', '#1565C0', '#F7941D', '#2E7D32'];
  const regionBarColors = ['#D1242F', '#F7941D', '#1565C0', '#2E7D32', '#00897B', '#7B1FA2', '#E65100', '#0097A7'];

  // India Post KPI color palette (inspired by reference dashboards)
  const kpiStyles = [
    { bg: 'linear-gradient(135deg, #1B2A4A, #243B6A)', shadow: 'rgba(27,42,74,0.35)' },    // Navy — Total
    { bg: 'linear-gradient(135deg, #1565C0, #1976D2)', shadow: 'rgba(21,101,192,0.35)' },   // Blue — Contacted
    { bg: 'linear-gradient(135deg, #2E7D32, #388E3C)', shadow: 'rgba(46,125,50,0.35)' },    // Green — Interested
    { bg: 'linear-gradient(135deg, #D1242F, #E53935)', shadow: 'rgba(209,36,47,0.35)' },    // Red — Not Interested
    { bg: 'linear-gradient(135deg, #F7941D, #FB8C00)', shadow: 'rgba(247,148,29,0.35)' },   // Gold — Follow-up
    { bg: 'linear-gradient(135deg, #00897B, #00ACC1)', shadow: 'rgba(0,137,123,0.35)' },     // Teal — Willing
    { bg: 'linear-gradient(135deg, #6A1B9A, #8E24AA)', shadow: 'rgba(106,27,154,0.35)' },   // Purple — Onboarded
    { bg: 'linear-gradient(135deg, #E65100, #EF6C00)', shadow: 'rgba(230,81,0,0.35)' },     // Deep Orange — Pending
  ];

  return (
    <main className="min-h-screen bg-[#f4f6f9] text-slate-800 pb-8" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      {/* ═══════════ INDIA POST THEMED DARK HEADER ═══════════ */}
      <div className="ip-header-gradient pt-7 pb-6 px-6 overflow-hidden">
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D1242F] via-[#F7941D] to-[#FAB52C]"></div>
        
        <div className="max-w-[1440px] mx-auto relative z-10">
          {/* Top Bar */}
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-7">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3">
                {/* India Post inspired logo mark */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D1242F, #B01E28)' }}>
                  <Package className="w-5 h-5 text-white relative z-10" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F7941D] rounded-full opacity-60"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    Lead Analytics Dashboard
                    {/* Live indicator */}
                    <span className="flex items-center gap-1.5 ml-2 px-2.5 py-0.5 bg-emerald-500/15 rounded-full border border-emerald-400/25">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-dot"></span>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                    </span>
                  </h1>
                  {/* Greeting + Clock */}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-slate-400 text-sm font-medium">
                      {getGreeting()}{userName ? `, ${userName.charAt(0).toUpperCase() + userName.slice(1)}` : ''} 👋
                    </p>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1.5 text-[#FAB52C]/80 text-xs font-medium">
                      <CalendarDays className="w-3 h-3" />
                      <span>{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="text-slate-600 mx-0.5">|</span>
                      <Clock className="w-3 h-3" />
                      <span className="tabular-nums">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              {/* Division Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-medium text-slate-200 outline-none focus:ring-2 focus:ring-[#F7941D]/40 focus:border-[#F7941D]/40 transition-all appearance-none min-w-[180px] cursor-pointer backdrop-blur-sm"
                >
                  <option value="" className="bg-[#1B2A4A] text-white">All Divisions</option>
                  {divisions.map((div) => (
                    <option key={div} value={div} className="bg-[#1B2A4A] text-white">{div}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              {/* Upload Button — India Post Red */}
              <div className="relative">
                <input type="file" accept=".xls,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, #D1242F, #B01E28)', boxShadow: '0 4px 14px rgba(209,36,47,0.3)' }}
                >
                  {uploading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploading ? 'Processing...' : 'Upload Excel'}</span>
                </button>
              </div>
            </div>
          </header>

          {/* ═══════════ KPI CARDS — Row 1 (4 cards) ═══════════ */}
          {analytics && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <KPICard label="Total Leads" value={analytics.total_leads} style={kpiStyles[0]} icon={<Users className="w-4 h-4" />} delay={0} />
                <KPICard label="Contacted" value={analytics.contacted} style={kpiStyles[1]} icon={<PhoneCall className="w-4 h-4" />} change={`${analytics.contacted_rate}%`} up delay={1} />
                <KPICard label="Interested" value={analytics.interested} style={kpiStyles[2]} icon={<CheckCircle2 className="w-4 h-4" />} delay={2} />
                <KPICard label="Not Interested" value={analytics.not_interested} style={kpiStyles[3]} icon={<XCircle className="w-4 h-4" />} delay={3} />
              </div>
              {/* ═══════════ KPI CARDS — Row 2 (4 cards) ═══════════ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <KPICard label="Follow-up" value={analytics.follow_up} style={kpiStyles[4]} icon={<Clock className="w-4 h-4" />} delay={4} />
                <KPICard label="Willing to Onboard" value={analytics.willing_to_onboard} style={kpiStyles[5]} icon={<Target className="w-4 h-4" />} delay={5} />
                <KPICard label="Onboarded" value={analytics.onboarded} style={kpiStyles[6]} icon={<BadgeCheck className="w-4 h-4" />} change={`${analytics.onboarding_rate}%`} up delay={6} />
                <KPICard label="Contact Pending" value={analytics.contact_pending} style={kpiStyles[7]} icon={<AlertCircle className="w-4 h-4" />} delay={7} />
              </div>
            </>
          )}

          {/* ═══════════ CONVERSION PIPELINE BAR ═══════════ */}
          {analytics && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
              <div className="glass-card-dark rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-[#FAB52C]" />
                  <span className="text-xs font-bold text-[#FAB52C] uppercase tracking-wider">Conversion Pipeline</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <PipelineStep label="Total Leads" value={analytics.total_leads} color="#1B2A4A" colorEnd="#243B6A" icon={<Users className="w-3.5 h-3.5" />} />
                  <PipelineConnector percentage={analytics.total_leads > 0 ? Math.round((analytics.contacted / analytics.total_leads) * 100) : 0} />
                  <PipelineStep label="Contacted" value={analytics.contacted} color="#1565C0" colorEnd="#1976D2" icon={<PhoneCall className="w-3.5 h-3.5" />} />
                  <PipelineConnector percentage={analytics.contacted > 0 ? Math.round((analytics.interested / analytics.contacted) * 100) : 0} />
                  <PipelineStep label="Interested" value={analytics.interested} color="#F7941D" colorEnd="#FB8C00" icon={<Target className="w-3.5 h-3.5" />} />
                  <PipelineConnector percentage={analytics.interested > 0 ? Math.round((analytics.onboarded / analytics.interested) * 100) : 0} />
                  <PipelineStep label="Onboarded" value={analytics.onboarded} color="#2E7D32" colorEnd="#388E3C" icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="bg-[#f4f6f9] min-h-screen -mt-1 pt-6 px-6 rounded-t-3xl">
        <div className="max-w-[1440px] mx-auto space-y-5">

          {/* ═══════════ ROW 1: Area Chart + Funnel ═══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {analytics && analytics.time_series && (
              <ChartCard title="Meetings Over Time" icon={<TrendingUp className="w-4 h-4" />} iconBg="bg-blue-50" iconColor="text-[#1565C0]" className="lg:col-span-2" delay={0}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.time_series} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradMeetings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1565C0" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#1565C0" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }} />
                    <Area type="monotone" dataKey="meetings" stroke="#1565C0" strokeWidth={2.5} fillOpacity={1} fill="url(#gradMeetings)" dot={{ fill: '#1565C0', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#D1242F' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {analytics && analytics.funnel && (
              <ChartCard title="Acquisition Funnel" icon={<Target className="w-4 h-4" />} iconBg="bg-orange-50" iconColor="text-[#F7941D]" delay={1}>
                <div className="flex items-center justify-center h-[280px]">
                  <div className="flex items-center gap-5 w-full">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      {analytics.funnel.map((item, i) => {
                        const maxVal = analytics.funnel![0].value || 1;
                        const widthPct = Math.max(30, (item.value / maxVal) * 100);
                        return (
                          <div key={i} className="w-full flex flex-col items-center group cursor-pointer">
                            <div 
                              className="relative h-[52px] rounded-lg flex items-center justify-center transition-all duration-500 hover:scale-[1.02]"
                              style={{ 
                                width: `${widthPct}%`, 
                                background: `linear-gradient(135deg, ${funnelColors[i]}, ${funnelColors[i]}cc)`,
                                boxShadow: `0 4px 14px ${funnelColors[i]}25`
                              }}
                            >
                              <span className="text-white font-extrabold text-lg drop-shadow-sm">{item.value.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-2 min-w-[100px]">
                      {analytics.funnel.map((item, i) => (
                        <div key={i} className="h-[52px] flex items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: funnelColors[i]}}></div>
                            <span className="text-sm font-semibold text-slate-600">{item.stage}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ChartCard>
            )}
          </div>

          {/* ═══════════ ROW 2: Doughnut + Services ═══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {analytics && (
              <ChartCard title="Status Distribution" icon={<BarChart3 className="w-4 h-4" />} iconBg="bg-red-50" iconColor="text-[#D1242F]" delay={2}>
                <div className="h-[280px] flex items-center justify-center">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: any) => [`${value} Leads`, '']}
                          contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}
                        />
                        <Legend verticalAlign="bottom" height={42} iconType="circle" iconSize={8} 
                          formatter={(value: string) => <span className="text-xs font-medium text-slate-600 ml-1">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-400 font-medium text-sm">No data available</div>
                  )}
                </div>
              </ChartCard>
            )}

            <ChartCard title="Top Services Used" icon={<Briefcase className="w-4 h-4" />} iconBg="bg-indigo-50" iconColor="text-indigo-600" className="lg:col-span-2" delay={3}>
              <div className="h-[280px]">
                {serviceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={90} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {serviceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#D1242F','#F7941D','#1565C0','#2E7D32','#00897B'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 font-medium text-sm flex items-center justify-center h-full">No service data available</div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* ═══════════ ROW 3: Region Distribution + Recent Activity ═══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <ChartCard title="Region Distribution" icon={<Globe className="w-4 h-4" />} iconBg="bg-violet-50" iconColor="text-violet-600" className="lg:col-span-2" delay={4}>
              <div className="h-[280px]">
                {regionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                        {regionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={regionBarColors[index % regionBarColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 font-medium text-sm flex items-center justify-center h-full">No region data available</div>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Recent Activity" icon={<FileText className="w-4 h-4" />} iconBg="bg-amber-50" iconColor="text-[#F7941D]" delay={5}>
              <div className="h-[280px] overflow-y-auto space-y-2.5 pr-1">
                {recentActivity.length > 0 ? (
                  recentActivity.map((lead, idx) => (
                    <ActivityItem key={lead.id} lead={lead} index={idx} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <FileText className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-sm font-medium">No recent activity</span>
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* ═══════════ ROW 4: Agent Performance Table ═══════════ */}
          {analytics && analytics.agent_performance && analytics.agent_performance.length > 0 && (
            <div className="glass-card rounded-2xl shadow-sm overflow-hidden animate-fade-in-up hover-lift" style={{ animationDelay: '0.3s' }}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-[#1565C0]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Agent Performance</h3>
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{analytics.agent_performance.length} agents</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #1B2A4A, #243B6A)' }} className="text-white text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-5">Agent Name</th>
                      <th className="py-3.5 px-4 text-center">Total Leads</th>
                      <th className="py-3.5 px-4 text-center">Contacted</th>
                      <th className="py-3.5 px-4 text-center">Converted</th>
                      <th className="py-3.5 px-4 text-center">Contact Rate</th>
                      <th className="py-3.5 px-4 text-center">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.agent_performance.map((agent, idx) => {
                      const contactRate = agent.leads > 0 ? Math.round((agent.contacted / agent.leads) * 100) : 0;
                      const rankColors = ['bg-gradient-to-br from-[#F7941D] to-[#FB8C00]', 'bg-gradient-to-br from-slate-400 to-slate-500', 'bg-gradient-to-br from-[#D1242F] to-[#E53935]', 'bg-gradient-to-br from-slate-300 to-slate-400'];
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${rankColors[Math.min(idx, 3)]}`}>
                                {idx + 1}
                              </div>
                              <span className="font-semibold text-slate-700 text-sm">{agent.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[42px] px-2.5 py-1 bg-[#1B2A4A]/10 text-[#1B2A4A] rounded-md text-sm font-bold">{agent.leads}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[42px] px-2.5 py-1 bg-[#1565C0]/10 text-[#1565C0] rounded-md text-sm font-bold">{agent.contacted}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[42px] px-2.5 py-1 bg-[#2E7D32]/10 text-[#2E7D32] rounded-md text-sm font-bold">{agent.converted}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1565C0] rounded-full transition-all duration-700" style={{ width: `${contactRate}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 w-10 text-right">{contactRate}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#2E7D32] rounded-full transition-all duration-700" style={{ width: `${agent.conversion_rate}%` }}></div>
                              </div>
                              <span className={`text-xs font-bold w-10 text-right ${agent.conversion_rate >= 10 ? 'text-[#2E7D32]' : agent.conversion_rate >= 5 ? 'text-[#F7941D]' : 'text-slate-500'}`}>{agent.conversion_rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ ROW 5: Pincode Performance ═══════════ */}
          {!loading && filteredLeads.length > 0 && (
            <PincodePerformanceTable leads={filteredLeads} />
          )}

          {/* ═══════════ ROW 6: Leads Data Grid ═══════════ */}
          <div className="glass-card rounded-2xl shadow-sm overflow-hidden animate-fade-in-up hover-lift" style={{ animationDelay: '0.35s' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-[3px] border-[#D1242F]/20 border-t-[#D1242F] rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 text-sm font-medium animate-pulse">Loading leads directory...</p>
              </div>
            ) : (
              <div className="p-5">
                <LeadsTable data={filteredLeads} />
              </div>
            )}
          </div>
          
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   KPI CARD — India Post colored, animated counter
   ═══════════════════════════════════════════════════════════ */
function KPICard({ label, value, style, icon, change, up, delay = 0 }: { label: string, value: number, style: { bg: string, shadow: string }, icon: React.ReactNode, change?: string, up?: boolean, delay?: number }) {
  const animatedValue = useAnimatedCounter(value, 1400);
  
  return (
    <div 
      className="kpi-card animate-fade-in-up"
      style={{ background: style.bg, boxShadow: `0 4px 14px ${style.shadow}`, animationDelay: `${delay * 0.06}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider truncate">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/80">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-extrabold tracking-tight leading-none text-white">{animatedValue.toLocaleString()}</p>
        {change && (
          <span className={`text-[11px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${up ? 'text-emerald-300 bg-emerald-500/15' : 'text-rose-300 bg-rose-500/15'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PIPELINE STEP
   ═══════════════════════════════════════════════════════════ */
function PipelineStep({ label, value, color, colorEnd, icon }: { label: string, value: number, color: string, colorEnd: string, icon: React.ReactNode }) {
  const animatedValue = useAnimatedCounter(value, 1600);
  
  return (
    <div className="pipeline-step flex flex-col items-center gap-1.5 flex-1">
      <div className="w-full rounded-xl py-3 px-4 flex flex-col items-center shadow-lg" style={{ background: `linear-gradient(135deg, ${color}, ${colorEnd})` }}>
        <div className="flex items-center gap-1.5 text-white/80 mb-0.5">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-2xl font-extrabold text-white tabular-nums">{animatedValue.toLocaleString()}</span>
      </div>
    </div>
  );
}

function PipelineConnector({ percentage }: { percentage: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 w-12 shrink-0">
      <ChevronRight className="w-4 h-4 text-[#FAB52C]/70" />
      <span className="text-[9px] font-bold text-[#FAB52C]/80 tabular-nums">{percentage}%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHART CARD — white glassmorphism with colored icon badges
   ═══════════════════════════════════════════════════════════ */
function ChartCard({ title, icon, iconBg, iconColor, children, className = '', delay = 0 }: { title: string, icon: React.ReactNode, iconBg: string, iconColor: string, children: React.ReactNode, className?: string, delay?: number }) {
  return (
    <div 
      className={`glass-card rounded-2xl shadow-sm overflow-hidden hover-lift animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className="px-5 py-4 border-b border-slate-100/80 flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITY ITEM
   ═══════════════════════════════════════════════════════════ */
function ActivityItem({ lead, index }: { lead: Lead, index: number }) {
  const getStatusInfo = (outcome: string, contractId: string) => {
    const out = (outcome || '').trim().toLowerCase();
    const hasContract = !!(contractId || '').trim();
    
    if (hasContract) return { label: 'Onboarded', color: 'bg-[#1565C0]/10 text-[#1565C0]', dot: 'bg-[#1565C0]' };
    if (out === 'positive') return { label: 'Interested', color: 'bg-[#2E7D32]/10 text-[#2E7D32]', dot: 'bg-[#2E7D32]' };
    if (out === 'not interested') return { label: 'Not Interested', color: 'bg-[#D1242F]/10 text-[#D1242F]', dot: 'bg-[#D1242F]' };
    if (out === 'followup') return { label: 'Follow-up', color: 'bg-[#F7941D]/10 text-[#F7941D]', dot: 'bg-[#F7941D]' };
    if (out !== '') return { label: 'Contacted', color: 'bg-[#1565C0]/10 text-[#1565C0]', dot: 'bg-[#1565C0]' };
    return { label: 'Pending', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  };

  const status = getStatusInfo(lead.meetingOutcome, lead.contractId);

  let dateStr = '';
  try {
    const d = new Date(lead.dateOfMeeting);
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  } catch {}

  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors group cursor-default animate-slide-in-right"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex flex-col items-center pt-1">
        <div className={`w-2.5 h-2.5 rounded-full ${status.dot} ring-2 ring-white shadow-sm`}></div>
        {index < 4 && <div className="w-px h-full bg-slate-200 mt-1"></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{lead.exporterName || 'Unknown'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>{status.label}</span>
          {dateStr && <span className="text-[10px] text-slate-400 font-medium">{dateStr}</span>}
        </div>
      </div>
      {lead.region && lead.region !== 'nan' && (
        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{lead.region}</span>
      )}
    </div>
  );
}

function ProgressBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900">{value}</span>
          <span className="text-xs font-medium text-slate-400 ml-1">({percentage}%)</span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
