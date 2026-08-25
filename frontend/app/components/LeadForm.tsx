"use client";

import React, { useState } from "react";

interface FormData {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
}

interface SubmittedLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string | null;
  status: string;
  ml_lead_score?: number | null;
  created_at: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LeadForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<SubmittedLead | null>(null);

  // Handle input updates
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (serverError) {
      setServerError(null);
    }
  };

  // Validate Step 1
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const stepErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      stepErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      stepErrors.last_name = "Last name is required";
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  // Validate Step 2 & Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stepErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      stepErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      stepErrors.email = "Please provide a valid email address";
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setServerError(null);
    setIsLoading(true);

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        company_name: formData.company_name.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
      };

      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
            ? data.detail.map((err: { msg?: string }) => err.msg).join(", ")
            : "Failed to create lead. Please verify the information.";
        throw new Error(errorMsg);
      }

      setSubmittedLead(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      first_name: "",
      last_name: "",
      company_name: "",
      email: "",
    });
    setErrors({});
    setServerError(null);
    setSubmittedLead(null);
    setStep(1);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#171f33]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 font-sans">
      {/* Top Header & Progress Bar */}
      <div className="px-8 pt-8 pb-6 bg-[#222a3d]/40 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#81b562]/15 text-[#9fd57e] border border-[#81b562]/30">
              {submittedLead ? "Verification Complete" : `Step ${step} of 2`}
            </span>
          </div>
          {!submittedLead && (
            <span className="text-xs font-mono text-[#c2c9b8]">
              {step === 1 ? "50% Completed" : "Almost Done"}
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">
          {submittedLead
            ? "Lead Profile Registered"
            : step === 1
            ? "Tell us about yourself"
            : "Where should we reach you?"}
        </h2>
        <p className="mt-1 text-xs text-[#c2c9b8]">
          {submittedLead
            ? "Your lead profile has been synchronized with the PostgreSQL database."
            : step === 1
            ? "Enter your basic contact and company information."
            : "Provide your primary work email to complete your registration."}
        </p>

        {/* Stepper Progress Bar */}
        {!submittedLead && (
          <div className="mt-5">
            <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#81b562] to-[#9fd57e] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_#9fd57e]"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[11px] font-mono text-[#8c9384]">
              <span className={step >= 1 ? "text-[#9fd57e] font-bold" : ""}>
                1. Personal Details
              </span>
              <span className={step === 2 ? "text-[#9fd57e] font-bold" : ""}>
                2. Contact & Email
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-8">
        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-start gap-3 text-[#ffb4ab] animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-lg mt-0.5">warning</span>
            <div className="text-xs">
              <p className="font-bold">Submission Failed</p>
              <p className="mt-0.5 opacity-90">{serverError}</p>
            </div>
          </div>
        )}

        {/* Success View */}
        {submittedLead ? (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-[#0b1326] border border-[#81b562]/30">
              <div className="w-12 h-12 rounded-full bg-[#81b562]/20 text-[#9fd57e] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Lead Created Successfully
              </h3>
              <p className="text-xs text-[#c2c9b8] mt-1">
                Database record generated and synced to live pipeline.
              </p>
            </div>

            {/* Lead Details Card */}
            <div className="p-4 rounded-xl bg-[#0b1326] border border-white/5 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[#8c9384]">Full Name</span>
                <span className="font-bold text-white">
                  {submittedLead.first_name} {submittedLead.last_name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[#8c9384]">Email</span>
                <span className="font-mono text-white">
                  {submittedLead.email}
                </span>
              </div>
              {submittedLead.company_name && (
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[#8c9384]">Company</span>
                  <span className="font-semibold text-white">
                    {submittedLead.company_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[#8c9384]">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#81b562]/20 text-[#9fd57e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9fd57e] animate-pulse"></span>
                  {submittedLead.status.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-[#81b562] hover:bg-[#9fd57e] text-[#1a4600] shadow-[0_0_15px_rgba(129,181,98,0.3)] transition-all cursor-pointer"
            >
              Submit Another Lead
            </button>
          </div>
        ) : (
          /* Multi-Step Form */
          <form
            onSubmit={step === 1 ? handleNext : handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* Step 1 Fields */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-xs font-semibold text-[#dae2fd] mb-1"
                    >
                      First Name <span className="text-[#ffb4ab]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8c9384]">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </span>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Jane"
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-[#0b1326] text-white placeholder-[#8c9384]/60 outline-none transition-all ${
                          errors.first_name
                            ? "border-[#ffb4ab] ring-1 ring-[#ffb4ab]"
                            : "border-[#42493c] focus:border-[#9fd57e] focus:ring-1 focus:ring-[#9fd57e]"
                        }`}
                      />
                    </div>
                    {errors.first_name && (
                      <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.first_name}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-xs font-semibold text-[#dae2fd] mb-1"
                    >
                      Last Name <span className="text-[#ffb4ab]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8c9384]">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </span>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Doe"
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-[#0b1326] text-white placeholder-[#8c9384]/60 outline-none transition-all ${
                          errors.last_name
                            ? "border-[#ffb4ab] ring-1 ring-[#ffb4ab]"
                            : "border-[#42493c] focus:border-[#9fd57e] focus:ring-1 focus:ring-[#9fd57e]"
                        }`}
                      />
                    </div>
                    {errors.last_name && (
                      <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label
                      htmlFor="company_name"
                      className="block text-xs font-semibold text-[#dae2fd]"
                    >
                      Company Name
                    </label>
                    <span className="text-[10px] font-mono text-[#8c9384]">
                      OPTIONAL
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8c9384]">
                      <span className="material-symbols-outlined text-sm">domain</span>
                    </span>
                    <input
                      id="company_name"
                      name="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Acme Innovations Inc."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#42493c] bg-[#0b1326] text-white placeholder-[#8c9384]/60 focus:border-[#9fd57e] focus:ring-1 focus:ring-[#9fd57e] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg font-mono text-xs font-bold uppercase tracking-wider bg-[#81b562] hover:bg-[#9fd57e] text-[#1a4600] shadow-[0_0_15px_rgba(129,181,98,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Step 2</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 Fields */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Summary Pill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b1326] border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#81b562]/20 text-[#9fd57e] font-bold text-xs flex items-center justify-center">
                      {formData.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {formData.first_name} {formData.last_name}
                      </p>
                      {formData.company_name && (
                        <p className="text-[10px] text-[#8c9384]">
                          {formData.company_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] font-mono text-[#9fd57e] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-[#dae2fd] mb-1"
                  >
                    Work Email Address <span className="text-[#ffb4ab]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8c9384]">
                      <span className="material-symbols-outlined text-sm">mail</span>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoFocus
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane.doe@company.com"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-[#0b1326] text-white placeholder-[#8c9384]/60 outline-none transition-all ${
                        errors.email
                          ? "border-[#ffb4ab] ring-1 ring-[#ffb4ab]"
                          : "border-[#42493c] focus:border-[#9fd57e] focus:ring-1 focus:ring-[#9fd57e]"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.email}</p>
                  )}
                  <p className="mt-2 text-[10px] text-[#8c9384] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#9fd57e]">lock</span>
                    Enterprise encryption. No spam or 3rd-party sharing.
                  </p>
                </div>

                {/* Actions: Back & Submit */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="w-1/3 py-2.5 px-3 rounded-lg font-mono text-xs text-[#c2c9b8] border border-[#42493c] hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 py-2.5 px-4 rounded-lg font-mono text-xs font-bold uppercase tracking-wider bg-[#81b562] hover:bg-[#9fd57e] text-[#1a4600] shadow-[0_0_15px_rgba(129,181,98,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#1a4600] border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Lead</span>
                        <span className="material-symbols-outlined text-sm">check</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
