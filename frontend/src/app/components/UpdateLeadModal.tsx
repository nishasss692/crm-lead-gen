'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead } from './LeadsTable';
import { X, Check } from 'lucide-react';

interface UpdateLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Lead>) => Promise<void>;
}

// Post Office mapping for quick selection based on pincode
const PINCODE_OFFICES: Record<string, string[]> = {
  "560092": ["Sahakarnagar SO", "Hebbal Agricultural Farm SO", "Kodigehalli BO", "Byatarayanapura SO"],
  "560001": ["Bengaluru GPO", "Raj Bhavan SO", "Vidhana Soudha SO"],
  "560002": ["Bengaluru City SO", "Dharmaram College SO"],
  "560004": ["Basavanagudi SO", "Pampa Mahakavi Road SO"],
  "560010": ["Rajajinagar SO", "Industrial Estate SO"],
  "560025": ["Museum Road SO", "Ashoknagar SO"],
  "560034": ["Koramangala SO", "St. Johns Medical College SO"],
  "560038": ["Indiranagar SO", "HAL II Stage SO"],
  "560066": ["Whitefield SO", "Kadugodi SO"],
  "560068": ["Madivala SO", "Bommanahalli SO"],
  "570001": ["Mysuru Head Post Office", "Mysuru Fort SO"],
  "575001": ["Mangaluru Head Post Office", "Hampankatta SO"],
  "580001": ["Dharwad Head Post Office"],
  "590001": ["Belagavi Head Post Office", "Camp Belagavi SO"],
};

