'use client';
import React, { useState, useMemo, useEffect } from 'react';
import UpdateLeadModal, { sanitizeIndianMobile, sanitizeText } from './UpdateLeadModal';
import ModifyLeadSourceModal from './ModifyLeadSourceModal';
import { 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Award, 
  PhoneCall, 
  AlertCircle,
  Building2 
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export interface Lead {
  id: number;
  slNo?: number | string;
  exporterName: string;
  address: string;
  pincode: string;
  poName?: string;
  po_name?: string;
  divisionId?: string;
  division: string;
  region?: string;
  assignedMeName?: string;
  assigned_me_name?: string;
  assignedAgent?: string;
  assigned_agent?: string;
  meMobile?: string;
  me_mobile?: string;
  dateOfMeeting?: string;
  contactedDate1?: string;
  contactedDate2?: string;
  contactedDate3?: string;
  contacted_date_1?: string;
  contacted_date_2?: string;
  contacted_date_3?: string;
  customerMet?: string;
  contactNumber?: string;
  email?: string;
  productType?: string;
  serviceUsing?: string;
  monthlyVolume?: number | string;
  meetingOutcome?: string;
  willingToOnboard?: string;
  willing_to_onboard?: string;
  contractId?: string;
  remarks?: string;
}

interface LeadsTableProps {
  data: Lead[];
  allowEdit?: boolean;
  statusFilter?: string | null;
}

export default function LeadsTable({ data, allowEdit = true, statusFilter }: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sourceModalLead, setSourceModalLead] = useState<Lead | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [meMobileMap, setMeMobileMap] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserRole(String(u.role || '').toUpperCase());
      } else {
        const r = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
        if (r) setUserRole(r.toUpperCase());
      }
    } catch (e) {}

    apiFetch('/api/mes')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mobiles: Record<string, string> = {};
          data.forEach((m: any) => {
            const n = m.name || m.employee_id;
            const empId = m.employee_id;
            const mob = sanitizeIndianMobile(m.mobile_number);
            if (mob) {
              if (n) {
                mobiles[n] = mob;
                mobiles[n.toLowerCase()] = mob;
              }
              if (empId) {
                mobiles[empId] = mob;
                mobiles[empId.toLowerCase()] = mob;
              }
            }
          });
          setMeMobileMap(mobiles);
        }
      })
      .catch(() => {});
  }, []);

  const isME = userRole === 'ME' || userRole === 'MARKETING EXECUTIVE' || userRole === 'EXECUTIVE';

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const handleUpdate = async (id: number, updates: Partial<Lead>) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await apiFetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDelete = async (id: number, exporterName: string) => {
    if (!confirm(`Are you sure you want to delete lead "${exporterName || 'Record'}"?`)) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await apiFetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const isAllLeadsOrPending = !statusFilter || statusFilter.toLowerCase() === 'all' || statusFilter.toLowerCase() === 'pending';

  const handleLeadClick = (lead: Lead) => {
    if (!allowEdit) return;
    if (isAllLeadsOrPending) {
      setSelectedLead(lead);
    } else {
      setSourceModalLead(lead);
    }
  };

  // Helper to split product and provider cleanly from serviceUsing
  const parseProductAndProvider = (serviceUsing?: string, customerMet?: string) => {
    if (!serviceUsing || !serviceUsing.trim()) {
      return { product: customerMet ? customerMet : '—', provider: 'DHL' };
    }
    const s = serviceUsing.trim();
    const parts = s.split(/\s+/);
    if (parts.length === 1) {
      return { product: parts[0], provider: 'DHL' };
    }
    const provider = parts[parts.length - 1];
    const product = parts.slice(0, -1).join(' ');
    return { product, provider };
  };

  const renderOutcomeBadge = (outcome?: string, hasContract?: string, willingToOnboard?: string) => {
    const out = (outcome || '').trim().toLowerCase();
    const contract = !!(hasContract || '').trim();
    const willing = (willingToOnboard || '').trim().toLowerCase();
    
    if (contract || (out.includes('onboard') && !out.includes('willing') && !out.includes('pending'))) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold shadow-2xs">
          <Award className="w-3 h-3" />
          <span>Onboarded</span>
        </span>
      );
    }
    if (out === 'company not exist' || willing === 'company not exist' || out.includes('company not exist')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold shadow-2xs border border-slate-300">
          <Building2 className="w-3 h-3 text-slate-500" />
          <span>Company Not Exist</span>
        </span>
      );
    }
    if (willing === 'yes' || willing === 'willing' || out === 'willing to onboard' || out === 'willing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold shadow-2xs border border-teal-200">
          <CheckCircle2 className="w-3 h-3 text-teal-600" />
          <span>Willing</span>
        </span>
      );
    }
    if (out === 'interested' || out === 'positive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold shadow-2xs">
          <CheckCircle2 className="w-3 h-3" />
          <span>Interested</span>
        </span>
      );
    }
    if (out === 'not interested' || out.includes('not willing') || willing === 'no' || willing === 'not willing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold shadow-2xs">
          <XCircle className="w-3 h-3" />
          <span>Not Interested</span>
        </span>
      );
    }
    if (out.includes('follow')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold shadow-2xs">
          <Clock className="w-3 h-3" />
          <span>Follow-up</span>
        </span>
      );
    }
    if (out !== '') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold shadow-2xs">
          <PhoneCall className="w-3 h-3" />
          <span>Contacted</span>
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
        <AlertCircle className="w-3 h-3 text-slate-400" />
        <span>Pending</span>
      </span>
    );
  };

  const renderWillingText = (willing?: string, outcome?: string) => {
    const w = (willing || '').trim().toLowerCase();
    const out = (outcome || '').trim().toLowerCase();
    if (w === 'company not exist' || out === 'company not exist' || out.includes('company not exist')) {
      return <span className="text-slate-600 font-bold text-xs">Company Not Exist</span>;
    }
    if (w === 'yes' || w === 'willing' || out === 'willing to onboard' || out === 'willing' || out === 'interested') {
      return <span className="text-emerald-700 font-bold text-xs">Willing</span>;
    }
    if (w === 'no' || w === 'not willing' || out === 'not interested' || out.includes('not willing')) {
      return <span className="text-rose-600 font-bold text-xs">Not Willing</span>;
    }
    return <span className="text-slate-400 font-medium text-xs">—</span>;
  };

  const renderOnboardingBadge = (contractId?: string, outcome?: string, willing?: string) => {
    const hasContract = Boolean(contractId && contractId.trim());
    const out = (outcome || '').trim().toLowerCase();
    const w = (willing || '').trim().toLowerCase();

    if (hasContract || out.includes('onboarded')) {
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-2xs">
            Onboarded
          </span>
          {hasContract && (
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
              {contractId}
            </span>
          )}
        </div>
      );
    }

    if (w === 'yes' || out === 'interested' || out.includes('willing') || out.includes('follow') || out === 'contacted') {
      return (
        <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
          Contract pending
        </span>
      );
    }

    return <span className="text-slate-400 font-medium text-xs">—</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-left text-sm border-collapse">
            {/* Original Clean Slate Table Header */}
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-12">#</th>
                <th className="px-4 py-3.5 font-semibold text-center w-24">Actions</th>
                <th className="px-5 py-3.5 font-semibold min-w-[240px]">Lead / Exporter</th>
                <th className="px-4 py-3.5 font-semibold min-w-[140px]">Location & Pincode</th>
                <th className="px-4 py-3.5 font-semibold min-w-[130px]">Contact Person</th>
                <th className="px-4 py-3.5 font-semibold min-w-[140px]">Product / Provider</th>
                <th className="px-4 py-3.5 font-semibold min-w-[130px]">ME Name / Mobile</th>
                <th className="px-4 py-3.5 font-semibold text-center min-w-[110px]">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center min-w-[120px]">Willing to Onboard</th>
                <th className="px-4 py-3.5 font-semibold text-center min-w-[120px]">Onboarding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700 text-xs">
              {currentData.map((lead, index) => {
                const { product, provider } = parseProductAndProvider(lead.serviceUsing, lead.customerMet);
                const rawMeName = lead.assignedMeName || lead.assignedAgent || lead.assigned_me_name || lead.assigned_agent || '';
                const meName = sanitizeText(rawMeName) || 'Unassigned';
                const rawMeMob = lead.meMobile || lead.me_mobile || meMobileMap[rawMeName] || meMobileMap[rawMeName.toLowerCase()] || '';
                const meMob = sanitizeIndianMobile(rawMeMob) || '—';
                const contactPerson = sanitizeText(lead.customerMet) || '—';
                const contactPhone = sanitizeIndianMobile(lead.contactNumber) || '—';
                const locationPo = lead.poName || lead.po_name || (lead.pincode ? `Post Office - ${lead.pincode}` : (lead.division || '—'));

                return (
                  <tr 
                    key={lead.id} 
                    onClick={() => handleLeadClick(lead)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors duration-150 group"
                  >
                    {/* 1. SER / # */}
                    <td className="px-4 py-3.5 text-center text-slate-400 font-semibold text-xs tabular-nums">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* 2. Actions: Edit and Delete Buttons */}
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {allowEdit && (
                          <button 
                            onClick={() => handleLeadClick(lead)} 
                            className="p-1.5 border border-blue-200 hover:bg-blue-100/60 text-blue-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isME && (
                          <button 
                            onClick={() => handleDelete(lead.id, lead.exporterName)}
                            className="p-1.5 border border-rose-200 hover:bg-rose-100/60 text-rose-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    
                    {/* 3. Lead / Exporter */}
                    <td className="px-5 py-3.5 text-left">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 text-sm tracking-tight transition-colors">
                        {lead.exporterName || 'Unknown Exporter'}
                      </div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5 leading-snug line-clamp-2 max-w-md">
                        {lead.address || '—'}
                      </div>
                    </td>
                    
                    {/* 4. Location & Pincode */}
                    <td className="px-4 py-3.5 text-left">
                      <div className="text-xs font-medium text-slate-800 leading-tight">
                        {locationPo}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {lead.pincode || '—'}
                      </div>
                    </td>

                    {/* 5. Contact Person */}
                    <td className="px-4 py-3.5 text-left">
                      <div className="text-xs font-medium text-slate-800 leading-tight">
                        {contactPerson}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {contactPhone}
                      </div>
                    </td>

                    {/* 6. Product / Provider */}
                    <td className="px-4 py-3.5 text-left">
                      <div className="text-xs font-medium text-slate-800 leading-tight">
                        {product}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {provider}
                      </div>
                    </td>

                    {/* 7. ME Name / Mobile */}
                    <td className="px-4 py-3.5 text-left">
                      <div className="text-xs font-medium text-slate-800 leading-tight">
                        {meName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {meMob}
                      </div>
                    </td>
                    
                    {/* 8. Status / Outcome */}
                    <td className="px-4 py-3.5 text-center">
                      {renderOutcomeBadge(lead.meetingOutcome, lead.contractId, lead.willingToOnboard || lead.willing_to_onboard)}
                    </td>

                    {/* 9. Willing to Onboard */}
                    <td className="px-4 py-3.5 text-center">
                      {renderWillingText(lead.willingToOnboard || lead.willing_to_onboard, lead.meetingOutcome)}
                    </td>

                    {/* 10. Onboarding */}
                    <td className="px-4 py-3.5 text-center">
                      {renderOnboardingBadge(lead.contractId, lead.meetingOutcome, lead.willingToOnboard || lead.willing_to_onboard)}
                    </td>
                  </tr>
                );
              })}
              
              {data.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">No leads found</span>
                      <span className="text-xs text-slate-400">Try adjusting your filters to see more results</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Original Clean Pagination Controls */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-600 font-medium">
          <p>
            Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, data.length)}</span> of <span className="font-bold text-slate-900">{data.length}</span> leads
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-xs flex items-center gap-1 font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-xs font-semibold text-slate-500 px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-xs flex items-center gap-1 font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedLead && (
        <UpdateLeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleUpdate}
          initialTab="outcome"
        />
      )}

      {sourceModalLead && (
        <ModifyLeadSourceModal
          lead={sourceModalLead}
          onClose={() => setSourceModalLead(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}
