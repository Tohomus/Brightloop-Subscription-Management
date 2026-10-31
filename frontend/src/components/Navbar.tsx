import React from 'react';
import { NavLink } from 'react-router';
import { ChevronDown, Sparkles, UserCheck } from 'lucide-react';
import type { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  userEmail: string;
  onRoleChange: (role: UserRole) => void;
  onTriggerDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  userEmail,
  onRoleChange,
  onTriggerDemo,
}) => {
  return (
    <div className="w-full pt-4 px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto max-w-7xl rounded-full bg-[#0B0F19] px-5 py-2.5 sm:px-7 sm:py-3 text-white shadow-2xl border border-white/10 flex items-center justify-between">
        {/* Brand: brightloop. (Upflow style) */}
        <div className="flex items-center gap-8">
          <NavLink to="/admin/products" className="flex items-center gap-1 group">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans lowercase">
              brightloop
            </span>
            <span className="h-2 w-2 rounded-full bg-[#3B49DF] group-hover:scale-125 transition-transform"></span>
          </NavLink>

          {/* Navigation Items (Upflow style) */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `flex items-center gap-1.5 transition hover:text-white ${
                  isActive ? 'text-white font-semibold' : ''
                }`
              }
            >
              <span>Products & Plans</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </NavLink>

            <NavLink
              to="/staff/subscriptions"
              className={({ isActive }) =>
                `flex items-center gap-1.5 transition hover:text-white ${
                  isActive ? 'text-white font-semibold' : ''
                }`
              }
            >
              <span>Subscriptions</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </NavLink>

            <NavLink
              to="/staff/invoices"
              className={({ isActive }) =>
                `flex items-center gap-1.5 transition hover:text-white ${
                  isActive ? 'text-white font-semibold' : ''
                }`
              }
            >
              <span>Invoices & Ledger</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </NavLink>

            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-mono text-slate-300 border border-white/5">
              Odoo × CUSAT
            </span>
          </div>
        </div>

        {/* Right CTA & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Persona Capsule Dropdown */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs border border-white/10">
            <UserCheck className="h-3.5 w-3.5 text-blue-400" />
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-medium text-white border-none outline-none cursor-pointer pr-1"
            >
              <option value="admin" className="bg-[#0B0F19] text-white">Admin</option>
              <option value="staff" className="bg-[#0B0F19] text-white">Internal Staff</option>
              <option value="customer" className="bg-[#0B0F19] text-white">Customer</option>
            </select>
          </div>

          <NavLink
            to="/login"
            className="hidden sm:inline-block text-xs font-medium text-slate-300 hover:text-white transition px-2 py-1"
          >
            {userEmail ? userEmail.split('@')[0] : 'Login'}
          </NavLink>

          {/* Upflow "Book a demo" pill CTA -> Fast-Action */}
          <button
            onClick={onTriggerDemo}
            className="flex items-center gap-1.5 rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-4 py-2 text-xs font-semibold text-white shadow-md transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast-Forward Run</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
