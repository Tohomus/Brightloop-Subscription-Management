import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CatalogPage } from './pages/CatalogPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { LoginPage } from './pages/LoginPage';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { CustomerPortal } from './pages/CustomerPortal';
import type { UserRole } from './types';
import { api } from './services/api';
import { Calendar, ShieldCheck, Check } from 'lucide-react';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUser = api.getCurrentUser();
  const [role, setRole] = useState<UserRole>(initialUser?.role || 'admin');
  const [email, setEmail] = useState<string>(initialUser?.email || 'admin@brightloop.io');
  const [simulatedDate, setSimulatedDate] = useState<string>('2026-10-31');
  const [runResult, setRunResult] = useState<string | null>(null);
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const verifyHealth = async () => {
      const live = await api.checkHealth();
      if (active) setIsBackendLive(live);
    };
    void verifyHealth();
    const interval = setInterval(() => {
      void verifyHealth();
    }, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const mockEmail =
      newRole === 'admin'
        ? 'admin@brightloop.io'
        : newRole === 'staff'
        ? 'operations@brightloop.io'
        : 'finance@acmeglobal.com';
    setEmail(mockEmail);
    api.setCurrentUser({
      id: `user-${newRole}`,
      email: mockEmail,
      name: `${newRole.toUpperCase()} User`,
      role: newRole,
    });
  };

  const handleLogin = (newRole: UserRole, userEmail: string) => {
    setRole(newRole);
    setEmail(userEmail);
    api.setCurrentUser({
      id: `user-${newRole}`,
      email: userEmail,
      name: `${newRole.toUpperCase()} User`,
      role: newRole,
    });
    if (newRole === 'customer') {
      navigate('/portal');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleLogout = () => {
    api.logout();
    setRole('customer');
    setEmail('');
    navigate('/login');
  };

  const advanceDay = async () => {
    const parts = simulatedDate.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
    const nextDate = d.toISOString().slice(0, 10);
    setSimulatedDate(nextDate);
    const result = await api.triggerBillingRun(nextDate);
    setRunResult(`Simulated ${nextDate}: Evaluated ${result.evaluated}, Generated ${result.generated}, Skipped ${result.skipped} (idempotent)`);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setRunResult(null), 4000);
  };

  // Upflow-style capsule steps
  const steps = [
    { number: '00', title: 'Executive Telemetry', path: '/admin/dashboard' },
    { number: '01', title: 'Catalog & Plans', path: '/admin/products' },
    { number: '02', title: 'Subscriptions', path: '/staff/subscriptions' },
    { number: '03', title: 'Invoicing & Cash', path: '/staff/invoices' },
    { number: '04', title: 'Customer Portal', path: '/portal' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#0B0F19] flex flex-col font-sans selection:bg-[#3B49DF] selection:text-white">
      {/* 1. UPFLOW COBALT TOP HERO SECTION */}
      <section className="bg-gradient-to-b from-[#242DB8] to-[#3B49DF] pb-14 text-white">
        <Navbar
          currentRole={role}
          userEmail={email}
          onRoleChange={handleRoleChange}
          onTriggerDemo={advanceDay}
          onLogout={handleLogout}
        />

        {/* Upflow Pill Banner (Read all 29 stories | Explore) */}
        <div className="mt-8 flex justify-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0B0F19]/80 backdrop-blur px-4 py-1.5 text-xs text-white border border-white/10 shadow-lg">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span>Simulated Date: <strong className="text-white font-mono">{simulatedDate}</strong></span>
            </span>
            <button
              onClick={advanceDay}
              className="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-[#0B0F19] hover:bg-slate-100 transition shadow-sm cursor-pointer"
            >
              Advance +1 Day
            </button>
          </div>
        </div>

        {runResult && (
          <div className="mt-3 flex justify-center px-4">
            <div className="rounded-full bg-emerald-500/90 text-white px-4 py-1 text-xs font-medium shadow-md flex items-center gap-1.5 animate-fade-in">
              <Check className="h-3.5 w-3.5" />
              <span>{runResult}</span>
            </div>
          </div>
        )}
      </section>

      {/* 2. UPFLOW HERO HEADLINE & CAPSULE STEPPER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 text-center">
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-xl border border-slate-100">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#0B0F19] max-w-3xl mx-auto leading-tight">
            What changes when subscription billing is built around relationships?
          </h1>

          {/* Upflow Capsule Stepper Bar (01, 02, 03) */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center justify-between rounded-full bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-2 border border-blue-100/80 shadow-inner">
              {steps.map((s) => {
                const isActive = location.pathname.startsWith(s.path);
                return (
                  <button
                    key={s.number}
                    onClick={() => navigate(s.path)}
                    className={`flex items-center gap-2 rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#3B49DF] text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isActive ? 'bg-white text-[#3B49DF]' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className="hidden sm:inline">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN WORKSPACE */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 min-w-0" key={refreshKey}>
          <Routes>
            <Route path="/admin/dashboard" element={<ExecutiveDashboard />} />
            <Route path="/admin/products" element={<CatalogPage />} />
            <Route path="/staff/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/staff/invoices" element={<InvoicesPage />} />
            <Route path="/portal" element={<CustomerPortal />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Upflow Floating Helper Widget (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-50">
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#0B0F19] text-white px-4 py-2.5 shadow-2xl border border-white/10 text-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#3B49DF]">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>Odoo × CUSAT Engine</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  isBackendLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {isBackendLive ? 'FastAPI Live :8000 • SQLite' : 'Offline Mock Active 👋'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
