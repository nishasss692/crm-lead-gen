import React, { useMemo } from 'react';
import { Lead } from './LeadsTable';

interface PincodeStats {
  pincode: string;
  total: number;
  pending: number;
  contacted: number;
  interested: number;
  notInterested: number;
  followUp: number;
  willing: number;
  notWilling: number;
  onboarded: number;
}

export default function PincodePerformanceTable({ leads }: { leads: Lead[] }) {
  const stats = useMemo(() => {
    const map = new Map<string, PincodeStats>();

    leads.forEach(lead => {
      const pin = lead.pincode || 'Unknown';
      if (!map.has(pin)) {
        map.set(pin, {
          pincode: pin,
          total: 0, pending: 0, contacted: 0, interested: 0, 
          notInterested: 0, followUp: 0, willing: 0, notWilling: 0, onboarded: 0
        });
      }
      
      const st = map.get(pin)!;
      st.total += 1;
      
      const outcome = (lead.meetingOutcome || '').trim().toLowerCase();
      const hasContract = !!(lead.contractId || '').trim();

      if (!outcome) {
        st.pending += 1;
      } else {
        st.contacted += 1;
      }

      if (outcome === 'positive') {
        st.interested += 1;
        if (hasContract) {
          st.onboarded += 1;
        } else {
          st.willing += 1;
        }
      } else if (outcome === 'not interested') {
        st.notInterested += 1;
        st.notWilling += 1; // Assuming not interested means not willing to onboard
      } else if (outcome === 'followup') {
        st.followUp += 1;
      }

      if (hasContract && outcome !== 'positive') {
         // Fallback if they have a contract but weren't marked positive
         st.onboarded += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [leads]);

  if (stats.length === 0) return null;

  const handleExport = () => {
    const headers = [
      "PINCODE", "TOTAL", "PENDING", "CONTACTED", "INTERESTED", 
      "NOT INTERESTED", "FOLLOW-UP REQUIRED", "WILLING TO ONBOARD", 
      "NOT WILLING TO ONBOARD", "ONBOARDED"
    ].join(',');
    
    const rows = stats.map(s => 
      [s.pincode, s.total, s.pending, s.contacted, s.interested, 
       s.notInterested, s.followUp, s.willing, s.notWilling, s.onboarded].join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pincode_performance.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Geography</h3>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pincode performance</h2>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-[#d1242f] hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-[#155a8f] text-white">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">Pincode / PO</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Total</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Pending</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Contacted</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Interested</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Not Interested</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Follow-up Required</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Willing to Onboard</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Not Willing to Onboard</th>
              <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Onboarded</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {stats.map((row) => (
              <tr key={row.pincode} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-slate-800">{row.pincode}</div>
                  <div className="text-[10px] text-slate-400 font-medium">#N/A</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center font-medium text-slate-700">{row.total}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.pending}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.contacted}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.interested}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.notInterested}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.followUp}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.willing}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.notWilling}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-slate-600">{row.onboarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
