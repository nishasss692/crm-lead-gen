"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface LeadItem {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  value: number;
  tier: "Enterprise" | "Mid-Market" | "SMB";
  status: "new" | "contacted" | "qualified" | "closed";
  ml_lead_score?: number | null;
  created_at?: string;
}

const INITIAL_MOCK_LEADS: LeadItem[] = [
  {
    id: "lead-1",
    title: "Acme Corp Redesign",
    first_name: "Sarah",
    last_name: "Jenkins",
    email: "sarah.jenkins@acme.com",
    company_name: "Acme Corporation",
    value: 120000,
    tier: "Enterprise",
    status: "new",
    ml_lead_score: 94,
  },
  {
    id: "lead-2",
    title: "Cloud Migration Phase 1",
    first_name: "Marcus",
    last_name: "Vance",
    email: "m.vance@techflow.io",
    company_name: "TechFlow Inc.",
    value: 45000,
    tier: "Mid-Market",
    status: "new",
    ml_lead_score: 82,
  },
  {
    id: "lead-3",
    title: "Global HR Integration",
    first_name: "Elena",
    last_name: "Rostova",
    email: "e.rostova@synergy.com",
    company_name: "Synergy Worldwide",
    value: 250000,
    tier: "Enterprise",
    status: "contacted",
    ml_lead_score: 89,
  },
  {
    id: "lead-4",
    title: "Security Audit & Compliance",
    first_name: "David",
    last_name: "Chen",
    email: "d.chen@defendsec.com",
    company_name: "DefendSec LLC",
    value: 15000,
    tier: "SMB",
    status: "qualified",
    ml_lead_score: 76,
  },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_MOCK_LEADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pipeline" | "leads" | "analytics">("pipeline");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);

  // Form state for adding a new lead
  const [newLeadForm, setNewLeadForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company_name: "",
    value: 50000,
    tier: "Mid-Market" as "Enterprise" | "Mid-Market" | "SMB",
    status: "new" as "new" | "contacted" | "qualified" | "closed",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch leads from backend on mount
  useEffect(() => {
    async function loadBackendLeads() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leads`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedLeads: LeadItem[] = data.map((d: any, idx: number) => ({
              id: d.id || `api-lead-${idx}`,
              title: `${d.company_name || d.first_name + "'s Project"} CRM Setup`,
              first_name: d.first_name,
              last_name: d.last_name,
              email: d.email,
              company_name: d.company_name || `${d.first_name} ${d.last_name}`,
              value: 35000 + (idx * 15000) % 80000,
              tier: idx % 2 === 0 ? "Enterprise" : "Mid-Market",
              status: (d.status === "new" ? "new" : d.status) as any,
              ml_lead_score: d.ml_lead_score || 85,
              created_at: d.created_at,
            }));

            // Merge with initial leads avoiding duplicate emails
            setLeads((prev) => {
              const existingEmails = new Set(prev.map((l) => l.email.toLowerCase()));
              const filteredNew = mappedLeads.filter(
                (l) => !existingEmails.has(l.email.toLowerCase())
              );
              return [...filteredNew, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn("Could not connect to FastAPI backend at", API_BASE_URL, err);
      }
    }

    loadBackendLeads();
  }, []);

  // Filter leads based on search query
  const filteredLeads = leads.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Change lead status (Move across Kanban stages)
  const moveLeadStatus = (
    id: string,
    newStatus: "new" | "contacted" | "qualified" | "closed"
  ) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
    );
  };

  // Submit new lead to backend
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      // 1. Try to post to backend API
      const res = await fetch(`${API_BASE_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newLeadForm.first_name,
          last_name: newLeadForm.last_name,
          email: newLeadForm.email,
          company_name: newLeadForm.company_name || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to create lead in database.");
      }

      // 2. Add to local UI state
      const createdItem: LeadItem = {
        id: data.id || `lead-${Date.now()}`,
        title: `${newLeadForm.company_name || newLeadForm.first_name}'s Intake`,
        first_name: newLeadForm.first_name,
        last_name: newLeadForm.last_name,
        email: newLeadForm.email,
        company_name: newLeadForm.company_name || "New Prospect",
        value: Number(newLeadForm.value) || 50000,
        tier: newLeadForm.tier,
        status: newLeadForm.status,
        ml_lead_score: 90,
      };

      setLeads((prev) => [createdItem, ...prev]);
      setIsAddModalOpen(false);
      setNewLeadForm({
        first_name: "",
        last_name: "",
        email: "",
        company_name: "",
        value: 50000,
        tier: "Mid-Market",
        status: "new",
      });
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: "new", label: "New", color: "bg-[#adc6ff]", textColor: "text-[#adc6ff]" },
    { key: "contacted", label: "Contacted", color: "bg-[#bdc7d9]", textColor: "text-[#bdc7d9]" },
    { key: "qualified", label: "Qualified", color: "bg-[#9fd57e]", textColor: "text-[#9fd57e]" },
    { key: "closed", label: "Closed", color: "bg-[#c2c9b8]", textColor: "text-[#c2c9b8]" },
  ] as const;

  return (
    <div className="antialiased flex h-screen bg-[#0b1326] text-[#dae2fd] overflow-hidden font-sans">
      {/* SideNavBar (Shared Component) */}
      <nav className="hidden md:flex h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#0b1326]/90 backdrop-blur-xl shadow-xl flex-col z-40">
        {/* Brand Header */}
        <div className="px-6 py-6 flex flex-col gap-1 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#81b562] text-[#1a4600] flex items-center justify-center font-bold text-lg">
              L
            </div>
            <h1 className="text-xl font-extrabold text-[#9fd57e] tracking-tight">
              LeadGen Pro
            </h1>
          </Link>
          <p className="text-[10px] font-mono text-[#c2c9b8] uppercase tracking-wider mt-1">
            Enterprise Lead Management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activeTab === "pipeline"
                ? "text-[#9fd57e] font-bold border-r-2 border-[#9fd57e] bg-[#9fd57e]/10"
                : "text-[#c2c9b8] hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              view_kanban
            </span>
            <span>Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab("leads")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activeTab === "leads"
                ? "text-[#9fd57e] font-bold border-r-2 border-[#9fd57e] bg-[#9fd57e]/10"
                : "text-[#c2c9b8] hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">group</span>
            <span>All Leads ({leads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activeTab === "analytics"
                ? "text-[#9fd57e] font-bold border-r-2 border-[#9fd57e] bg-[#9fd57e]/10"
                : "text-[#c2c9b8] hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">leaderboard</span>
            <span>Analytics</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#c2c9b8] text-sm hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span>Landing Page</span>
          </Link>
        </div>

        {/* CTA & Footer Actions */}
        <div className="px-4 py-4 border-t border-white/5 flex flex-col gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-2.5 px-4 bg-[#81b562] text-[#1a4600] font-mono text-xs uppercase tracking-wider rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(129,181,98,0.25)] font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add New Lead
          </button>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsAISummaryOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 rounded text-[#c2c9b8] text-xs hover:bg-white/5 hover:text-white transition-colors text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-[#adc6ff]">smart_toy</span>
              <span>AI Summary</span>
            </button>
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-1.5 rounded text-[#c2c9b8] text-xs hover:bg-white/5 hover:text-white transition-colors text-left"
            >
              <span className="material-symbols-outlined text-sm text-[#9fd57e]">bolt</span>
              <span>Switch User</span>
            </Link>
          </div>

          {/* User Profile Footer */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#81b562] to-[#7aa6ff] flex items-center justify-center font-bold text-xs text-[#1a4600]">
              AJ
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Alex Jensen</span>
              <span className="text-[10px] font-mono text-[#c2c9b8]">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <div className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        {/* TopAppBar */}
        <header className="h-[72px] bg-[#0b1326]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-30 shrink-0">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9384] text-lg">
              search
            </span>
            <input
              className="w-full bg-[#131b2e] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-[#8c9384] focus:outline-none focus:border-[#9fd57e] focus:ring-1 focus:ring-[#9fd57e] transition-colors"
              placeholder="Search leads, companies, or values..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-[#81b562]/20 border border-[#81b562]/40 text-[#9fd57e] px-3 py-1.5 rounded-lg text-xs font-mono hover:bg-[#81b562]/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Quick Add</span>
            </button>

            <button className="p-2 rounded-full hover:bg-white/5 text-[#c2c9b8] transition-colors relative">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ffb4ab] rounded-full"></span>
            </button>

            <Link href="/" className="p-2 rounded-full hover:bg-white/5 text-[#c2c9b8] transition-colors">
              <span className="material-symbols-outlined text-xl">help_outline</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-auto overflow-y-auto flex flex-col p-6 gap-6 relative">
          {/* Stats Row */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
            {/* Stat Card 1 */}
            <div className="bg-[#171f33] rounded-xl p-4 border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9fd57e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#c2c9b8] uppercase">Total Leads</span>
                <span className="material-symbols-outlined text-[#9fd57e]">groups</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-white">{1248 + leads.length}</span>
                <span className="text-xs font-mono text-[#9fd57e] flex items-center">
                  <span className="material-symbols-outlined text-sm">trending_up</span> +12%
                </span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-[#171f33] rounded-xl p-4 border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9fd57e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#c2c9b8] uppercase">Conversion Rate</span>
                <span className="material-symbols-outlined text-[#adc6ff]">data_usage</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-white">18.4%</span>
                <span className="text-xs font-mono text-[#9fd57e] flex items-center">
                  <span className="material-symbols-outlined text-sm">trending_up</span> +2.1%
                </span>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-[#171f33] rounded-xl p-4 border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9fd57e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#c2c9b8] uppercase">Pipeline Value</span>
                <span className="material-symbols-outlined text-[#bdc7d9]">payments</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-white">
                  ${(leads.reduce((sum, l) => sum + l.value, 4200000) / 1000000).toFixed(2)}M
                </span>
                <span className="text-xs font-mono text-[#ffb4ab] flex items-center">
                  <span className="material-symbols-outlined text-sm">trending_down</span> -1.5%
                </span>
              </div>
            </div>
          </section>

          {/* Kanban Board Area */}
          <section className="flex-1 flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
            {columns.map((col) => {
              const colLeads = filteredLeads.filter((l) => l.status === col.key);

              return (
                <div
                  key={col.key}
                  className="flex flex-col min-w-[280px] max-w-[300px] flex-1 flex-shrink-0 bg-[#131b2e]/60 rounded-xl border border-white/5"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#222a3d]/40 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                      <h3 className="text-xs font-mono text-white uppercase font-bold">
                        {col.label}
                      </h3>
                      <span className="text-[10px] font-mono bg-[#171f33] px-2 py-0.5 rounded text-[#c2c9b8]">
                        {colLeads.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewLeadForm((prev) => ({ ...prev, status: col.key }));
                        setIsAddModalOpen(true);
                      }}
                      className="text-xs text-[#8c9384] hover:text-white"
                      title="Add lead to this column"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>

                  {/* Column Cards */}
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                    {colLeads.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-lg">
                        <span className="material-symbols-outlined text-[#8c9384]/40 text-3xl mb-1">
                          task_alt
                        </span>
                        <p className="text-xs text-[#8c9384]">No leads in {col.label}</p>
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className={`bg-[#171f33] rounded-xl p-3.5 border border-white/5 hover:border-white/20 transition-all shadow-md group relative ${
                            lead.status === "qualified" ? "border-l-2 border-l-[#9fd57e]" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                lead.tier === "Enterprise"
                                  ? "text-[#adc6ff] bg-[#adc6ff]/10"
                                  : lead.tier === "Mid-Market"
                                  ? "text-[#9fd57e] bg-[#9fd57e]/10"
                                  : "text-[#c2c9b8] bg-[#31394d]"
                              }`}
                            >
                              {lead.tier}
                            </span>
                            <div className="flex items-center gap-1">
                              {lead.ml_lead_score && (
                                <span className="text-[10px] font-mono text-[#9fd57e] bg-[#9fd57e]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  ⚡{lead.ml_lead_score}
                                </span>
                              )}
                              <span className="material-symbols-outlined text-[16px] text-[#8c9384] cursor-grab">
                                drag_indicator
                              </span>
                            </div>
                          </div>

                          <h4 className="text-sm font-semibold text-white mb-0.5">
                            {lead.title}
                          </h4>
                          <p className="text-xs text-[#c2c9b8] mb-1">
                            {lead.company_name} • {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-[11px] font-mono text-[#8c9384] truncate mb-3">
                            {lead.email}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs font-mono font-bold text-white">
                              ${lead.value.toLocaleString()}
                            </span>

                            {/* Stage Move Dropdown/Buttons */}
                            <div className="flex items-center gap-1">
                              {col.key !== "new" && (
                                <button
                                  onClick={() =>
                                    moveLeadStatus(
                                      lead.id,
                                      col.key === "contacted"
                                        ? "new"
                                        : col.key === "qualified"
                                        ? "contacted"
                                        : "qualified"
                                    )
                                  }
                                  className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-[#c2c9b8] flex items-center justify-center text-[10px]"
                                  title="Move Left"
                                >
                                  ←
                                </button>
                              )}
                              {col.key !== "closed" && (
                                <button
                                  onClick={() =>
                                    moveLeadStatus(
                                      lead.id,
                                      col.key === "new"
                                        ? "contacted"
                                        : col.key === "contacted"
                                        ? "qualified"
                                        : "closed"
                                    )
                                  }
                                  className="w-5 h-5 rounded bg-[#9fd57e]/20 hover:bg-[#9fd57e]/30 text-[#9fd57e] flex items-center justify-center text-[10px] font-bold"
                                  title="Advance Stage"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      </div>

      {/* Agentic Sidebar (Right Side) */}
      <aside className="hidden xl:flex w-80 h-screen border-l border-white/5 bg-[#060e20] flex-col z-30 shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-[#131b2e]/50 backdrop-blur-md">
          <span className="material-symbols-outlined text-[#adc6ff]">auto_awesome</span>
          <h2 className="text-sm font-bold text-white">AI Insights & Actions</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Insight Alert */}
          <div className="bg-[#93000a]/15 border border-[#ffb4ab]/20 rounded-xl p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#ffb4ab] text-xl shrink-0 mt-0.5">
              warning
            </span>
            <div>
              <h4 className="text-xs font-bold text-[#ffb4ab] uppercase font-mono">
                Urgent Attention
              </h4>
              <p className="text-xs text-[#dae2fd] mt-1 leading-relaxed">
                3 high-value leads in &apos;Contacted&apos; have not received a reply in 48 hours.
              </p>
              <button
                onClick={() => setActiveTab("pipeline")}
                className="mt-2.5 text-[11px] font-mono text-white bg-[#171f33] hover:bg-[#31394d] px-2.5 py-1 rounded border border-white/10 transition-colors"
              >
                Review Leads
              </button>
            </div>
          </div>

          {/* Next Best Actions */}
          <div>
            <h3 className="text-[10px] font-mono text-[#c2c9b8] uppercase mb-3 tracking-wider">
              Next Best Actions
            </h3>
            <div className="flex flex-col gap-2.5">
              {/* Action 1 */}
              <div className="bg-[#171f33] rounded-xl p-3 border border-white/5 hover:bg-[#222a3d] transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#adc6ff] uppercase">Follow-up Call</span>
                  <span className="material-symbols-outlined text-[16px] text-[#8c9384] group-hover:text-[#adc6ff] transition-colors">
                    arrow_forward
                  </span>
                </div>
                <p className="text-xs text-white">
                  Call <strong>Sarah Jenkins</strong> from Acme Corp to discuss Phase 2 pricing.
                </p>
                <div className="flex items-center gap-1 mt-2 text-[11px] font-mono text-[#c2c9b8]">
                  <span className="material-symbols-outlined text-[13px]">schedule</span> Due in 2 hours
                </div>
              </div>

              {/* Action 2 */}
              <div className="bg-[#171f33] rounded-xl p-3 border border-white/5 hover:bg-[#222a3d] transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#9fd57e] uppercase">Send Proposal</span>
                  <span className="material-symbols-outlined text-[16px] text-[#8c9384] group-hover:text-[#9fd57e] transition-colors">
                    arrow_forward
                  </span>
                </div>
                <p className="text-xs text-white">
                  Draft initial proposal for <strong>TechFlow Inc.</strong> based on yesterday&apos;s discovery call.
                </p>
              </div>
            </div>
          </div>

          {/* Activity Sparkline (Weekly Pipeline Velocity) */}
          <div className="mt-auto bg-[#131b2e] border border-white/5 rounded-xl p-3.5 relative overflow-hidden backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-t from-[#9fd57e]/5 to-transparent"></div>
            <h3 className="text-[10px] font-mono text-[#c2c9b8] uppercase mb-2 relative z-10">
              Weekly Pipeline Velocity
            </h3>
            <div className="h-16 w-full flex items-end gap-1.5 relative z-10 opacity-80">
              <div className="w-full bg-[#9fd57e]/20 h-[30%] rounded-t"></div>
              <div className="w-full bg-[#9fd57e]/40 h-[50%] rounded-t"></div>
              <div className="w-full bg-[#9fd57e]/30 h-[40%] rounded-t"></div>
              <div className="w-full bg-[#9fd57e]/60 h-[70%] rounded-t"></div>
              <div className="w-full bg-[#9fd57e]/80 h-[90%] rounded-t"></div>
              <div className="w-full bg-[#9fd57e] h-[100%] rounded-t"></div>
              <div className="w-full bg-[#9fd57e]/50 h-[60%] rounded-t"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9fd57e]"></span>
                Add New Lead to Pipeline
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8c9384] hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-[#93000a]/20 border border-[#ffb4ab]/30 text-xs text-[#ffb4ab]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#c2c9b8] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.first_name}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                    placeholder="Jane"
                    className="w-full bg-[#0b1326] border border-[#42493c] rounded-lg p-2.5 text-xs text-white focus:border-[#9fd57e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c2c9b8] mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.last_name}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                    placeholder="Doe"
                    className="w-full bg-[#0b1326] border border-[#42493c] rounded-lg p-2.5 text-xs text-white focus:border-[#9fd57e] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#c2c9b8] mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={newLeadForm.email}
                  onChange={(e) =>
                    setNewLeadForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="jane.doe@company.com"
                  className="w-full bg-[#0b1326] border border-[#42493c] rounded-lg p-2.5 text-xs text-white focus:border-[#9fd57e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#c2c9b8] mb-1">Company Name</label>
                <input
                  type="text"
                  value={newLeadForm.company_name}
                  onChange={(e) =>
                    setNewLeadForm((prev) => ({ ...prev, company_name: e.target.value }))
                  }
                  placeholder="Acme Corp"
                  className="w-full bg-[#0b1326] border border-[#42493c] rounded-lg p-2.5 text-xs text-white focus:border-[#9fd57e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#c2c9b8] mb-1">Est. Deal Value ($)</label>
                  <input
                    type="number"
                    value={newLeadForm.value}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, value: Number(e.target.value) }))
                    }
                    className="w-full bg-[#0b1326] border border-[#42493c] rounded-lg p-2.5 text-xs text-white focus:border-[#9fd57e] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c2c9b8] mb-1">Tier</label>
                  <select
                    value={newLeadForm.tier}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, tier: e.target.value as any }))
                    }
                    className="w-full bg-[#0b1326] border border-[#42493c] rounded-lg p-2.5 text-xs text-white focus:border-[#9fd57e] outline-none"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Mid-Market">Mid-Market</option>
                    <option value="SMB">SMB</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-[#c2c9b8] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-[#81b562] text-[#1a4600] hover:bg-[#9fd57e] transition-colors"
                >
                  {isSubmitting ? "Saving..." : "Save & Sync DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {isAISummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171f33] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#adc6ff]">smart_toy</span>
                AI Pipeline Executive Summary
              </h3>
              <button
                onClick={() => setIsAISummaryOpen(false)}
                className="text-[#8c9384] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-[#dae2fd] leading-relaxed">
              <p className="p-3 rounded-lg bg-[#0b1326] border border-white/5">
                📊 <strong>Pipeline Velocity:</strong> Currently tracking {leads.length} active leads across 4 lifecycle stages with an estimated velocity of 18.4 days to close.
              </p>
              <p className="p-3 rounded-lg bg-[#0b1326] border border-white/5">
                🎯 <strong>Key Opportunity:</strong> Acme Corp ($120k) and Synergy Worldwide ($250k) exhibit the highest ML conversion scores (&gt;88%).
              </p>
              <p className="p-3 rounded-lg bg-[#0b1326] border border-white/5">
                ⚡ <strong>Action Recommendation:</strong> Schedule follow-up discussions for 3 contacted opportunities before Friday.
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsAISummaryOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono bg-[#81b562] text-[#1a4600] font-bold"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
