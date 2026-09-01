import React, { useState } from 'react';
import { Lead } from './LeadsTable';
import { 
  X, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  User as UserIcon, 
  Calendar, 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  Clock, 
  Award, 
  XCircle, 
  FileText, 
  Building2,
  PhoneCall,
  Save,
  Check
} from 'lucide-react';

interface UpdateLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Lead>) => Promise<void>;
}

type TabKey = 'meeting' | 'contact' | 'location' | 'all';

export default function UpdateLeadModal({ lead, onClose, onSave }: UpdateLeadModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('meeting');
  const [formData, setFormData] = useState<Partial<Lead>>({
    address: lead.address || '',
    pincode: lead.pincode || '',
    division: lead.division || '',
    region: lead.region || '',
    assignedMeName: lead.assignedMeName || '',
    customerMet: lead.customerMet || '',
    contactNumber: lead.contactNumber || '',
    email: lead.email || '',
    serviceUsing: lead.serviceUsing || '',
    monthlyVolume: lead.monthlyVolume || '',
    meetingOutcome: lead.meetingOutcome || '',
    contractId: lead.contractId || '',
    remarks: lead.remarks || '',
    dateOfMeeting: lead.dateOfMeeting || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(lead.id, formData);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Quick Outcome Selector Chips
  const outcomePresets = [
    { value: 'Positive', label: 'Positive / Won', icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100', active: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
    { value: 'Onboarded', label: 'Onboarded', icon: Award, bg: 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100', active: 'bg-indigo-600 text-white border-indigo-600 shadow-sm' },
    { value: 'Followup', label: 'Follow-up', icon: Clock, bg: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100', active: 'bg-amber-500 text-white border-amber-500 shadow-sm' },
    { value: 'Contacted', label: 'Contacted', icon: PhoneCall, bg: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100', active: 'bg-blue-600 text-white border-blue-600 shadow-sm' },
    { value: 'Not interested', label: 'Not Interested', icon: XCircle, bg: 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100', active: 'bg-rose-600 text-white border-rose-600 shadow-sm' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 border border-slate-200/80 overflow-hidden z-10">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D1242F]/10 border border-[#D1242F]/20 flex items-center justify-center text-[#D1242F] shrink-0 font-bold shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  {lead.exporterName || 'Update Lead'}
                </h2>
                {lead.division && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                    {lead.division}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-2">
                <span>Lead #{lead.id}</span>
                {lead.pincode && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> PIN {lead.pincode}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Header - Eliminates the need to scroll down! */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-0 border-b border-slate-200 bg-slate-50/70 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('meeting')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'meeting'
                ? 'border-[#D1242F] text-[#D1242F] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Meeting & Outcome</span>
            {formData.meetingOutcome && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-[#D1242F] text-[#D1242F] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Contact & ME</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'location'
                ? 'border-[#D1242F] text-[#D1242F] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Location & Pin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-[#D1242F] text-[#D1242F] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>All Details</span>
          </button>
        </div>

        {/* Form Body - Fast Direct Access */}
        <div className="overflow-y-auto flex-1 p-6 bg-slate-50/40">
          <form id="update-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* TAB 1: MEETING & OUTCOME (DIRECT ACCESS - NO SCROLLING NEEDED) */}
            {(activeTab === 'meeting' || activeTab === 'all') && (
              <div className="space-y-5 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Meeting Outcome / Status
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Click to select status</span>
                  </div>
                  
                  {/* Quick Pill Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {outcomePresets.map(preset => {
                      const Icon = preset.icon;
                      const isSelected = (formData.meetingOutcome || '').toLowerCase() === preset.value.toLowerCase() ||
                        (preset.value === 'Onboarded' && !!formData.contractId);
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            handleChange('meetingOutcome', preset.value);
                            if (preset.value === 'Onboarded' && !formData.contractId) {
                              handleChange('contractId', `CON-${new Date().getFullYear()}-${lead.id}`);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSelected ? preset.active : preset.bg
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Date of Meeting
                    </label>
                    <input 
                      type="date" 
                      value={formData.dateOfMeeting || ''} 
                      onChange={e => handleChange('dateOfMeeting', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <Package className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Service Using (Competitor)
                    </label>
                    <select 
                      value={formData.serviceUsing || ''} 
                      onChange={e => handleChange('serviceUsing', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- None / Select Service --</option>
                      <option value="DHL">DHL Express</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="Aramex">Aramex</option>
                      <option value="Speed Post B2B">Speed Post B2B</option>
                      <option value="Business Parcel">Business Parcel</option>
                      <option value="Others">Others / Local Courier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Monthly Volume (pcs/month)
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500"
                      value={formData.monthlyVolume || ''} 
                      onChange={e => handleChange('monthlyVolume', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <Award className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Contract ID (if Won / Onboarded)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. CON-2024-001"
                      value={formData.contractId || ''} 
                      onChange={e => handleChange('contractId', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Meeting Remarks & Next Steps
                    </label>
                    <input 
                      type="text" 
                      placeholder="Key discussion points, rate negotiations, follow-up requirements..."
                      value={formData.remarks || ''} 
                      onChange={e => handleChange('remarks', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT & AGENT */}
            {(activeTab === 'contact' || activeTab === 'all') && (
              <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Contact Person & Marketing Executive
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <UserIcon className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Customer Met / Contact Person
                    </label>
                    <input 
                      type="text" 
                      placeholder="Name & Designation"
                      value={formData.customerMet || ''} 
                      onChange={e => handleChange('customerMet', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Contact Number / Mobile
                    </label>
                    <input 
                      type="tel" 
                      placeholder="10-digit mobile number"
                      value={formData.contactNumber || ''} 
                      onChange={e => handleChange('contactNumber', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      placeholder="name@company.com"
                      value={formData.email || ''} 
                      onChange={e => handleChange('email', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <UserIcon className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Assigned Marketing Executive (ME)
                    </label>
                    <input 
                      type="text" 
                      placeholder="ME Name or Employee ID"
                      value={formData.assignedMeName || ''} 
                      onChange={e => handleChange('assignedMeName', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LOCATION DETAILS */}
            {(activeTab === 'location' || activeTab === 'all') && (
              <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Location & Postal Jurisdiction
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      Street Address
                    </label>
                    <input 
                      type="text" 
                      placeholder="Complete business/exporter address"
                      value={formData.address || ''} 
                      onChange={e => handleChange('address', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pincode
                    </label>
                    <input 
                      type="text" 
                      placeholder="6-digit PIN"
                      value={formData.pincode || ''} 
                      onChange={e => handleChange('pincode', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Division
                    </label>
                    <input 
                      type="text" 
                      value={formData.division || ''} 
                      onChange={e => handleChange('division', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Region
                    </label>
                    <input 
                      type="text" 
                      value={formData.region || ''} 
                      onChange={e => handleChange('region', e.target.value)} 
                      className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#D1242F] focus:ring-2 focus:ring-[#D1242F]/20 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">
            {saveSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" /> Lead saved successfully!
              </span>
            ) : (
              <span>Review updates and click Save Lead</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="update-form" 
              disabled={saving} 
              className="px-5 py-2 bg-[#D1242F] hover:bg-[#b01c25] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-[#D1242F]/20 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Lead</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
