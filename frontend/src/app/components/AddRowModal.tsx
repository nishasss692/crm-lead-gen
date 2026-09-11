'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  PlusCircle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle, 
  Calendar,
  Sparkles,
  ShieldCheck,
  Truck,
  DollarSign
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolvePincodeTerritory, PINCODE_TERRITORY_CATALOG, KARNATAKA_TERRITORY_DIRECTORY } from '@/lib/karnatakaTerritory';

interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
  currentUser: any;
  divisions?: string[];
  activeDivision?: string;
}

export default function AddRowModal({
  isOpen,
  onClose,
  onLeadAdded,
  currentUser,
  divisions = [],
  activeDivision = ''
}: AddRowModalProps) {
  const isME = currentUser?.role?.toUpperCase() === 'ME' || 
               currentUser?.role?.toUpperCase() === 'MARKETING EXECUTIVE' || 
               currentUser?.role?.toUpperCase() === 'EXECUTIVE';

  const userDivision = currentUser?.assigned_division || currentUser?.division || activeDivision || 'Mysuru';
  const userRegion = currentUser?.assigned_region || currentUser?.region || (
    KARNATAKA_TERRITORY_DIRECTORY[userDivision]?.region || 'Bengaluru HQ Region'
  );

  const initialMeMobile = currentUser?.mobile_number || currentUser?.mobile || '';
  const initialMeName = isME ? (currentUser?.name || currentUser?.username || '') : '';

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    exporterName: '',
    contactNumber: '',
    customerMet: '',
    alternativeNumber: '',
    email: '',
    address: '',
    pincode: '570001',
    poName: 'Mysuru Head Post Office',
    division: userDivision,
    region: userRegion,
    assignedMeName: initialMeName,
    meMobile: initialMeMobile,
    serviceUsing: 'DHL',
    monthlyVolume: '',
    meetingOutcome: 'Interested',
    willingToOnboard: 'Willing',
    dateOfMeeting: todayStr,
    contractId: '',
    remarks: ''
  });

  const [isCustomPin, setIsCustomPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync with initial user state when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      const defaultDiv = currentUser?.assigned_division || currentUser?.division || activeDivision || 'Mysuru';
      const defaultReg = currentUser?.assigned_region || currentUser?.region || (
        KARNATAKA_TERRITORY_DIRECTORY[defaultDiv]?.region || 'Bengaluru HQ Region'
      );
      setFormData(prev => ({
        ...prev,
        division: defaultDiv,
        region: defaultReg,
        assignedMeName: isME ? (currentUser?.name || currentUser?.username || '') : prev.assignedMeName,
        meMobile: currentUser?.mobile_number || currentUser?.mobile || prev.meMobile,
        dateOfMeeting: todayStr
      }));
    }
  }, [isOpen, currentUser, activeDivision, isME, todayStr]);

  // Dynamic PO offices based on Pincode
  const sourceTerritory = useMemo(() => {
    return resolvePincodeTerritory(formData.pincode);
  }, [formData.pincode]);

  const handlePincodeSelect = (pin: string) => {
    const territory = resolvePincodeTerritory(pin);
    setFormData(prev => ({
      ...prev,
      pincode: pin,
      division: territory.division,
      region: territory.region,
      poName: territory.offices[0]?.label || prev.poName
    }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOutcomeChange = (val: string) => {
    handleChange('meetingOutcome', val);
    if (val === 'Willing' || val === 'Interested' || val === 'Onboarded') {
      handleChange('willingToOnboard', 'Willing');
    } else if (val === 'Not Willing' || val === 'Not Interested') {
      handleChange('willingToOnboard', 'Not Willing');
    } else if (val === 'Company Not Exist') {
      handleChange('willingToOnboard', 'Company Not Exist');
    }
  };

  const handleWillingChange = (val: string) => {
    handleChange('willingToOnboard', val);
    if (val === 'Willing') {
      if (['Not Interested', 'Not Willing', 'Company Not Exist'].includes(formData.meetingOutcome)) {
        handleChange('meetingOutcome', 'Willing');
      }
    } else if (val === 'Not Willing') {
      handleChange('meetingOutcome', 'Not Interested');
    } else if (val === 'Company Not Exist') {
      handleChange('meetingOutcome', 'Company Not Exist');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = formData.exporterName.trim();
    const phone = formData.contactNumber.replace(/\D/g, '').trim();

    if (!name && !phone) {
      setErrorMsg('Please provide either an Exporter Name or a Contact Number.');
      return;
    }

    if (phone && phone.length !== 10) {
      setErrorMsg('Contact number must be exactly 10 digits.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const payload = {
        exporter_name: name,
        exporterName: name,
        contact_number: phone,
        contactNumber: phone,
        customer_met: formData.customerMet.trim(),
        customerMet: formData.customerMet.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        po_name: formData.poName.trim(),
        poName: formData.poName.trim(),
        division: formData.division.trim(),
        region: formData.region.trim(),
        assigned_agent: formData.assignedMeName.trim(),
        assignedMeName: formData.assignedMeName.trim(),
        me_mobile: formData.meMobile.replace(/\D/g, '').trim(),
        meMobile: formData.meMobile.replace(/\D/g, '').trim(),
        service_using: formData.serviceUsing,
        serviceUsing: formData.serviceUsing,
        monthly_volume: formData.monthlyVolume.trim(),
        monthlyVolume: formData.monthlyVolume.trim(),
        meeting_outcome: formData.meetingOutcome,
        meetingOutcome: formData.meetingOutcome,
        willing_to_onboard: formData.willingToOnboard,
        willingToOnboard: formData.willingToOnboard,
        date_of_meeting: formData.dateOfMeeting,
        contactedDate1: formData.dateOfMeeting,
        contract_id: formData.contractId.trim(),
        contractId: formData.contractId.trim(),
        remarks: formData.remarks.trim()
      };

      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data && (data.success || data.lead)) {
        setSuccessMsg(data.message || 'Lead record added successfully!');
        onLeadAdded();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data?.detail || data?.message || 'Failed to add lead record.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error: could not contact server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#1B2A4A] to-[#28385e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-[#FAB52C] shadow-inner">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">Add New Commercial Lead</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ME Row Entry
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Quick entry for territory field meetings & client interactions
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form id="add-row-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Section 1: Business Identity */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#D1242F]" />
                <span>1. Business & Contact Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Exporter / Business Name <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.exporterName}
                    onChange={e => handleChange('exporterName', e.target.value)}
                    placeholder="e.g. Apex Exports Pvt Ltd"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Contact Number <span className="text-slate-400 font-normal">(10 Digits)</span>
                  </label>
                  <input 
                    type="tel"
                    maxLength={10}
                    value={formData.contactNumber}
                    onChange={e => handleChange('contactNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Customer Met <span className="text-slate-400 font-normal">(Contact Person)</span>
                  </label>
                  <input 
                    type="text"
                    value={formData.customerMet}
                    onChange={e => handleChange('customerMet', e.target.value)}
                    placeholder="e.g. Rajesh Kumar (MD)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Email Address</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="exporter@domain.com"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Commercial Address</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={e => handleChange('address', e.target.value)}
                    placeholder="Plot 42, Industrial Area..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Postal Territory & Post Office */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1B2A4A]" />
                  2. Territory & Postal Mapping
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsCustomPin(!isCustomPin)}
                  className="text-[11px] text-[#1e3a8a] hover:underline font-bold cursor-pointer"
                >
                  {isCustomPin ? "Select from list" : "Enter custom PIN"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Pincode</label>
                  {isCustomPin ? (
                    <input 
                      type="text" 
                      maxLength={6}
                      required
                      value={formData.pincode} 
                      onChange={e => {
                        const pin = e.target.value.replace(/\D/g, '');
                        handleChange('pincode', pin);
                        if (pin.length === 6) {
                          const terr = resolvePincodeTerritory(pin);
                          handleChange('division', terr.division);
                          handleChange('region', terr.region);
                          if (terr.offices[0]) handleChange('poName', terr.offices[0].label);
                        }
                      }}
                      placeholder="6-digit Pincode"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                    />
                  ) : (
                    <select
                      value={formData.pincode}
                      onChange={e => handlePincodeSelect(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                    >
                      {Object.keys(PINCODE_TERRITORY_CATALOG).map(pin => {
                        const entry = PINCODE_TERRITORY_CATALOG[pin];
                        return (
                          <option key={pin} value={pin}>
                            {pin} — {entry.division}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Post Office (PO Name)</label>
                  <select 
                    value={formData.poName}
                    onChange={e => handleChange('poName', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                  >
                    {sourceTerritory.offices.map((off, idx) => (
                      <option key={idx} value={off.label}>
                        {off.label}
                      </option>
                    ))}
                    {formData.poName && !sourceTerritory.offices.some(o => o.label === formData.poName) && (
                      <option value={formData.poName}>{formData.poName}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Division</label>
                  <input 
                    type="text"
                    value={formData.division}
                    onChange={e => handleChange('division', e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Region</label>
                  <input 
                    type="text"
                    value={formData.region}
                    onChange={e => handleChange('region', e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Status, Willingness & Outcomes */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Meeting Outcome & Commercial Assessment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Meeting Outcome</label>
                  <select 
                    value={formData.meetingOutcome}
                    onChange={e => handleOutcomeChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="Willing">Willing</option>
                    <option value="Not Willing">Not Willing</option>
                    <option value="Company Not Exist">Company Not Exist</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                    <option value="Onboarded">Onboarded</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Willing to Onboard</label>
                  <select 
                    value={formData.willingToOnboard}
                    onChange={e => handleWillingChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="Willing">Willing</option>
                    <option value="Not Willing">Not Willing</option>
                    <option value="Company Not Exist">Company Not Exist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Date of Meeting</label>
                  <input 
                    type="date"
                    value={formData.dateOfMeeting}
                    onChange={e => handleChange('dateOfMeeting', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#D1242F] focus:ring-1 focus:ring-[#D1242F] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Current Courier / Provider</label>
                  <select 
                    value={formData.serviceUsing}
                    onChange={e => handleChange('serviceUsing', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="DHL">DHL</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="Aramex">Aramex</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Monthly Volume (₹)</label>
                  <input 
                    type="text"
                    value={formData.monthlyVolume}
                    onChange={e => handleChange('monthlyVolume', e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Contract ID (if signed)</label>
                  <input 
                    type="text"
                    value={formData.contractId}
                    onChange={e => handleChange('contractId', e.target.value)}
                    placeholder="Contract or Customer ID"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* ME Agent Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Assigned ME Officer</label>
                  <input 
                    type="text"
                    value={formData.assignedMeName}
                    onChange={e => handleChange('assignedMeName', e.target.value)}
                    placeholder="Marketing Executive Name"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">ME Contact Mobile</label>
                  <input 
                    type="tel"
                    maxLength={10}
                    value={formData.meMobile}
                    onChange={e => handleChange('meMobile', e.target.value.replace(/\D/g, ''))}
                    placeholder="Auto-fetched ME mobile"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Discussion Remarks / Notes</label>
                <textarea 
                  rows={2}
                  value={formData.remarks}
                  onChange={e => handleChange('remarks', e.target.value)}
                  placeholder="Notes from customer interaction, pricing quotes, follow up timeline..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs resize-none"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-row-form"
            disabled={submitting}
            className="px-5 py-2 bg-[#D1242F] hover:bg-[#B01E28] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Save Lead Record</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
