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

  // Handle standard input updates
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific validation error on change
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
        // Handle FastAPI standard error responses (detail field)
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

  // Reset form to start a new submission
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
    <div className="w-full max-w-lg mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden transition-all duration-300">
      {/* Top Header & Progress Bar */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
              {submittedLead
                ? "Verification Complete"
                : `Step ${step} of 2`}
            </span>
          </div>
          {!submittedLead && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {step === 1 ? "50% Complete" : "Almost Done"}
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {submittedLead
            ? "Lead Registered!"
            : step === 1
            ? "Tell us about yourself"
            : "Where should we reach you?"}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {submittedLead
            ? "Your lead profile has been synchronized with the CRM."
            : step === 1
            ? "Enter your basic contact and company information."
            : "Provide your primary work email to complete your registration."}
        </p>

        {/* Stepper Progress Bar */}
        {!submittedLead && (
          <div className="mt-6">
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className={step >= 1 ? "text-indigo-600 dark:text-indigo-400 font-semibold" : ""}>
                1. Personal Details
              </span>
              <span className={step === 2 ? "text-indigo-600 dark:text-indigo-400 font-semibold" : ""}>
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
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-3 text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2 duration-200">
            <svg
              className="w-5 h-5 mt-0.5 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm">
              <p className="font-semibold">Submission Failed</p>
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-300/90">{serverError}</p>
            </div>
          </div>
        )}

        {/* Success View */}
        {submittedLead ? (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Lead Created Successfully
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                A CRM record has been generated and ready for outreach.
              </p>
            </div>

            {/* Lead Details Card */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Full Name</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {submittedLead.first_name} {submittedLead.last_name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Email Address</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {submittedLead.email}
                </span>
              </div>
              {submittedLead.company_name && (
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Company</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {submittedLead.company_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                  {submittedLead.status.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 active:scale-[0.99] cursor-pointer"
            >
              Add Another Lead
            </button>
          </div>
        ) : (
          /* Multi-Step Form */
          <form
            onSubmit={step === 1 ? handleNext : handleSubmit}
            className="space-y-5"
            noValidate
          >
            {/* Step 1 Fields */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 mb-1.5"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Jane"
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all ${
                          errors.first_name
                            ? "border-red-400 ring-2 ring-red-400/20"
                            : "border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20"
                        }`}
                      />
                    </div>
                    {errors.first_name && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{errors.first_name}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 mb-1.5"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Doe"
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all ${
                          errors.last_name
                            ? "border-red-400 ring-2 ring-red-400/20"
                            : "border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20"
                        }`}
                      />
                    </div>
                    {errors.last_name && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Company Name (Optional) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      htmlFor="company_name"
                      className="block text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300"
                    >
                      Company Name
                    </label>
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      Optional
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      id="company_name"
                      name="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Acme Innovations Inc."
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Continue to Step 2</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 Fields */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Summary Pill */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {formData.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {formData.first_name} {formData.last_name}
                      </p>
                      {formData.company_name && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {formData.company_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Edit Info
                  </button>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Work Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoFocus
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane.doe@company.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-zinc-50/70 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all ${
                        errors.email
                          ? "border-red-400 ring-2 ring-red-400/20"
                          : "border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
                  )}
                  <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    We value your privacy. No spam or third-party sharing.
                  </p>
                </div>

                {/* Actions: Back & Submit */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="w-1/3 py-3 px-3 rounded-xl font-semibold text-xs border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Lead</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
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
