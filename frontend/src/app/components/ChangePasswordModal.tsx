import React, { useState, useMemo } from 'react';
import { apiFetch, safeJson } from '@/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Live password validation checks
  const checks = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      digit: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>\-_=+[\];/~`]/.test(newPassword),
      diffFromOld: oldPassword ? newPassword !== oldPassword : true,
      match: newPassword.length > 0 && confirmPassword.length > 0 ? newPassword === confirmPassword : false,
    };
  }, [newPassword, confirmPassword, oldPassword]);

  const allRequirementsMet = checks.length && checks.uppercase && checks.lowercase && checks.digit && checks.special;
  const isFormValid = allRequirementsMet && checks.match && checks.diffFromOld;

  // Calculate strength percentage
  const strengthScore = useMemo(() => {
    let score = 0;
    if (checks.length) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.digit) score += 20;
    if (checks.special) score += 20;
    return score;
  }, [checks]);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return '';
    if (strengthScore <= 40) return 'Weak';
    if (strengthScore <= 80) return 'Moderate';
    return 'Strong';
  }, [strengthScore, newPassword]);

  const strengthColor = useMemo(() => {
    if (strengthScore <= 40) return 'bg-rose-500';
    if (strengthScore <= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, [strengthScore]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword.trim()) {
      setError('Current password is required.');
      return;
    }

    if (newPassword === oldPassword) {
      setError('New password cannot be the same as current password.');
      return;
    }

    if (!checks.length) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!checks.uppercase) {
      setError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }

    if (!checks.lowercase) {
      setError('Password must contain at least one lowercase letter (a-z).');
      return;
    }

    if (!checks.digit) {
      setError('Password must contain at least one numeric digit (0-9).');
      return;
    }

    if (!checks.special) {
      setError('Password must contain at least one special character (!@#$%^&*...).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });

      const data = await safeJson(res);
      if (res.ok) {
        setSuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => onClose(), 1800);
      } else {
        setError(data.detail || 'Failed to update password.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose a secure, strong password for your account</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
              <span className="text-sm">✓</span>
              <span>{success}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#113254]/20 focus:border-[#113254] transition-all"
            />
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">New Password</label>
              {strengthLabel && (
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  strengthScore <= 40 ? 'text-rose-600' : strengthScore <= 80 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {strengthLabel}
                </span>
              )}
            </div>
            <input
              type={showPasswords ? "text" : "password"}
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter strong password"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#113254]/20 focus:border-[#113254] transition-all"
            />
            {/* Strength Meter Bar */}
            {newPassword && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${strengthColor}`} 
                  style={{ width: `${strengthScore}%` }}
                />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                confirmPassword && !checks.match
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                  : confirmPassword && checks.match
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'border-slate-200 focus:border-[#113254] focus:ring-[#113254]/20'
              }`}
            />
          </div>

          {/* Toggle show password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showPasswords} 
                onChange={e => setShowPasswords(e.target.checked)}
                className="rounded border-slate-300 text-[#113254] focus:ring-[#113254]/30 cursor-pointer"
              />
              <span>Show passwords</span>
            </label>
          </div>

          {/* Strong Password Criteria Checklist */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-[11px]">
            <span className="font-bold text-slate-700 block mb-1">Password Requirements:</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600">
              <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                <span>{checks.length ? '✓' : '•'}</span>
                <span>8+ characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.uppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                <span>{checks.uppercase ? '✓' : '•'}</span>
                <span>1 uppercase (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.lowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                <span>{checks.lowercase ? '✓' : '•'}</span>
                <span>1 lowercase (a-z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.digit ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                <span>{checks.digit ? '✓' : '•'}</span>
                <span>1 number (0-9)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                <span>{checks.special ? '✓' : '•'}</span>
                <span>1 special character</span>
              </div>
              <div className={`flex items-center gap-1.5 ${confirmPassword && checks.match ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                <span>{confirmPassword && checks.match ? '✓' : '•'}</span>
                <span>Passwords match</span>
              </div>
            </div>
            {oldPassword && newPassword && !checks.diffFromOld && (
              <p className="text-rose-600 font-medium text-[10px] mt-1 pt-1 border-t border-slate-200">
                ⚠️ New password must differ from current password.
              </p>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex-1 py-2 px-3 bg-[#113254] text-white text-xs font-bold rounded-xl hover:bg-[#0a1f35] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
