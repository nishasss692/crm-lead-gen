'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface Lead {
  id: string;
  sl_no?: number | string;
  exporter_name?: string;
  address?: string;
  pincode?: string;
  division_id?: string;
  division_name?: string;
  region?: string;
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
  const [modifiedLeads, setModifiedLeads] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalLeads(leads);
    setModifiedLeads(new Set());
  }, [leads]);

  const handleSaveAll = async () => {
    if (modifiedLeads.size === 0) return;
    
    setIsSaving(true);
    let successCount = 0;
    
    try {
      const promises = Array.from(modifiedLeads).map(async (id) => {
        const leadToSave = localLeads.find(l => l.id === id);
        if (!leadToSave) return;
        
        // Find the diff to only send changed fields
        const originalLead = leads.find(l => l.id === id) || {};
        const changedFields: any = {};
        for (const key of Object.keys(leadToSave)) {
          if (leadToSave[key] !== originalLead[key]) {
            changedFields[key] = leadToSave[key];
          }
        }

        if (Object.keys(changedFields).length === 0) return;

        const response = await fetch(`http://localhost:8000/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changedFields),
        });
        
        if (!response.ok) throw new Error(`Failed to update lead ${id}`);
        successCount++;
      });
      
      await Promise.all(promises);
      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} leads`);
      } else {
        toast.success('No changes needed saving');
      }
      setModifiedLeads(new Set());
      onLeadUpdated();
    } catch (err) {
      console.error(err);
      toast.error('Some updates failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (id: string, field: string, value: any) => {
    setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    setModifiedLeads(prev => new Set(prev).add(id));
  };

  const handlePhoneKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete') {
      e.preventDefault();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading leads...</div>;
  }

  if (localLeads.length === 0) {
    return <div className="p-8 text-center text-slate-500 font-medium">No leads found.</div>;
  }

  const inputClasses = "w-full min-w-[120px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all";
  const selectClasses = "w-full min-w-[120px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all";
  const readonlyClasses = "px-4 py-2 min-w-[100px] text-slate-600 truncate max-w-[200px]";

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-end px-2">
        <button
          onClick={handleSaveAll}
          disabled={modifiedLeads.size === 0 || isSaving}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">
            {isSaving ? 'sync' : 'save'}
          </span>
          {isSaving ? 'Saving...' : `Save Changes (${modifiedLeads.size})`}
        </button>
      </div>
      <div className="w-full overflow-x-auto shadow-sm border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">SL No</th>
              <th className="px-4 py-3">Exporter Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">PINCODE</th>
              <th className="px-4 py-3">Division ID</th>
              <th className="px-4 py-3">Division</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Assigned To (ME)</th>
              <th className="px-4 py-3">Date of Meeting</th>
              <th className="px-4 py-3">Customer Met</th>
              <th className="px-4 py-3">Contact No.</th>
              <th className="px-4 py-3">Email ID</th>
              <th className="px-4 py-3">Service Using</th>
              <th className="px-4 py-3">Monthly Vol (Rs)</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Contract ID</th>
              <th className="px-4 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {localLeads.map((lead, idx) => {
              const isModified = modifiedLeads.has(lead.id);
              return (
                <tr key={lead.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-50'} ${isModified ? 'bg-blue-50/30' : ''}`}>
                  {/* Read-Only Columns */}
                  <td className={readonlyClasses} title={lead.sl_no?.toString()}>{lead.sl_no || '-'}</td>
                  <td className={readonlyClasses} title={lead.exporter_name}>{lead.exporter_name || '-'}</td>
                  <td className={readonlyClasses} title={lead.address}>{lead.address || '-'}</td>
                  <td className={readonlyClasses} title={lead.pincode}>{lead.pincode || '-'}</td>
                  <td className={readonlyClasses} title={lead.division_id}>{lead.division_id || '-'}</td>
                  <td className={readonlyClasses} title={lead.division_name}>{lead.division_name || '-'}</td>
                  <td className={readonlyClasses} title={lead.region}>{lead.region || '-'}</td>

                  {/* Editable Columns */}
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      className={inputClasses}
                      value={lead.assigned_agent_name || ''} 
                      onChange={(e) => handleChange(lead.id, 'assigned_agent_name', e.target.value)}
                    />
                  </td>
                  
                  <td className="px-2 py-2">
                    <input 
                      type="date" 
                      className={inputClasses}
                      value={lead.date_of_meeting || ''} 
                      onChange={(e) => handleChange(lead.id, 'date_of_meeting', e.target.value)}
                    />
                  </td>
                  
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      maxLength={100}
                      className={inputClasses}
                      value={lead.customer_met_name || ''} 
                      onChange={(e) => handleChange(lead.id, 'customer_met_name', e.target.value)}
                    />
                  </td>
                  
                  <td className="px-2 py-2">
                    <input 
                      type="tel"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="10-digit number"
                      onKeyDown={handlePhoneKeyPress}
                      className={inputClasses}
                      value={lead.contact_number || ''} 
                      onChange={(e) => handleChange(lead.id, 'contact_number', e.target.value)}
                    />
                  </td>
                  
                  <td className="px-2 py-2">
                    <input 
                      type="email" 
                      className={inputClasses}
                      value={lead.email_id || ''} 
                      onChange={(e) => handleChange(lead.id, 'email_id', e.target.value)}
                    />
                  </td>
                  
                  <td className="px-2 py-2">
                    <select
                      className={selectClasses}
                      value={lead.service_presently_using || ''}
                      onChange={(e) => handleChange(lead.id, 'service_presently_using', e.target.value)}
                    >
                      <option value=""></option>
                      <option value="DHL">DHL</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="Aramex">Aramex</option>
                      <option value="Others">Others</option>
                    </select>
                  </td>
                  
                  <td className="px-2 py-2">
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      className={inputClasses}
                      value={lead.monthly_appx_volume || ''} 
                      onChange={(e) => handleChange(lead.id, 'monthly_appx_volume', e.target.value)}
                    />
                  </td>
                  
                  <td className="px-2 py-2">
                    <select
                      className={selectClasses}
                      value={lead.meeting_outcome || ''}
                      onChange={(e) => handleChange(lead.id, 'meeting_outcome', e.target.value)}
                    >
                      <option value=""></option>
                      <option value="Positive">Positive</option>
                      <option value="Followup">Followup</option>
                      <option value="Not interested">Not interested</option>
                    </select>
                  </td>
                  
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      maxLength={50}
                      className={inputClasses}
                      value={lead.contract_id || ''} 
                      onChange={(e) => handleChange(lead.id, 'contract_id', e.target.value)}
                    />
                  </td>
                  
                  <td className="px-2 py-2">
                    <textarea 
                      maxLength={500}
                      rows={1}
                      className={`${inputClasses} resize-y min-h-[34px]`}
                      value={lead.remarks || ''} 
                      onChange={(e) => handleChange(lead.id, 'remarks', e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
