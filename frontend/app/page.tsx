'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  
  // State for login methods toggle
  const [loginMethod, setLoginMethod] = useState<'employee' | 'otp'>('employee');
  
  // State for Employee ID Login
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  
  // State for OTP Login
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpRequested, setIsOtpRequested] = useState(false);
  
  const [loading, setLoading] = useState(false);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId, password }),
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data = await res.json();
      toast.success('Logged in successfully!');
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      router.push('/dashboard');
    } catch (err) {
      toast.error('Invalid credentials or server error');
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
      const res = await fetch('http://localhost:8000/api/login/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });
      if (!res.ok) throw new Error('Failed to request OTP');
      toast.success('OTP sent successfully! (Use 123456 for testing)');
      setIsOtpRequested(true);
    } catch (err) {
      toast.error('Failed to send OTP');
      console.error(err);
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
      const res = await fetch('http://localhost:8000/api/login/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile_number: mobileNumber, otp }),
      });
      if (!res.ok) throw new Error('Invalid OTP');
      const data = await res.json();
      toast.success('Logged in successfully!');
      if (typeof window !== 'undefined') localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err) {
      toast.error('Invalid OTP. Use 123456 for testing.');
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

        {/* Tabs */}
        <div className="flex border-b border-outline-variant mb-6">
          <button
            className={`flex-1 py-2 font-body-medium text-center ${loginMethod === 'employee' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setLoginMethod('employee')}
          >
            Employee ID
          </button>
          <button
            className={`flex-1 py-2 font-body-medium text-center ${loginMethod === 'otp' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setLoginMethod('otp')}
          >
            OTP Login
          </button>
        </div>

        {loginMethod === 'employee' ? (
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
        ) : (
          <div className="space-y-5">
            {!isOtpRequested ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block font-body-medium text-body-medium text-on-surface-variant mb-1.5" htmlFor="mobileNumber">Mobile Number</label>
                  <input 
                    id="mobileNumber" 
                    type="tel" 
                    required
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-medium text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-outline-variant" 
                    placeholder="+1 (555) 000-0000" 
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
                      <span>Requesting OTP...</span>
                    </>
                  ) : (
                    'Request OTP'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block font-body-medium text-body-medium text-on-surface-variant mb-1.5" htmlFor="otp">Enter OTP</label>
                  <input 
                    id="otp" 
                    type="text" 
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-medium text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-outline-variant tracking-widest text-center" 
                    placeholder="------" 
                  />
                  <p className="text-xs text-on-surface-variant mt-2 text-center">We've sent a 6-digit code to your mobile number.</p>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-body-medium text-body-medium hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm mt-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOtpRequested(false)}
                  className="w-full text-primary text-sm font-medium hover:underline focus:outline-none mt-2"
                >
                  Change Mobile Number
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
