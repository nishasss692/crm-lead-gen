'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data = await res.json();
      toast.success('Logged in successfully!');
      
      // Store dummy token
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      
      // Redirect to leads page
      router.push('/leads');
    } catch (err) {
      toast.error('Invalid credentials or server error');
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

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block font-body-medium text-body-medium text-on-surface-variant mb-1.5" htmlFor="email">Email address</label>
            <input 
              id="email" 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-medium text-body-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-outline-variant" 
              placeholder="name@company.com" 
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
      </div>
    </div>
  );
}
