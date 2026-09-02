'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, 
  MapPin,
  Sparkles, 
  Download, 
  Search, 
  X, 
  RefreshCw, 
  Filter, 
  PieChart as PieChartIcon, 
  BarChart3,
  TrendingUp,
  Target,
  PhoneCall,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Percent,
  Layers
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  total_leads: number;
  contact_pending: number;
  contacted: number;
  interested: number;
  not_interested: number;
  willing_to_onboard: number;
  onboarded: number;
  onboard_pending: number;
  follow_up?: number;
  pipeline_value?: string;
  pipeline_raw?: number;
  contacted_rate?: number;
  onboarding_rate?: number;
  data_health?: {
    score?: number;
    contact_completeness_pct?: number;
  };
  service_distribution?: Array<{
    name: string;
    count: number;
    value: number;
    revenue?: number;
    revenue_formatted?: string;
    color?: string;
  }>;
  outcome_breakdown?: Array<{
    name: string;
    label: string;
    status: string;
    count: number;
    color: string;
    pct: number;
  }>;
}

interface PincodePerformanceItem {
  pincode: string;
  office_name?: string;
  total?: number;
  total_leads?: number;
  pending?: number;
  contacted?: number;
  interested?: number;
  not_interested?: number;
  follow_up_required?: number;
  willing_to_onboard?: number;
  not_willing_to_onboard?: number;
  onboarded?: number;
  onboarded_count?: number;
  division?: string;
}

interface PriorityLead {
  id: number;
  exporter_name?: string;
  exporterName?: string;
  address?: string;
  pincode?: string;
  division?: string;
  contact_number?: string;
  contactNumber?: string;
  service_using?: string;
  serviceUsing?: string;
  monthly_volume?: string | number;
  monthlyVolume?: string | number;
  meeting_outcome?: string;
  meetingOutcome?: string;
  contract_id?: string;
  contractId?: string;
  win_probability?: number;
  winProbability?: number;
}

// 8 Distinct, harmonious colors for the lead stages
const STAGE_COLORS = {
  'Contact Pending': '#E11D48',       // Rose Red
  'Contacted': '#2563EB',             // Royal Blue
  'Interested': '#0284C7',            // Sky Blue
  'Not Interested': '#94A3B8',        // Slate Gray
  'Willing to Onboard': '#0D9488',    // Emerald Teal
  'Onboarded': '#D1242F',             // India Post Crimson
  'Onboard Pending': '#F59E0B',       // Warm Amber
  'Follow-up Required': '#EA580C'     // Vivid Orange
};

const SERVICE_PALETTE = [
  '#D1242F', '#1B2A4A', '#F7941D', '#0284C7', '#10B981', '#8B5CF6', '#EC4899', '#64748B'
];

