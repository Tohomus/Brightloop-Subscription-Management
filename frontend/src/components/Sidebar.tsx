import React from 'react';
import { NavLink } from 'react-router';
import {
  Boxes,
  FileSpreadsheet,
  Receipt,
  LayoutDashboard,
  Shield,
  Zap,
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
      roles: ['admin'], // Strictly Admin!
    },
    {
      to: '/staff/subscriptions',
      label: 'Subscriptions & Quotes',
      badge: role === 'customer' ? 'My Subs' : 'Contracts',
      icon: FileSpreadsheet,
      roles: ['admin', 'staff'],
    },
    {
      to: '/staff/invoices',
      label: 'Invoices & Ledger',
      badge: 'Ledger',
      icon: Receipt,
      roles: ['admin', 'staff'],
    },
    {
      to: '/admin/products',
      label: 'Products & Catalog',
      badge: 'Catalog',
      icon: Boxes,
      roles: ['admin', 'staff'],
    },
    {
      to: '/portal',
      label: 'Customer Portal',
      badge: 'Self-Serve',
      icon: Shield,
      roles: ['admin', 'customer'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const roleMeta: Record<UserRole, { title: string; color: string; badgeBg: string }> = {
    admin: {
      title: 'Administrator',
      color: 'bg-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    staff: {
      title: 'Operations Staff',
      color: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    customer: {
      title: 'Customer Tenant',
      color: 'bg-violet-500',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
    },
  };

  const meta = roleMeta[role];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between py-2 pr-6 select-none">
      <div className="space-y-4">
        {/* Workspace Scope Box */}
        <div className="rounded-lg border border-[#E4E4E7] bg-[#FFFFFF] p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#09090B]">
            <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-mono">
              Active Scope
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${meta.color}`} />
              <span className="text-xs font-bold text-[#09090B] font-sans">{meta.title}</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 font-bold uppercase text-[9px] font-mono border ${meta.badgeBg}`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#09090B] text-white font-semibold'
                      : 'text-[#71717A] hover:bg-[#F3F3F4] hover:text-[#09090B]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive ? 'text-white' : 'text-[#71717A] group-hover:text-[#09090B]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'bg-[#F3F3F4] text-[#71717A] group-hover:bg-[#E4E4E7]'
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
      <div className="rounded-lg border border-[#E4E4E7] bg-[#FFFFFF] p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#09090B]">
          <Zap className="h-3.5 w-3.5 text-[#2563EB]" />
          <span>Billing Engine</span>
        </div>
        <p className="text-[11px] text-[#71717A] leading-relaxed">
          Zero-daemon SQLite transaction ledger. Strict cycle key idempotency.
        </p>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-semibold pt-1 border-t border-[#E4E4E7]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Invariants Operational</span>
        </div>
      </div>
    </aside>
  );
};
