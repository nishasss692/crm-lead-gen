import React, { useState, useMemo } from 'react';
import UpdateLeadModal from './UpdateLeadModal';

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
        // Ideally we refetch or mutate the local state here.
        // For simplicity, we just reload the page to get fresh data
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
    
    if (contract) return <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold">Onboarded</span>;
    if (out === 'positive') return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Interested</span>;
    if (out === 'not interested') return <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">Not Interested</span>;
    if (out === 'followup') return <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-bold">Follow-up</span>;
    if (out !== '') return <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-bold">Contacted</span>;
    
    return <span className="px-3 py-1 bg-emerald-100/50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">Pending</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#113254] text-white uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-bold text-center w-16">Ser</th>
                <th className="px-6 py-4 font-bold text-center w-32">Action</th>
                <th className="px-6 py-4 font-bold">Lead / Exporter</th>
                <th className="px-6 py-4 font-bold w-48 text-center">Location</th>
                <th className="px-6 py-4 font-bold text-center w-32">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentData.map((lead, index) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-center text-slate-500 font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {allowEdit && (
                        <button onClick={() => setSelectedLead(lead)} className="px-3 py-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded text-xs font-bold transition-colors">
                          Edit
                        </button>
                      )}
                      <button className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded text-xs font-bold transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {allowEdit ? (
                      <button 
                        onClick={() => setSelectedLead(lead)} 
                        className="font-bold text-[#113254] hover:text-indigo-700 hover:underline text-base text-left block w-full truncate max-w-lg transition-colors"
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
                    <div className="text-slate-400">—</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">{lead.pincode || 'N/A'}</div>
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
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1 font-semibold"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1 font-semibold"
            >
              Next
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
