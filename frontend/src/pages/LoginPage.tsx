import React, { useState } from 'react';
import { ShieldCheck, Check, Lock, Mail, User, AlertCircle, X, KeyRound, ArrowRight } from 'lucide-react';
import type { UserRole } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  onLogin: (role: UserRole, email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('Brightloop@2026!');
  const [name, setName] = useState('Sarah Connor');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  // Password Validation Criteria: >= 8 chars, uppercase, lowercase, special character
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const user = await api.login(email, password);
        onLogin(user.role, user.email);
      } else {
        const user = await api.register({
          email,
          password,
          role: selectedRole,
          name,
        });
        onLogin(user.role, user.email);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const setPersona = async (role: UserRole, roleEmail: string, rolePass: string) => {
    setSelectedRole(role);
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg(null);
    try {
      const user = await api.login(roleEmail, rolePass);
      onLogin(user.role, user.email);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Persona switch failed.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.resetPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err) {
      setForgotMsg(err instanceof Error ? err.message : 'Password reset failed.');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4 pb-12">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3B49DF] shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#0B0F19] tracking-tight">
          Brightloop Authentication
        </h1>
        <p className="text-xs text-slate-500">
          Sign in or switch demo personas for the Odoo × CUSAT screening review.
        </p>
      </div>

      {/* Upflow Demo Persona Quick Selector */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Instant Demo Persona Switcher
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPersona('admin', 'admin@brightloop.io', 'Brightloop@2026!')}
            className={`rounded-2xl p-4 text-left border transition cursor-pointer ${
              selectedRole === 'admin'
                ? 'border-[#3B49DF] bg-blue-50/50 shadow-sm ring-1 ring-[#3B49DF]'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-bold text-xs text-[#0B0F19]">Administrator</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Catalog & Finance</div>
            <span className="mt-2 inline-block rounded-full bg-blue-100 text-[#3B49DF] px-2 py-0.5 text-[9px] font-bold uppercase font-mono">
              admin
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPersona('staff', 'operations@brightloop.io', 'Brightloop@2026!')}
            className={`rounded-2xl p-4 text-left border transition cursor-pointer ${
              selectedRole === 'staff'
                ? 'border-[#3B49DF] bg-blue-50/50 shadow-sm ring-1 ring-[#3B49DF]'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-bold text-xs text-[#0B0F19]">Operations Staff</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Quotes & Billing</div>
            <span className="mt-2 inline-block rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold uppercase font-mono">
              staff
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPersona('customer', 'finance@acmeglobal.com', 'Brightloop@2026!')}
            className={`rounded-2xl p-4 text-left border transition cursor-pointer ${
              selectedRole === 'customer'
                ? 'border-[#3B49DF] bg-blue-50/50 shadow-sm ring-1 ring-[#3B49DF]'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-bold text-xs text-[#0B0F19]">Customer Tenant</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Isolated View</div>
            <span className="mt-2 inline-block rounded-full bg-violet-100 text-violet-800 px-2 py-0.5 text-[9px] font-bold uppercase font-mono">
              customer
            </span>
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Sign In vs Register Toggle */}
        <div className="flex rounded-full bg-slate-100 p-1 mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition cursor-pointer ${
              mode === 'signin' ? 'bg-[#0B0F19] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition cursor-pointer ${
              mode === 'register' ? 'bg-[#0B0F19] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Account Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                >
                  <option value="admin">Administrator (Catalog & Invoices)</option>
                  <option value="staff">Internal Staff (Quotes & Payments)</option>
                  <option value="customer">Customer (Isolated Portal)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotMsg(null);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-[#3B49DF] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
              />
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-[11px]">
            <span className="font-semibold text-slate-700">Security Invariant Checklist:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                <Check className="h-3 w-3" /> Minimum 8 characters
              </span>
              <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                <Check className="h-3 w-3" /> Uppercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                <Check className="h-3 w-3" /> Lowercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                <Check className="h-3 w-3" /> Special character (!@#$)
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid || loading}
            className={`w-full rounded-full py-2.5 font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              isPasswordValid && !loading
                ? 'bg-[#3B49DF] hover:bg-[#313DE0]'
                : 'bg-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create & Activate Account'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#3B49DF] flex items-center justify-center">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-[#0B0F19]">Password Recovery</h2>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Enter your registered corporate email. The system will dispatch an expiring cryptographic password reset link.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#3B49DF]"
                />
              </div>

              {forgotMsg && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                  {forgotMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
