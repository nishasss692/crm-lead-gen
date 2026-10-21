'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  KeyRound, 
  ShieldCheck, 
  Phone, 
  Building2, 
  MapPin, 
  Edit, 
  Trash2, 
  RefreshCw,
  Lock,
  ChevronRight,
  Filter
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { KARNATAKA_TERRITORY_DIRECTORY } from '@/lib/karnatakaTerritory';

export interface Officer {
  id: number;
  employee_id: string;
  name: string;
  role: 'RO' | 'DO';
  assigned_region?: string | null;
  assigned_division?: string | null;
  mobile_number?: string | null;
}

interface ManageOfficersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetRole?: 'RO' | 'DO' | 'ALL';
}

const REGIONS = [
  'Bengaluru HQ Region',
  'South Karnataka Region',
  'North Karnataka Region'
];

export default function ManageOfficersModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  targetRole = 'ALL'
}: ManageOfficersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'add'>('directory');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'RO' | 'DO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Officers List State
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Officer Form State
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'RO' | 'DO'>('DO');
  const [newRegion, setNewRegion] = useState('South Karnataka Region');
  const [newDivision, setNewDivision] = useState('Mysuru');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('Post@123');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Officer State
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'RO' | 'DO'>('DO');
  const [editRegion, setEditRegion] = useState('');
  const [editDivision, setEditDivision] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete State
  const [officerToDelete, setOfficerToDelete] = useState<Officer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOfficers = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await apiFetch('/api/officers', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setOfficers(data || []);
      } else {
        const err = await res.json().catch(() => null);
        setFeedback({ type: 'error', message: err?.detail || 'Failed to load officers.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message || 'Error connecting to server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (targetRole && targetRole !== 'ALL') {
        setRoleFilter(targetRole);
        setNewRole(targetRole);
        if (targetRole === 'RO') {
          setNewRegion('Bengaluru HQ Region');
          setNewDivision('');
        } else if (targetRole === 'DO') {
          setNewRegion('South Karnataka Region');
          setNewDivision('Mysuru');
        }
      } else {
        setRoleFilter('ALL');
      }
      fetchOfficers();
      setFeedback(null);
    }
  }, [isOpen, targetRole]);

  // Handle Division Selection for New Officer
  const handleNewDivisionChange = (div: string) => {
    setNewDivision(div);
    const reg = KARNATAKA_TERRITORY_DIRECTORY[div]?.region;
    if (reg) {
      setNewRegion(reg);
    }
  };

  // Handle Add Officer Submit
  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeId.trim()) {
      setFeedback({ type: 'error', message: 'Employee ID is required.' });
      return;
    }
    if (!newName.trim()) {
      setFeedback({ type: 'error', message: 'Officer Name is required.' });
      return;
    }

    setIsSubmittingAdd(true);
    setFeedback(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await apiFetch('/api/officers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          employee_id: newEmployeeId.trim(),
          name: newName.trim(),
          role: newRole,
          assigned_region: newRegion,
          assigned_division: newRole === 'DO' ? newDivision : null,
          mobile_number: newMobile.trim() || null,
          password: newPassword.trim() || 'Post@123'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        // Reset form
        setNewEmployeeId('');
        setNewName('');
        setNewMobile('');
        setNewPassword('Post@123');
        fetchOfficers();
        setActiveTab('directory');
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: 'error', message: data.detail || data.message || 'Failed to create officer.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Network error occurred.' });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Start Editing Officer
  const handleStartEdit = (officer: Officer) => {
    setEditingOfficer(officer);
    setEditName(officer.name || '');
    setEditRole(officer.role);
    setEditRegion(officer.assigned_region || 'Bengaluru HQ Region');
    setEditDivision(officer.assigned_division || '');
    setEditMobile(officer.mobile_number || '');
    setEditPassword('');
    setFeedback(null);
  };

  // Handle Edit Division Change
  const handleEditDivisionChange = (div: string) => {
    setEditDivision(div);
    const reg = KARNATAKA_TERRITORY_DIRECTORY[div]?.region;
    if (reg) {
      setEditRegion(reg);
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;

    setIsSubmittingEdit(true);
    setFeedback(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await apiFetch(`/api/officers/${encodeURIComponent(editingOfficer.employee_id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole,
          assigned_region: editRegion,
          assigned_division: editRole === 'DO' ? editDivision : null,
          mobile_number: editMobile.trim() || null,
          password: editPassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        setEditingOfficer(null);
        fetchOfficers();
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: 'error', message: data.detail || data.message || 'Failed to update officer.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Network error occurred.' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!officerToDelete) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await apiFetch(`/api/officers/${encodeURIComponent(officerToDelete.employee_id)}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        setOfficerToDelete(null);
        fetchOfficers();
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: 'error', message: data.detail || data.message || 'Failed to delete officer.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Network error occurred.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Officers
  const filteredOfficers = officers.filter(o => {
    if (roleFilter !== 'ALL' && o.role !== roleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.employee_id && o.employee_id.toLowerCase().includes(q)) ||
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.assigned_division && o.assigned_division.toLowerCase().includes(q)) ||
      (o.assigned_region && o.assigned_region.toLowerCase().includes(q)) ||
      (o.mobile_number && o.mobile_number.includes(q))
    );
  });

  const roCount = officers.filter(o => o.role === 'RO').length;
  const doCount = officers.filter(o => o.role === 'DO').length;

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dark Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-fade-in" 
        onClick={onClose} 
      />

      {/* Main Modal Card */}
      <div 
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-fade-in-up"
        style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}
      >
        
        {/* Modal Top Header - Dark Blue Theme */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B1528] via-[#1B2A4A] to-[#1E3A8A] text-white flex items-center justify-between border-b border-[#24355A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              {targetRole === 'RO' ? <Building2 className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  {targetRole === 'RO' 
                    ? 'Regional Officer (RO) Governance Portal' 
                    : targetRole === 'DO' 
                    ? 'Divisional Officer (DO) Governance Portal' 
                    : 'Officer Governance Portal (RO & DO)'}
                </h2>
                <span className="bg-[#FAB52C] text-[#1B2A4A] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {targetRole === 'RO' ? 'RO Operations' : targetRole === 'DO' ? 'DO Operations' : 'Circle Officer Exclusive'}
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                {targetRole === 'RO'
                  ? 'Manage and provision official Regional Office (RO) accounts across Bengaluru HQ, SK, and NK'
                  : targetRole === 'DO'
                  ? 'Manage and provision Divisional Office (DO) accounts across all 35+ postal divisions in Karnataka Circle'
                  : 'Manage all Regional Officers (RO) and Divisional Officers (DO) across Karnataka Circle'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Modal Navigation Tabs - Dark Blue Theme */}
        <div className="px-6 pt-3 bg-slate-100 border-b border-slate-300/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-[#1B2A4A] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-200/70'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                {targetRole === 'RO' ? 'RO Directory' : targetRole === 'DO' ? 'DO Directory' : 'Officer Directory'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {officers.filter(o => roleFilter === 'ALL' || o.role === roleFilter).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-[#1B2A4A] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-200/70'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {targetRole === 'RO' ? 'Add New RO' : targetRole === 'DO' ? 'Add New DO' : 'Add New Officer'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'add' ? 'bg-emerald-400 text-[#0B1528]' : 'bg-emerald-100 text-emerald-800'
              }`}>
                + Provision
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={fetchOfficers}
              title="Refresh officers list"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1B2A4A]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">

          {/* ═══════════════════════════════════════════════════════════
              TAB 1: DIRECTORY (LIST, SEARCH, FILTER, EDIT, DELETE)
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              
              {/* Filter & Search Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                
                {/* Role Filter Pills */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setRoleFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleFilter === 'ALL'
                        ? 'bg-[#1B2A4A] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Officers ({officers.length})
                  </button>

                  <button
                    onClick={() => setRoleFilter('RO')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleFilter === 'RO'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50'
                    }`}
                  >
                    <span>Regional (RO)</span>
                    <span className="text-[10px] px-1 bg-white/20 rounded font-mono">{roCount}</span>
                  </button>

                  <button
                    onClick={() => setRoleFilter('DO')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleFilter === 'DO'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50'
                    }`}
                  >
                    <span>Divisional (DO)</span>
                    <span className="text-[10px] px-1 bg-white/20 rounded font-mono">{doCount}</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by ID, name, division..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Table of Officers */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="min-w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">#</th>
                        <th className="px-4 py-3 min-w-[120px]">Employee ID</th>
                        <th className="px-4 py-3 min-w-[180px]">Officer Name</th>
                        <th className="px-4 py-3 text-center min-w-[90px]">Role</th>
                        <th className="px-4 py-3 min-w-[160px]">Jurisdiction</th>
                        <th className="px-4 py-3 min-w-[120px]">Contact Mobile</th>
                        <th className="px-4 py-3 text-center min-w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-[#D1242F]" />
                              <p className="font-semibold">Loading officers directory...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredOfficers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                            <p className="font-semibold">No officers found matching your query.</p>
                            <p className="text-[11px] text-slate-400 mt-1">Try clearing your search or filter pills.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredOfficers.map((officer, idx) => {
                          const isRO = officer.role === 'RO';
                          return (
                            <tr key={officer.id || officer.employee_id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Serial */}
                              <td className="px-4 py-3 text-center text-slate-400 font-semibold tabular-nums">
                                {idx + 1}
                              </td>

                              {/* Employee ID */}
                              <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {officer.employee_id}
                                </span>
                              </td>

                              {/* Officer Name */}
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {officer.name}
                              </td>

                              {/* Role Badge */}
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                                  isRO 
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {isRO ? 'RO REGIONAL' : 'DO DIVISION'}
                                </span>
                              </td>

                              {/* Jurisdiction */}
                              <td className="px-4 py-3">
                                {isRO ? (
                                  <div className="flex items-center gap-1.5 text-indigo-900 font-medium">
                                    <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                    <span>{officer.assigned_region || 'Statewide RO'}</span>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                                      <span>{officer.assigned_division || 'Unassigned'} Division</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 pl-4.5">
                                      {officer.assigned_region || 'Karnataka'}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Mobile Number */}
                              <td className="px-4 py-3 font-mono text-slate-600">
                                {officer.mobile_number ? (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{officer.mobile_number}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEdit(officer)}
                                    title="Modify Officer Details or Reset Password"
                                    className="p-1.5 border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setOfficerToDelete(officer)}
                                    title="Delete Officer Account"
                                    className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 2: ADD NEW OFFICER FORM
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'add' && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Provision New Postal Officer</h3>
                  <p className="text-xs text-slate-500">Create an official RO or DO account with instant authentication credentials</p>
                </div>
              </div>

              <form onSubmit={handleAddOfficer} className="space-y-4 text-xs">
                
                {/* 1. Officer Role Card Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Officer Administrative Level *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewRole('DO')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        newRole === 'DO'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className={`w-5 h-5 shrink-0 ${newRole === 'DO' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-slate-900">Divisional Officer (DO)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Assigned to a specific postal division (e.g. Mysuru, BG East)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewRole('RO')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        newRole === 'RO'
                          ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className={`w-5 h-5 shrink-0 ${newRole === 'RO' ? 'text-indigo-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-slate-900">Regional Officer (RO)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Oversees an entire postal region (e.g. Bengaluru HQ, South Kar)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Employee ID & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Employee / Login ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={newRole === 'DO' ? 'e.g. Dharwad or DIV_MYS_02' : 'e.g. r004 or RO_BG'}
                      value={newEmployeeId}
                      onChange={(e) => setNewEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      The officer will use this exact Employee ID to log in.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Officer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DO Mysuru Division"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {/* 3. Jurisdiction Scope: Region & Division */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned Region *
                    </label>
                    <select
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium cursor-pointer"
                    >
                      {REGIONS.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>

                  {newRole === 'DO' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Assigned Division *
                      </label>
                      <select
                        value={newDivision}
                        onChange={(e) => handleNewDivisionChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium cursor-pointer"
                      >
                        {Object.keys(KARNATAKA_TERRITORY_DIRECTORY).map(div => (
                          <option key={div} value={div}>
                            {div} Division ({KARNATAKA_TERRITORY_DIRECTORY[div].region.split(' ')[0]})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 4. Contact & Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Mobile Number (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Initial Password
                    </label>
                    <input
                      type="text"
                      placeholder="Defaults to Post@123"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Default standard portal password: Post@123</p>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdd}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAdd ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isSubmittingAdd ? 'Provisioning...' : 'Provision Officer'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Circle Officer Role Authority: Full Read/Write Governance over RO and DO Hierarchy</span>
          </div>
          <button 
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════
          NESTED MODAL: EDIT OFFICER MODAL
         ═══════════════════════════════════════════════════════════ */}
      {editingOfficer && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setEditingOfficer(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 z-10 animate-fade-in-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Modify Officer Account</h4>
                  <p className="text-xs text-slate-400 font-mono">Employee ID: {editingOfficer.employee_id}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingOfficer(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Officer Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'RO' | 'DO')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="DO">Divisional (DO)</option>
                    <option value="RO">Regional (RO)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Region</label>
                  <select
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editRole === 'DO' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Division</label>
                  <select
                    value={editDivision}
                    onChange={(e) => handleEditDivisionChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {Object.keys(KARNATAKA_TERRITORY_DIRECTORY).map(div => (
                      <option key={div} value={div}>{div} Division</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Mobile Number</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="text"
                  placeholder="New password (e.g. Post@123)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NESTED MODAL: DELETE CONFIRMATION MODAL
         ═══════════════════════════════════════════════════════════ */}
      {officerToDelete && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setOfficerToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md p-6 z-10 animate-fade-in-up">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center mb-5">
              <h4 className="text-base font-bold text-slate-900">Delete Officer Account?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove the following officer account? This action cannot be undone.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-bold text-slate-900">{officerToDelete.employee_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Officer Name:</span>
                <span className="font-bold text-slate-900">{officerToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-bold text-rose-600">{officerToDelete.role === 'RO' ? 'Regional Officer (RO)' : 'Divisional Officer (DO)'}</span>
              </div>
              {officerToDelete.assigned_division && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Division:</span>
                  <span className="font-medium text-slate-700">{officerToDelete.assigned_division}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOfficerToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#D1242F] hover:bg-[#B01E28] text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
