import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-display-lg text-display-lg text-surface-container-lowest tracking-tight mx-auto mb-4 shadow-sm">
            R
          </div>
          <h1 className="font-display-sm text-display-sm text-on-background font-bold tracking-tight">Welcome back</h1>
          <p className="font-body-base text-body-base text-on-surface-variant mt-2">Sign in to your RevOps account</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button className="flex items-center justify-center py-2.5 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-body-medium text-body-medium text-on-surface">
              <img alt="Google" className="w-5 h-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" />
              Google
            </button>
            <button className="flex items-center justify-center py-2.5 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-body-medium text-body-medium text-on-surface">
              <img alt="Microsoft" className="w-5 h-5 mr-2" src="https://www.svgrepo.com/show/448239/microsoft.svg" />
              Microsoft
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-surface-container-lowest font-caption text-caption text-on-surface-variant">Or continue with</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="email">Email address</label>
              <input className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-base text-body-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" id="email" placeholder="name@company.com" type="email" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                <a className="font-label-md text-label-md text-primary hover:text-primary-container" href="#">Forgot password?</a>
              </div>
              <input className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-base text-body-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" id="password" placeholder="••••••••" type="password" />
            </div>

            <Link href="/dashboard" className="block w-full bg-primary text-on-primary py-2.5 rounded-lg font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-sm mt-6 mb-4 text-center">
              Sign In
            </Link>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center font-body-medium text-body-medium text-on-surface-variant mt-8">
          Don't have an account? <Link className="text-primary hover:text-primary-container font-semibold" href="#">Request access</Link>
        </p>
      </div>
    </div>
  );
}