export default function UpdateLeadModal({ lead, onClose, onSave }: UpdateLeadModalProps) {
  const [formData, setFormData] = useState({
    assignedMeName: lead.assignedMeName || 'Testing1',
    meMobile: '9000000001',
    dateOfMeeting: lead.dateOfMeeting || new Date().toISOString().split('T')[0],
    exporterName: lead.exporterName || '',
    address: lead.address || '',
    pincode: lead.pincode || '560092',
    poName: '',
    customerMet: lead.customerMet || '',
    contactNumber: lead.contactNumber || '',
    alternativeNumber: '',
    email: lead.email || '',
    productType: '',
    serviceUsing: lead.serviceUsing || '',
    monthlyVolume: lead.monthlyVolume || '',
    meetingOutcome: lead.meetingOutcome || '',
    willingToOnboard: '',
    contractId: lead.contractId || '',
    remarks: lead.remarks || '',
    division: lead.division || '',
    region: lead.region || '',
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background body scrolling when modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Map form fields to backend Lead schema
      const updates: Partial<Lead> = {
        exporterName: formData.exporterName,
        address: formData.address,
        pincode: formData.pincode,
        division: formData.division,
        region: formData.region,
        assignedMeName: formData.assignedMeName,
        customerMet: formData.customerMet,
        contactNumber: formData.contactNumber,
        email: formData.email,
        serviceUsing: formData.serviceUsing,
        monthlyVolume: formData.monthlyVolume,
        meetingOutcome: formData.meetingOutcome || (formData.willingToOnboard === 'Yes' ? 'Willing to onboard' : ''),
        contractId: formData.contractId,
        remarks: formData.remarks,
        dateOfMeeting: formData.dateOfMeeting,
      };

      await onSave(lead.id, updates);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      console.error('Failed to save lead contact outcome:', err);
    } finally {
      setSaving(false);
    }
  };

  // Get PO names for selected or typed pincode
  const availableOffices = PINCODE_OFFICES[formData.pincode] || [
    `Post Office - ${formData.pincode || 'Select'}`
  ];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Dark Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[1080px] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 overflow-hidden font-sans my-auto">
        
        {/* Top Decorative Border */}
        <div className="h-1 bg-[#b91c1c] w-full shrink-0" />

        {/* Header Section */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between bg-white shrink-0">
          <div>
            <span className="text-[11px] font-black tracking-wider uppercase text-[#b91c1c] block leading-none">
              CONTACT OUTCOME
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#1e3a8a] tracking-tight mt-1 leading-none">
              Update lead
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Separator line below header */}
        <div className="h-[1px] bg-slate-200 mx-6 shrink-0" />

        {/* Scrollable / Directly viewable Form Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 custom-scrollbar">
          <form id="update-lead-form" onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* ROW 1: Assigned ME, ME mobile, Contacted date, Exporter name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Assigned ME</label>
                <select 
                  value={formData.assignedMeName} 
                  onChange={e => handleChange('assignedMeName', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="Testing1">Testing1</option>
                  <option value="ME_MYS_01">ME_MYS_01</option>
                  <option value="me_user">me_user</option>
                  <option value="ME1">ME1</option>
                  <option value="ME2">ME2</option>
                  <option value="ME3">ME3</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">ME mobile</label>
                <input 
                  type="text" 
                  value={formData.meMobile} 
                  onChange={e => handleChange('meMobile', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#1e3a8a] outline-none shadow-2xs font-mono" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Contacted date</label>
                <input 
                  type="date" 
                  value={formData.dateOfMeeting} 
                  onChange={e => handleChange('dateOfMeeting', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Exporter name</label>
                <input 
                  type="text" 
                  value={formData.exporterName} 
                  onChange={e => handleChange('exporterName', e.target.value)}
                  placeholder="Exporter Business Name"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 uppercase focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>
            </div>

            {/* ROW 2: Exporter address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Exporter address</label>
              <textarea 
                rows={2} 
                value={formData.address} 
                onChange={e => handleChange('address', e.target.value)}
                placeholder="Full street address, building name, road, city, state"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs resize-none" 
              />
            </div>

            {/* ROW 3: Pincode, PO Name, Contact person, Contact number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Pincode</label>
                <input 
                  type="text" 
                  value={formData.pincode} 
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="6-digit PIN"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">PO Name</label>
                <select 
                  value={formData.poName} 
                  onChange={e => handleChange('poName', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select PO Name</option>
                  {availableOffices.map((office, i) => (
                    <option key={i} value={office}>{office}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-tight">
                  Multiple post offices use this pincode. Select the correct PO Name.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Contact person</label>
                <input 
                  type="text" 
                  value={formData.customerMet} 
                  onChange={e => handleChange('customerMet', e.target.value)}
                  placeholder="Key Contact / Customer Met"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Contact number</label>
                <input 
                  type="text" 
                  value={formData.contactNumber} 
                  onChange={e => handleChange('contactNumber', e.target.value)}
                  placeholder="Primary Phone Number"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>
            </div>

            {/* ROW 4: Alternative number, Email, Product type, Current provider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Alternative number</label>
                <input 
                  type="text" 
                  value={formData.alternativeNumber} 
                  onChange={e => handleChange('alternativeNumber', e.target.value)}
                  placeholder="Optional Alternate Phone"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="exporter@domain.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Product type</label>
                <input 
                  type="text" 
                  value={formData.productType} 
                  onChange={e => handleChange('productType', e.target.value)}
                  placeholder="e.g. Handicrafts, Textiles, Books"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Current provider</label>
                <select 
                  value={formData.serviceUsing} 
                  onChange={e => handleChange('serviceUsing', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select Provider</option>
                  <option value="DHL">DHL</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="Aramex">Aramex</option>
                  <option value="Speed Post B2B">Speed Post B2B</option>
                  <option value="Business Parcel">Business Parcel</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            {/* ROW 5: Monthly volume (₹), Outcome, Willing to onboard, Contract ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Monthly volume (₹)</label>
                <input 
                  type="text" 
                  value={formData.monthlyVolume} 
                  onChange={e => handleChange('monthlyVolume', e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Outcome</label>
                <select 
                  value={formData.meetingOutcome} 
                  onChange={e => handleChange('meetingOutcome', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select Outcome</option>
                  <option value="Pending">Pending</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Positive">Positive</option>
                  <option value="Followup">Follow-up</option>
                  <option value="Willing to onboard">Willing to onboard</option>
                  <option value="Onboarded">Onboarded</option>
                  <option value="Not interested">Not interested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Willing to onboard</label>
                <select 
                  value={formData.willingToOnboard} 
                  onChange={e => {
                    const val = e.target.value;
                    handleChange('willingToOnboard', val);
                    if (val === 'Yes' && !formData.meetingOutcome) {
                      handleChange('meetingOutcome', 'Willing to onboard');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Under Consideration">Under Consideration</option>
                  <option value="Pending Decision">Pending Decision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Contract ID</label>
                <input 
                  type="text" 
                  value={formData.contractId} 
                  onChange={e => handleChange('contractId', e.target.value)}
                  placeholder="Enter Contract ID if already created"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>
            </div>

            {/* ROW 6: Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Remarks</label>
              <textarea 
                rows={2} 
                value={formData.remarks} 
                onChange={e => handleChange('remarks', e.target.value)}
                placeholder="Meeting discussion notes, discount requests, follow up dates..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs resize-none" 
              />
            </div>

          </form>
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 mr-auto flex items-center gap-1">
              <Check className="w-4 h-4" /> Lead saved successfully!
            </span>
          )}

          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="update-lead-form" 
            disabled={saving} 
            className="px-6 py-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white rounded-lg text-xs font-bold shadow-md shadow-red-700/20 transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save contact outcome →'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
