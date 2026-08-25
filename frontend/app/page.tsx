import React from "react";
import LeadForm from "./components/LeadForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glows and Mesh Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-purple-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[500px] -left-48 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[600px] -right-48 w-96 h-96 bg-violet-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Navigation Bar */}
      <header className="w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30 text-white font-bold text-lg">
              ⚡
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                LeadFlow <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">CRM</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>FastAPI Backend: <strong className="text-zinc-200">http://localhost:8000</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left Column: Copy & Value Proposition */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-medium">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400"></span>
            Next-Gen CRM Lead Generation Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Capture high-intent leads with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              zero friction.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Accelerate conversion rates with our optimized multi-step intake workflow. Powered by an asynchronous FastAPI backend and PostgreSQL database.
          </p>

          {/* Value Props / Feature Matrix */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-left max-w-lg mx-auto lg:mx-0">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 font-bold">
                ⚡
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">Async SQLAlchemy</h4>
              <p className="text-xs text-zinc-400 mt-0.5">High-concurrency PostgreSQL connection pool</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-2 font-bold">
                🎯
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">Duplicate Check</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Real-time email deduplication on intake</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 font-bold">
                📊
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">ML Scoring Ready</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Schema built for AI prioritization</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                🔒
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">Type-Safe Flow</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Pydantic schemas & Next.js TypeScript</p>
            </div>
          </div>
        </div>

        {/* Right Column: Lead Form Card */}
        <div className="w-full lg:w-[480px] shrink-0">
          <LeadForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 py-6 text-center text-xs text-zinc-500">
        <p>CRM Lead Generation System • Next.js & FastAPI Architecture</p>
      </footer>
    </div>
  );
}
