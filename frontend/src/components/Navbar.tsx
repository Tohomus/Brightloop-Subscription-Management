import React from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  Calendar,
  LogOut,
  Sparkles,
  Shield,
  Layers,
  FileSpreadsheet,
  Receipt,
  LayoutDashboard,
} from 'lucide-react';
import type { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  userEmail: string;
  simulatedDate: string;
  onRoleChange: (role: UserRole) => void;
  onAdvanceDay?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  userEmail,
  simulatedDate,
  onRoleChange,
  onAdvanceDay,
  onLogout,
}) => {
  const navigate = useNavigate();

  const handlePersonaSelect = (role: UserRole) => {
    onRoleChange(role);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'staff') {
      navigate('/staff/subscriptions');
    } else if (role === 'customer') {
      navigate('/portal');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E4E4E7] transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* 1. Brand Logo + Version Chip */}
          <div className="flex items-center gap-6 lg:gap-8">
            <NavLink
              to={
                currentRole === 'admin'
                  ? '/admin/dashboard'
                  : currentRole === 'staff'
                  ? '/staff/subscriptions'
                  : '/portal'
              }
              className="flex items-center gap-2.5 group select-none"
            >
              <div className="h-7 w-7 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs">
                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-neutral-900 font-sans lowercase">
                brightloop
              </span>
              <div className="hidden sm:flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 font-mono text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                <span>ENGINE v2.4</span>
              </div>
            </NavLink>

            {/* 2. Role-Aware Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
              {currentRole === 'admin' && (
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-[#F3F3F4] text-[#09090B] font-semibold'
                        : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#F9F9FA]'
                    }`
                  }
                >
                  <LayoutDashboard className="h-3.5 w-3.5 opacity-70" />
                  <span>Telemetry</span>
                </NavLink>
              )}

              {currentRole !== 'customer' && (
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-[#F3F3F4] text-[#09090B] font-semibold'
                        : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#F9F9FA]'
                    }`
                  }
                >
                  <Layers className="h-3.5 w-3.5 opacity-70" />
                  <span>Catalog & Plans</span>
                </NavLink>
              )}

              {currentRole !== 'customer' && (
                <NavLink
                  to="/staff/subscriptions"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-[#F3F3F4] text-[#09090B] font-semibold'
                        : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#F9F9FA]'
                    }`
                  }
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 opacity-70" />
                  <span>Subscriptions</span>
                </NavLink>
              )}

              {currentRole !== 'customer' && (
                <NavLink
                  to="/staff/invoices"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-[#F3F3F4] text-[#09090B] font-semibold'
                        : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#F9F9FA]'
                    }`
                  }
                >
                  <Receipt className="h-3.5 w-3.5 opacity-70" />
                  <span>Invoices & Ledger</span>
                </NavLink>
              )}

              {currentRole === 'customer' && (
                <NavLink
                  to="/portal"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-[#F3F3F4] text-[#09090B] font-semibold'
                        : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#F9F9FA]'
                    }`
                  }
                >
                  <Shield className="h-3.5 w-3.5 opacity-70" />
                  <span>Customer Portal</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* 3. Center/Right: Segmented Persona Switcher & Fast-Forward Clock */}
          <div className="flex items-center gap-3">
            {/* Segmented Persona Control */}
            <div className="flex items-center bg-[#F3F3F4] rounded-full p-1 border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => handlePersonaSelect('admin')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  currentRole === 'admin'
                    ? 'bg-[#09090B] text-white shadow-xs font-semibold'
                    : 'text-[#71717A] hover:text-[#09090B] font-medium'
                }`}
                title="Switch to Admin (Executive Telemetry & Catalog)"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaSelect('staff')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  currentRole === 'staff'
                    ? 'bg-[#09090B] text-white shadow-xs font-semibold'
                    : 'text-[#71717A] hover:text-[#09090B] font-medium'
                }`}
                title="Switch to Operations Staff (Contracts, Quotations & Ledger)"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Operations</span>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaSelect('customer')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  currentRole === 'customer'
                    ? 'bg-[#09090B] text-white shadow-xs font-semibold'
                    : 'text-[#71717A] hover:text-[#09090B] font-medium'
                }`}
                title="Switch to Customer Tenant (Self-service billing & PDF receipts)"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                <span>Customer</span>
              </button>
            </div>

            {/* Compact Chrono-Simulator Time Pill */}
            {onAdvanceDay && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#FFFFFF] border border-[#E4E4E7] px-3 py-1 text-xs text-[#71717A]">
                <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
                <span className="font-mono text-[11px] font-medium text-[#09090B]">
                  {simulatedDate}
                </span>
                <button
                  type="button"
                  onClick={onAdvanceDay}
                  title="Advance clock by 1 day and trigger idempotent billing evaluation"
                  className="ml-1 rounded-full bg-[#09090B] hover:bg-[#2563EB] text-white px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>+1d</span>
                </button>
              </div>
            )}

            {/* User Session & Logout */}
            <div className="flex items-center gap-2 border-l border-[#E4E4E7] pl-3">
              <div
                className="hidden lg:flex items-center gap-2 text-xs"
                title={userEmail}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F3F4] text-[#09090B] font-mono font-semibold text-[11px] border border-[#E4E4E7]">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[110px] truncate font-medium text-[#09090B]">
                  {userEmail ? userEmail.split('@')[0] : 'Guest'}
                </span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out of current session"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#71717A] hover:text-[#09090B] hover:bg-[#F3F3F4] transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
