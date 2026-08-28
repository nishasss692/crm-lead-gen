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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operational Data</h2>
              <div className="w-px h-6 bg-slate-300 hidden md:block"></div>
              <div className="relative">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full sm:w-48 bg-white/70 border-none text-slate-800 text-sm font-semibold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer appearance-none hover:bg-white transition-all"
                >
                  <option value="">All Divisions</option>
                  {DIVISIONS.map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={handleExportCSV} className="flex items-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading data...</p>
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
