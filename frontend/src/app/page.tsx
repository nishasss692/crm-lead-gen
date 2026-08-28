'use client';
import React, { useState, useEffect, useRef } from 'react';
import LeadsTable, { Lead } from './components/LeadsTable';
import PincodePerformanceTable from './components/PincodePerformanceTable';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
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
  MapPin,
  Mail,
  AlertCircle
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
}

export default function Dashboard() {
  const [selectedDivision, setSelectedDivision] = useState('');
  const [divisions, setDivisions] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDivisions = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/divisions');
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
      const res = await fetch('http://localhost:8000/api/leads');
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
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  useEffect(() => {
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
      const res = await fetch('http://localhost:8000/api/upload-excel', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchDivisions();
        fetchLeads();
        fetchAnalytics(selectedDivision);
        // Reset file input
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

  const priorityFollowUps = filteredLeads
    .filter(lead => (lead.meetingOutcome || '').toLowerCase() === 'followup' || ((lead.meetingOutcome || '').toLowerCase() === 'positive' && !lead.contractId))
    .slice(0, 5);

  const pieData = analytics ? [
    { name: 'Interested', value: analytics.interested, color: '#10b981' }, // emerald
    { name: 'Follow-up', value: analytics.follow_up, color: '#8b5cf6' }, // violet
    { name: 'Not Interested', value: analytics.not_interested, color: '#f43f5e' }, // rose
    { name: 'Contact Pending', value: analytics.contact_pending, color: '#fbbf24' }, // amber
    { name: 'Onboarded', value: analytics.onboarded, color: '#14b8a6' }, // teal
  ].filter(item => item.value > 0) : [];

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#113254]/20 selection:text-[#113254] pb-20">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-slate-200/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-red-100/30 blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#113254] tracking-tight">
              Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d1242f] to-rose-500">Dashboard</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-xl text-lg">
              Monitor your lead pipeline, track conversion rates, and manage high-priority follow-ups in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/80 p-3 rounded-2xl border border-white backdrop-blur-xl shadow-sm">
            <div className="relative group">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#113254] group-focus-within:text-[#d1242f] transition-colors" />
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#113254]/30 transition-all appearance-none min-w-[200px] cursor-pointer"
              >
                <option value="">All Divisions</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

            <div className="relative">
              <input type="file" accept=".xls,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#d1242f] hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {uploading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                )}
                <span>{uploading ? 'Processing...' : 'Upload Excel'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Pipeline Health (High-level Rates) */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-[#113254] to-[#0a1e33] rounded-3xl p-8 text-white shadow-xl shadow-[#113254]/20 relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700" />
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold backdrop-blur-md mb-6">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> Pipeline Health
                </div>
                <h2 className="text-5xl font-bold tracking-tight mb-2">
                  {analytics.total_leads}
                </h2>
                <p className="text-slate-300 font-medium text-lg">Total Pipeline Leads</p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Contacted Rate</p>
                  <p className="text-2xl font-bold text-white">{analytics.contacted_rate}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Onboarding Rate</p>
                  <p className="text-2xl font-bold text-white">{analytics.onboarding_rate}%</p>
                </div>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard title="Contact Pending" value={analytics.contact_pending} icon={<PhoneCall className="w-5 h-5 text-amber-500" />} color="amber" />
              <MetricCard title="Contacted" value={analytics.contacted} icon={<Users className="w-5 h-5 text-sky-500" />} color="sky" />
              <MetricCard title="Interested" value={analytics.interested} icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} color="emerald" />
              
              <MetricCard title="Follow-up Required" value={analytics.follow_up} icon={<Clock className="w-5 h-5 text-violet-500" />} color="violet" />
              <MetricCard title="Willing to Onboard" value={analytics.willing_to_onboard} icon={<Building2 className="w-5 h-5 text-blue-500" />} color="blue" />
              <MetricCard title="Onboarded" value={analytics.onboarded} icon={<CheckCircle2 className="w-5 h-5 text-teal-500" />} color="teal" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Distribution Pie Chart */}
          {analytics && (
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#d1242f]" />
                  Status Distribution
                </h3>
              </div>
              
              <div className="flex-1 min-h-[300px] w-full mt-4 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [`${value} Leads`, '']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 font-medium flex items-center justify-center w-full h-full">No data available</div>
                )}
              </div>
            </div>
          )}

          {/* Priority Follow-ups */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Priority Follow-ups
            </h3>
            
            <div className="flex-1 space-y-4">
              {priorityFollowUps.length > 0 ? (
                priorityFollowUps.map(lead => (
                  <div key={lead.id} className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors line-clamp-1">{lead.exporterName || 'Unknown Company'}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 uppercase tracking-wider whitespace-nowrap ml-2">Action Req</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      {lead.contactNumber && (
                        <div className="flex items-center gap-1">
                          <PhoneCall className="w-3 h-3" /> {lead.contactNumber}
                        </div>
                      )}
                      {lead.assignedMeName && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {lead.assignedMeName}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-3" />
                  <p className="text-sm font-medium text-slate-600">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No priority follow-ups pending.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pincode Performance Section */}
        {!loading && filteredLeads.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PincodePerformanceTable leads={filteredLeads} />
          </div>
        )}

        {/* Data Grid Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mt-8">
           {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="w-10 h-10 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
               <p className="mt-4 text-slate-500 text-sm font-medium animate-pulse">Loading leads directory...</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700">
              <LeadsTable data={filteredLeads} />
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}

function MetricCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 hover:bg-amber-100/50 border-amber-100',
    sky: 'bg-sky-50 hover:bg-sky-100/50 border-sky-100',
    emerald: 'bg-emerald-50 hover:bg-emerald-100/50 border-emerald-100',
    violet: 'bg-violet-50 hover:bg-violet-100/50 border-violet-100',
    blue: 'bg-blue-50 hover:bg-blue-100/50 border-blue-100',
    teal: 'bg-teal-50 hover:bg-teal-100/50 border-teal-100',
  };
  const iconBgMap: Record<string, string> = {
    amber: 'bg-amber-100',
    sky: 'bg-sky-100',
    emerald: 'bg-emerald-100',
    violet: 'bg-violet-100',
    blue: 'bg-blue-100',
    teal: 'bg-teal-100',
  };

  return (
    <div className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer ${colorMap[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-2xl ${iconBgMap[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-extrabold text-slate-800">{value}</h4>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
      </div>
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
