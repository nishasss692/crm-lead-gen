"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"Agent" | "Manager" | "Admin">("Agent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication and route to dashboard
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen flex flex-col relative overflow-hidden font-sans">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#81b562]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7aa6ff]/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Header Link */}
      <header className="p-6 z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#c2c9b8] hover:text-[#9fd57e] transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 z-10 relative">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded bg-[#81b562] text-[#1a4600] flex items-center justify-center font-bold text-lg">
                L
              </div>
              <h1 className="text-3xl font-extrabold text-[#9fd57e] tracking-tight">
                LeadGen Pro
              </h1>
            </Link>
            <p className="text-sm text-[#c2c9b8]">Welcome Back</p>
          </div>

          {/* Login Card (Glassmorphism) */}
          <div className="bg-[#171f33]/70 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-8 relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-mono text-[#c2c9b8] mb-2 uppercase tracking-wider">
                  Access Role
                </label>
                <div className="flex rounded-xl bg-[#222a3d] p-1 gap-1">
                  {(["Agent", "Manager", "Admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 px-1 text-xs font-mono rounded-lg transition-all ${
                        role === r
                          ? "bg-[#2d3449] text-white shadow-sm border border-white/10 font-bold"
                          : "text-[#c2c9b8] hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label
                  className="block text-xs font-semibold text-[#dae2fd] mb-1.5"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8c9384]">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <input
                    className="w-full bg-[#0b1326] border border-[#42493c] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[#dae2fd] focus:border-[#9fd57e] focus:ring-1 focus:ring-[#9fd57e] transition-colors outline-none placeholder:text-[#8c9384]/60"
                    id="email"
                    placeholder="alex.jensen@company.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  className="block text-xs font-semibold text-[#dae2fd] mb-1.5"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8c9384]">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </span>
                  <input
                    className="w-full bg-[#0b1326] border border-[#42493c] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[#dae2fd] focus:border-[#9fd57e] focus:ring-1 focus:ring-[#9fd57e] transition-colors outline-none placeholder:text-[#8c9384]/60"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    className="w-4 h-4 rounded border-[#42493c] bg-[#0b1326] text-[#9fd57e] focus:ring-[#9fd57e] focus:ring-offset-[#0b1326]"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-[#c2c9b8] group-hover:text-[#dae2fd] transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  className="text-[#9fd57e] hover:underline transition-colors"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  className="w-full bg-[#81b562] text-white py-3 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-[#9fd57e] hover:shadow-[0_0_15px_rgba(129,181,98,0.3)] transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In to Pipeline</span>
                  )}
                </button>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-[#42493c]"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-mono text-[#c2c9b8]">
                    or
                  </span>
                  <div className="flex-grow border-t border-[#42493c]"></div>
                </div>

                <button
                  className="w-full bg-[#31394d] text-[#dae2fd] border border-[#42493c] py-2.5 rounded-xl text-xs font-mono hover:bg-[#2d3449] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  type="button"
                  onClick={() => router.push("/dashboard")}
                >
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                  <span>Sign in with SSO</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center space-x-4 text-xs text-[#c2c9b8]">
            <a className="hover:text-white transition-colors" href="#">
              Privacy Policy
            </a>
            <span className="opacity-30">•</span>
            <a className="hover:text-white transition-colors" href="#">
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
