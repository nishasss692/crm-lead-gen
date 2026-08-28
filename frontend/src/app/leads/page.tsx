'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LeadsTable, { Lead } from '../components/LeadsTable';

const DIVISIONS = [
  "Bagalkot", "Ballari", "Belagavi", "BG East", "BG GPO", "BG South", "BG West", 
  "Bidar", "Channapatna", "Chikkamagaluru", "Chikodi", "Chitradurga", "Davanagere", 
  "Dharwad", "Gadag", "Gokak", "Hassan", "Haveri", "Kalaburagi", "Karwar", "Kodagu", 
  "Kolar", "Mandya", "Mangaluru", "Mysuru", "Nanjangud", "Puttur", "Raichur", 
  "Shimoga", "Sirsi", "Tumkur", "Udupi", "Vijayapura", "Yadgir"
];

export default function LeadsPage() {
  const [selectedDivision, setSelectedDivision] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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
    a.download = 'leads_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/leads`);
        if (res.ok) {
           const data = await res.json();
           const formattedData = data.map((item: any) => ({
             id: item.id, slNo: item.sl_no, exporterName: item.exporter_name, address: item.address,
             pincode: item.pincode, divisionId: item.division_id, division: item.division,
             region: item.region, assignedMeName: item.assigned_agent, dateOfMeeting: item.date_of_meeting,
             customerMet: item.customer_met, contactNumber: item.contact_number, email: item.email,
             serviceUsing: item.service_using, monthlyVolume: item.monthly_volume, meetingOutcome: item.meeting_outcome,
             contractId: item.contract_id, remarks: item.remarks
           }));
           setLeads(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch leads", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [searchTerm, setSearchTerm] = useState('');

  let filtered = selectedDivision ? leads.filter(d => d.division === selectedDivision) : leads;

  if (statusFilter) {
    filtered = filtered.filter(lead => {
      const outcome = (lead.meetingOutcome || '').trim().toLowerCase();
      const hasContract = !!(lead.contractId || '').trim();
      
      switch (statusFilter) {
        case 'pending':
          return outcome === '';
        case 'contacted':
          return outcome !== '';
        case 'followup':
          return outcome === 'followup';
        case 'interested':
          return outcome === 'positive';
        case 'willing':
          return outcome === 'positive' && !hasContract;
        case 'onboarded':
          return hasContract;
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
      (lead.id || '').toString().includes(term)
    );
  }

  const getTitle = () => {
    switch (statusFilter) {
      case 'pending': return 'Contact pending';
      case 'contacted': return 'Contacted';
      case 'followup': return 'Follow-up Required';
      case 'interested': return 'Interested';
      case 'willing': return 'Willing to onboard';
      case 'onboarded': return 'Onboarded';
      default: return 'All Leads';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="mb-2">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lead Workspace</h3>
          <h1 className="text-3xl font-extrabold text-[#113254] tracking-tight">{getTitle()}</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">{filtered.length.toLocaleString()} records matching the selected filters</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto flex-1">
             <div className="relative w-full sm:max-w-[200px]">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer appearance-none"
                >
                  <option value="">All Divisions</option>
                  {DIVISIONS.map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
             </div>
             
             <div className="relative w-full sm:flex-1 max-w-lg">
                <input
                  type="text"
                  placeholder="Search exporter, address, lead ID, pincode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center px-8 py-2.5 bg-[#d1242f] text-white rounded-xl text-sm font-bold shadow-md hover:bg-rose-700 transition-colors active:scale-95">
              Load
            </button>
            <button onClick={handleExportCSV} className="flex items-center px-4 py-2.5 bg-[#1e4b85] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#113254] transition-colors gap-2 active:scale-95">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-[#155a8f] rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading workspace...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <LeadsTable data={filtered} />
          </div>
        )}
        
      </div>
    </main>
  );
}
