'use client';
import React, { useMemo } from 'react';
import { Lead } from './LeadsTable';
import { MapPin, Download, Building } from 'lucide-react';

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
        st.notWilling += 1;
      } else if (outcome === 'followup') {
        st.followUp += 1;
      }

      if (hasContract && outcome !== 'positive') {
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
    <div className="glass-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover-lift animate-fade-in-up">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#D1242F]">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Pincode & Post Office Performance</h3>
            <p className="text-xs text-slate-500 font-medium">Regional delivery & lead distribution across postal codes</p>
          </div>
        </div>
        <button 
          onClick={handleExport} 
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #D1242F, #B01E28)' }}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #1B2A4A, #243B6A)' }} className="text-white text-xs font-bold uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-6 whitespace-nowrap">Pincode / PO</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Total</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Pending</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Contacted</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Interested</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Not Interested</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Follow-up</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Willing</th>
              <th scope="col" className="py-3.5 px-3 text-center whitespace-nowrap">Onboarded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.map((row, idx) => (
              <tr key={row.pincode} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{row.pincode}</div>
                      <div className="text-[11px] text-slate-400 font-medium">Karnataka Circle</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-xs font-bold">{row.total}</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-semibold">{row.pending}</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-blue-50 text-[#1565C0] rounded-md text-xs font-semibold">{row.contacted}</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-emerald-50 text-[#2E7D32] rounded-md text-xs font-semibold">{row.interested}</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-red-50 text-[#D1242F] rounded-md text-xs font-semibold">{row.notInterested}</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-orange-50 text-[#F7941D] rounded-md text-xs font-semibold">{row.followUp}</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-teal-50 text-[#00897B] rounded-md text-xs font-semibold">{row.willing}</span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-xs font-bold">{row.onboarded}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
