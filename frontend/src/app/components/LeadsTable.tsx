'use client';
import React, { useState, useMemo } from 'react';

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
}

export default function LeadsTable({ data }: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const handleBlur = async (id: number, field: string, value: string | number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) console.error('Failed to update lead');
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const inputStyles = "w-full bg-white/50 border border-slate-200/50 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white rounded-md px-2 py-1.5 text-sm outline-none transition-all duration-200 text-slate-700 shadow-sm backdrop-blur-sm";
  const selectStyles = "w-full bg-white/50 border border-slate-200/50 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white rounded-md px-1 py-1.5 text-sm cursor-pointer outline-none transition-all duration-200 text-slate-700 shadow-sm backdrop-blur-sm";

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-slate-50/20 pointer-events-none" />
        
        <div className="overflow-x-auto relative z-10 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
            <thead className="bg-slate-900/5 backdrop-blur-sm text-slate-600 border-b border-slate-200/60 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-5 py-4 font-semibold">SL No</th>
                <th className="px-5 py-4 font-semibold">Exporter Name</th>
                <th className="px-5 py-4 font-semibold">Address</th>
                <th className="px-5 py-4 font-semibold">PINCODE</th>
                <th className="px-5 py-4 font-semibold">Division</th>
                <th className="px-5 py-4 font-semibold">Assigned ME</th>
                <th className="px-5 py-4 font-semibold">Date of Meeting</th>
                <th className="px-5 py-4 font-semibold">Customer Met</th>
                <th className="px-5 py-4 font-semibold">Contact</th>
                <th className="px-5 py-4 font-semibold">Service</th>
                <th className="px-5 py-4 font-semibold">Volume</th>
                <th className="px-5 py-4 font-semibold">Outcome</th>
                <th className="px-5 py-4 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-700">
              {currentData.map((lead) => (
                <tr key={lead.id} className="hover:bg-indigo-50/40 transition-colors duration-200 group">
                  <td className="px-5 py-3 text-slate-500 font-medium">{lead.slNo}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{lead.exporterName}</td>
                  <td className="px-5 py-3 max-w-[180px] truncate" title={lead.address}>{lead.address}</td>
                  <td className="px-5 py-3">{lead.pincode}</td>
                  <td className="px-5 py-3 font-medium text-indigo-900/70">{lead.division}</td>
                  <td className="px-5 py-3 text-slate-600">{lead.assignedMeName}</td>
                  
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      defaultValue={lead.dateOfMeeting}
                      onBlur={(e) => handleBlur(lead.id, 'dateOfMeeting', e.target.value)}
                      className={inputStyles}
                    />
                  </td>
                  <td className="px-5 py-3">{lead.customerMet}</td>
                  <td className="px-3 py-2">
                    <input
                      type="tel"
                      maxLength={10}
                      defaultValue={lead.contactNumber}
                      onBlur={(e) => handleBlur(lead.id, 'contactNumber', e.target.value)}
                      className={inputStyles}
                      placeholder="1234567890"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      defaultValue={lead.serviceUsing}
                      onBlur={(e) => handleBlur(lead.id, 'serviceUsing', e.target.value)}
                      className={selectStyles}
                    >
                      <option value=""></option>
                      <option value="DHL">DHL</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="Aramex">Aramex</option>
                      <option value="Others">Others</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      defaultValue={lead.monthlyVolume}
                      onBlur={(e) => handleBlur(lead.id, 'monthlyVolume', Number(e.target.value))}
                      className={inputStyles}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      defaultValue={lead.meetingOutcome}
                      onBlur={(e) => handleBlur(lead.id, 'meetingOutcome', e.target.value)}
                      className={selectStyles}
                    >
                      <option value=""></option>
                      <option value="Positive">Positive</option>
                      <option value="Followup">Followup</option>
                      <option value="Not interested">Not interested</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 max-w-[180px] truncate text-slate-500" title={lead.remarks}>{lead.remarks}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-5 py-12 text-center text-slate-500">
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
        <div className="flex items-center justify-between px-2 text-sm text-slate-600 font-medium">
          <p>
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, data.length)}</span> of <span className="font-semibold text-slate-900">{data.length}</span> entries
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1 font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Prev
            </button>
            
            <div className="flex items-center px-4 font-semibold text-slate-700 bg-white/50 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-1 font-semibold"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
