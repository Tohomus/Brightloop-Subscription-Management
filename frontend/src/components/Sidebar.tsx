import React from 'react';
import { NavLink } from 'react-router';
import {
  Boxes,
  FileSpreadsheet,
  Receipt,
  LogIn,
  CheckCircle2,
  Database,
  LayoutDashboard,
  UserCheck,
} from 'lucide-react';
import type { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Executive Telemetry',
      badge: 'SLA <2s',
      icon: LayoutDashboard,
      roles: ['admin', 'staff'],
    },
    {
      to: '/admin/products',
      label: 'Products & Plans',
      badge: 'Catalog',
      icon: Boxes,
      roles: ['admin', 'staff'],
    },
    {
      to: '/staff/subscriptions',
      label: 'Subscriptions',
      badge: 'Contracts',
      icon: FileSpreadsheet,
      roles: ['admin', 'staff', 'customer'],
    },
    {
      to: '/staff/invoices',
      label: 'Invoices & Billing',
      badge: 'Ledger',
      icon: Receipt,
      roles: ['admin', 'staff', 'customer'],
    },
    {
      to: '/portal',
      label: 'Customer Portal',
      badge: 'Self-Serve',
      icon: UserCheck,
      roles: ['admin', 'customer'],
    },
    {
      to: '/login',
      label: 'Switch Persona',
      badge: 'Auth',
      icon: LogIn,
      roles: ['admin', 'staff', 'customer'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between py-6 pr-6">
      <div className="space-y-4">
        {/* Workspace Scope Pill */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
            <span>Operations Rail</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Active Persona:</span>
            <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-bold uppercase text-[10px]">
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Items (Clean Upflow pill style) */}
        <nav className="space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#0B0F19] text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 transition ${
                          isActive ? 'text-[#3B49DF]' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Engine Status Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
          <Database className="h-4 w-4 text-[#3B49DF]" />
          <span>Billing Engine</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Zero-daemon SQLite transaction ledger. Strict cycle key idempotency.
        </p>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Accounting Invariants OK</span>
        </div>
      </div>
    </aside>
  );
};
