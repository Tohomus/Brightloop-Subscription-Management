import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  Lock,
  Mail,
  User,
  AlertCircle,
  X,
  KeyRound,
  ArrowRight,
  Calendar,
  Receipt,
  FileSpreadsheet,
  ChevronRight,
  Sliders,
} from 'lucide-react';
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
    setLoading(true);
    try {
      const user = await api.login(roleEmail, rolePass);
      onLogin(user.role, user.email);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Persona switch failed.');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-between selection:bg-black selection:text-white">
      {/* 1. STITCH TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-[1340px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Left Brand & Navigation */}
          <div className="flex items-center space-x-10">
            <a aria-label="Brightloop Home" className="flex items-center space-x-3 group" href="#top">
              {/* Geometric Brand Logo */}
              <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-neutral-900 lowercase">
                brightloop
              </span>
            </a>

            <nav className="hidden md:flex items-center space-x-8 text-[15px] font-medium text-gray-700">
              <a className="hover:text-black transition-colors" href="#personas">Personas</a>
              <a className="hover:text-black transition-colors" href="#features">Architecture</a>
              <a className="hover:text-black transition-colors" href="#auth">Direct Sign-In</a>
            </nav>
          </div>

          {/* Right: Engine Status Pill & Instant Access */}
          <div className="flex items-center space-x-4 text-[14px] font-medium">
            <div className="hidden sm:flex items-center space-x-2 bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-full text-xs text-gray-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px]">SQLite v3.45 • LIVE SLA &lt;2s</span>
            </div>
            <a
              href="#personas"
              className="bg-black hover:bg-neutral-800 text-white px-5 py-2.5 rounded-full font-semibold text-[14px] transition-all cursor-pointer shadow-xs"
            >
              Instant Demo
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-20 pb-16 text-center relative px-4" id="top">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Social Proof Pill Stack */}
          <div className="flex flex-col items-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200/80 px-4 py-1.5 rounded-full text-xs text-gray-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="font-medium">Deterministic Billing Engine • Zero Mock Placeholders</span>
            </div>
            <p className="text-[14px] text-gray-500 font-medium">
              Trusted by recurring revenue operators. Built with real SQLite telemetry.
            </p>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[68px] leading-[1.08] font-bold tracking-[-0.035em] text-neutral-900 mb-6 max-w-4xl">
            The subscription engine your financial operations deserve.
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-[20px] leading-relaxed text-gray-500 max-w-2xl mb-10 font-normal">
            Brightloop connects your pricing catalog to automated prorations, idempotent billing runners, and isolated customer portals. What you invoice starts with what actually works.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <a
              href="#personas"
              className="bg-black hover:bg-neutral-800 text-white font-medium px-7 py-3 rounded-full text-[15px] transition-all cursor-pointer shadow-sm"
            >
              Choose Demo Persona
            </a>
            <a
              href="#auth"
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-6 py-3 rounded-full text-[15px] inline-flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Sign In with Credentials</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            Role-Based Access Control • Administrator · Operations Staff · Customer Tenant
          </p>
        </div>
      </section>

      {/* 3. INSTANT DEMO PERSONAS SECTION */}
      <section className="py-16 bg-gray-50/70 border-y border-gray-100 px-4 sm:px-6" id="personas">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-[44px] font-bold tracking-tight text-neutral-900 leading-[1.15]">
              Instant Persona Switcher
            </h2>
            <p className="text-gray-500 text-[15px] mt-2">
              Select any role to test end-to-end workflows with full route isolation and real SQLite data.
            </p>
          </div>

          {/* 3 Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Persona 1: Administrator */}
            <div
              onClick={() => setPersona('admin', 'admin@brightloop.io', 'Brightloop@2026!')}
              className={`bg-white rounded-2xl p-7 border transition-all cursor-pointer floating-card flex flex-col justify-between ${
                selectedRole === 'admin'
                  ? 'border-black ring-2 ring-black/5 shadow-md'
                  : 'border-gray-200/80 hover:border-gray-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    admin
                  </span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900">Administrator</h3>
                <p className="text-xs text-gray-500 mt-1 mb-6">
                  Executive Telemetry & Rule Engine
                </p>

                <div className="space-y-3 text-[13px] text-gray-600 mb-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Real $17,960 MRR &amp; aging exposure buckets</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Dynamic formula: <code className="font-mono text-xs">Unit = Base + Σ(ΔP)</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Chrono-Simulator with idempotent runs</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Admin Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Persona 2: Operations Staff */}
            <div
              onClick={() => setPersona('staff', 'operations@brightloop.io', 'Brightloop@2026!')}
              className={`bg-white rounded-2xl p-7 border transition-all cursor-pointer floating-card flex flex-col justify-between ${
                selectedRole === 'staff'
                  ? 'border-black ring-2 ring-black/5 shadow-md'
                  : 'border-gray-200/80 hover:border-gray-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    operations
                  </span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900">Operations Staff</h3>
                <p className="text-xs text-gray-500 mt-1 mb-6">
                  Quotations, Contracts & Cash Ledger
                </p>

                <div className="space-y-3 text-[13px] text-gray-600 mb-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Dynamic multi-line quotes with live math</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Lifecycle: Draft → Quotation → Active → Paused</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>B2B wire payment recording &amp; statement print</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Operations Deck</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Persona 3: Customer Tenant */}
            <div
              onClick={() => setPersona('customer', 'finance@acmeglobal.com', 'Brightloop@2026!')}
              className={`bg-white rounded-2xl p-7 border transition-all cursor-pointer floating-card flex flex-col justify-between ${
                selectedRole === 'customer'
                  ? 'border-black ring-2 ring-black/5 shadow-md'
                  : 'border-gray-200/80 hover:border-gray-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-neutral-800 text-white rounded-xl flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                    customer
                  </span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900">Customer Tenant</h3>
                <p className="text-xs text-gray-500 mt-1 mb-6">
                  Acme Global Logistics Self-Service
                </p>

                <div className="space-y-3 text-[13px] text-gray-600 mb-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Isolated tenant security: Acme Global Logistics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Self-service pause/resume subscription control</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Official B2B tax invoice PDF generation</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Customer Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DIRECT CREDENTIALS AUTHENTICATION SECTION */}
      <section className="py-20 bg-white px-4" id="auth">
        <div className="max-w-md mx-auto">
          {/* Card Frame */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-8 shadow-sm">
            {/* Toggle Sign In / Register */}
            <div className="flex rounded-full bg-gray-100 p-1 mb-6 border border-gray-200/80">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition cursor-pointer ${
                  mode === 'signin' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'
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
                  mode === 'register' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sarah Connor"
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-3.5 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@brightloop.io"
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-3.5 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-gray-500 hover:text-black transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-3.5 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                {/* Password Criteria indicators when registering */}
                {mode === 'register' && (
                  <div className="mt-2.5 space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-[10px]">
                    <div className="font-semibold text-gray-600 mb-1">Password Requirements:</div>
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" /> Minimum 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" /> Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" /> Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" /> Special symbol (!@#$...)
                    </div>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-black focus:outline-none transition-colors bg-white cursor-pointer"
                  >
                    <option value="admin">Administrator (Catalog & Finance)</option>
                    <option value="staff">Operations Staff (Quotes & Ledger)</option>
                    <option value="customer">Customer Tenant (Self-Service)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'register' && !isPasswordValid)}
                className="w-full mt-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : mode === 'signin' ? (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Create Account &amp; Proceed</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 5. ARCHITECTURE BENTO GRID SECTION */}
      <section className="py-20 bg-gray-50/70 border-t border-gray-100 px-4 sm:px-6" id="features">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[50px] font-bold tracking-tight text-neutral-900 leading-[1.1]">
              Engine Architecture &amp; Invariants
            </h2>
            <p className="text-gray-500 text-[15px] mt-2 max-w-xl mx-auto">
              Engineered with strict invariant math, deterministic clock simulation, and real SQLite persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-7 border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mb-4 text-black font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Deterministic TimeMachine</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  Advance the simulation clock by +1d, +7d, or +30d. Idempotent billing evaluation guarantees zero duplicate invoices for identical billing windows.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-mono text-[11px] text-gray-700">
                <span>cycle: evaluate_subscriptions(sim_date)</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-7 border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mb-4 text-black font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Dynamic Pricing Formulas</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  Every product line item evaluates: <code className="bg-gray-100 px-1 py-0.5 rounded text-black font-mono">Unit Price = Base Price + Σ(Modifier ΔP)</code>. Zero hardcoded quotes.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-mono text-[11px] text-gray-700">
                <span>rule: unit_price = base + sum(delta_p)</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-7 border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mb-4 text-black font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">B2B Tax Invoicing &amp; Cash</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  Itemized tax breakdowns (GST/VAT 18%), wire transfer reference details, and instant balance reconciliation with printable PDF output.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-mono text-[11px] text-gray-700">
                <span>balance = total_amount - amount_paid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIAL QUOTE */}
      <section className="py-20 bg-white text-center px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <blockquote className="text-2xl md:text-[34px] leading-[1.25] font-semibold text-neutral-900 tracking-[-0.02em] mb-8">
            “Being able to run deterministic billing simulations and test multi-tier contract changes without dummy data transforms recurring revenue operations.”
          </blockquote>
          <div className="flex flex-col items-center">
            <cite className="not-italic font-bold text-neutral-900 text-sm">Brightloop Systems Architecture</cite>
            <span className="text-xs text-gray-400 mt-0.5">High-Velocity B2B Recurring Revenue</span>
          </div>
        </div>
      </section>

      {/* 7. DARK CONSOLE FOOTER */}
      <footer className="bg-[#0C0C0C] text-white pt-20 pb-16 relative overflow-hidden">
        {/* Giant Background Watermark "Brightloop" */}
        <div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 select-none pointer-events-none opacity-[0.03] text-[220px] font-black tracking-tighter whitespace-nowrap text-white">
          brightloop
        </div>

        <div className="max-w-[1300px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-neutral-800">
            {/* Logo Column */}
            <div className="md:col-span-5">
              <span className="inline-block text-2xl font-bold tracking-tight text-white mb-4 lowercase">
                brightloop
              </span>
              <p className="text-neutral-400 text-xs max-w-sm leading-relaxed">
                Deterministic B2B subscription billing, pricing formula engines, and multi-tenant self-service portals.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Production v2.4 • Offline SQLite</span>
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-[14px]">
              <div className="space-y-4">
                <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Engine</h4>
                <ul className="space-y-2.5 font-normal text-xs text-neutral-300">
                  <li><a className="hover:text-white transition-colors" href="#personas">Admin Console</a></li>
                  <li><a className="hover:text-white transition-colors" href="#personas">Operations Deck</a></li>
                  <li><a className="hover:text-white transition-colors" href="#personas">Customer Portal</a></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Modules</h4>
                <ul className="space-y-2.5 font-normal text-xs text-neutral-300">
                  <li><span className="text-neutral-400">TimeMachine</span></li>
                  <li><span className="text-neutral-400">Pricing Invariants</span></li>
                  <li><span className="text-neutral-400">AR Aging</span></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">System</h4>
                <ul className="space-y-2.5 font-normal text-xs text-neutral-300">
                  <li><span className="text-neutral-400">FastAPI backend</span></li>
                  <li><span className="text-neutral-400">SQLite persistence</span></li>
                  <li><span className="text-neutral-400">React + Vite frontend</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 space-y-4 sm:space-y-0">
            <div>© Brightloop 2026. All rights reserved.</div>
            <div className="flex items-center space-x-6">
              <span>Security &amp; Invariants Verified</span>
              <div className="h-3 w-[1px] bg-neutral-800" />
              <span>SLA &lt; 2s</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-black">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMsg(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotMsg ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                  {forgotMsg}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMsg(null);
                  }}
                  className="w-full rounded-xl bg-black py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your account email"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-black focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-black py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