export default function MarketingExecutiveDashboard() {
  // User Authentication & Role State
  const [user, setUser] = useState<{
    employee_id?: string;
    username?: string;
    role?: string;
    assigned_division?: string;
    division?: string;
    assigned_region?: string;
    region?: string;
  } | null>(null);

  // Analytics & Data State
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    total_leads: 0,
    contact_pending: 0,
    contacted: 0,
    interested: 0,
    not_interested: 0,
    willing_to_onboard: 0,
    onboarded: 0,
    onboard_pending: 0,
    follow_up: 0,
    pipeline_value: '₹ 0',
    service_distribution: [],
    outcome_breakdown: []
  });
  const [pincodes, setPincodes] = useState<PincodePerformanceItem[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [priorityLeads, setPriorityLeads] = useState<PriorityLead[]>([]);
  
  // Loading States
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(true);
  const [isPincodesLoading, setIsPincodesLoading] = useState<boolean>(true);
  const [isPriorityLoading, setIsPriorityLoading] = useState<boolean>(true);

  // Territory & Table Filters
  const [selectedDivision, setSelectedDivision] = useState<string>('All Divisions');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [chartViewMode, setChartViewMode] = useState<'stage' | 'service'>('stage');

  // Load User from LocalStorage
  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        const roleClean = String(u.role || '').toUpperCase();
        if (['DO', 'DIVISION', 'ME', 'DIV'].includes(roleClean)) {
          const userDiv = u.assigned_division || u.division;
          if (userDiv) {
            setSelectedDivision(userDiv);
          }
        }
      } catch (e) {}
    }
  }, []);

  // 1. Fetch 8 KPI Analytics & Visual Distributions from Backend GET /api/analytics
  const fetchAnalytics = useCallback(async (div = selectedDivision) => {
    setIsAnalyticsLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const queryParam = div && div !== 'All Divisions' ? `division_name=${encodeURIComponent(div)}&` : '';
      const res = await fetch(`${API_BASE_URL}/api/analytics?${queryParam}only_valid=false`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics({
          total_leads: data.total_leads ?? 0,
          contact_pending: data.contact_pending ?? 0,
          contacted: data.contacted ?? 0,
          interested: data.interested ?? 0,
          not_interested: data.not_interested ?? 0,
          willing_to_onboard: data.willing_to_onboard ?? 0,
          onboarded: data.onboarded ?? 0,
          onboard_pending: data.onboard_pending ?? 0,
          follow_up: data.follow_up ?? 0,
          pipeline_value: data.pipeline_value ?? '₹ 0',
          pipeline_raw: data.pipeline_raw ?? 0,
          contacted_rate: data.contacted_rate ?? 0,
          onboarding_rate: data.onboarding_rate ?? 0,
          data_health: data.data_health ?? {},
          service_distribution: data.service_distribution ?? [],
          outcome_breakdown: data.outcome_breakdown ?? []
        });
      }
    } catch (err) {
      console.warn('Backend analytics fetch fallback:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [selectedDivision]);

  // 2. Fetch Pincode Leaderboard from Backend GET /api/analytics/pincodes (Unique Pincodes)
  const fetchPincodes = useCallback(async (div = selectedDivision) => {
    setIsPincodesLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const queryParam = div && div !== 'All Divisions' ? `division_name=${encodeURIComponent(div)}` : '';
      const res = await fetch(`${API_BASE_URL}/api/analytics/pincodes?${queryParam}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Remove duplicate pincode entries if any exist
          const seen = new Set<string>();
          const uniqueList: PincodePerformanceItem[] = [];
          for (const item of data) {
            const key = item.pincode ? String(item.pincode).trim() : '';
            if (key && !seen.has(key)) {
              seen.add(key);
              uniqueList.push(item);
            }
          }
          setPincodes(uniqueList);
        }
      }
    } catch (err) {
      console.warn('Backend pincodes fetch fallback:', err);
    } finally {
      setIsPincodesLoading(false);
    }
  }, [selectedDivision]);

  // 3. Fetch Priority High-Probability Leads from Backend GET /api/leads/priority (Unique Entities)
  const fetchPriorityLeads = useCallback(async (div = selectedDivision) => {
    setIsPriorityLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const queryParam = div && div !== 'All Divisions' ? `division_name=${encodeURIComponent(div)}&limit=10` : 'limit=10';
      const res = await fetch(`${API_BASE_URL}/api/leads/priority?${queryParam}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter unique entities to eliminate any duplicate prospect rows
          const seenNames = new Set<string>();
          const uniqueLeads: PriorityLead[] = [];
          for (const lead of data) {
            const name = (lead.exporter_name || lead.exporterName || '').toLowerCase().trim();
            const id = lead.id;
            const key = name || `id_${id}`;
            if (!seenNames.has(key)) {
              seenNames.add(key);
              uniqueLeads.push(lead);
            }
            if (uniqueLeads.length === 5) break;
          }
          setPriorityLeads(uniqueLeads);
        }
      }
    } catch (err) {
      console.warn('Backend priority leads fetch fallback:', err);
    } finally {
      setIsPriorityLoading(false);
    }
  }, [selectedDivision]);

  // 4. Fetch Divisions from Backend GET /api/divisions
  const fetchDivisions = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/divisions`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const uniqueDivs = Array.from(new Set(data.map((d: string) => d.trim()).filter(Boolean)));
          setDivisions(uniqueDivs);
          
          const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (userStr) {
            try {
              const u = JSON.parse(userStr);
              const roleClean = String(u.role || '').toUpperCase();
              if (['DO', 'DIVISION', 'ME', 'DIV'].includes(roleClean)) {
                const userDiv = u.assigned_division || u.division || uniqueDivs[0];
                if (userDiv) {
                  setSelectedDivision(userDiv);
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn('Backend divisions fetch fallback:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  // Reload Analytics, Pincodes & Priority Leads on Division Change
  useEffect(() => {
    fetchAnalytics(selectedDivision);
    fetchPincodes(selectedDivision);
    fetchPriorityLeads(selectedDivision);
  }, [selectedDivision, fetchAnalytics, fetchPincodes, fetchPriorityLeads]);

  // Refresh all dashboard data
  const handleRefreshAll = () => {
    fetchDivisions();
    fetchAnalytics(selectedDivision);
    fetchPincodes(selectedDivision);
    fetchPriorityLeads(selectedDivision);
  };

  // ═══════════════════════════════════════════════════════════════
  // TOP CONVERSION & PERFORMANCE FACTORS COMPUTATION
  // ═══════════════════════════════════════════════════════════════
  const totalLeadsCount = analytics.total_leads || 0;
  const contactedCount = analytics.contacted || 0;
  const onboardedCount = analytics.onboarded || 0;
  const interestedCount = analytics.interested || 0;
  const willingCount = analytics.willing_to_onboard || 0;

  // 1. Overall Conversion Rate (Won Deals / Total Leads)
  const winConversionRate = totalLeadsCount > 0 
    ? ((onboardedCount / totalLeadsCount) * 100).toFixed(1) 
    : '0.0';

  // 2. Outreach / Contact Coverage Rate
  const contactRate = totalLeadsCount > 0 
    ? ((contactedCount / totalLeadsCount) * 100).toFixed(1) 
    : '0.0';

  // 3. Lead Qualification (Positive Interest) Rate from Contacted Inquiries
  const qualificationRate = contactedCount > 0 
    ? (((interestedCount + willingCount) / contactedCount) * 100).toFixed(1) 
    : '0.0';

  // ═══════════════════════════════════════════════════════════════
  // STAGE & SERVICE PIE CHART DATA ENGINE
  // ═══════════════════════════════════════════════════════════════
  const pieStageData = useMemo(() => {
    if (totalLeadsCount === 0) return [];

    if (chartViewMode === 'service') {
      if (analytics.service_distribution && analytics.service_distribution.length > 0) {
        return analytics.service_distribution.map((item, idx) => ({
          name: item.name,
          value: item.count,
          percentage: item.value,
          revenueFormatted: item.revenue_formatted,
          color: item.color || SERVICE_PALETTE[idx % SERVICE_PALETTE.length]
        }));
      }
      return [];
    }

    // Lead Stages List
    const stages = [
      { name: 'Contact Pending', count: analytics.contact_pending, color: STAGE_COLORS['Contact Pending'] },
      { name: 'Contacted', count: analytics.contacted, color: STAGE_COLORS['Contacted'] },
      { name: 'Interested', count: analytics.interested, color: STAGE_COLORS['Interested'] },
      { name: 'Not Interested', count: analytics.not_interested, color: STAGE_COLORS['Not Interested'] },
      { name: 'Willing to Onboard', count: analytics.willing_to_onboard, color: STAGE_COLORS['Willing to Onboard'] },
      { name: 'Onboarded', count: analytics.onboarded, color: STAGE_COLORS['Onboarded'] },
      { name: 'Onboard Pending', count: analytics.onboard_pending, color: STAGE_COLORS['Onboard Pending'] },
      { name: 'Follow-up Required', count: analytics.follow_up || 0, color: STAGE_COLORS['Follow-up Required'] }
    ];

    const sumVal = stages.reduce((acc, k) => acc + k.count, 0);
    if (sumVal === 0) return [];
    const denominator = sumVal;

    return stages.map(st => ({
      name: st.name,
      value: st.count,
      percentage: Number(((st.count / denominator) * 100).toFixed(1)),
      color: st.color
    }));
  }, [chartViewMode, analytics, totalLeadsCount]);

  // Top 10 Unique Pincodes for BarChart Visualization
  const topPincodesChartData = useMemo(() => {
    return pincodes.slice(0, 10).map(p => ({
      pincode: p.pincode,
      total: p.total ?? p.total_leads ?? 0,
      office_name: p.office_name || ''
    }));
  }, [pincodes]);

  // Filtered Pincodes for the bottom table based on search
  const filteredPincodes = useMemo(() => {
    if (!tableSearchQuery.trim()) return pincodes;
    const q = tableSearchQuery.toLowerCase().trim();
    return pincodes.filter(item => {
      const pinMatch = (item.pincode || '').toLowerCase().includes(q);
      const nameMatch = (item.office_name || '').toLowerCase().includes(q);
      return pinMatch || nameMatch;
    });
  }, [pincodes, tableSearchQuery]);

  // Export Pincode Performance CSV
  const handleExportPincodesCSV = () => {
    const recordsToExport = filteredPincodes.length > 0 ? filteredPincodes : pincodes;
    if (!recordsToExport || recordsToExport.length === 0) return;
    
    const headers = [
      "PINCODE", "POST OFFICE", "TOTAL", "PENDING", "CONTACTED", 
      "INTERESTED", "NOT INTERESTED", "FOLLOW-UP REQUIRED", 
      "WILLING TO ONBOARD", "NOT WILLING TO ONBOARD", "ONBOARDED"
    ].join(',');

    const rows = recordsToExport.map(p => [
      `"${p.pincode}"`,
      `"${(p.office_name || '#N/A').replace(/"/g, '""')}"`,
      p.total ?? p.total_leads ?? 0,
      p.pending ?? 0,
      p.contacted ?? 0,
      p.interested ?? 0,
      p.not_interested ?? 0,
      p.follow_up_required ?? 0,
      p.willing_to_onboard ?? 0,
      p.not_willing_to_onboard ?? 0,
      p.onboarded ?? 0
    ].join(',')).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pincode_performance_${selectedDivision.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // The 8 KPI Cards configuration
  const kpiCards = [
    {
      title: 'Total leads',
      value: analytics.total_leads,
      borderClass: 'border-t-4 border-t-red-600'
    },
    {
      title: 'Contact pending',
      value: analytics.contact_pending,
      borderClass: 'border-t-4 border-t-red-600'
    },
    {
      title: 'Contacted',
      value: analytics.contacted,
      borderClass: 'border-t-4 border-t-blue-600'
    },
    {
      title: 'Interested',
      value: analytics.interested,
      borderClass: 'border-t-4 border-t-blue-600'
    },
    {
      title: 'Not interested',
      value: analytics.not_interested,
      borderClass: 'border-t-4 border-t-slate-400'
    },
    {
      title: 'Willing to onboard',
      value: analytics.willing_to_onboard,
      borderClass: 'border-t-4 border-t-red-500'
    },
    {
      title: 'Onboarded',
      value: analytics.onboarded,
      borderClass: 'border-t-4 border-t-red-500'
    },
    {
      title: 'Onboard pending',
      value: analytics.onboard_pending,
      borderClass: 'border-t-4 border-t-red-500'
    }
  ];

  const userRole = String(user?.role || 'CO').toUpperCase();
  const isDO = ['DO', 'DIVISION', 'DIV'].includes(userRole);
  const isRO = userRole === 'RO';
  const isME = userRole === 'ME';
  const isCO = userRole === 'CO' || (!isDO && !isRO && !isME);

  const roleTitle = isCO 
    ? 'Central Office (CO) Operations & Commercial Analytics' 
    : isRO 
    ? 'Regional Office (RO) Operations & Territory Analytics' 
    : isDO 
    ? 'Divisional Office (DO) Commercial Operations' 
    : 'Marketing Executive (ME) Field Analytics';

  const roleSubtitle = isCO 
    ? 'Pipeline metrics, territory performance & predictive scoring across Karnataka Circle (All 34 Divisions).' 
    : isRO 
    ? `Regional pipeline metrics, territory performance & predictive scoring across ${user?.assigned_region || 'Regional Jurisdiction'}.` 
    : `Divisional pipeline metrics, territory performance & predictive scoring for ${user?.assigned_division || selectedDivision || 'Assigned'} Division.`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in-up select-none">
      
      {/* ═══════════════════════════════════════════════════════════════
          DASHBOARD TOP CONTROL BAR & DIVISION SELECTOR
         ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D1242F] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {roleTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {roleSubtitle}
            </p>
          </div>
        </div>

        {/* Division Filter Dropdown & Refresh */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-2"
            >
              {isRO ? (
                <option value="All Divisions">All Regional Divisions ({user?.assigned_region || 'Region'})</option>
              ) : isDO || isME ? (
                divisions.length <= 1 ? (
                  <option value={divisions[0] || selectedDivision}>{divisions[0] || selectedDivision} Division (Assigned Territory)</option>
                ) : (
                  <option value="All Divisions">All Assigned Divisions</option>
                )
              ) : (
                <option value="All Divisions">All Divisions (Circle-wide)</option>
              )}
              {(!isDO && !isME) && divisions.map((div) => (
                <option key={div} value={div}>
                  {div} Division
                </option>
              ))}
              {(isDO || isME) && divisions.length > 1 && divisions.map((div) => (
                <option key={div} value={div}>
                  {div} Division
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefreshAll}
            title="Refresh All Metrics"
            className="p-2 text-slate-600 hover:text-[#D1242F] hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyticsLoading || isPincodesLoading ? 'animate-spin text-[#D1242F]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONVERSION RATE & EXECUTIVE PERFORMANCE FACTORS (ABOVE KPIS)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Factor 1: Onboarding Conversion Rate */}
        <div className="bg-gradient-to-br from-white to-red-50/40 border border-red-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Conversion Rate
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#D1242F] tracking-tight">
                {isAnalyticsLoading ? '...' : `${winConversionRate}%`}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                Won Leads
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {onboardedCount.toLocaleString()} contracted contracts
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100/60 text-[#D1242F] flex items-center justify-center font-black shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Factor 2: Outreach / Contact Coverage */}
        <div className="bg-gradient-to-br from-white to-blue-50/40 border border-blue-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Contact Outreach
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                {isAnalyticsLoading ? '...' : `${contactRate}%`}
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">
                Engaged
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {contactedCount.toLocaleString()} commercial meetings held
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-blue-700 flex items-center justify-center font-black shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        {/* Factor 3: Lead Qualification Rate */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Qualification Rate
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                {isAnalyticsLoading ? '...' : `${qualificationRate}%`}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                Positive
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {(interestedCount + willingCount).toLocaleString()} interested/willing leads
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center font-black shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Factor 4: Estimated Pipeline Revenue */}
        <div className="bg-gradient-to-br from-white to-amber-50/40 border border-amber-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pipeline Valuation
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#1B2A4A] tracking-tight">
                {isAnalyticsLoading ? '...' : analytics.pipeline_value}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Estimated annual corporate value
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center font-black shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: THE 8 KPI GRID (BACKEND POWERED)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
        {kpiCards.map((kpi, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-xl shadow-sm p-4 ${kpi.borderClass} flex flex-col justify-between hover:shadow-md transition-all`}
          >
            <span className="text-slate-500 font-medium text-sm truncate" title={kpi.title}>
              {kpi.title}
            </span>
            <div className="text-slate-800 text-3xl font-bold mt-2">
              {isAnalyticsLoading ? (
                <span className="text-slate-300 text-2xl animate-pulse">...</span>
              ) : (
                kpi.value.toLocaleString()
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: SIDE-BY-SIDE ANALYTICS (BAR GRAPH & PIE CHART)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. LEFT CARD: Top Pincodes by Volume (BAR GRAPH) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1e3a8a]">
                  Top Pincodes by Lead Volume
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Highest commercial volume territories {selectedDivision !== 'All Divisions' ? `in ${selectedDivision}` : 'across Circle'}
                </p>
              </div>
            </div>
            <span className="bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3 py-1 rounded-full border border-blue-100 shrink-0">
              Top {topPincodesChartData.length} PINs
            </span>
          </div>

          <div className="w-full h-72">
            {isPincodesLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                <div className="w-5 h-5 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading territory bar chart...
              </div>
            ) : topPincodesChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                No pincode volume records available for the selected territory.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPincodesChartData} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="pincode" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    dy={8}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '0.75rem', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${Number(value).toLocaleString()} leads`, 
                      item?.payload?.office_name ? item.payload.office_name : 'Volume'
                    ]}
                    labelFormatter={(label) => `PIN: ${label}`}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#1e3a8a" 
                    radius={[6, 6, 0, 0]} 
                    name="Commercial Leads" 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Unique Territories Indexed: <strong className="text-slate-800 font-bold">{pincodes.length}</strong></span>
            <span className="text-[11px] text-slate-400">Pincode Leaderboard</span>
          </div>
        </div>

        {/* 2. RIGHT CARD: SPACIOUS PIE / DONUT CHART WITH ELEGANT SIDE LEGEND */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          
          {/* Card Header with Professional Terminology */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D1242F] flex items-center justify-center font-bold">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {chartViewMode === 'stage' ? 'Lead Lifecycle Breakdown' : 'Postal Service Distribution'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {chartViewMode === 'stage' 
                    ? 'Active volume & conversion status across engagement stages' 
                    : 'Revenue and volume share by service line'}
                </p>
              </div>
            </div>

            {/* Toggle view between Pipeline Stages and Service Lines */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setChartViewMode('stage')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartViewMode === 'stage'
                    ? 'bg-white text-[#D1242F] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lead Stages
              </button>
              <button
                onClick={() => setChartViewMode('service')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartViewMode === 'service'
                    ? 'bg-white text-[#D1242F] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Services
              </button>
            </div>
          </div>

          {/* Spacious Layout: Donut Chart on Left, Clean 2-Column Legend on Right */}
          <div className="w-full h-72">
            {isAnalyticsLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                <div className="w-5 h-5 border-2 border-[#D1242F] border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading lifecycle breakdown...
              </div>
            ) : pieStageData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                No records found for chart calculation.
              </div>
            ) : (
              <div className="h-full flex flex-col sm:flex-row items-center gap-4">
                
                {/* Left: Donut Chart */}
                <div className="w-full sm:w-5/12 h-44 sm:h-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieStageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieStageData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '0.75rem',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                        formatter={(value: any, name: any, item: any) => [
                          `${Number(value).toLocaleString()} leads (${item?.payload?.percentage ?? 0}%)`,
                          item?.payload?.revenueFormatted ? `${name} [Est: ${item.payload.revenueFormatted}]` : name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Right: Clean, Spacious 2-Column Stage Legend Grid */}
                <div className="w-full sm:w-7/12 grid grid-cols-2 gap-2 overflow-y-auto max-h-64 pr-1">
                  {pieStageData.map((item, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/70 rounded-xl p-2 flex items-center justify-between transition-colors shadow-2xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span 
                          className="text-[11px] font-bold text-slate-700 truncate group-hover:text-slate-900" 
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-black text-slate-900 tabular-nums">
                          {Number(item.value).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block -mt-0.5">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">
              Total Pipeline Volume: <strong className="text-slate-800 font-bold">{totalLeadsCount.toLocaleString()} leads</strong>
            </span>
            <span className="text-[11px] text-slate-400">Live Stage Distribution</span>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: PRIORITY FOLLOW-UPS (AI PREDICTIVE WIN SCORING)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D1242F] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-[#D1242F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Priority Follow-ups
                </h2>
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                  AI Ranked
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Top high-priority prospective leads ordered by predicted win probability {selectedDivision !== 'All Divisions' ? `in ${selectedDivision}` : 'across Circle'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              Top <strong className="text-slate-900 font-bold">{priorityLeads.length}</strong> Target Opportunities
            </span>
          </div>
        </div>

        {isPriorityLoading ? (
          <div className="py-8 flex items-center justify-center text-slate-400 text-xs font-medium">
            <div className="w-5 h-5 border-2 border-[#114b79] border-t-transparent rounded-full animate-spin mr-2"></div>
            <span>Loading priority AI recommendations...</span>
          </div>
        ) : priorityLeads.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No priority follow-up recommendations available for the selected division.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
            {priorityLeads.map((lead, idx) => {
              const name = lead.exporter_name || lead.exporterName || 'Commercial Prospect';
              const rawVol = lead.monthly_volume ?? lead.monthlyVolume;
              const volume = rawVol !== null && rawVol !== undefined && rawVol !== '' ? `${Number(rawVol).toLocaleString()} pcs/mo` : '0 pcs/mo';
              const rawScore = lead.win_probability ?? lead.winProbability ?? 0;
              const score = typeof rawScore === 'number' ? rawScore : parseFloat(String(rawScore)) || 0;
              const service = lead.service_using || lead.serviceUsing || 'Speed Post';
              const division = lead.division || '';

              let badgeClasses = 'bg-slate-100 text-slate-600';
              if (score >= 75) {
                badgeClasses = 'bg-emerald-100 text-emerald-800';
              } else if (score >= 40) {
                badgeClasses = 'bg-amber-100 text-amber-800';
              }

              return (
                <div
                  key={lead.id || idx}
                  className="bg-slate-50/60 hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-4 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center shadow-2xs">
                        #{idx + 1}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClasses}`}>
                        <span>{score.toFixed(1)}%</span>
                        <span className="text-[10px] font-semibold opacity-75">Win</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-700 text-sm tracking-tight leading-snug line-clamp-2 transition-colors" title={name}>
                        {name}
                      </h3>
                      {lead.address && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5" title={lead.address}>
                          {lead.address}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Monthly Vol:</span>
                        <span className="font-bold text-slate-800 tabular-nums">{volume}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Service:</span>
                        <span className="font-semibold text-slate-600 truncate max-w-[100px]" title={service}>{service}</span>
                      </div>
                      {division && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Division:</span>
                          <span className="font-semibold text-slate-500 truncate max-w-[100px]" title={division}>{division}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lead.contact_number && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[10px] font-medium">Phone:</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{lead.contact_number}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: PINCODE PERFORMANCE TABLE & LEADERBOARD
         ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Card Header with Search and Export Button */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
              GEOGRAPHY LEADERBOARD
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#1e3a8a] mt-0.5">
              Pincode Performance
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                placeholder="Search PIN or Post Office..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#D1242F] focus:ring-2 focus:ring-red-100 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {tableSearchQuery && (
                <button 
                  onClick={() => setTableSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button 
              onClick={handleExportPincodesCSV}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-sm inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto max-h-[550px] relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#114b79] text-white text-xs font-bold uppercase tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th scope="col" className="py-3.5 px-6 whitespace-nowrap">PINCODE / PO</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">TOTAL</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">PENDING</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">CONTACTED</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">INTERESTED</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">NOT INTERESTED</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">FOLLOW-UP REQUIRED</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">WILLING TO ONBOARD</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">NOT WILLING TO ONBOARD</th>
                <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">ONBOARDED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isPincodesLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#114b79] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading pincode performance records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPincodes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No pincode performance data found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPincodes.map((item, idx) => (
                  <tr 
                    key={item.pincode || idx} 
                    className="border-b border-gray-100 odd:bg-white even:bg-gray-50/60 hover:bg-blue-50/20 transition-colors"
                  >
                    {/* Pincode & Post Office Name underneath */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm font-mono leading-tight">
                        {item.pincode}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 font-sans">
                        {item.office_name || '#N/A'}
                      </div>
                    </td>

                    {/* TOTAL */}
                    <td className="py-3.5 px-3 text-center font-bold text-gray-900">
                      {item.total ?? item.total_leads ?? 0}
                    </td>

                    {/* PENDING */}
                    <td className="py-3.5 px-3 text-center text-amber-700 font-semibold">
                      {item.pending ?? 0}
                    </td>

                    {/* CONTACTED */}
                    <td className="py-3.5 px-3 text-center text-blue-700 font-semibold">
                      {item.contacted ?? 0}
                    </td>

                    {/* INTERESTED */}
                    <td className="py-3.5 px-3 text-center text-emerald-700 font-semibold">
                      {item.interested ?? 0}
                    </td>

                    {/* NOT INTERESTED */}
                    <td className="py-3.5 px-3 text-center text-rose-700 font-semibold">
                      {item.not_interested ?? 0}
                    </td>

                    {/* FOLLOW-UP REQUIRED */}
                    <td className="py-3.5 px-3 text-center text-orange-700 font-semibold">
                      {item.follow_up_required ?? 0}
                    </td>

                    {/* WILLING TO ONBOARD */}
                    <td className="py-3.5 px-3 text-center text-teal-700 font-semibold">
                      {item.willing_to_onboard ?? 0}
                    </td>

                    {/* NOT WILLING TO ONBOARD */}
                    <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">
                      {item.not_willing_to_onboard ?? 0}
                    </td>

                    {/* ONBOARDED */}
                    <td className="py-3.5 px-3 text-center text-purple-700 font-bold">
                      {item.onboarded ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
