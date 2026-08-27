'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../firebase';

declare global {
  interface Window {
    recaptchaVerifier: any;
    grecaptcha: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'employee' | 'otp'>('employee');
  
  // Employee Login State
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Login State
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Shared State
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  }, []);

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !password) {
      toast.error('Please enter both Employee ID and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 403) {
          toast.error(data.detail);
          setActiveTab('otp');
          return;
        }
        throw new Error(data.detail || 'Login failed');
      }
      
      toast.success('Logged in successfully!');
      if (typeof window !== 'undefined') localStorage.setItem('token', data.token);
      router.push('/leads');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials or server error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber) {
      toast.error('Please enter your mobile number');
      return;
    }
    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, mobileNumber, appVerifier);
      setConfirmationResult(confirmation);
      toast.success('OTP sent successfully');
      setOtpSent(true);
    } catch (err: any) {
      toast.error('Error sending OTP. Make sure your number includes country code.');
      console.error(err);
      // reset recaptcha
      if (window.recaptchaVerifier) {
          window.recaptchaVerifier.render().then((widgetId: any) => {
              window.grecaptcha.reset(widgetId);
          });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      if (!confirmationResult) {
        // Fallback for mock backend flow if Firebase fails to initialize due to dummy keys
        const res = await fetch('http://localhost:8000/api/login/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebase_id_token: 'dummy_token' }),
        });
        if (!res.ok) throw new Error('Invalid OTP');
        const data = await res.json();
        toast.success('Logged in successfully!');
        if (typeof window !== 'undefined') localStorage.setItem('token', data.token);
        router.push('/leads');
        return;
      }
      
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch('http://localhost:8000/api/login/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_id_token: idToken }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Verification failed on server');
      }
      const data = await res.json();
      toast.success('Logged in successfully!');
      if (typeof window !== 'undefined') localStorage.setItem('token', data.token);
      router.push('/leads');
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP or server error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body-base">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-2xl text-on-primary tracking-tight mx-auto mb-4 shadow-sm">
            R
          </div>
          <h1 className="font-display-sm text-display-sm text-on-background font-bold tracking-tight mb-1">Welcome back</h1>
          <p className="font-body-base text-body-base text-on-surface-variant mt-2">Sign in to your CRM account</p>
        </div>

        <div className="flex border-b border-outline-variant mb-6">
          <button
            className={`flex-1 pb-3 font-body-medium text-body-medium transition-colors ${activeTab === 'employee' ? 'text-primary border-b-2 border-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => {
              setActiveTab('employee');
              setOtpSent(false); // Reset OTP state if they switch back and forth
            }}
          >
            Employee ID
          </button>
          <button
            className={`flex-1 pb-3 font-body-medium text-body-medium transition-colors ${activeTab === 'otp' ? 'text-primary border-b-2 border-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setActiveTab('otp')}
          >
            OTP Login
          </button>
        </div>

        {activeTab === 'employee' && (
          <form onSubmit={handleEmployeeLogin} className="space-y-5">
            <div>
              <label className="block font-body-medium text-body-medium text-on-surface-variant mb-1.5" htmlFor="employeeId">Employee ID</label>
              <input 
                id="employeeId" 
                type="text" 
                required
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-medium text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-outline-variant" 
                placeholder="EMP-12345" 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-body-medium text-body-medium text-on-surface-variant" htmlFor="password">Password</label>
              </div>
              <input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-medium text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-outline-variant" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-body-medium text-body-medium hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm mt-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {activeTab === 'otp' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-5">
            <div>
              <label className="block font-body-medium text-body-medium text-on-surface-variant mb-1.5" htmlFor="mobileNumber">Mobile Number</label>
              <input 
                id="mobileNumber" 
                type="tel" 
                required
                disabled={otpSent}
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-medium text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-outline-variant disabled:bg-surface-container disabled:text-on-surface-variant" 
                placeholder="+1 (555) 000-0000" 
              />
            </div>
            
            {otpSent && (
              <div>
                <label className="block font-body-medium text-body-medium text-on-surface-variant mb-1.5" htmlFor="otp">One-Time Password (OTP)</label>
                <input 
                  id="otp" 
                  type="text" 
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-medium text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-outline-variant" 
                  placeholder="123456" 
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-body-medium text-body-medium hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm mt-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>{otpSent ? 'Verifying...' : 'Sending...'}</span>
                </>
              ) : (
                otpSent ? 'Verify & Sign In' : 'Send OTP'
              )}
            </button>
            
            {otpSent && (
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  className="text-primary font-body-medium text-sm hover:underline"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                >
                  Change mobile number
                </button>
              </div>
            )}
            <div id="recaptcha-container"></div>
          </form>
        )}

      </div>
    </div>
  );
}
