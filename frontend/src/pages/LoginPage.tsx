import React, { useState } from 'react';
import {
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
  ChevronRight,
  Sliders,
  Terminal,
  Copy,
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
  const [copiedCli, setCopiedCli] = useState(false);

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

  const copyCliCommand = () => {
    navigator.clipboard.writeText('curl -X GET http://127.0.0.1:8000/api/dashboard/summary');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F9FA] text-[#1A1C1D] flex flex-col justify-between selection:bg-black selection:text-white">
      {/* 1. STITCH TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E4E4E7] transition-all">
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
              <span className="text-xl font-bold tracking-tight text-[#09090B] lowercase font-sans">
                brightloop
              </span>
              <div className="hidden sm:flex items-center px-2 py-0.5 rounded-full border border-[#E4E4E7] bg-[#F7F7F8] font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-medium">
                <span>MCP v2.4</span>
              </div>
            </a>

            <nav className="hidden md:flex items-center space-x-8 text-[14px] font-medium text-[#71717A]">
              <a className="hover:text-black transition-colors" href="#personas">Personas</a>
              <a className="hover:text-black transition-colors" href="#architecture">Architecture</a>
              <a className="hover:text-black transition-colors" href="#auth">Direct Sign-In</a>
            </nav>
          </div>

          {/* Right: Engine Status Pill & Instant Access */}
          <div className="flex items-center space-x-4 text-[14px] font-medium">
            <div className="hidden sm:flex items-center space-x-2 bg-[#FFFFFF] border border-[#E4E4E7] px-3.5 py-1.5 rounded-full text-xs text-[#71717A] shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="font-mono text-[11px] font-medium text-[#09090B]">SQLite v3.45 • LIVE SLA &lt;2s</span>
            </div>
            <a
              href="#personas"
              className="bg-black hover:bg-neutral-800 text-white px-5 py-2.5 rounded-full font-semibold text-[13px] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Instant Demo
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH ARCHITECTURAL DOT-GRID & RADIAL GRADIENT */}
      <section className="relative w-full overflow-hidden bg-[#FFFFFF] pt-20 pb-16 border-b border-[#E4E4E7] text-center px-4" id="top">
        {/* Architectural Dot Matrix Grid Backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_20%,transparent_100%)]">
          <svg className="w-full h-full" height="100%" width="100%">
            <defs>
              <pattern height="24" id="login-dot-grid" patternUnits="userSpaceOnUse" width="24">
                <circle cx="2" cy="2" fill="#71717A" opacity="0.35" r="1" />
              </pattern>
            </defs>
            <rect fill="url(#login-dot-grid)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Subtle Cobalt Radial Glow Vignette */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-gradient-to-b from-[#2563EB]/10 via-[#2563EB]/4 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center z-10">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F7F7F8] border border-[#E4E4E7] mb-6 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span className="font-mono text-[11px] text-[#09090B] uppercase tracking-wider font-semibold">
              Deterministic B2B Recurring Billing
            </span>
            <span className="h-3 w-px bg-[#E4E4E7] mx-0.5" />
            <span className="font-mono text-[11px] text-[#71717A] font-medium">v2.4.0-stable</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[68px] leading-[1.08] font-bold tracking-[-0.035em] text-[#09090B] mb-6 max-w-4xl">
            The subscription engine your financial operations deserve.
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-[20px] leading-relaxed text-[#71717A] max-w-2xl mb-8 font-normal">
            Brightloop connects your pricing catalog to automated prorations, idempotent billing runners, and isolated customer portals. What you invoice starts with what actually works.
          </p>

          {/* Terminal Quickstart Card (Precision Engineering Dark Console) */}
          <div className="w-full max-w-2xl rounded-xl bg-[#0A0A0B] border border-[#27272A] shadow-2xl p-4 sm:p-5 text-left mb-10 transition-all">
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="ml-2 font-mono text-xs text-[#A1A1AA] select-none">brightloop-engine ~ bash</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#A1A1AA] uppercase tracking-wider">
                <Terminal className="h-3 w-3 text-[#A1A1AA]" />
                <span>STDIO Protocol</span>
              </div>
            </div>
            {/* Command Box */}
            <div className="flex items-center justify-between gap-3 bg-[#141416] p-3 rounded-lg border border-[#27272A]">
              <div className="flex items-center gap-2 font-mono text-xs text-[#FAFAFA] overflow-x-auto select-all">
                <span className="text-[#71717A] select-none">$</span>
                <span className="text-[#A1A1AA]">curl</span>
                <span className="text-white">http://127.0.0.1:8000/api/dashboard/summary</span>
                <span className="text-emerald-400"># SLA &lt;2s</span>
              </div>
              <button
                type="button"
                onClick={copyCliCommand}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] font-mono text-xs transition-all active:scale-95 cursor-pointer"
              >
                {copiedCli ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 text-xs font-mono text-[#A1A1AA]">
              <span>FastAPI Backend • SQLite Invariants Active</span>
              <a href="#personas" className="inline-flex items-center gap-1 hover:text-white transition-colors text-emerald-400">
                Launch Demo Console ↓
              </a>
            </div>
          </div>

          {/* CTA Buttons Row */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <a
              href="#personas"
              className="bg-black hover:bg-neutral-800 text-white font-medium px-7 py-3 rounded-full text-[14px] sm:text-[15px] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Choose Demo Persona
            </a>
            <a
              href="#auth"
              className="bg-[#F7F7F8] hover:bg-[#EEEEEF] text-[#09090B] border border-[#E4E4E7] font-medium px-6 py-3 rounded-full text-[14px] sm:text-[15px] inline-flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <span>Sign In with Credentials</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-[#71717A] font-medium tracking-wide">
            Role-Based Access Control • Administrator · Operations Staff · Customer Tenant
          </p>
        </div>
      </section>

      {/* 3. INSTANT DEMO PERSONAS SECTION (MOBBIN PRICING TIER GRID) */}
      <section className="py-20 bg-[#F9F9FA] border-b border-[#E4E4E7] px-4 sm:px-6" id="personas">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E4E4E7] bg-[#F7F7F8] font-mono text-[11px] text-[#71717A] uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span>Three-Persona Dispatch 2026.1</span>
            </div>
            <h2 className="text-3xl md:text-[48px] font-bold tracking-tight text-[#09090B] leading-[1.1]">
              Instant Persona Switcher
            </h2>
            <p className="text-[#71717A] text-[15px] mt-2 max-w-xl mx-auto">
              Select any role to test end-to-end workflows with full route isolation, dynamic pricing math, and real SQLite telemetry.
            </p>
          </div>

          {/* 3 Interactive Cards matching Mobbin Pricing Tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Persona 1: Administrator */}
            <div
              onClick={() => setPersona('admin', 'admin@brightloop.io', 'Brightloop@2026!')}
              className={`flex flex-col justify-between p-8 rounded-xl bg-[#FFFFFF] border transition-all cursor-pointer floating-card ${
                selectedRole === 'admin'
                  ? 'border-black ring-2 ring-black/5 shadow-md'
                  : 'border-[#E4E4E7] hover:border-[#71717A]/40 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#71717A]">
                    Persona 01
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    admin
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#09090B] mb-1">Administrator</h3>
                <p className="text-xs text-[#71717A] mb-6">
                  Executive Telemetry &amp; Financial Formula Rules
                </p>

                <div className="flex items-baseline gap-1 pb-6 mb-6 border-b border-[#E4E4E7]">
                  <span className="font-mono text-3xl font-bold text-[#09090B] tabular-nums">$17,960</span>
                  <span className="text-xs text-[#71717A] font-mono">/mo MRR</span>
                </div>

                <div className="space-y-3 mb-8 text-[13px] text-[#47464A]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real $17,960 MRR &amp; aging exposure buckets</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dynamic formula: <code className="font-mono text-xs">Unit = Base + Σ(ΔP)</code></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Chrono-Simulator with idempotent runs</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="w-full h-11 rounded-full border border-[#E4E4E7] bg-[#FFFFFF] text-[#09090B] font-medium text-xs flex items-center justify-center gap-1.5 hover:border-[#09090B] transition-all cursor-pointer active:scale-95"
                >
                  <span>Launch Admin Console</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Persona 2: Operations Staff (HIGHLIGHTED PRO TIER) */}
            <div
              onClick={() => setPersona('staff', 'operations@brightloop.io', 'Brightloop@2026!')}
              className="relative flex flex-col justify-between p-8 rounded-xl bg-[#FFFFFF] border-2 border-black shadow-md transition-all cursor-pointer floating-card"
            >
              {/* Highlight Pill */}
              <div className="absolute -top-3.5 left-8 px-3 py-0.5 bg-black text-white rounded-full font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span>Primary Operations Deck</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#2563EB] font-semibold">
                    Persona 02
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    staff
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#09090B] mb-1">Operations Staff</h3>
                <p className="text-xs text-[#71717A] mb-6">
                  Quotations, Contracts &amp; Cash Reconciliation
                </p>

                <div className="flex items-baseline gap-1 pb-6 mb-6 border-b border-[#E4E4E7]">
                  <span className="font-mono text-3xl font-bold text-[#09090B] tabular-nums">Multi-Line</span>
                  <span className="text-xs text-[#71717A] font-mono">/Quotations</span>
                </div>

                <div className="space-y-3 mb-8 text-[13px] text-[#47464A]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dynamic multi-line quotes with live math</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>State Machine: Draft → Quotation → Active → Paused</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>B2B wire payment recording &amp; statement print</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="w-full h-11 rounded-full bg-black text-white font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <span>Launch Operations Deck</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Persona 3: Customer Tenant */}
            <div
              onClick={() => setPersona('customer', 'finance@acmeglobal.com', 'Brightloop@2026!')}
              className={`flex flex-col justify-between p-8 rounded-xl bg-[#FFFFFF] border transition-all cursor-pointer floating-card ${
                selectedRole === 'customer'
                  ? 'border-black ring-2 ring-black/5 shadow-md'
                  : 'border-[#E4E4E7] hover:border-[#71717A]/40 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#71717A]">
                    Persona 03
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                    customer
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#09090B] mb-1">Customer Tenant</h3>
                <p className="text-xs text-[#71717A] mb-6">
                  Acme Global Logistics Self-Service Portal
                </p>

                <div className="flex items-baseline gap-1 pb-6 mb-6 border-b border-[#E4E4E7]">
                  <span className="font-mono text-3xl font-bold text-[#09090B] tabular-nums">Isolated</span>
                  <span className="text-xs text-[#71717A] font-mono">/Tenant View</span>
                </div>

                <div className="space-y-3 mb-8 text-[13px] text-[#47464A]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Isolated tenant security: Acme Global Logistics</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Self-service pause/resume subscription control</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Official B2B tax invoice PDF generation</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="w-full h-11 rounded-full border border-[#E4E4E7] bg-[#FFFFFF] text-[#09090B] font-medium text-xs flex items-center justify-center gap-1.5 hover:border-[#09090B] transition-all cursor-pointer active:scale-95"
                >
                  <span>Launch Customer Portal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DIRECT CREDENTIALS AUTHENTICATION SECTION */}
      <section className="py-20 bg-[#FFFFFF] px-4 border-b border-[#E4E4E7]" id="auth">
        <div className="max-w-md mx-auto">
          {/* Card Frame */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E4E4E7] p-8 shadow-xs">
            {/* Toggle Sign In / Register */}
            <div className="flex rounded-full bg-[#F3F3F4] p-1 mb-6 border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition cursor-pointer ${
                  mode === 'signin' ? 'bg-black text-white shadow-xs' : 'text-[#71717A] hover:text-black'
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
                  mode === 'register' ? 'bg-black text-white shadow-xs' : 'text-[#71717A] hover:text-black'
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
                  <label className="block text-xs font-semibold text-[#1A1C1D] mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-[#71717A]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sarah Connor"
                      className="w-full rounded-xl border border-[#E4E4E7] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#1A1C1D] placeholder-[#A1A1AA] focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1A1C1D] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#71717A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@brightloop.io"
                    className="w-full rounded-xl border border-[#E4E4E7] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#1A1C1D] placeholder-[#A1A1AA] focus:border-black focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1A1C1D]">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-[#71717A] hover:text-black transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#71717A]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-[#E4E4E7] pl-10 pr-3.5 py-2.5 text-xs font-medium text-[#1A1C1D] placeholder-[#A1A1AA] focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                {/* Password Criteria indicators when registering */}
                {mode === 'register' && (
                  <div className="mt-2.5 space-y-1 bg-[#F7F7F8] p-2.5 rounded-lg border border-[#E4E4E7] text-[10px]">
                    <div className="font-semibold text-[#71717A] mb-1">Password Requirements:</div>
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-[#71717A]'}`}>
                      <Check className="h-3 w-3" /> Minimum 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-semibold' : 'text-[#71717A]'}`}>
                      <Check className="h-3 w-3" /> Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-semibold' : 'text-[#71717A]'}`}>
                      <Check className="h-3 w-3" /> Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-semibold' : 'text-[#71717A]'}`}>
                      <Check className="h-3 w-3" /> Special symbol (!@#$...)
                    </div>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C1D] mb-1.5">Account Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-[#E4E4E7] px-3.5 py-2.5 text-xs font-medium text-[#1A1C1D] focus:border-black focus:outline-none transition-colors bg-white cursor-pointer"
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
      <section className="py-20 bg-[#F9F9FA] px-4 sm:px-6" id="architecture">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[48px] font-bold tracking-tight text-[#09090B] leading-[1.1]">
              Engine Architecture &amp; Invariants
            </h2>
            <p className="text-[#71717A] text-[15px] mt-2 max-w-xl mx-auto">
              Engineered with strict invariant math, deterministic clock simulation, and real SQLite persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#FFFFFF] rounded-2xl p-7 border border-[#E4E4E7] shadow-xs flex flex-col justify-between floating-card">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#F7F7F8] border border-[#E4E4E7] flex items-center justify-center mb-4 text-black font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#09090B] mb-2">Deterministic TimeMachine</h3>
                <p className="text-xs text-[#71717A] leading-relaxed mb-6">
                  Advance the simulation clock by +1d, +7d, or +30d. Idempotent billing evaluation guarantees zero duplicate invoices for identical billing windows.
                </p>
              </div>
              <div className="bg-[#F7F7F8] border border-[#E4E4E7] rounded-xl p-3 font-mono text-[11px] text-[#09090B]">
                <span>cycle: evaluate_subscriptions(sim_date)</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FFFFFF] rounded-2xl p-7 border border-[#E4E4E7] shadow-xs flex flex-col justify-between floating-card">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#F7F7F8] border border-[#E4E4E7] flex items-center justify-center mb-4 text-black font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#09090B] mb-2">Dynamic Pricing Formulas</h3>
                <p className="text-xs text-[#71717A] leading-relaxed mb-6">
                  Every product line item evaluates: <code className="bg-[#EEEEEF] px-1 py-0.5 rounded text-black font-mono">Unit Price = Base + Σ(ΔP)</code>. Zero hardcoded quotes.
                </p>
              </div>
              <div className="bg-[#F7F7F8] border border-[#E4E4E7] rounded-xl p-3 font-mono text-[11px] text-[#09090B]">
                <span>rule: unit_price = base + sum(delta_p)</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FFFFFF] rounded-2xl p-7 border border-[#E4E4E7] shadow-xs flex flex-col justify-between floating-card">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#F7F7F8] border border-[#E4E4E7] flex items-center justify-center mb-4 text-black font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#09090B] mb-2">B2B Tax Invoicing &amp; Cash</h3>
                <p className="text-xs text-[#71717A] leading-relaxed mb-6">
                  Itemized tax breakdowns (GST/VAT 18%), wire transfer reference details, and instant balance reconciliation with printable PDF output.
                </p>
              </div>
              <div className="bg-[#F7F7F8] border border-[#E4E4E7] rounded-xl p-3 font-mono text-[11px] text-[#09090B]">
                <span>balance = total_amount - amount_paid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DARK CONSOLE FOOTER */}
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
