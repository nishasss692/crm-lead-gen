'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Filter, 
  Search, 
  RotateCcw, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  X,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
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

export default function MarketingExecutiveDashboard() {
  // Analytics & Pincode Performance State
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    total_leads: 0,
    contact_pending: 0,
    contacted: 0,
    interested: 0,
    not_interested: 0,
    willing_to_onboard: 0,
    onboarded: 0,
    onboard_pending: 0
  });
  const [pincodes, setPincodes] = useState<PincodePerformanceItem[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [priorityLeads, setPriorityLeads] = useState<PriorityLead[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(true);
  const [isPincodesLoading, setIsPincodesLoading] = useState<boolean>(true);
  const [isPriorityLoading, setIsPriorityLoading] = useState<boolean>(true);

  // Quick Filters State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('All Divisions');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch 8 KPI Analytics from Backend GET /api/analytics
  const fetchAnalytics = useCallback(async (div = selectedDivision) => {
    setIsAnalyticsLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const queryParam = div && div !== 'All Divisions' ? `division_name=${encodeURIComponent(div)}&` : '';
      const res = await fetch(`http://localhost:8000/api/analytics?${queryParam}only_valid=false`, {
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
          onboard_pending: data.onboard_pending ?? 0
        });
      }
    } catch (err) {
      console.warn('Backend analytics fetch fallback:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [selectedDivision]);

  // 2. Fetch Pincode Leaderboard from Backend GET /api/analytics/pincodes
  const fetchPincodes = useCallback(async (div = selectedDivision) => {
    setIsPincodesLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const queryParam = div && div !== 'All Divisions' ? `division_name=${encodeURIComponent(div)}` : '';
      const res = await fetch(`http://localhost:8000/api/analytics/pincodes?${queryParam}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPincodes(data);
        }
      }
    } catch (err) {
      console.warn('Backend pincodes fetch fallback:', err);
    } finally {
      setIsPincodesLoading(false);
    }
  }, [selectedDivision]);

  // 3. Fetch Priority High-Probability Leads from Backend GET /api/leads/priority
  const fetchPriorityLeads = useCallback(async (div = selectedDivision) => {
    setIsPriorityLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const queryParam = div && div !== 'All Divisions' ? `division_name=${encodeURIComponent(div)}&limit=5` : 'limit=5';
      const res = await fetch(`http://localhost:8000/api/leads/priority?${queryParam}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPriorityLeads(data.slice(0, 5));
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
      const res = await fetch('http://localhost:8000/api/divisions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDivisions(data);
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

  // Filtered Pincodes based on status filter and search query
  const filteredPincodes = useMemo(() => {
    return pincodes.filter(item => {
      // 1. Search Query on Pincode or Post Office name
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const pinMatch = (item.pincode || '').toLowerCase().includes(q);
        const nameMatch = (item.office_name || '').toLowerCase().includes(q);
        if (!pinMatch && !nameMatch) return false;
      }

      // 2. Status Filter: Only show pincodes that have at least 1 lead with that status
      if (statusFilter === 'pending') {
        if ((item.pending ?? 0) <= 0) return false;
      } else if (statusFilter === 'contacted') {
        if ((item.contacted ?? 0) <= 0) return false;
      } else if (statusFilter === 'followup') {
        if ((item.follow_up_required ?? 0) <= 0) return false;
      } else if (statusFilter === 'positive') {
        if ((item.interested ?? 0) <= 0) return false;
      } else if (statusFilter === 'not_interested') {
        if ((item.not_interested ?? 0) <= 0) return false;
      } else if (statusFilter === 'willing_to_onboard') {
        if ((item.willing_to_onboard ?? 0) <= 0) return false;
      } else if (statusFilter === 'onboarded') {
        if ((item.onboarded ?? 0) <= 0) return false;
      }

      return true;
    });
  }, [pincodes, searchQuery, statusFilter]);

  // Top 10 Pincodes for BarChart Visualization
  const chartData = useMemo(() => {
    return filteredPincodes.slice(0, 10).map(p => {
      let value = p.total ?? p.total_leads ?? 0;
      if (statusFilter === 'pending') value = p.pending ?? 0;
      else if (statusFilter === 'contacted') value = p.contacted ?? 0;
      else if (statusFilter === 'followup') value = p.follow_up_required ?? 0;
      else if (statusFilter === 'positive') value = p.interested ?? 0;
      else if (statusFilter === 'not_interested') value = p.not_interested ?? 0;
      else if (statusFilter === 'willing_to_onboard') value = p.willing_to_onboard ?? 0;
      else if (statusFilter === 'onboarded') value = p.onboarded ?? 0;

      return {
        pincode: p.pincode,
        total: value,
        office_name: p.office_name || ''
      };
    });
  }, [filteredPincodes, statusFilter]);

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

  // The 8 KPI Cards configuration matching exact reference styling & border rules
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in-up select-none">
      
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
          SECTION 2: PIPELINE QUICK FILTERS (NO EMOJIS, CLEAN UI)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        
        {/* Header with Title, Matching Counts, and Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D1242F] flex items-center justify-center font-bold">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pipeline Quick Filters
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Real-time filtering across lead disposition status, territory division, and search terms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              Showing <strong className="text-slate-900 font-bold">{filteredPincodes.length}</strong> pincode territories
            </span>
            {(statusFilter !== 'all' || selectedDivision !== 'All Divisions' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSelectedDivision('All Divisions');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Interactive Filter Controls Grid (Status, Division, Search) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          
          {/* Dropdown 1: Filter by Lead Status */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Meeting Outcome / Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-300 focus:border-[#D1242F] focus:ring-2 focus:ring-red-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition-colors cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Action Pending (Uncontacted)</option>
                <option value="contacted">Contacted</option>
                <option value="followup">Follow-up Scheduled</option>
                <option value="positive">Positive / Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="willing_to_onboard">Willing to Onboard</option>
                <option value="onboarded">Onboarded (Contract Won)</option>
              </select>
            </div>
          </div>

          {/* Dropdown 2: Filter by Postal Division */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Territory Division
            </label>
            <div className="relative">
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-300 focus:border-[#D1242F] focus:ring-2 focus:ring-red-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition-colors cursor-pointer shadow-2xs"
              >
                <option value="All Divisions">All Divisions</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input: Pincode or Post Office name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Search Pincode / Post Office
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PIN (e.g. 570001) or Post Office name..."
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-[#D1242F] focus:ring-2 focus:ring-red-100 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Quick Filter Status Pills (Clean Text, No Emojis) */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto flex-wrap border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
            Quick Status:
          </span>
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'pending', label: 'Action Pending' },
            { id: 'contacted', label: 'Contacted' },
            { id: 'followup', label: 'Follow-up' },
            { id: 'positive', label: 'Positive' },
            { id: 'not_interested', label: 'Not Interested' },
            { id: 'willing_to_onboard', label: 'Willing to Onboard' },
            { id: 'onboarded', label: 'Onboarded' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-[#114b79] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2.5: PRIORITY FOLLOW-UPS (AI PREDICTIVE WIN SCORING)
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
          SECTION 3: PINCODE PERFORMANCE ANALYTICS & DATA VISUALIZATION
         ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        
        {/* TASK 1: White Card Titled "Top Pincodes by Volume" with Recharts BarChart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[#1e3a8a]">
                Top Pincodes by Volume
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Total commercial lead volume per territory {selectedDivision !== 'All Divisions' ? `in ${selectedDivision}` : 'across Circle'}
              </p>
            </div>
            <span className="bg-blue-50 text-[#1e3a8a] text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
              Top {chartData.length} Territories
            </span>
          </div>

          <div className="w-full h-72 sm:h-80">
            {isPincodesLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                <div className="w-5 h-5 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading chart visualization...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                No pincode volume data available for the selected filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="pincode" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    dy={8}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
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
                    name="Leads" 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* TASK 2: White Card with "Pincode performance" Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header with Subhead, Main Heading, and Export Button */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                GEOGRAPHY
              </span>
              <h2 className="text-2xl font-bold font-serif text-[#1e3a8a] mt-0.5">
                Pincode performance
              </h2>
            </div>
            <button 
              onClick={handleExportPincodesCSV}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors cursor-pointer shrink-0 shadow-sm inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
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

    </div>
  );
}
