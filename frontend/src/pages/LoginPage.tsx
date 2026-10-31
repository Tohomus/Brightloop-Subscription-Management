import React, { useState } from 'react';
import { ShieldCheck, Check, Lock, Mail } from 'lucide-react';
import type { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole, email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('Brightloop@2026!');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  // Regex validation per context specs: >= 8 chars, uppercase, lowercase, special character
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    onLogin(selectedRole, email);
  };

  const setPersona = (role: UserRole, roleEmail: string) => {
    setSelectedRole(role);
    setEmail(roleEmail);
    onLogin(role, roleEmail);
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
          Instant Demo Switcher
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPersona('admin', 'admin@brightloop.io')}
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
            onClick={() => setPersona('staff', 'operations@brightloop.io')}
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
            onClick={() => setPersona('customer', 'finance@acmeglobal.com')}
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

      {/* Login Form with Validation Spec */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
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
            disabled={!isPasswordValid}
            className={`w-full rounded-full py-2.5 font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer ${
              isPasswordValid
                ? 'bg-[#3B49DF] hover:bg-[#313DE0]'
                : 'bg-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            Authenticate & Access Workspace
          </button>
        </form>
      </div>
    </div>
  );
};
