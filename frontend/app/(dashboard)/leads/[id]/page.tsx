"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function LeadDetailPage() {
  const params = useParams();
  const id = params?.id;
  
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:8000/api/leads/${id}`)
      .then(res => res.json())
      .then(data => {
        setLead(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading lead details...</div>;
  }

  if (!lead) {
    return <div className="p-8 text-center">Lead not found.</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
      {/* Breadcrumb & Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center text-body-base text-outline space-x-2">
          <a className="hover:text-primary transition-colors" href="/leads">Leads</a>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-background font-medium">{lead.exporter_name || 'Unknown Lead'}</span>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-body-medium text-body-medium hover:bg-slate-50 transition-colors ambient-shadow">
            Edit Lead
          </button>
          <div className="relative">
            <button className="px-4 py-2 bg-primary text-white rounded-lg font-body-medium text-body-medium hover:bg-primary-container transition-colors ambient-shadow flex items-center space-x-2">
              <span>Status: In Progress</span>
              <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Canvas (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 ambient-shadow p-6 flex items-start justify-between">
            <div className="flex space-x-5 items-center">
              <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center border border-slate-200 shrink-0">
                <span className="material-symbols-outlined text-3xl text-primary">domain</span>
              </div>
              <div>
                <h1 className="font-display-lg text-display-lg text-on-background mb-1">{lead.exporter_name || 'Unknown Lead'}</h1>
                <div className="flex items-center space-x-4 text-body-base text-outline">
                  <div className="flex items-center space-x-1">
                    <span className="material-symbols-outlined text-sm">business</span>
                    <span>Software &amp; Technology</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>San Francisco, CA</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="px-2 py-1 bg-amber-50 text-amber-700 font-label-caps text-label-caps rounded mb-2 border border-amber-200">{lead.status || 'NEW'}</span>
              <span className="font-body-medium text-caption text-outline">Created: {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Contact & Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-slate-200 ambient-shadow p-6">
              <h2 className="font-title-lg text-title-lg text-on-background border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                Contact Information
                <button className="text-primary hover:text-primary-container">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <img alt="Primary Contact" className="w-10 h-10 rounded-full object-cover border border-slate-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDltKIFVKsk7dJJFCCb26zG3EjG8edJuFPdhNguCcugjGpa_TCG9WSLffVXFvfc4vD0CrUW6rxct_CTclO9gbR5LDBMxvHqlXwV5gIvCgG5DGJvwdqKPwO8yR7ZzZHZj8eEVxjV1eX6B5N7HxBOwRd4Tp2uCgvHEuCPDhFQJwS4rvqT0t9kHDQd8eiU0Z8Fxu4TIMJlmi-K2zgq3Zodxmvz6YEzI1HAtPIEIAuWzUdphFD0Kak4vg"/>
                  <div>
                    <div className="font-body-medium text-body-medium text-on-background">{lead.customer_met_name || 'N/A'}</div>
                    <div className="font-caption text-caption text-outline mb-1">Contact for {lead.exporter_name || 'this lead'}</div>
                    <div className="flex flex-col space-y-1 mt-2">
                      <a className="text-body-base text-primary hover:underline flex items-center space-x-2" href={`mailto:${lead.email_id || ''}`}>
                        <span className="material-symbols-outlined text-sm">mail</span>
                        <span>{lead.email_id || 'N/A'}</span>
                      </a>
                      <a className="text-body-base text-outline hover:text-primary transition-colors flex items-center space-x-2" href={`tel:${lead.contact_number || ''}`}>
                        <span className="material-symbols-outlined text-sm">phone</span>
                        <span>{lead.contact_number || 'N/A'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes/Context */}
            <div className="bg-white rounded-xl border border-slate-200 ambient-shadow p-6 flex flex-col">
              <h2 className="font-title-lg text-title-lg text-on-background border-b border-slate-100 pb-3 mb-4">
                Strategic Notes
              </h2>
              <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100 text-body-base text-on-surface-variant overflow-y-auto max-h-[160px]">
                <p className="mb-2">{lead.remarks || 'No remarks available.'}</p>
              </div>
              <button className="mt-4 text-primary font-body-medium text-body-medium flex items-center space-x-1 hover:text-primary-container self-start">
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Note</span>
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 ambient-shadow p-6">
            <h2 className="font-title-lg text-title-lg text-on-background border-b border-slate-100 pb-3 mb-6">
              Activity Timeline
            </h2>
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {/* Event 1 */}
              <div className="relative pl-6">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-surface-container rounded-full border-4 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary">call</span>
                </div>
                <div className="flex justify-between items-start mb-1">
                  <div className="font-body-medium text-body-medium text-on-background">Discovery Call Completed</div>
                  <div className="font-caption text-caption text-outline">Today, 10:30 AM</div>
                </div>
                <div className="text-body-base text-on-surface-variant bg-slate-50 p-3 rounded border border-slate-100 mt-2">
                  Discussed initial requirements and timeline constraints with Sarah. Scheduled a technical deep-dive for next Thursday.
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative pl-6">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-emerald-50 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">mail</span>
                </div>
                <div className="flex justify-between items-start mb-1">
                  <div className="font-body-medium text-body-medium text-on-background">Proposal Sent</div>
                  <div className="font-caption text-caption text-outline">Oct 24, 2023</div>
                </div>
                <div className="text-body-base text-on-surface-variant mt-1">
                  Initial pricing tier options sent via DocuSign.
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative pl-6">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-slate-100 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">person_add</span>
                </div>
                <div className="flex justify-between items-start mb-1">
                  <div className="font-body-medium text-body-medium text-on-background">Lead Created</div>
                  <div className="font-caption text-caption text-outline">Oct 12, 2023</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel (Col 3) */}
        <div className="space-y-6">
          {/* Deal Value Card */}
          <div className="bg-white rounded-xl border border-slate-200 ambient-shadow p-6 text-center">
            <div className="font-caption text-caption text-outline uppercase tracking-wider mb-2">Estimated Deal Value</div>
            <div className="font-stat-lg text-stat-lg text-on-background mb-4">$125,000</div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="flex justify-between font-caption text-caption text-outline">
              <span>45% Probability</span>
              <span>Est. Close: Dec 15</span>
            </div>
          </div>

          {/* Lead Owner Card */}
          <div className="bg-white rounded-xl border border-slate-200 ambient-shadow p-6">
            <h3 className="font-title-lg text-title-lg text-on-background mb-4">Lead Owner</h3>
            <div className="flex items-center space-x-3 mb-4">
              <img alt="Lead Owner" className="w-12 h-12 rounded-full object-cover border border-slate-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbqKfvRJ8eUKVicKaY8vmzDIy2k1gCcJ-PJGD0goeg-P2im1Jk_EkxQmZ881x6FNHkMh9os9dl1JF7_B8IjtQj5CZD7Dgnx1hKDu29XqVAAX3hUtrum7YNP31o_TBCD0gNbHRAfMWcEUBp_fuv37vUVp7ollaD-Inf9btZVKvZ0Q9dWJdD61RFzfp81QqgXsStdKFuVIzog8he9ZwkMCKsHvG1y5t8pPvYcHfXpUkj7EIj20vX_vg"/>
              <div>
                <div className="font-body-medium text-body-medium text-on-background">{lead.assigned_agent_name || 'Unassigned'}</div>
                <div className="font-caption text-caption text-outline">Sales Representative</div>
              </div>
            </div>
            <button className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-body-medium text-body-medium hover:bg-slate-100 transition-colors">
              Reassign Lead
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 ambient-shadow p-4 space-y-2">
            <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3 text-slate-700 group-hover:text-primary">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <span className="font-body-medium text-body-medium">Schedule Meeting</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm">arrow_forward</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group">
              <div className="flex items-center space-x-3 text-slate-700 group-hover:text-primary">
                <span className="material-symbols-outlined text-lg">description</span>
                <span className="font-body-medium text-body-medium">Generate Quote</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
