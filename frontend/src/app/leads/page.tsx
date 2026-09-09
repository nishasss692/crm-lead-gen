'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LeadsTable, { Lead } from '../components/LeadsTable';
import { 
  CopyX, 
  Trash2, 
  Check, 
  RefreshCw, 
  X, 
  Download, 
  Filter, 
  Search, 
  Upload, 
  FileSpreadsheet, 
  FileCheck, 
  AlertTriangle,
  ShieldCheck,
  BadgeCheck,
  Server
} from 'lucide-react';
import { apiFetch, safeJson, getApiBaseUrl } from '@/lib/api';

function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [user, setUser] = useState<{
    employee_id?: string;
    username?: string;
    role?: string;
    assigned_division?: string;
    division?: string;
    assigned_region?: string;
    region?: string;
  } | null>(null);

  const [selectedDivision, setSelectedDivision] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState<boolean>(true);
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

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        const role = (u.role || '').toUpperCase();
        const assignedDiv = u.assigned_division || u.division;
        if ((role === 'ME' || role === 'MARKETING EXECUTIVE' || role === 'DO' || role === 'EXECUTIVE') && assignedDiv) {
          setSelectedDivision(assignedDiv);
        }
      } catch (e) {}
    }
  }, []);

  const fetchDivisions = async (token: string) => {
    try {
      const res = await apiFetch('/api/divisions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) {
          setDivisions(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch divisions", err);
    }
  };

  const fetchLeads = async (token: string, division = selectedDivision) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (division && !division.toLowerCase().startsWith('all')) {
        params.append('division_name', division);
      }
      params.append('only_valid', 'false');

      const res = await apiFetch(`/api/leads?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) {
          const formattedData = data.map((item: any) => ({
            id: item.id, 
            slNo: item.sl_no, 
            exporterName: item.exporter_name, 
            address: item.address,
            pincode: item.pincode, 
            poName: item.po_name || item.poName || '',
            divisionId: item.division_id, 
            division: item.division,
            region: item.region, 
            assignedMeName: item.assigned_agent, 
            dateOfMeeting: item.date_of_meeting || item.contactedDate1 || item.contacted_date_1 || '',
            contactedDate1: item.contactedDate1 || item.contacted_date_1 || item.date_of_meeting || '',
            contacted_date_1: item.contacted_date_1 || item.contactedDate1 || item.date_of_meeting || '',
            contactedDate2: item.contactedDate2 || item.contacted_date_2 || '',
            contacted_date_2: item.contacted_date_2 || item.contactedDate2 || '',
            contactedDate3: item.contactedDate3 || item.contacted_date_3 || '',
            contacted_date_3: item.contacted_date_3 || item.contactedDate3 || '',
            customerMet: item.customer_met, 
            contactNumber: item.contact_number, 
            email: item.email,
            serviceUsing: item.service_using, 
            monthlyVolume: item.monthly_volume, 
            meetingOutcome: item.meeting_outcome,
            contractId: item.contract_id, 
            remarks: item.remarks,
            win_probability: item.win_probability ?? 0,
            winProbability: item.win_probability ?? 0
          }));
          setLeads(formattedData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDivisions(token);
    fetchLeads(token, selectedDivision);
  }, [router, selectedDivision]);

  // Handle File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadProgress('uploading');
    setUploadMessage('Processing records on backend...');
    setUploadSummary(null);

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const clearParam = clearExisting ? '?clear_existing=true' : '?clear_existing=false';
      const res = await apiFetch(`/api/upload-excel${clearParam}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await safeJson(res);
      if (res.ok && data && !data.error) {
        setUploadProgress('success');
        setUploadMessage(data.message || `Successfully imported ${data.count || ''} records!`);
        setUploadSummary({
          count: data.count,
          skipped_empty: data.skipped_empty,
          data_quality_pct: data.data_quality_pct,
          total_rows: data.total_rows
        });
        if (token) {
          fetchDivisions(token);
          fetchLeads(token, selectedDivision);
        }
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadProgress('idle');
          setUploadFile(null);
          setUploadSummary(null);
        }, 2000);
      } else {
        setUploadProgress('error');
        setUploadMessage(data?.detail || 'Failed to process file on backend.');
      }
    } catch (error: any) {
      setUploadProgress('error');
      setUploadMessage(error.message || 'Network error occurred while uploading. Please ensure backend is reachable.');
    }
  };

  const handleDownloadTemplate = () => {
    const base = getApiBaseUrl();
    window.open(base ? `${base}/api/download-template` : '/api/download-template', '_blank');
  };

  // Fetch Duplicate Summary
  const fetchDuplicateSummary = async (criteria = dedupCriteria) => {
    const token = localStorage.getItem('token');
    setIsDedupLoading(true);
    try {
      const res = await apiFetch(`/api/leads/duplicates-summary?criteria=${encodeURIComponent(criteria)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await safeJson(res);
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
      const res = await apiFetch('/api/leads/deduplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ criteria: dedupCriteria })
      });
      const data = await safeJson(res);
      if (res.ok) {
        setDedupSuccessResult(data.message || 'Deduplication completed');
        if (token) fetchLeads(token, selectedDivision);
        fetchDuplicateSummary(dedupCriteria);
      } else {
        alert(data?.detail || "Failed to remove duplicates");
      }
    } catch (err: any) {
      alert("Error running deduplication: " + err.message);
    } finally {
      setIsDedupLoading(false);
    }
  };

  const handleClearAllLeads = async () => {
    if (!confirm("Are you sure you want to remove all existing leads? This will leave the database clean for your new upload.")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await apiFetch('/api/leads/clear-all', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        if (token) {
          fetchDivisions(token);
          fetchLeads(token, selectedDivision);
        }
      }
    } catch (err) {
      console.error("Error clearing leads", err);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = Object.keys(leads[0]).join(',');
    const rows = leads.map(lead => 
      Object.values(lead).map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const regPrefix = user?.assigned_region ? user.assigned_region.replace(/\s+/g, '_') : 'all';
    a.download = `indiapost_leads_${selectedDivision || regPrefix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  let filtered = selectedDivision && !selectedDivision.toLowerCase().startsWith('all')
    ? leads.filter(d => {
        const divA = (d.division || '').trim().toLowerCase();
        const divB = selectedDivision.trim().toLowerCase();
        const cleanB = divB.replace(/ division/i, '').trim();
        return divA === divB || divA === cleanB || (cleanB && divA.includes(cleanB));
      })
    : leads;

  if (statusFilter) {
    filtered = filtered.filter(lead => {
      const outcome = (lead.meetingOutcome || '').trim().toLowerCase();
      const hasContract = !!(lead.contractId || '').trim();
      
      switch (statusFilter) {
        case 'pending':
          return outcome === '' || outcome === 'pending' || outcome === 'nan';
        case 'contacted':
          return outcome !== '' && outcome !== 'pending' && outcome !== 'nan';
        case 'followup':
          return outcome.includes('follow') || outcome.includes('warm');
        case 'interested':
          return outcome.includes('positive') || outcome.includes('interested');
        case 'willing':
          return (outcome.includes('positive') || outcome.includes('interested')) && !hasContract;
        case 'onboarded':
          return hasContract || outcome.includes('onboard');
        default:
          return true;
      }
    });
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(lead => 
      (lead.exporterName || '').toLowerCase().includes(term) ||
      (lead.address || '').toLowerCase().includes(term) ||
      (lead.pincode || '').toLowerCase().includes(term) ||
      (lead.contactNumber || '').toLowerCase().includes(term) ||
      (lead.email || '').toLowerCase().includes(term) ||
      (lead.id || '').toString().includes(term)
    );
  }

  const getTitle = () => {
    const roleUpper = (user?.role || '').toUpperCase();
    const regionName = user?.assigned_region || 'Regional';
    const isRO = roleUpper === 'RO';

    switch (statusFilter) {
      case 'pending': return isRO ? `${regionName} — Contact Pending Leads` : 'Contact Pending Leads';
      case 'contacted': return isRO ? `${regionName} — Contacted Leads` : 'Contacted Leads';
      case 'followup': return isRO ? `${regionName} — Follow-up Required` : 'Follow-up Required';
      case 'interested': return isRO ? `${regionName} — Interested Commercial Leads` : 'Interested Commercial Leads';
      case 'willing': return isRO ? `${regionName} — Willing to Onboard` : 'Willing to Onboard';
      case 'onboarded': return isRO ? `${regionName} — Onboarded Contracts` : 'Onboarded Contracts';
      default: return isRO ? `${regionName} Leads Directory` : 'All Circle Leads Directory';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      <div className="max-w-[1650px] mx-auto space-y-6">
        
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <BadgeCheck className="w-3 h-3 text-emerald-600" />
                Postal CRM Directory
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-[11px] font-black text-[#D1242F] uppercase tracking-wider">
                {user?.assigned_region || (user?.role === 'CO' ? 'Karnataka Circle' : (user?.assigned_division ? `${user.assigned_division} Division` : 'Karnataka Postal Circle'))}
              </span>
            </div>
            <h1 className="text-3xl font-black text-[#1B2A4A] tracking-tight">{getTitle()}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {filtered.length.toLocaleString()} records matching active filters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Deduplicate Clean Button */}
            <button
              onClick={handleOpenDedupModal}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <CopyX className="w-3.5 h-3.5 text-amber-700" />
              <span>Clean Duplicates</span>
            </button>

            {/* Clear All Data Button */}
            <button
              onClick={handleClearAllLeads}
              title="Remove all leads to start fresh with a clean upload"
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear All</span>
            </button>

            {/* Upload File Button */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#1B2A4A] hover:bg-[#283044] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#FAB52C]" />
              <span>Upload File</span>
            </button>

            {/* Export CSV Button */}
            <button 
              onClick={handleExportCSV} 
              className="flex items-center px-3.5 py-2.5 bg-[#D1242F] hover:bg-[#B01E28] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
            <div className="relative w-full sm:max-w-[260px]">
              {(user?.role?.toUpperCase() === 'ME' || user?.role?.toUpperCase() === 'MARKETING EXECUTIVE' || user?.role?.toUpperCase() === 'DO' || user?.role?.toUpperCase() === 'EXECUTIVE') ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-bold text-red-900 shadow-xs">
                  <span className="shrink-0 text-sm">📍</span>
                  <span className="truncate">{user?.assigned_division || user?.division || selectedDivision || 'Mysuru'} Division (My Territory)</span>
                </div>
              ) : (
                <>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 shadow-xs cursor-pointer appearance-none pr-9"
                  >
                    <option value="">
                      {user?.role?.toUpperCase() === 'RO'
                        ? `🏢 All Regional Divisions (${user?.assigned_region || 'Regional Territory'})`
                        : '🏢 All Divisions (Circle-wide)'}
                    </option>
                    {divisions.map((div) => {
                      const isAssigned = div === (user?.assigned_division || user?.division);
                      return (
                        <option key={div} value={div}>
                          {div} Division {isAssigned ? '(Assigned)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </>
              )}
            </div>
            
            <div className="relative w-full sm:flex-1 max-w-xl">
              <input
                type="text"
                placeholder="Search exporter name, address, lead ID, phone, email, pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 shadow-xs"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-red-200 border-t-[#D1242F] rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-500 font-bold animate-pulse">Loading leads directory...</p>
          </div>
        ) : (
          <div>
            <LeadsTable data={filtered} allowEdit={true} statusFilter={statusFilter} />
          </div>
        )}
        
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

              {/* Replace existing data option */}
              <label className="flex items-start gap-2.5 p-3 bg-red-50/40 hover:bg-red-50/70 rounded-xl border border-red-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="mt-0.5 rounded text-[#D1242F] focus:ring-[#D1242F] cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Replace existing data with this upload</span>
                  <span className="text-slate-500 text-[11px]">Wipes previous leads so ONLY your uploaded file's data is visible.</span>
                </div>
              </label>

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
                  <div className="text-xs flex-1">
                    <p className="font-bold">{uploadMessage}</p>
                    {uploadSummary && (
                      <p className="text-[11px] opacity-90 mt-1">
                        Total Rows: {uploadSummary.total_rows} • Valid Imported: {uploadSummary.count} • Skipped: {uploadSummary.skipped_empty}
                      </p>
                    )}
                    {uploadProgress === 'error' && (
                      <div className="mt-2 pt-1.5 border-t border-rose-200 text-[11px] text-rose-700">
                        Backend URL in use: <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono font-bold">{getApiBaseUrl() || 'Not set (defaults to localhost:8000)'}</code>
                      </div>
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
                  <p className="text-xs text-slate-500">Scan & remove duplicate records across database</p>
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

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Total Leads in Database:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {dedupSummary?.total_leads ? dedupSummary.total_leads.toLocaleString() : '...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700">Duplicate Records Found:</span>
                  <span className="font-black text-amber-600 text-sm">
                    {dedupSummary?.duplicate_count !== undefined ? dedupSummary.duplicate_count.toLocaleString() : '...'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="font-bold text-emerald-700">Unique Records Preserved:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {dedupSummary?.unique_leads_estimate !== undefined ? dedupSummary.unique_leads_estimate.toLocaleString() : '...'}
                  </span>
                </div>
              </div>

              {dedupSuccessResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{dedupSuccessResult}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                * Note: The primary lead record with the earliest entry is preserved, while all duplicate secondary entries are safely removed.
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
    </main>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 min-h-screen">
        <div className="w-12 h-12 border-4 border-red-200 border-t-[#D1242F] rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold animate-pulse">Loading leads directory...</p>
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
