'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface Lead {
  id: string;
  exporter_name?: string;
  address?: string;
  pincode?: string;
  assigned_agent_name?: string;
  date_of_meeting?: string;
  customer_met_name?: string;
  contact_number?: string;
  email_id?: string;
  service_presently_using?: string;
  monthly_appx_volume?: string;
  meeting_outcome?: string;
  contract_id?: string;
  remarks?: string;
  [key: string]: any;
}

interface DataGridProps {
  leads: Lead[];
  loading: boolean;
  onLeadUpdated: () => void;
}

export default function DataGrid({ leads, loading, onLeadUpdated }: DataGridProps) {
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const handleBlur = async (id: string, field: string, value: any, originalValue: any) => {
    if (value === originalValue) return;

    try {
      const response = await fetch(`http://localhost:8000/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }
      
      toast.success('Updated successfully');
      setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update');
      setLocalLeads([...leads]);
    }
  };

  const handleChange = (id: string, field: string, value: any) => {
    setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading leads...</div>;
  }

  if (localLeads.length === 0) {
    return <div className="p-8 text-center text-slate-500 font-medium">No leads found.</div>;
  }

  return (
    <div className="w-full overflow-x-auto shadow-sm border border-slate-200 rounded-xl bg-white">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Exporter Name</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">PINCODE</th>
            <th className="px-4 py-3">Assigned ME</th>
            <th className="px-4 py-3">Date of Meeting</th>
            <th className="px-4 py-3">Customer Met</th>
            <th className="px-4 py-3">Contact No.</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Service Using</th>
            <th className="px-4 py-3">Monthly Vol</th>
            <th className="px-4 py-3">Outcome</th>
            <th className="px-4 py-3">Contract ID</th>
            <th className="px-4 py-3">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {localLeads.map((lead, idx) => (
            <tr key={lead.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-50'}>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.exporter_name || ''} 
                  onChange={(e) => handleChange(lead.id, 'exporter_name', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'exporter_name', e.target.value, leads.find(l => l.id === lead.id)?.exporter_name || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[200px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.address || ''} 
                  onChange={(e) => handleChange(lead.id, 'address', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'address', e.target.value, leads.find(l => l.id === lead.id)?.address || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[100px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.pincode || ''} 
                  onChange={(e) => handleChange(lead.id, 'pincode', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'pincode', e.target.value, leads.find(l => l.id === lead.id)?.pincode || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[120px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.assigned_agent_name || ''} 
                  onChange={(e) => handleChange(lead.id, 'assigned_agent_name', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'assigned_agent_name', e.target.value, leads.find(l => l.id === lead.id)?.assigned_agent_name || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="date" 
                  className="w-full min-w-[130px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.date_of_meeting || ''} 
                  onChange={(e) => handleChange(lead.id, 'date_of_meeting', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'date_of_meeting', e.target.value, leads.find(l => l.id === lead.id)?.date_of_meeting || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[120px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.customer_met_name || ''} 
                  onChange={(e) => handleChange(lead.id, 'customer_met_name', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'customer_met_name', e.target.value, leads.find(l => l.id === lead.id)?.customer_met_name || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[120px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.contact_number || ''} 
                  onChange={(e) => handleChange(lead.id, 'contact_number', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'contact_number', e.target.value, leads.find(l => l.id === lead.id)?.contact_number || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="email" 
                  className="w-full min-w-[180px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.email_id || ''} 
                  onChange={(e) => handleChange(lead.id, 'email_id', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'email_id', e.target.value, leads.find(l => l.id === lead.id)?.email_id || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.service_presently_using || ''} 
                  onChange={(e) => handleChange(lead.id, 'service_presently_using', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'service_presently_using', e.target.value, leads.find(l => l.id === lead.id)?.service_presently_using || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[100px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.monthly_appx_volume || ''} 
                  onChange={(e) => handleChange(lead.id, 'monthly_appx_volume', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'monthly_appx_volume', e.target.value, leads.find(l => l.id === lead.id)?.monthly_appx_volume || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.meeting_outcome || ''} 
                  onChange={(e) => handleChange(lead.id, 'meeting_outcome', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'meeting_outcome', e.target.value, leads.find(l => l.id === lead.id)?.meeting_outcome || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[120px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.contract_id || ''} 
                  onChange={(e) => handleChange(lead.id, 'contract_id', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'contract_id', e.target.value, leads.find(l => l.id === lead.id)?.contract_id || '')}
                />
              </td>
              <td className="px-4 py-2">
                <input 
                  type="text" 
                  className="w-full min-w-[200px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all"
                  value={lead.remarks || ''} 
                  onChange={(e) => handleChange(lead.id, 'remarks', e.target.value)}
                  onBlur={(e) => handleBlur(lead.id, 'remarks', e.target.value, leads.find(l => l.id === lead.id)?.remarks || '')}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
