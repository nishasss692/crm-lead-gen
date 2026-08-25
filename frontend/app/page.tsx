"use client";

import React, { useState } from "react";
import Link from "next/link";
import LeadForm from "./components/LeadForm";

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1326] text-[#dae2fd] overflow-x-hidden relative font-sans">
      {/* Top Navigation */}
      <header className="bg-[#0b1326]/80 sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl shadow-sm transition-opacity">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#81b562] text-[#1a4600] flex items-center justify-center font-bold text-lg">
                L
              </div>
              <span className="text-2xl font-extrabold text-[#9fd57e] tracking-tight">
                LeadGen Pro
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
            <Link
              href="#features"
              className="text-[#c2c9b8] hover:text-[#9fd57e] transition-colors duration-200"
            >
              Platform
            </Link>
            <Link
              href="/dashboard"
              className="text-[#c2c9b8] hover:text-[#9fd57e] transition-colors duration-200 flex items-center gap-1"
            >
              <span>Pipeline Dashboard</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#9fd57e]/20 text-[#9fd57e] font-mono">
                LIVE
              </span>
            </Link>
            <Link
              href="#intake"
              className="text-[#c2c9b8] hover:text-[#9fd57e] transition-colors duration-200"
            >
              Lead Intake
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[#c2c9b8]">
              <span className="material-symbols-outlined hover:text-[#9fd57e] cursor-pointer text-xl">
                notifications
              </span>
              <span className="material-symbols-outlined hover:text-[#9fd57e] cursor-pointer text-xl">
                help_outline
              </span>
            </div>
            <Link
              href="/login"
              className="text-[#c2c9b8] text-xs font-mono tracking-wider px-3 py-2 hover:text-[#9fd57e] transition-colors"
            >
              LOGIN
            </Link>
            <Link
              href="/dashboard"
              className="bg-[#81b562] text-white px-5 py-2 rounded text-xs font-mono tracking-wider hover:bg-[#9fd57e] transition-colors btn-glow shadow-[0_0_15px_rgba(129,181,98,0.3)]"
            >
              OPEN DASHBOARD
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center w-full">
        {/* Hero Section */}
        <section className="w-full max-w-[1440px] px-6 md:px-12 py-24 md:py-32 flex flex-col items-center text-center relative z-10">
          <div className="absolute inset-0 flex justify-center items-center -z-10 pointer-events-none">
            <div className="w-3/4 h-3/4 rounded-full hero-glow bg-[#9fd57e]/5 blur-[100px]"></div>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#222a3d] rounded-full px-4 py-1.5 border border-white/5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#9fd57e] animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#c2c9b8]">
              Introducing LeadGen Pro 2.0
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#dae2fd] mb-6 max-w-4xl tracking-tight leading-tight">
            Escape Legacy CRM.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9fd57e] via-[#adc6ff] to-[#7aa6ff]">
              Automate Your Pipeline.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#c2c9b8] mb-10 max-w-2xl mx-auto leading-relaxed">
            Deploy AI-driven lead generation that works at the speed of thought. 
            Agentic workflows identify, enrich, and engage high-intent prospects before your competitors even wake up.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
            <a
              href="#intake"
              className="bg-[#81b562] text-white px-8 py-3.5 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#9fd57e] transition-all duration-200 btn-glow w-full sm:w-auto text-center"
            >
              Get Started
            </a>
            <Link
              href="/dashboard"
              className="glass-panel text-[#dae2fd] px-8 py-3.5 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#2d3449] transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px] text-[#9fd57e]">
                play_circle
              </span>
              View Live Pipeline
            </Link>
          </div>

          {/* Interactive Dashboard Mockup Preview */}
          <div className="mt-16 w-full relative">
            <div className="glass-panel rounded-2xl p-4 border border-white/10 shadow-2xl overflow-hidden bg-[#060e20]/80">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-[#c2c9b8]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <span className="ml-2 font-mono text-[#8c9384]">leadgen-pro://dashboard/pipeline</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#9fd57e] animate-ping"></span>
                  <span className="text-[#9fd57e]">PostgreSQL & FastAPI Live</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-left">
                {/* Mock Column 1 */}
                <div className="p-3 rounded-xl bg-[#131b2e] border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-[#adc6ff] uppercase">New Leads</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171f33] text-[#c2c9b8]">4</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#171f33] border border-white/5 mb-2">
                    <div className="text-xs font-semibold text-white">Acme Corp Redesign</div>
                    <div className="text-[11px] text-[#c2c9b8]">$120,000 • Enterprise</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#171f33] border border-white/5">
                    <div className="text-xs font-semibold text-white">TechFlow Migration</div>
                    <div className="text-[11px] text-[#c2c9b8]">$45,000 • Mid-Market</div>
                  </div>
                </div>

                {/* Mock Column 2 */}
                <div className="p-3 rounded-xl bg-[#131b2e] border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-[#bdc7d9] uppercase">Contacted</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171f33] text-[#c2c9b8]">2</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#171f33] border border-white/5">
                    <div className="text-xs font-semibold text-white">Synergy Worldwide</div>
                    <div className="text-[11px] text-[#c2c9b8]">$250,000 • Discovery</div>
                  </div>
                </div>

                {/* Mock Column 3 */}
                <div className="p-3 rounded-xl bg-[#131b2e] border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-[#9fd57e] uppercase">Qualified</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171f33] text-[#c2c9b8]">1</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#171f33] border border-white/5 border-l-2 border-l-[#9fd57e]">
                    <div className="text-xs font-semibold text-white">DefendSec Audit</div>
                    <div className="text-[11px] text-[#c2c9b8]">$15,000 • High Intent</div>
                  </div>
                </div>

                {/* Mock Column 4: AI Insights */}
                <div className="p-3 rounded-xl bg-[#060e20] border border-[#adc6ff]/20">
                  <div className="flex items-center gap-1 text-[#adc6ff] text-xs font-bold mb-2">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    <span>AI Insights</span>
                  </div>
                  <div className="text-[11px] text-[#dae2fd] bg-[#171f33] p-2 rounded mb-2">
                    ⚡ 3 leads ready for follow-up outreach.
                  </div>
                  <Link
                    href="/dashboard"
                    className="block text-center w-full py-1.5 rounded bg-[#9fd57e]/10 text-[#9fd57e] hover:bg-[#9fd57e]/20 text-[11px] font-mono transition-colors"
                  >
                    Open Live Board →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full bg-[#060e20] py-10 border-y border-white/5">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 text-center">
            <p className="text-xs font-mono text-[#c2c9b8] uppercase tracking-wider mb-6">
              Trusted by Enterprise Teams Worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-24 opacity-60 hover:opacity-100 transition-all duration-500">
              <span className="text-xl md:text-2xl font-bold tracking-tighter">ACME Corp</span>
              <span className="text-xl md:text-2xl font-bold tracking-tighter italic">Globex</span>
              <span className="text-xl md:text-2xl font-bold tracking-widest uppercase">Soylent</span>
              <span className="text-xl md:text-2xl font-bold tracking-tighter">Initech</span>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="w-full max-w-[1440px] px-6 md:px-12 py-24 md:py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#dae2fd] mb-4">
              Engineered for Velocity
            </h2>
            <p className="text-base text-[#c2c9b8] max-w-2xl mx-auto">
              A modern architecture designed to handle complex enterprise workflows with zero latency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="md:col-span-2 glass-panel rounded-2xl p-8 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9fd57e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="z-10 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#222a3d] flex items-center justify-center border border-white/5 mb-4 text-[#9fd57e]">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <h3 className="text-2xl font-bold text-[#dae2fd] mb-2">
                  Agentic Workflows
                </h3>
                <p className="text-sm text-[#c2c9b8] max-w-lg leading-relaxed">
                  Deploy autonomous AI agents that research, qualify, and score leads in the background, surfacing only the highest-intent prospects to your sales team.
                </p>
              </div>
              <div className="w-full h-36 rounded-xl bg-[#060e20] border border-white/5 p-4 flex items-center justify-around">
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#9fd57e]/20 text-[#9fd57e] flex items-center justify-center font-bold">1</div>
                  <span className="text-[11px] text-[#c2c9b8]">Intake</span>
                </div>
                <span className="text-[#8c9384]">→</span>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#adc6ff]/20 text-[#adc6ff] flex items-center justify-center font-bold">2</div>
                  <span className="text-[11px] text-[#c2c9b8]">AI Score</span>
                </div>
                <span className="text-[#8c9384]">→</span>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#7aa6ff]/20 text-[#7aa6ff] flex items-center justify-center font-bold">3</div>
                  <span className="text-[11px] text-[#c2c9b8]">Pipeline Sync</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#adc6ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="z-10 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#222a3d] flex items-center justify-center border border-white/5 mb-4 text-[#adc6ff]">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <h3 className="text-2xl font-bold text-[#dae2fd] mb-2">
                  Zero-Latency UI
                </h3>
                <p className="text-sm text-[#c2c9b8] leading-relaxed">
                  Built on Next.js App Router and asynchronous FastAPI, ensuring instant data synchronization and responsive transitions.
                </p>
              </div>
              <div className="w-full h-24 rounded-xl bg-[#060e20] border border-white/5 flex items-end p-3 gap-2">
                <div className="w-1/4 bg-[#9fd57e]/20 h-1/3 rounded-t"></div>
                <div className="w-1/4 bg-[#9fd57e]/40 h-2/3 rounded-t"></div>
                <div className="w-1/4 bg-[#9fd57e]/60 h-1/2 rounded-t"></div>
                <div className="w-1/4 bg-[#9fd57e] h-full rounded-t"></div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9fd57e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="z-10">
                <div className="w-12 h-12 rounded-xl bg-[#222a3d] flex items-center justify-center border border-white/5 mb-4 text-[#9fd57e]">
                  <span className="material-symbols-outlined">database</span>
                </div>
                <h3 className="text-2xl font-bold text-[#dae2fd] mb-2">
                  Data Enrichment
                </h3>
                <p className="text-sm text-[#c2c9b8] leading-relaxed">
                  Automatically append company firmographics and interaction histories to raw emails, building complete buyer profiles instantly.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="md:col-span-2 glass-panel rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tl from-[#adc6ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex-1 z-10">
                <h3 className="text-2xl font-bold text-[#dae2fd] mb-2">
                  Seamless Integration
                </h3>
                <p className="text-sm text-[#c2c9b8] leading-relaxed">
                  Connects instantly with your existing toolchain via robust, asynchronous REST APIs and PostgreSQL event hooks.
                </p>
              </div>
              <div className="w-full md:w-1/2 h-28 rounded-xl bg-[#060e20] border border-white/5 flex items-center justify-center gap-4">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-[#0b1326] text-[#c2c9b8]">
                  <span className="material-symbols-outlined text-sm">api</span>
                </div>
                <div className="w-8 border-t border-dashed border-white/20"></div>
                <div className="w-14 h-14 rounded-full border border-[#9fd57e]/30 flex items-center justify-center bg-[#9fd57e]/10 text-[#9fd57e]">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <div className="w-8 border-t border-dashed border-white/20"></div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-[#0b1326] text-[#c2c9b8]">
                  <span className="material-symbols-outlined text-sm">cloud_sync</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Intake Form Section */}
        <section id="intake" className="w-full max-w-[1440px] px-6 md:px-12 py-20 bg-gradient-to-b from-transparent via-[#060e20]/80 to-transparent">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-[#9fd57e] uppercase tracking-wider">
              Live Intake Form
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#dae2fd] mt-1 mb-3">
              Capture & Qualify Leads in Real-Time
            </h2>
            <p className="text-sm text-[#c2c9b8] max-w-xl mx-auto">
              Submissions are validated, deduplicated, and synchronized directly with the PostgreSQL database.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <LeadForm />
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full max-w-[1000px] mx-auto px-6 md:px-12 py-24 text-center relative">
          <div className="absolute inset-0 flex justify-center items-center -z-10 pointer-events-none">
            <div className="w-full h-full rounded-full hero-glow bg-[#9fd57e]/5 blur-[120px]"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#dae2fd] mb-4">
            Ready to accelerate?
          </h2>
          <p className="text-base text-[#c2c9b8] mb-8 max-w-xl mx-auto">
            Join thousands of high-performing revenue teams already scaling their pipeline with LeadGen Pro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="bg-[#81b562] text-white px-8 py-3.5 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#9fd57e] transition-all duration-200 btn-glow"
            >
              Open Pipeline Dashboard
            </Link>
            <Link
              href="/login"
              className="text-[#dae2fd] px-8 py-3.5 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#222a3d] transition-colors duration-200 border border-white/5"
            >
              Agent Login
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#060e20] text-[#9fd57e] w-full py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center px-8 md:px-12 mt-auto text-xs">
        <div className="mb-4 md:mb-0">
          <span className="text-base font-bold text-[#dae2fd]">LeadGen Pro</span>
          <p className="text-[#c2c9b8] mt-0.5">© 2026 LeadGen Pro. All rights reserved.</p>
        </div>
        <nav className="flex flex-wrap gap-6 items-center justify-center text-[#c2c9b8]">
          <a href="#" className="hover:text-[#dae2fd] underline">Privacy Policy</a>
          <a href="#" className="hover:text-[#dae2fd] underline">Terms of Service</a>
          <a href="#" className="hover:text-[#dae2fd] underline">Contact Support</a>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-[#dae2fd] underline">
            FastAPI Docs
          </a>
        </nav>
      </footer>
    </div>
  );
}
