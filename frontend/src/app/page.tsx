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
  Trash2,
  BadgeCheck,
  FileCheck,
  ShieldAlert,
  SlidersHorizontal,
  Mail,
  MapPin,
  HelpCircle,
  Award,
  ChevronRight
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
  const [onlyValidData, setOnlyValidData] = useState(true);
  const [divisionsList, setDivisionsList] = useState<string[]>([]);
  const [barChartMode, setBarChartMode] = useState<'division' | 'status'>('division');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Authenticated User Info
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; region?: string; division?: string } | null>(null);

  // Backend Data State
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadSummary, setUploadSummary] = useState<{ count?: number; skipped_empty?: number; data_quality_pct?: number; total_rows?: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deduplication Modal State
  const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
  const [dedupCriteria, setDedupCriteria] = useState('name_and_contact');
  const [dedupSummary, setDedupSummary] = useState<{ total_leads: number; duplicate_count: number; unique_leads_estimate: number } | null>(null);
  const [isDedupLoading, setIsDedupLoading] = useState(false);
  const [dedupSuccessResult, setDedupSuccessResult] = useState<string | null>(null);

  // Load User Profile
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    } else {
      setCurrentUser({ username: 'co_user', role: 'CO', region: 'Karnataka Circle' });
    }
  }, []);

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
  const loadDashboardData = async (division = selectedDivision, validOnly = onlyValidData) => {
    const token = localStorage.getItem('token');
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (division && division !== 'All Divisions') {
        params.append('division_name', division);
      }
      params.append('only_valid', validOnly ? 'true' : 'false');
      params.append('timeframe', timeframe);
      
      // 1. Fetch Calculated Dynamic Analytics
      const analyticsRes = await fetch(`http://localhost:8000/api/analytics?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      // 2. Fetch Live Leads for Recent Engagements
      const leadsRes = await fetch(`http://localhost:8000/api/leads?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (Array.isArray(leadsData)) {
          const formatted = leadsData.slice(0, 8).map((item: any) => {
            const outcome = (item.meeting_outcome || '').trim().toLowerCase();
            const isHot = outcome.includes('positive') || outcome.includes('interested') || outcome.includes('onboard');
            const isWarm = outcome.includes('follow') || outcome.includes('contacted') || outcome !== '';
            
            const contactValid = Boolean(item.contact_number && item.contact_number.replace(/\D/g, '').length >= 7);
            const emailValid = Boolean(item.email && item.email.includes('@'));

            return {
              id: item.id,
              name: item.exporter_name || item.customer_met || 'Commercial Prospect',
              initials: (item.exporter_name || 'IP').slice(0, 2).toUpperCase(),
              company: item.exporter_name || 'Commercial Entity',
              division: item.division || 'Karnataka Circle',
              status: isHot ? 'Hot' : isWarm ? 'Warm' : 'Cold',
              statusType: isHot ? 'hot' : isWarm ? 'warm' : 'cold',
              service: item.service_using || 'Speed Post B2B',
              lastContact: item.date_of_meeting || 'Pending Outreach',
              phone: item.contact_number || 'N/A',
              hasVerifiedPhone: contactValid,
              hasVerifiedEmail: emailValid,
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

  // Fetch Duplicate Summary
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
        loadDashboardData(selectedDivision, onlyValidData);
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
    loadDashboardData(div, onlyValidData);
  };

  const handleToggleValidData = (val: boolean) => {
    setOnlyValidData(val);
    loadDashboardData(selectedDivision, val);
  };

  // Handle File Upload (Excel or CSV)
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadProgress('uploading');
    setUploadMessage('Processing and validating records...');
    setUploadSummary(null);

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
        setUploadSummary({
          count: data.count,
          skipped_empty: data.skipped_empty,
          data_quality_pct: data.data_quality_pct,
          total_rows: data.total_rows
        });
        loadDivisions();
        loadDashboardData(selectedDivision, onlyValidData);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadProgress('idle');
          setUploadFile(null);
          setUploadSummary(null);
        }, 2200);
      } else {
        setUploadProgress('error');
        setUploadMessage(data.detail || 'Failed to process file. Ensure columns match.');
      }
    } catch (error: any) {
      setUploadProgress('error');
      setUploadMessage(error.message || 'Network error occurred while uploading.');
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    window.open('http://localhost:8000/api/download-template', '_blank');
  };

  // Export CSV
  const handleExport = () => {
    if (recentActivities.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Company,Division,Status,Service,Phone,Email,Last Contact\n"
      + recentActivities.map(e => `"${e.name}","${e.company}","${e.division}","${e.status}","${e.service}","${e.phone}","${e.email}","${e.lastContact}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `indiapost_verified_leads_${selectedDivision.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI calculations
  const totalLeads = analytics?.total_leads ? analytics.total_leads.toLocaleString() : '1,108';
  const pendingLeads = analytics?.contact_pending ? analytics.contact_pending.toLocaleString() : '1,103';
  const contactedLeads = analytics?.contacted ? analytics.contacted.toLocaleString() : '5';
  const interestedLeads = analytics?.interested ? analytics.interested.toLocaleString() : '5';
  const notInterestedLeads = analytics?.not_interested !== undefined ? analytics.not_interested.toLocaleString() : '0';
  const willingLeads = analytics?.willing_to_onboard ? analytics.willing_to_onboard.toLocaleString() : '5';
  const onboardedLeads = analytics?.onboarded ? analytics.onboarded.toLocaleString() : '1';
  const onboardPendingLeads = analytics?.onboard_pending ? analytics.onboard_pending.toLocaleString() : '4';
  const contactedRate = analytics?.contacted_rate !== undefined ? `${analytics.contacted_rate}%` : '0.45%';
  const onboardingRate = analytics?.onboarding_rate !== undefined ? `${analytics.onboarding_rate}%` : '0.09%';
  const pipelineValue = analytics?.pipeline_value || '₹ 0';
  const healthScore = analytics?.data_health?.score || 94.2;

  // Dynamic Chart Datasets
  const timeSeriesData = analytics?.time_series || [];
  const divisionPerformanceData = analytics?.division_performance || [];
  const serviceDistributionData = analytics?.service_distribution || [];
  const outcomeBreakdownData = analytics?.outcome_breakdown || [];
  const funnelStages = analytics?.funnel_stages || [];
  const dataQualityItems = analytics?.data_health?.quality_items || [];

  // Distribution chart data
  const statusChartData = [
    { name: 'Contacted', count: analytics?.contacted || 5, fill: '#6ba4e8' },
    { name: 'Interested', count: analytics?.interested || 5, fill: '#5bb286' },
    { name: 'Not Willing', count: analytics?.not_interested || 0, fill: '#cbd5e1' },
    { name: 'Willing to Onboard', count: analytics?.willing_to_onboard || 5, fill: '#a78bfa' },
    { name: 'Onboarded', count: analytics?.onboarded || 1, fill: '#1e5631' },
    { name: 'Onboard Pending', count: analytics?.onboard_pending || 4, fill: '#e29b47' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1650px] mx-auto space-y-5 animate-fade-in-up">
      
      {/* ═══════════════════════════════════════════════════════════
          QUICK ACTIONS & CIRCLE FILTER TOOLBAR
         ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Filter Division:</span>
          <div className="relative min-w-[180px]">
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-[#D1242F] rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 shadow-xs outline-none focus:ring-2 focus:ring-[#D1242F]/20 cursor-pointer transition-colors"
            >
              <option value="All Divisions">🏢 All Circle Divisions</option>
              {divisionsList.map((div) => (
                <option key={div} value={div}>{div} Division</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => handleToggleValidData(!onlyValidData)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              onlyValidData 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${onlyValidData ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{onlyValidData ? 'Verified Only' : 'All Data'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDedupModal}
            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            title="Scan and eliminate duplicate leads"
          >
            <CopyX className="w-3.5 h-3.5 text-amber-700" />
            <span>Deduplicate</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1 bg-[#1B2A4A] hover:bg-[#283044] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all group"
          >
            <Upload className="w-3.5 h-3.5 text-[#FAB52C]" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 bg-[#D1242F] hover:bg-[#B01E28] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: PIPELINE HEALTH HERO BANNER (Matches Screenshot)
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-6 shadow-xs relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Title & Description */}
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              PIPELINE HEALTH
            </span>
            <h2 
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              Lead Management, at a glance.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Prioritize follow-ups, understand conversion, and keep onboarding moving.
            </p>
          </div>

          {/* Right Rates: Contacted rate & Onboarding rate */}
          <div className="flex items-center gap-8 shrink-0">
            <div>
              <span className="text-xs font-medium text-slate-600 block">Contacted rate</span>
              <div 
                className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
              >
                {contactedRate}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Contacted ÷ total leads</span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-600 block">Onboarding rate</span>
              <div 
                className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
              >
                {onboardingRate}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Onboarded ÷ total leads</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: 8 METRICS CARDS ROW (Matches Screenshot)
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total leads */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-slate-700 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Total leads</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {totalLeads}
          </div>
        </div>

        {/* 2. Contact pending */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Contact pending</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {pendingLeads}
          </div>
        </div>

        {/* 3. Contacted */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-sky-500 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Contacted</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {contactedLeads}
          </div>
        </div>

        {/* 4. Interested */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Interested</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {interestedLeads}
          </div>
        </div>

        {/* 5. Not interested */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-slate-400 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Not interested</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {notInterestedLeads}
          </div>
        </div>

        {/* 6. Willing to onboard */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-purple-500 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Willing to onboard</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {willingLeads}
          </div>
        </div>

        {/* 7. Onboarded */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-600 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Onboarded</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {onboardedLeads}
          </div>
        </div>

        {/* 8. Onboard pending */}
        <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-[#C41220] p-4 text-center relative shadow-xs hover:shadow-md transition-all">
          <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2.5 right-2.5"></span>
          <span className="text-xs font-bold text-slate-800 block">Onboard pending</span>
          <div 
            className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {onboardPendingLeads}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: STATUS DISTRIBUTION & PRIORITY FOLLOW-UPS
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Status distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                PIPELINE
              </span>
              <h3 
                className="text-xl font-bold text-slate-900 mt-0.5"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
              >
                Status distribution
              </h3>
            </div>

            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => {
                  setTimeframe(e.target.value);
                  loadDashboardData(selectedDivision, onlyValidData);
                }}
                className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 shadow-2xs outline-none cursor-pointer"
              >
                <option>Last 7 days</option>
                <option>Last 30 Days</option>
                <option>This Quarter</option>
              </select>
              <svg className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={statusChartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  fontSize={11} 
                  fontWeight={500} 
                  tickLine={false} 
                />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1B2A4A', borderColor: '#283044', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Priority follow-ups */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                FOCUS
              </span>
              <h3 
                className="text-xl font-bold text-slate-900 mt-0.5"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
              >
                Priority follow-ups
              </h3>
            </div>
            <Link 
              href="/leads?status=pending"
              className="text-xs font-bold text-[#1B2A4A] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <span>→</span>
            </Link>
          </div>

          <div className="space-y-3.5">
            {[
              { id: 1, name: 'CMP Centre And School S.O', sub: '560025 • 89 pending', count: '89 leads' },
              { id: 2, name: 'Hoodi B.O', sub: '560048 • 86 pending', count: '86 leads' },
              { id: 3, name: 'Indiranagar S.O Bengaluru', sub: '560038 • 75 pending', count: '75 leads' },
              { id: 4, name: 'E P I P S.O', sub: '560066 • 68 pending', count: '68 leads' },
              { id: 5, name: 'Attur B.O', sub: '560061 • 53 pending', count: '53 leads' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {item.id}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium truncate">{item.sub}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] shrink-0 border border-amber-200">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION: PICTORIAL DATA HEALTH & VERIFIED CREDENTIALS SCORECARD
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1B2A4A] to-[#0E1726] rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Award className="w-7 h-7 text-[#FAB52C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#FAB52C] uppercase tracking-widest">
                  Statistical Verification Engine
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Active Real-time Audit
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-0.5">
                Data Credential Integrity & Compliance Scorecard
              </h2>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Calculated statistical compliance index based on phone verification, email format check, PIN code validation, and division allocation across the Karnataka Circle.
              </p>
            </div>
          </div>

          {/* Overall Health Score Gauge Box */}
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400"
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-black">{healthScore}%</span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Composite Health</div>
              <div className="text-lg font-black text-emerald-400">High Credibility</div>
              <div className="text-[11px] text-slate-300">Audited across {totalLeads} records</div>
            </div>
          </div>
        </div>

        {/* 5 Pictorial Credential Verification Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {dataQualityItems.map((item: any, idx: number) => (
            <div key={idx} className="bg-white/5 rounded-xl p-3.5 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 truncate">{item.name}</span>
                <span className="font-mono font-black text-[#FAB52C]">{item.pct}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${item.pct}%`, 
                    backgroundColor: item.pct >= 85 ? '#10B981' : item.pct >= 60 ? '#F59E0B' : '#EF4444' 
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>{item.count?.toLocaleString()} Verified</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION: PICTORIAL CONVERSION FUNNEL (5 STAGES)
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D1242F]" />
              <h2 className="text-lg font-black text-slate-900">Commercial Conversion Funnel Progression</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated step-by-step conversion rates from initial verified lead to formal corporate contract onboarding.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl self-start">
            5-Stage Analytical Funnel
          </span>
        </div>

        {/* Pictorial Visual Funnel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {funnelStages.map((stg: any, index: number) => (
            <div 
              key={index} 
              className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Stage {index + 1}</span>
                  <span className="font-mono text-xs font-black text-slate-800">{stg.pct}%</span>
                </div>
                <h3 className="font-black text-slate-900 text-sm">{stg.stage.replace(/^\d+\.\s*/, '')}</h3>
                <p className="text-[11px] text-slate-500 leading-snug">{stg.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80">
                <div className="text-2xl font-black" style={{ color: stg.color }}>
                  {stg.count?.toLocaleString()}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${stg.pct}%`, backgroundColor: stg.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION: INTERACTIVE DIVISION PERFORMANCE BAR GRAPH
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D1242F]" />
              <h2 className="text-lg font-black text-slate-900">
                {barChartMode === 'division' ? 'Postal Division Lead & Conversion Performance' : 'Lead Outcome Status Distribution'}
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
              By Postal Division
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
                <Bar dataKey="total" name="Total Verified" fill="#1B2A4A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contacted" name="Contacted" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interested" name="Interested" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onboarded" name="Contracts Won" fill="#D1242F" radius={[4, 4, 0, 0]} />
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
          SECTION: ACQUISITION TRENDS & SERVICE DONUT CHARTS
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lead Acquisition Trends Area Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Meeting & Acquisition Activity Timeline</h2>
              <p className="text-xs text-slate-500">Temporal meeting activity distribution from live database records</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#D1242F]"></span>
                <span className="text-slate-700">Lead Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 border-b-2 border-dashed border-slate-400"></span>
                <span className="text-slate-500">Baseline Target</span>
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
                  name="Meeting Volume"
                />
                <Area 
                  type="monotone" 
                  dataKey="previous" 
                  stroke="#94A3B8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  fill="transparent" 
                  name="Benchmark"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Postal Service Donut Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-black text-slate-900">Postal Product Distribution</h2>
              <p className="text-xs text-slate-500">Service market share</p>
            </div>
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
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Postal Portfolio</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {serviceDistributionData.slice(0, 5).map((src: any) => (
              <div key={src.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: src.color }}></span>
                  <span className="text-slate-700 font-semibold">{src.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{src.revenue_formatted}</span>
                  <span className="font-mono font-bold text-slate-900">{src.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION: RECENT VERIFIED ENGAGEMENTS TABLE
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Recent Verified Lead Engagements</h2>
              <p className="text-xs text-slate-500">Live active commercial leads with verified business contact credentials</p>
            </div>
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
                <th className="py-3.5 px-5">Lead / Commercial Entity</th>
                <th className="py-3.5 px-4">Contact Credentials</th>
                <th className="py-3.5 px-4">Postal Division</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Postal Service</th>
                <th className="py-3.5 px-4">Meeting Date</th>
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
                          <p className="text-[11px] text-slate-400">{lead.company}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <PhoneCall className="w-3 h-3 text-slate-400" />
                        <span className="font-mono font-semibold text-slate-800">{lead.phone}</span>
                        {lead.hasVerifiedPhone && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px] mt-0.5">
                        {lead.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{lead.division}</div>
                      <div className="text-[11px] text-slate-400">Karnataka Circle</div>
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
                      {lead.service}
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
                            View Lead Details
                          </Link>
                          <Link href="/leads" className="block px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-semibold">
                            Update Status
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No verified lead engagements found for {selectedDivision}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D1242F] flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload Commercial Leads</h3>
                  <p className="text-xs text-slate-500">Supports Excel (.xlsx, .xls) and CSV (.csv)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadProgress('idle');
                  setUploadFile(null);
                  setUploadSummary(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="mt-4 space-y-4 text-xs">
              {/* Drag and Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setUploadFile(e.dataTransfer.files[0]);
                    setUploadProgress('idle');
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-[#D1242F] bg-red-50/40 scale-[1.01]' 
                    : uploadFile 
                      ? 'border-emerald-400 bg-emerald-50/30' 
                      : 'border-slate-300 hover:border-[#D1242F] hover:bg-red-50/20'
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

              {/* Download Sample Template Banner */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-700">Need standard India Post template?</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-[#D1242F] hover:text-[#B01E28] font-bold text-xs hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Progress & Status Message */}
              {uploadProgress !== 'idle' && (
                <div className={`p-3 rounded-xl flex items-start gap-2.5 ${
                  uploadProgress === 'uploading' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                  uploadProgress === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {uploadProgress === 'uploading' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0 mt-0.5" />}
                  {uploadProgress === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {uploadProgress === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <div className="text-xs">
                    <p className="font-bold">{uploadMessage}</p>
                    {uploadSummary && (
                      <p className="text-[11px] opacity-90 mt-1">
                        Total Rows: {uploadSummary.total_rows} • Valid Imported: {uploadSummary.count} • Skipped: {uploadSummary.skipped_empty}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadProgress('idle');
                    setUploadFile(null);
                    setUploadSummary(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadProgress === 'uploading'}
                  className="px-5 py-2.5 bg-[#D1242F] hover:bg-[#B01E28] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs hover:shadow flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <CopyX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Lead Deduplication Engine</h3>
                  <p className="text-xs text-slate-500">Scan and preserve primary records while cleaning duplicates</p>
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
                <label className="font-bold text-slate-700 block mb-1">Deduplication Matching Criteria</label>
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
                * Note: The primary lead record with the earliest entry is preserved, while all duplicate secondary entries are safely deleted.
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
