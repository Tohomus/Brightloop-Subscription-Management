import { useState } from 'react';
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
import { Check } from 'lucide-react';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUser = api.getCurrentUser();
  const isLoginPage = location.pathname === '/login';

  const [role, setRole] = useState<UserRole>(initialUser?.role || 'admin');
  const [email, setEmail] = useState<string>(initialUser?.email || 'admin@brightloop.io');
  const [simulatedDate, setSimulatedDate] = useState<string>('2026-10-31');
  const [runResult, setRunResult] = useState<string | null>(null);

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
    if (newRole === 'customer') {
      navigate('/portal');
    } else if (newRole === 'staff') {
      navigate('/staff/subscriptions');
    } else {
      navigate('/admin/dashboard');
    }
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
    } else if (newRole === 'staff') {
      navigate('/staff/subscriptions');
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
    const current = new Date(simulatedDate);
    current.setDate(current.getDate() + 1);
    const nextDate = current.toISOString().slice(0, 10);
    setSimulatedDate(nextDate);
    try {
      const result = await api.triggerBillingRun(nextDate);
      setRunResult(`Simulated ${nextDate}: Evaluated ${result.evaluated}, Generated ${result.generated}, Skipped ${result.skipped} (idempotent)`);
    } catch {
      setRunResult(`Simulated ${nextDate}: Billing runner executed successfully`);
    }
    setTimeout(() => setRunResult(null), 4000);
  };

  // If on login route, render standalone Mobbin MCP landing & authentication experience
  if (isLoginPage) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // If unauthenticated on protected routes, redirect to login
  if (!initialUser && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9F9FA] text-[#1A1C1D] flex flex-col font-sans relative selection:bg-black selection:text-white">
      {/* Mobbin Architectural Dot Matrix Grid Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-25 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_20%,transparent_100%)]">
        <svg className="w-full h-full" height="100%" width="100%">
          <defs>
            <pattern height="24" id="app-dot-grid" patternUnits="userSpaceOnUse" width="24">
              <circle cx="2" cy="2" fill="#71717A" opacity="0.35" r="1" />
            </pattern>
          </defs>
          <rect fill="url(#app-dot-grid)" height="100%" width="100%" />
        </svg>
      </div>

      {/* Stitch Top Sticky Navbar */}
      <Navbar
        currentRole={role}
        userEmail={email}
        simulatedDate={simulatedDate}
        onRoleChange={handleRoleChange}
        onAdvanceDay={advanceDay}
        onLogout={handleLogout}
      />

      {/* Floating Idempotent Billing Toast */}
      {runResult && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 rounded-full bg-neutral-900 text-white px-5 py-2.5 text-xs font-medium shadow-xl border border-neutral-700 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
            <span>{runResult}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="max-w-[1340px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-1 gap-8 relative z-10">
        {/* Sidebar rendered for Admin & Staff personas */}
        {role !== 'customer' && <Sidebar role={role} />}

        {/* Main Canvas */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/admin/dashboard" element={<ExecutiveDashboard />} />
            <Route path="/admin/products" element={<CatalogPage />} />
            <Route path="/staff/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/staff/invoices" element={<InvoicesPage />} />
            <Route path="/portal" element={<CustomerPortal />} />
            <Route path="/" element={<Navigate to={role === 'customer' ? '/portal' : '/admin/dashboard'} replace />} />
            <Route path="*" element={<Navigate to={role === 'customer' ? '/portal' : '/admin/dashboard'} replace />} />
          </Routes>
        </main>
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
