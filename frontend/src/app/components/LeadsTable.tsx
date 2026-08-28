'use client';
import React, { useState, useMemo } from 'react';
import UpdateLeadModal from './UpdateLeadModal';
import { Edit, Trash2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Lead {
  id: number;
  slNo: number;
  exporterName: string;
  address: string;
  pincode: string;
  divisionId: string;
  division: string;
  region: string;
  assignedMeName: string;
  dateOfMeeting: string;
  customerMet: string;
  contactNumber: string;
  email: string;
  serviceUsing: string;
  monthlyVolume: number;
  meetingOutcome: string;
  contractId: string;
  remarks: string;
}

interface LeadsTableProps {
  data: Lead[];
  allowEdit?: boolean;
}

export default function LeadsTable({ data, allowEdit = true }: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
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

  const getOutcomeBadge = (outcome: string, hasContract: string) => {
    const out = (outcome || '').trim().toLowerCase();
    const contract = !!(hasContract || '').trim();
    
    if (contract) return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">Onboarded</span>;
    if (out === 'positive') return <span className="px-3 py-1 bg-emerald-100 text-[#2E7D32] rounded-full text-xs font-bold">Interested</span>;
    if (out === 'not interested') return <span className="px-3 py-1 bg-red-100 text-[#D1242F] rounded-full text-xs font-bold">Not Interested</span>;
    if (out === 'followup') return <span className="px-3 py-1 bg-orange-100 text-[#F7941D] rounded-full text-xs font-bold">Follow-up</span>;
    if (out !== '') return <span className="px-3 py-1 bg-blue-100 text-[#1565C0] rounded-full text-xs font-bold">Contacted</span>;
    
    return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Pending</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-left text-sm">
            <thead style={{ background: 'linear-gradient(135deg, #1B2A4A, #243B6A)' }} className="text-white uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-bold text-center w-16">Ser</th>
                <th className="px-6 py-4 font-bold text-center w-32">Action</th>
                <th className="px-6 py-4 font-bold">Lead / Exporter</th>
                <th className="px-6 py-4 font-bold w-48 text-center">Location & Pincode</th>
                <th className="px-6 py-4 font-bold text-center w-36">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentData.map((lead, index) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-all duration-200 hover:shadow-[inset_4px_0_0_0_#D1242F]">
                  <td className="px-6 py-4 text-center text-slate-500 font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {allowEdit && (
                        <button 
                          onClick={() => setSelectedLead(lead)} 
                          className="px-2.5 py-1.5 border border-[#1565C0]/30 text-[#1565C0] hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button className="px-2.5 py-1.5 border border-red-200 text-[#D1242F] hover:bg-red-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {allowEdit ? (
                      <button 
                        onClick={() => setSelectedLead(lead)} 
                        className="font-bold text-[#1B2A4A] hover:text-[#D1242F] hover:underline text-sm sm:text-base text-left block w-full truncate max-w-lg transition-colors"
                      >
                        {lead.exporterName || 'Unknown Exporter'}
                      </button>
                    ) : (
                      <div className="font-bold text-slate-800 text-base text-left block w-full truncate max-w-lg">
                        {lead.exporterName || 'Unknown Exporter'}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1 truncate max-w-lg">
                      {lead.address || 'No address provided'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-semibold text-slate-700">
                      <MapPin className="w-3 h-3 text-[#D1242F]" />
                      <span>{lead.pincode || 'N/A'}</span>
                    </div>
                    {lead.division && (
                      <div className="text-[11px] text-slate-400 font-medium mt-1">{lead.division}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {getOutcomeBadge(lead.meetingOutcome, lead.contractId)}
                  </td>
                </tr>
              ))}
              
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span>No leads found matching your criteria.</span>
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
        <div className="flex items-center justify-between px-2 text-sm text-slate-600 font-medium mt-2">
          <p>
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, data.length)}</span> of <span className="font-semibold text-slate-900">{data.length}</span> entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1 text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1 text-xs font-bold"
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
