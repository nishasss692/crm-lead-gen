import React, { useState } from 'react';
import { Lead } from './LeadsTable';
import { X } from 'lucide-react';

interface UpdateLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Lead>) => Promise<void>;
}

export default function UpdateLeadModal({ lead, onClose, onSave }: UpdateLeadModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    address: lead.address,
    pincode: lead.pincode,
    division: lead.division,
    region: lead.region,
    assignedMeName: lead.assignedMeName,
    customerMet: lead.customerMet,
    contactNumber: lead.contactNumber,
    email: lead.email,
    serviceUsing: lead.serviceUsing,
    monthlyVolume: lead.monthlyVolume,
    meetingOutcome: lead.meetingOutcome,
    contractId: lead.contractId,
    remarks: lead.remarks,
    dateOfMeeting: lead.dateOfMeeting,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(lead.id, formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-full animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Update lead</h2>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">{lead.exporterName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar bg-slate-50/30">
          <form id="update-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Location Section */}
            <section>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Address</label>
                  <input type="text" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pincode</label>
                  <input type="text" value={formData.pincode || ''} onChange={e => handleChange('pincode', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Division</label>
                  <input type="text" value={formData.division || ''} onChange={e => handleChange('division', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Region</label>
                  <input type="text" value={formData.region || ''} onChange={e => handleChange('region', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Contact Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Met</label>
                  <input type="text" value={formData.customerMet || ''} onChange={e => handleChange('customerMet', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Number</label>
                  <input type="text" value={formData.contactNumber || ''} onChange={e => handleChange('contactNumber', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </section>

            {/* Business Section */}
            <section>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned ME</label>
                  <input type="text" value={formData.assignedMeName || ''} onChange={e => handleChange('assignedMeName', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Service Using</label>
                  <select value={formData.serviceUsing || ''} onChange={e => handleChange('serviceUsing', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm">
                    <option value=""></option>
                    <option value="DHL">DHL</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="Aramex">Aramex</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Monthly Volume</label>
                  <input type="number" value={formData.monthlyVolume || 0} onChange={e => handleChange('monthlyVolume', Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Meeting</label>
                  <input type="date" value={formData.dateOfMeeting || ''} onChange={e => handleChange('dateOfMeeting', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Meeting Outcome</label>
                  <select value={formData.meetingOutcome || ''} onChange={e => handleChange('meetingOutcome', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm">
                    <option value=""></option>
                    <option value="Positive">Positive</option>
                    <option value="Followup">Followup</option>
                    <option value="Not interested">Not interested</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contract ID</label>
                  <input type="text" value={formData.contractId || ''} onChange={e => handleChange('contractId', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" />
                </div>
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks</label>
                  <textarea rows={2} value={formData.remarks || ''} onChange={e => handleChange('remarks', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm resize-none"></textarea>
                </div>
              </div>
            </section>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            Cancel
          </button>
          <button type="submit" form="update-form" disabled={saving} className="px-6 py-2.5 bg-[#d1242f] hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-70">
            {saving ? 'Saving...' : 'Save Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
