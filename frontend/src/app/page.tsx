'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Download, 
  Upload, 
  MoreVertical, 
  Flame, 
  Zap, 
  Snowflake, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  PhoneCall,
  CheckCircle2,
  Filter,
  Briefcase,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Check,
  RefreshCw,
  BarChart3,
  Layers,
  CopyX,
  Trash2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

function DashboardMainContent() {
  const [timeframe, setTimeframe] = useState('Last 30 Days');
  const [selectedDivision, setSelectedDivision] = useState('All Divisions');
  const [divisionsList, setDivisionsList] = useState<string[]>([]);
  const [barChartMode, setBarChartMode] = useState<'division' | 'status'>('division');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Backend Data State
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deduplication Modal State
  const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
  const [dedupCriteria, setDedupCriteria] = useState('name_and_contact');
  const [dedupSummary, setDedupSummary] = useState<{ total_leads: number; duplicate_count: number; unique_leads_estimate: number } | null>(null);
  const [isDedupLoading, setIsDedupLoading] = useState(false);
  const [dedupSuccessResult, setDedupSuccessResult] = useState<string | null>(null);

  // Load Divisions
  const loadDivisions = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/divisions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setDivisionsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch divisions", err);
    }
  };

  // Load Dashboard Data from Backend
  const loadDashboardData = async (division = selectedDivision) => {
    const token = localStorage.getItem('token');
    setIsLoading(true);

    try {
      const divQuery = division && division !== 'All Divisions' ? `?division_name=${encodeURIComponent(division)}` : '';
      
      // 1. Fetch Dynamic Analytics
      const analyticsRes = await fetch(`http://localhost:8000/api/analytics${divQuery}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      // 2. Fetch Live Leads for Recent Engagements
      const leadsRes = await fetch(`http://localhost:8000/api/leads${divQuery}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (Array.isArray(leadsData)) {
          const formatted = leadsData.slice(0, 8).map((item: any) => {
            const outcome = (item.meeting_outcome || '').trim().toLowerCase();
            const isHot = outcome.includes('positive') || outcome.includes('interested');
            const isWarm = outcome.includes('follow') || outcome.includes('contacted') || outcome !== '';
            
            return {
              id: item.id,
              name: item.exporter_name || item.customer_met || 'Commercial Client',
              initials: (item.exporter_name || 'IP').slice(0, 2).toUpperCase(),
              company: item.exporter_name || 'Commercial Entity',
              division: item.division || 'Karnataka Circle',
              status: isHot ? 'Hot' : isWarm ? 'Warm' : 'Cold',
              statusType: isHot ? 'hot' : isWarm ? 'warm' : 'cold',
              score: isHot ? 92 : isWarm ? 74 : 45,
              source: item.service_using || 'Speed Post B2B',
              lastContact: item.date_of_meeting || 'Pending Meeting',
              email: item.email || `${(item.exporter_name || 'client').toLowerCase().replace(/[^a-z0-9]/g, '')}@indiapost.gov.in`
            };
          });
          setRecentActivities(formatted);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Duplicate Summary when Modal opens or criteria changes
  const fetchDuplicateSummary = async (criteria = dedupCriteria) => {
    const token = localStorage.getItem('token');
    setIsDedupLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/leads/duplicates-summary?criteria=${encodeURIComponent(criteria)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setDedupSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch duplicate summary", err);
    } finally {
      setIsDedupLoading(false);
    }
  };

  const handleOpenDedupModal = () => {
    setDedupSuccessResult(null);
    setIsDedupModalOpen(true);
    fetchDuplicateSummary(dedupCriteria);
  };

  const handleExecuteDeduplication = async () => {
    const token = localStorage.getItem('token');
    setIsDedupLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/leads/deduplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ criteria: dedupCriteria })
      });
      const data = await res.json();
      if (res.ok) {
        setDedupSuccessResult(data.message);
        loadDashboardData(selectedDivision);
        fetchDuplicateSummary(dedupCriteria);
      } else {
        alert(data.detail || "Failed to remove duplicates");
      }
    } catch (err: any) {
      alert("Error running deduplication: " + err.message);
    } finally {
      setIsDedupLoading(false);
    }
  };

  useEffect(() => {
    loadDivisions();
    loadDashboardData();
  }, []);

  const handleDivisionChange = (div: string) => {
    setSelectedDivision(div);
    loadDashboardData(div);
  };

  // Handle File Upload (Excel or CSV)
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadProgress('uploading');
    setUploadMessage('Processing records into database...');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch('http://localhost:8000/api/upload-excel', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadProgress('success');
        setUploadMessage(data.message || `Successfully imported ${data.count || ''} records!`);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadProgress('idle');
          setUploadFile(null);
          loadDivisions();
          loadDashboardData(selectedDivision);
        }, 1500);
      } else {
        setUploadProgress('error');
        setUploadMessage(data.detail || 'Failed to process file.');
      }
    } catch (error: any) {
      setUploadProgress('error');
      setUploadMessage(error.message || 'Network error occurred while uploading.');
    }
  };

  const handleExport = () => {
    if (recentActivities.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Company,Division,Status,Lead Score,Service,Last Contact\n"
      + recentActivities.map(e => `"${e.name}","${e.company}","${e.division}","${e.status}",${e.score},"${e.source}","${e.lastContact}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `indiapost_crm_leads_${selectedDivision.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI calculations
  const totalLeads = analytics?.total_leads ? analytics.total_leads.toLocaleString() : '0';
  const pendingLeads = analytics?.contact_pending ? analytics.contact_pending.toLocaleString() : '0';
  const contactedLeads = analytics?.contacted ? analytics.contacted.toLocaleString() : '0';
  const onboardedLeads = analytics?.onboarded ? analytics.onboarded.toLocaleString() : '0';
  const conversionRate = analytics?.onboarding_rate !== undefined ? `${analytics.onboarding_rate}%` : '0.0%';
  const pipelineValue = analytics?.pipeline_value || '₹ 0';

  // Dynamic Chart Datasets
  const timeSeriesData = analytics?.time_series || [];
  const divisionPerformanceData = analytics?.division_performance || [];
  const serviceDistributionData = analytics?.service_distribution || [];
  const outcomeBreakdownData = analytics?.outcome_breakdown || [];

  return (
    <div className="p-4 md:p-8 max-w-[1650px] mx-auto space-y-6 animate-fade-in-up">
      
      {/* Top Page Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D1242F]"></span>
            <span className="text-xs font-black text-[#D1242F] uppercase tracking-wider">Karnataka Circle Executive Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1B2A4A] tracking-tight">
            Commercial Pipeline & Analytics
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Real-time postal performance metrics, division breakdowns, service distribution, and lead acquisition trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Division Filter Dropdown */}
          <div className="relative min-w-[170px]">
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-[#D1242F] rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-slate-800 shadow-xs outline-none focus:ring-2 focus:ring-[#D1242F]/20 cursor-pointer transition-colors"
            >
              <option value="All Divisions">🏢 All Circle Divisions</option>
              {divisionsList.map((div) => (
                <option key={div} value={div}>{div} Division</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Timeframe Select */}
          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-300 hover:border-[#D1242F] rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-slate-800 shadow-xs outline-none focus:ring-2 focus:ring-[#D1242F]/20 cursor-pointer"
            >
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Year to Date</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Deduplicate Leads Button */}
          <button
            onClick={handleOpenDedupModal}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            title="Scan and eliminate duplicate leads"
          >
            <CopyX className="w-3.5 h-3.5 text-amber-700" />
            <span>Clean Duplicates</span>
          </button>

          {/* Upload Data File Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#1B2A4A] hover:bg-[#283044] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            title="Upload Excel or CSV data file"
          >
            <Upload className="w-3.5 h-3.5 text-[#FAB52C]" />
            <span>Upload File</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-[#D1242F] hover:bg-[#B01E28] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Leads */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Circle Leads</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D1242F] flex items-center justify-center group-hover:bg-[#D1242F] group-hover:text-white transition-colors shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalLeads}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +100% Real DB
              </span>
              <span className="text-slate-400 text-[11px]">{selectedDivision}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Pending Outreach */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Meeting</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F7941D] flex items-center justify-center group-hover:bg-[#F7941D] group-hover:text-white transition-colors shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{pendingLeads}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                {contactedLeads} Contacted
              </span>
              <span className="text-slate-400 text-[11px]">in queue</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Onboarding Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Onboarding Rate</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center group-hover:bg-[#1565C0] group-hover:text-white transition-colors shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{conversionRate}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                {onboardedLeads} Onboarded
              </span>
              <span className="text-slate-400 text-[11px]">contract signed</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Postal Pipeline Value */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Postal Pipeline Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center group-hover:bg-[#2E7D32] group-hover:text-white transition-colors shadow-xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{pipelineValue}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> High Potential
              </span>
              <span className="text-slate-400 text-[11px]">monthly volume</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: INTERACTIVE MULTI-DIMENSIONAL BAR GRAPH
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D1242F]" />
              <h2 className="text-lg font-black text-slate-900">
                {barChartMode === 'division' ? 'Division Lead Performance Breakdown' : 'Lead Outcome Status Distribution'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {barChartMode === 'division'
                ? 'Multi-dimensional comparison of Total Leads, Contacted Inquiries, and Onboarded Contracts by Division'
                : 'Exact volume distribution of lead stages across Karnataka Circle database'}
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setBarChartMode('division')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                barChartMode === 'division'
                  ? 'bg-white text-[#D1242F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Division
            </button>
            <button
              onClick={() => setBarChartMode('status')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                barChartMode === 'status'
                  ? 'bg-white text-[#D1242F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Outcome Status
            </button>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {barChartMode === 'division' ? (
              <BarChart data={divisionPerformanceData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="division" 
                  stroke="#64748B" 
                  fontSize={11} 
                  fontWeight={600}
                  tickLine={false} 
                  angle={-20} 
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '10px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '15px' }}
                  iconType="circle"
                />
                <Bar dataKey="total" name="Total Leads" fill="#1B2A4A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contacted" name="Contacted" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interested" name="Interested" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onboarded" name="Onboarded" fill="#D1242F" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={outcomeBreakdownData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} fontWeight={600} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Lead Count" radius={[6, 6, 0, 0]}>
                  {outcomeBreakdownData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#D1242F'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: ACQUISITION TRENDS & SERVICE DONUT CHARTS
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lead Acquisition Trends Area Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Lead Acquisition & Activity Timeline</h2>
              <p className="text-xs text-slate-500">Temporal meeting activity distribution from live database records</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#D1242F]"></span>
                <span className="text-slate-700">Lead Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 border-b-2 border-dashed border-slate-400"></span>
                <span className="text-slate-500">Benchmark</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ipRedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D1242F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D1242F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#FAB52C' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#D1242F" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#ipRedGradient)" 
                  name="Volume"
                />
                <Area 
                  type="monotone" 
                  dataKey="previous" 
                  stroke="#94A3B8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  fill="transparent" 
                  name="Baseline"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Lead Source Donut Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-black text-slate-900">Service Breakdown</h2>
            <span className="text-xs bg-red-50 text-[#D1242F] font-bold px-2.5 py-0.5 rounded-full border border-red-200">
              Live Mix
            </span>
          </div>

          <div className="relative h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {serviceDistributionData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 leading-tight">100%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Service Mix</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {serviceDistributionData.map((src: any) => (
              <div key={src.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: src.color }}></span>
                  <span className="text-slate-700 font-semibold">{src.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{src.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: RECENT LEADS ENGAGEMENTS TABLE
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-900">Recent Lead Engagements</h2>
            <p className="text-xs text-slate-500">Latest active leads from database matching selected division</p>
          </div>
          <Link
            href="/leads"
            className="text-xs font-bold text-[#D1242F] hover:text-[#B01E28] flex items-center gap-1 hover:underline"
          >
            <span>View All Leads</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Lead / Exporter Name</th>
                <th className="py-3.5 px-4">Company & Division</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Date of Meeting</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {recentActivities.length > 0 ? (
                recentActivities.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          {lead.initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{lead.name}</p>
                          <p className="text-[11px] text-slate-400">{lead.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{lead.company}</div>
                      <div className="text-[11px] text-slate-500">
                        {lead.division}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {lead.statusType === 'hot' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-[#D1242F] border border-red-200">
                          <Flame className="w-3 h-3 text-[#D1242F]" /> Qualified (Hot)
                        </span>
                      )}
                      {lead.statusType === 'warm' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Zap className="w-3 h-3 text-amber-600" /> Contacted
                        </span>
                      )}
                      {lead.statusType === 'cold' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <Snowflake className="w-3 h-3 text-slate-400" /> Cold Lead
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {lead.source}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {lead.lastContact}
                    </td>

                    <td className="py-3.5 px-4 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === lead.id ? null : lead.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === lead.id && (
                        <div className="absolute right-4 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 text-left text-xs animate-fade-in-scale">
                          <Link href="/leads" className="block px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-semibold">
                            View Details
                          </Link>
                          <Link href="/leads" className="block px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-semibold">
                            Schedule Call
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No lead engagements found for {selectedDivision}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL 1: UPLOAD DATA FILE (.xlsx, .xls, .csv)
         ═══════════════════════════════════════════════════════════ */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D1242F] flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload Leads Data</h3>
                  <p className="text-xs text-slate-500">Import Excel (.xlsx, .xls) or CSV files</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadProgress('idle');
                  setUploadFile(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="mt-4 space-y-4 text-xs">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  uploadFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300 hover:border-[#D1242F] hover:bg-red-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                      setUploadProgress('idle');
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6 text-[#D1242F]" />
                </div>

                {uploadFile ? (
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{uploadFile.name}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Ready to upload ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Click to browse or drag file here</p>
                    <p className="text-[11px] text-slate-400 mt-1">Supports Excel spreadsheet (.xlsx, .xls) and CSV</p>
                  </div>
                )}
              </div>

              {uploadProgress !== 'idle' && (
                <div className={`p-3 rounded-xl flex items-center gap-2 ${
                  uploadProgress === 'uploading' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                  uploadProgress === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {uploadProgress === 'uploading' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />}
                  {uploadProgress === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {uploadProgress === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span className="font-semibold text-[11px]">{uploadMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadProgress('idle');
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadProgress === 'uploading'}
                  className="px-4 py-2 bg-[#D1242F] hover:bg-[#B01E28] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs hover:shadow flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadProgress === 'uploading' ? 'Processing...' : 'Upload & Process'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 2: DEDUPLICATE LEADS CLEANUP
         ═══════════════════════════════════════════════════════════ */}
      {isDedupModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <CopyX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Lead Deduplication Engine</h3>
                  <p className="text-xs text-slate-500">Identify and clean duplicate records from database</p>
                </div>
              </div>
              <button
                onClick={() => setIsDedupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Criteria Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Deduplication Criteria</label>
                <select
                  value={dedupCriteria}
                  onChange={(e) => {
                    setDedupCriteria(e.target.value);
                    fetchDuplicateSummary(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#D1242F]/20"
                >
                  <option value="name_and_contact">Composite (Exporter Name + Phone Number + Email)</option>
                  <option value="name">Exporter Name only</option>
                  <option value="contact">Contact Phone Number only</option>
                  <option value="email">Email Address only</option>
                  <option value="sl_no">Sl No / Lead ID only</option>
                </select>
              </div>

              {/* Scan Results Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Total Records in CRM:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {dedupSummary?.total_leads ? dedupSummary.total_leads.toLocaleString() : '...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700">Detected Duplicate Records:</span>
                  <span className="font-black text-amber-600 text-sm">
                    {dedupSummary?.duplicate_count !== undefined ? dedupSummary.duplicate_count.toLocaleString() : '...'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="font-bold text-emerald-700">Estimated Unique Leads:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {dedupSummary?.unique_leads_estimate !== undefined ? dedupSummary.unique_leads_estimate.toLocaleString() : '...'}
                  </span>
                </div>
              </div>

              {/* Success Result Banner */}
              {dedupSuccessResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{dedupSuccessResult}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                * Note: The primary (original) lead record with the earliest entry is preserved, while all duplicate secondary entries are safely deleted.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDedupModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={handleExecuteDeduplication}
                  disabled={isDedupLoading || !dedupSummary || dedupSummary.duplicate_count === 0}
                  className="px-4 py-2 bg-[#D1242F] hover:bg-[#B01E28] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs hover:shadow flex items-center gap-1.5 transition-all"
                >
                  {isDedupLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isDedupLoading ? 'Cleaning Records...' : `Clean ${dedupSummary?.duplicate_count || 0} Duplicates`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-bold">Loading India Post CRM Dashboard...</div>}>
      <DashboardMainContent />
    </Suspense>
  );
}
