'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead } from './LeadsTable';
import { X, Check, AlertTriangle, Building2, MapPin } from 'lucide-react';
import { resolvePincodeTerritory, PINCODE_TERRITORY_CATALOG } from '@/lib/karnatakaTerritory';
import { apiFetch } from '@/lib/api';

interface ModifyLeadSourceModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Lead>) => Promise<void>;
}

export default function ModifyLeadSourceModal({ lead, onClose, onSave }: ModifyLeadSourceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [exporterName, setExporterName] = useState(lead.exporterName || '');
  const [address, setAddress] = useState(lead.address || '');
  const [pincode, setPincode] = useState(lead.pincode || '560092');
  const [poName, setPoName] = useState(lead.poName || '');
  const [isCustomPin, setIsCustomPin] = useState(false);

  // Resolved Territory Info
  const [resolvedTerritory, setResolvedTerritory] = useState(() => 
    resolvePincodeTerritory(lead.pincode || '560092', lead.division)
  );

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

  // Update territory and offices whenever pincode changes
  useEffect(() => {
    const cleanPin = (pincode || '').trim().replace(/\D/g, '');
    const resolved = resolvePincodeTerritory(cleanPin, lead.division);
    setResolvedTerritory(resolved);

    // If current poName doesn't match any office in the new pincode, pick the first
    const officeLabels = resolved.offices.map(o => o.label);
    const officeRaws = resolved.offices.map(o => o.raw);

    const matchesExisting = resolved.offices.some(
      o => o.raw.toLowerCase() === (poName || '').toLowerCase() || 
           o.label.toLowerCase() === (poName || '').toLowerCase()
    );

    if (!matchesExisting && resolved.offices.length > 0) {
      setPoName(resolved.offices[0].label);
    }

    // Dynamic backend lookup if 6 digits and offices only has default
    if (cleanPin.length === 6 && !PINCODE_TERRITORY_CATALOG[cleanPin]) {
      const controller = new AbortController();
      apiFetch(`/api/pincode-offices/${cleanPin}`, { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data.offices) && data.offices.length > 0) {
            const formatted = data.offices.map((name: string) => ({
              raw: name,
              label: name.includes('[') ? name : `${name} [${resolved.divisionLabel}]`,
              division: resolved.division,
              region: resolved.region
            }));
            setResolvedTerritory(prev => ({
              ...prev,
              offices: formatted
            }));
            if (!matchesExisting && formatted.length > 0) {
              setPoName(formatted[0].label);
            }
          }
        })
        .catch(() => {});

      return () => controller.abort();
    }
  }, [pincode, lead.division]);

  // Catalog pincode options for quick selection
  const catalogPincodes = Object.keys(PINCODE_TERRITORY_CATALOG);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Extract clean PO name (strip [Division] for clean DB storage, or store full)
      const cleanPo = poName.includes('[') ? poName.split('[')[0].trim() : poName.trim();

      const updates: Partial<Lead> = {
        exporterName: exporterName.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        poName: cleanPo || poName.trim(),
        division: resolvedTerritory.division,
        region: resolvedTerritory.region,
      };

      await onSave(lead.id, updates);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      console.error('Failed to update lead source details:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[620px] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 overflow-hidden font-sans my-auto">
        
        {/* Top Accent Stripe */}
        <div className="h-1 bg-[#b91c1c] w-full shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between bg-white shrink-0">
          <div>
            <span className="text-[11px] font-black tracking-widest uppercase text-[#b91c1c] block leading-none">
              AUTHORIZED DATA CORRECTION
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#1e3a8a] tracking-tight mt-1.5 leading-none">
              Modify lead source details
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-slate-200 mx-6 shrink-0" />

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 custom-scrollbar space-y-4">
          
          {/* Amber Warning Notice Box */}
          <div className="flex items-start gap-3 bg-amber-50/90 border border-amber-200/90 rounded-lg p-3.5 text-amber-900 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              Only the four source fields below can be changed. Pincode and PO selection will automatically update the organizational mapping.
            </p>
          </div>

          <form id="modify-lead-source-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field 1: Exporter name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Exporter name
              </label>
              <input 
                type="text" 
                required
                value={exporterName} 
                onChange={e => setExporterName(e.target.value)}
                placeholder="Business or Exporter Name"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-900 uppercase focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
              />
            </div>

            {/* Field 2: Exporter address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Exporter address
              </label>
              <textarea 
                rows={3} 
                required
                value={address} 
                onChange={e => setAddress(e.target.value)}
                placeholder="Full address, premises, street, city, state"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs resize-none"
              />
            </div>

            {/* Field 3: Pincode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Pincode
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomPin(prev => !prev)}
                  className="text-[11px] text-[#1e3a8a] hover:underline font-semibold cursor-pointer"
                >
                  {isCustomPin ? "Select from list" : "Enter custom PIN"}
                </button>
              </div>

              {isCustomPin ? (
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  value={pincode} 
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit Pincode"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                />
              ) : (
                <select
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  {catalogPincodes.map(pin => {
                    const entry = PINCODE_TERRITORY_CATALOG[pin];
                    const firstOff = entry?.offices?.[0] ? ` — ${entry.offices[0].replace(/ (SO|BO|HO|GPO)$/, '')}` : '';
                    return (
                      <option key={pin} value={pin}>
                        {pin} ({entry?.division || 'Division'}){firstOff}
                      </option>
                    );
                  })}
                  {!catalogPincodes.includes(pincode) && pincode && (
                    <option value={pincode}>{pincode} (Custom)</option>
                  )}
                </select>
              )}
            </div>

            {/* Field 4: PO Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                PO Name
              </label>
              <select 
                value={poName} 
                onChange={e => setPoName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
              >
                {resolvedTerritory.offices.map((off, idx) => (
                  <option key={idx} value={off.label}>
                    {off.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Organizational Mapping Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
              <Building2 className="w-4 h-4 text-[#1e3a8a] shrink-0" />
              <p className="font-semibold text-slate-700 leading-snug">
                <span className="text-[#1e3a8a] font-bold">{resolvedTerritory.divisionLabel}</span> • {resolvedTerritory.region} • Karnataka. <span className="text-slate-500 font-normal">Saving will apply this organizational mapping.</span>
              </p>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 mr-auto flex items-center gap-1">
              <Check className="w-4 h-4" /> Correction saved!
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
            form="modify-lead-source-form" 
            disabled={saving} 
            className="px-6 py-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white rounded-lg text-xs font-bold shadow-md shadow-red-700/20 transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving correction...' : 'Save correction...'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
