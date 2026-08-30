'use client';
import React, { useState, useMemo } from 'react';
import UpdateLeadModal from './UpdateLeadModal';
import { Edit, Trash2, MapPin, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, Award, PhoneCall, AlertCircle } from 'lucide-react';

export interface Lead {
  id: number;
  slNo?: number | string;
  exporterName: string;
  address: string;
  pincode: string;
  divisionId?: string;
  division: string;
  region?: string;
  assignedMeName?: string;
  dateOfMeeting?: string;
  customerMet?: string;
  contactNumber?: string;
  email?: string;
  serviceUsing?: string;
  monthlyVolume?: number | string;
  meetingOutcome?: string;
  contractId?: string;
  remarks?: string;
  win_probability?: number;
  winProbability?: number;
}

interface LeadsTableProps {
  data: Lead[];
  allowEdit?: boolean;
}

export default function LeadsTable({ data, allowEdit = true }: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const handleUpdate = async (id: number, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`http://localhost:8000/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  const getWinScoreBadge = (score?: number) => {
    const s = typeof score === 'number' ? score : parseFloat(String(score || 0)) || 0;
    let colorClasses = 'bg-slate-100 text-slate-600';
    if (s >= 75) {
      colorClasses = 'bg-emerald-100 text-emerald-800';
    } else if (s >= 40) {
      colorClasses = 'bg-amber-100 text-amber-800';
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colorClasses}`}>
        <span>{s.toFixed(1)}%</span>
      </span>
    );
  };

  const getOutcomeBadge = (outcome?: string, hasContract?: string) => {
    const out = (outcome || '').trim().toLowerCase();
    const contract = !!(hasContract || '').trim();
    
    if (contract) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold shadow-xs">
          <Award className="w-3 h-3" />
          <span>Onboarded</span>
        </span>
      );
    }
    if (out === 'positive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-3 h-3" />
          <span>Positive</span>
        </span>
      );
    }
    if (out === 'not interested') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold shadow-xs">
          <XCircle className="w-3 h-3" />
          <span>Not Interested</span>
        </span>
      );
    }
    if (out === 'followup') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold shadow-xs">
          <Clock className="w-3 h-3" />
          <span>Follow-up</span>
        </span>
      );
    }
    if (out !== '') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold shadow-xs">
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

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-center w-14">#</th>
                <th className="px-5 py-3.5 font-semibold text-center w-28">Actions</th>
                <th className="px-5 py-3.5 font-semibold">Lead / Exporter</th>
                <th className="px-5 py-3.5 font-semibold w-48 text-center">Location & Pincode</th>
                <th className="px-5 py-3.5 font-semibold text-center w-36">Status</th>
                <th className="px-5 py-3.5 font-semibold text-center w-36">AI Win Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {currentData.map((lead, index) => (
                <tr 
                  key={lead.id} 
                  onClick={() => allowEdit && setSelectedLead(lead)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="px-5 py-3.5 text-center text-slate-400 font-semibold text-xs tabular-nums">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      {allowEdit && (
                        <button 
                          onClick={() => setSelectedLead(lead)} 
                          className="p-1.5 border border-blue-200 hover:bg-blue-100/60 text-blue-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                          title="Edit Lead"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        className="p-1.5 border border-rose-200 hover:bg-rose-100/60 text-rose-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 text-sm tracking-tight transition-colors">
                      {lead.exporterName || 'Unknown Exporter'}
                    </div>
                    <div className="text-xs text-slate-500 font-normal mt-0.5 truncate max-w-md">
                      {lead.address || 'No address registered'}
                    </div>
                  </td>
                  
                  <td className="px-5 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-xs font-semibold text-slate-700">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{lead.pincode || 'N/A'}</span>
                    </div>
                    {lead.division && (
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{lead.division}</div>
                    )}
                  </td>
                  
                  <td className="px-5 py-3.5 text-center">
                    {getOutcomeBadge(lead.meetingOutcome, lead.contractId)}
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    {getWinScoreBadge(lead.win_probability ?? lead.winProbability)}
                  </td>
                </tr>
              ))}
              
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
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

      {/* Pagination Controls */}
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
        />
      )}
    </div>
  );
}
