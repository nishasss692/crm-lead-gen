'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  UserPlus, 
  Users, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  KeyRound, 
  ShieldCheck, 
  Phone, 
  Building2, 
  MapPin, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { apiFetch, safeJson, getApiBaseUrl } from '@/lib/api';
import { KARNATAKA_TERRITORY_DIRECTORY } from '@/lib/karnatakaTerritory';

interface UploadMEModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MEUser {
  employee_id: string;
  name: string;
  mobile_number: string;
  division?: string;
  region?: string;
}

export default function UploadMEModal({ isOpen, onClose, onSuccess }: UploadMEModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'single' | 'directory'>('upload');

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Bulk upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{
    message?: string;
    total_processed?: number;
    created_count?: number;
    updated_count?: number;
    default_password?: string;
    sample_mes?: any[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single ME form states
  const [singleEmpId, setSingleEmpId] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleDivision, setSingleDivision] = useState('Bengaluru East');
  const [singleRegion, setSingleRegion] = useState('Bengaluru HQ Region');
  const [singleMobile, setSingleMobile] = useState('');
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState<string>('');
  const [singleError, setSingleError] = useState<string>('');

  // ME Directory states
  const [meList, setMeList] = useState<MEUser[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Division list derived from territory directory
  const divisions = Object.keys(KARNATAKA_TERRITORY_DIRECTORY);

  // Sync region when division changes in single form
  const handleDivisionChange = (div: string) => {
    setSingleDivision(div);
    const reg = KARNATAKA_TERRITORY_DIRECTORY[div]?.region || 'Karnataka Circle';
    setSingleRegion(reg);
  };

  // Load MEs for directory tab
  const fetchMEdirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await apiFetch('/api/mes', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setMeList(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch MEs directory', e);
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMEdirectory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchMEdirectory();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv')) {
        setUploadFile(file);
        setUploadError('');
        setUploadProgress('idle');
      } else {
        setUploadError('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
    }
  };

  // Handle Bulk Upload
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress('uploading');
    setUploadError('');
    setUploadResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await apiFetch('/api/upload-mes', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const data = await safeJson(res);

      if (res.ok && data.success) {
        setUploadProgress('success');
        setUploadResult(data);
        fetchMEdirectory();
        if (onSuccess) onSuccess();
      } else {
        setUploadProgress('error');
        setUploadError(data.detail || data.message || 'Failed to upload ME roster.');
      }
    } catch (err: any) {
      setUploadProgress('error');
      setUploadError(err.message || 'Connection error during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Single ME Creation
  const handleCreateSingleME = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmpId.trim()) {
      setSingleError('Employee ID is required.');
      return;
    }
    if (!singleName.trim()) {
      setSingleError('Marketing Executive name is required.');
      return;
    }

    setIsSubmittingSingle(true);
    setSingleError('');
    setSingleSuccess('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await apiFetch('/api/mes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          employee_id: singleEmpId.trim(),
          name: singleName.trim(),
          division: singleDivision,
          region: singleRegion,
          mobile_number: singleMobile.trim()
        })
      });

      const data = await safeJson(res);

      if (res.ok && data.success) {
        setSingleSuccess(data.message || `ME ${singleName} onboarded successfully!`);
        setSingleEmpId('');
        setSingleName('');
        setSingleMobile('');
        fetchMEdirectory();
        if (onSuccess) onSuccess();
      } else {
        setSingleError(data.detail || data.message || 'Failed to onboard ME.');
      }
    } catch (err: any) {
      setSingleError(err.message || 'Error communicating with server.');
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  // Handle Template Download
  const handleDownloadTemplate = () => {
    const csvContent = 
      "Emp ID,Name,Role,Division Name,Region Name,Mobile Number\n" +
      "10099881,Ramesh Patil,ME,Bengaluru East,Bengaluru HQ Region,9876543210\n" +
      "10099882,Pooja Sharma,ME,Mysuru,South Karnataka Region,9876543211\n" +
      "10099883,Anand Kumar,ME,Belagavi,North Karnataka Region,9876543212\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ME_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered MEs for directory
  const filteredMEs = meList.filter(me => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (me.employee_id && me.employee_id.toLowerCase().includes(q)) ||
      (me.name && me.name.toLowerCase().includes(q)) ||
      (me.division && me.division.toLowerCase().includes(q)) ||
      (me.mobile_number && me.mobile_number.includes(q))
    );
  });

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dark Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />

      {/* Modal Container: perfectly centered horizontally and vertically */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 z-10 overflow-hidden my-auto select-none animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar - Solid Dark Blue */}
        <div className="bg-[#1B2A4A] p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-[#24355A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Marketing Executive (ME) Onboarding & Update
                </h2>
                <span className="text-[10px] font-bold bg-[#FAB52C] text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  CO Admin
                </span>
              </div>
              <p className="text-xs text-blue-100/80 font-medium mt-0.5">
                Upload new MEs, update existing roster, or add individual executives with automatic login provisioning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Credentials Callout Banner */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-900 font-medium">
            <KeyRound className="w-4 h-4 text-[#1B2A4A] shrink-0" />
            <span>
              <strong>Default Login Password:</strong> All newly added MEs can sign in immediately using their <strong>Employee ID</strong> and password <span className="inline-block font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900">Post@123</span>
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-md">
            Role: ME
          </span>
        </div>

        {/* Navigation Tabs - Dark Blue Theme */}
        <div className="flex border-b border-slate-300/80 bg-slate-100 px-4 sm:px-6 gap-2 shrink-0 pt-2.5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold transition-all cursor-pointer rounded-t-xl ${
              activeTab === 'upload'
                ? 'bg-[#1B2A4A] text-white shadow-md'
                : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-200/70'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload & Update MEs (.xlsx / .csv)</span>
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold transition-all cursor-pointer rounded-t-xl ${
              activeTab === 'single'
                ? 'bg-[#1B2A4A] text-white shadow-md'
                : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-200/70'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add / Update Single ME</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold transition-all cursor-pointer rounded-t-xl ${
              activeTab === 'directory'
                ? 'bg-[#1B2A4A] text-white shadow-md'
                : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-200/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active MEs ({meList.length})</span>
          </button>
        </div>

        {/* Modal Body Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* ══════════════════════════════════════════════════════════
              TAB 1: BULK FILE UPLOAD (.xlsx, .xls, .csv)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload ME Roster Spreadsheet</h3>
                  <p className="text-xs text-slate-500">
                    Upload an Excel or CSV file containing newly joined Marketing Executives.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:border-[#1B2A4A] text-slate-700 hover:text-[#1B2A4A] bg-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#1B2A4A]" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#1B2A4A] bg-blue-50/50 scale-[1.01]'
                    : uploadFile
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-[#1B2A4A] hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                      setUploadError('');
                      setUploadProgress('idle');
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    uploadFile ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-[#1B2A4A]'
                  }`}>
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>

                  {uploadFile ? (
                    <div>
                      <p className="text-sm font-bold text-slate-900">{uploadFile.name}</p>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">
                        {(uploadFile.size / 1024).toFixed(1)} KB • Ready to onboard
                      </p>
                      <span className="inline-block text-[11px] text-[#1B2A4A] underline mt-1 font-semibold">
                        Click or drop another file to replace
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Drag & drop your Excel or CSV file here, or <span className="text-[#1B2A4A] underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Required columns: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Emp ID</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Name</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Division Name</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Mobile Number</code>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message Alert */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Success Result Box */}
              {uploadProgress === 'success' && uploadResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm">Upload & ME Provisioning Complete!</span>
                  </div>
                  <p className="text-slate-700">{uploadResult.message}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60">
                    <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Newly Added</span>
                      <p className="text-base font-black text-emerald-700">{uploadResult.created_count || 0}</p>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Updated</span>
                      <p className="text-base font-black text-blue-700">{uploadResult.updated_count || 0}</p>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Default Password</span>
                      <p className="text-xs font-mono font-black text-amber-800 mt-1">Post@123</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!uploadFile || isUploading}
                  onClick={handleBulkUpload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1B2A4A] hover:bg-[#24355A] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing & Registering MEs...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-[#FAB52C]" />
                      <span>Upload & Provision MEs</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: QUICK ADD SINGLE ME
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'single' && (
            <form onSubmit={handleCreateSingleME} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Onboard Individual Marketing Executive</h3>
                <p className="text-xs text-slate-500">
                  Instantly provision a new Marketing Executive without creating a spreadsheet.
                </p>
              </div>

              {singleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{singleError}</span>
                </div>
              )}

              {singleSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{singleSuccess}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Credentials: Employee ID + Password <strong>Post@123</strong>
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Employee ID */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10099881"
                    value={singleEmpId}
                    onChange={(e) => setSingleEmpId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1B2A4A] focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Used by ME to log in</span>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1B2A4A] focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                  />
                </div>

                {/* Assigned Division */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Assigned Postal Division <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={singleDivision}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1B2A4A] focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    {divisions.map((div) => (
                      <option key={div} value={div}>
                        {div} Division
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region (Auto-resolved) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Jurisdiction Region
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={singleRegion}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-derived from selected division</span>
                </div>

                {/* Mobile Number */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={singleMobile}
                      onChange={(e) => setSingleMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1B2A4A] focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Used for automatic ME resolution and assignment during lead interactions
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSingle}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1B2A4A] hover:bg-[#24355A] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSingle ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Onboarding ME...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Register ME & Enable Login</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: ACTIVE ME DIRECTORY
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'directory' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Marketing Executives Roster</h3>
                  <p className="text-xs text-slate-500">
                    {meList.length} verified MEs enabled to access the Karnataka Postal CRM
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by ID, name, division..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#1B2A4A] focus:bg-white w-48 sm:w-56 font-medium"
                    />
                  </div>
                  <button
                    onClick={fetchMEdirectory}
                    title="Refresh ME List"
                    className="p-2 text-slate-500 hover:text-[#1B2A4A] hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDirectory ? 'animate-spin text-[#1B2A4A]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Roster List */}
              <div className="max-h-[340px] overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                {isLoadingDirectory ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" />
                    <span>Loading Marketing Executives...</span>
                  </div>
                ) : filteredMEs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No Marketing Executives match &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredMEs.map((me) => (
                    <div key={me.employee_id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B2A4A] font-bold flex items-center justify-center shrink-0 text-xs border border-blue-100">
                          {me.name ? me.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">{me.name || 'Unnamed ME'}</span>
                            <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                              ID: {me.employee_id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {me.division || 'Unassigned'} Division
                            </span>
                            {me.region && (
                              <span className="text-slate-400 text-[10px]">({me.region})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {me.mobile_number ? (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {me.mobile_number}
                          </span>
                        ) : (
                          <span className="hidden sm:inline-block text-[10px] text-slate-400 italic">
                            No phone
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          Post@123
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1B2A4A]" />
            <span>Official India Post CRM Access Control System</span>
          </div>
          <span className="font-semibold text-slate-600">Karnataka Postal Circle</span>
        </div>

      </div>
    </div>,
    document.body
  );
}
