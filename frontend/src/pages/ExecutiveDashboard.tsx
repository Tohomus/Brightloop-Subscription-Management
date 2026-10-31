import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  FileCheck2,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { DashboardSummary } from '../types';
import { dashboardService } from '../services/dashboardService';
import { TimeMachine } from '../components/TimeMachine';
import { NavLink } from 'react-router';

export const ExecutiveDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [simulatedDate, setSimulatedDate] = useState<string>(dashboardService.getSimulatedDate());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
      setSimulatedDate(dashboardService.getSimulatedDate());
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load executive dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time events triggered by the Chrono-Simulator TimeMachine
    const unsubscribe = dashboardService.subscribe((updatedSummary, newDate) => {
      setSummary(updatedSummary);
      setSimulatedDate(newDate);
      setLastRefreshed(new Date().toLocaleTimeString());
    });

    return unsubscribe;
  }, []);

  const totalAgingOverdue = summary
    ? summary.overdue_aging['1_to_30_days'] +
      summary.overdue_aging['31_to_60_days'] +
      summary.overdue_aging['60_plus_days']
    : 0;

  const pct1To30 = totalAgingOverdue > 0 && summary
    ? Math.round((summary.overdue_aging['1_to_30_days'] / totalAgingOverdue) * 100)
    : 0;
  const pct31To60 = totalAgingOverdue > 0 && summary
    ? Math.round((summary.overdue_aging['31_to_60_days'] / totalAgingOverdue) * 100)
    : 0;
  const pct60Plus = totalAgingOverdue > 0 && summary
    ? Math.round((summary.overdue_aging['60_plus_days'] / totalAgingOverdue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Telemetry SLA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
              Executive Financial Telemetry
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 border border-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              &lt; 2s SLA Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time recurring revenue, automated billing cycles, and accounts receivable aging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-slate-400">
              Synced: {lastRefreshed}
            </span>
          )}
          <button
            onClick={loadData}
            title="Refresh Metrics"
            className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors active:scale-[0.96] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Chrono-Simulator Time Machine Feature Header */}
      <TimeMachine onSimulate={loadData} />

      {/* 3. Top KPI Rollup Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Subscriptions */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#3B49DF]">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-slate-950 tabular-nums">
              {summary ? summary.active_subscriptions_count.toLocaleString() : '—'}
            </span>
            <span className="text-xs font-medium text-emerald-600">Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Enrolled recurring customer contracts
          </div>
        </div>

        {/* KPI 2: MRR */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Recurring (MRR)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-slate-950 tabular-nums">
              ${summary ? summary.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-xs font-mono text-slate-400">/mo</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Normalized across daily/weekly/monthly/annual plans
          </div>
        </div>

        {/* KPI 3: ARR */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Annual Run Rate (ARR)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-slate-950 tabular-nums">
              ${summary ? summary.arr.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-xs font-mono text-slate-400">/yr</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Contracted annualized run-rate (MRR × 12)
          </div>
        </div>

        {/* KPI 4: Total Revenue Collected */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Settled Collections
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-slate-950 tabular-nums">
              ${summary ? summary.total_revenue_collected.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Reconciled payments received in bank
          </div>
        </div>
      </div>

      {/* 4. Secondary Row: Accounts Receivable & Overdue Aging Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Aging Visualizer Card (Takes 2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-950">
                  Accounts Receivable & Overdue Aging Analysis
                </h2>
                {summary && summary.overdue_invoices_count > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.overdue_invoices_count} Overdue Invoices
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aging classification based on current simulated date ({simulatedDate}).
              </p>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                Total Overdue At-Risk
              </div>
              <div className="font-mono text-xl font-bold text-rose-600 tabular-nums">
                ${totalAgingOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Real Computed Distribution Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-medium">Aging Exposure Distribution</span>
              <span className="font-mono text-slate-400 text-[11px]">
                {totalAgingOverdue > 0 ? '100% evaluated' : 'Zero overdue arrears'}
              </span>
            </div>

            {totalAgingOverdue > 0 ? (
              <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                {pct1To30 > 0 && (
                  <div
                    style={{ width: `${pct1To30}%` }}
                    className="bg-amber-400 transition-all duration-500"
                    title={`1-30 Days: $${summary?.overdue_aging['1_to_30_days'].toFixed(2)} (${pct1To30}%)`}
                  />
                )}
                {pct31To60 > 0 && (
                  <div
                    style={{ width: `${pct31To60}%` }}
                    className="bg-orange-500 transition-all duration-500"
                    title={`31-60 Days: $${summary?.overdue_aging['31_to_60_days'].toFixed(2)} (${pct31To60}%)`}
                  />
                )}
                {pct60Plus > 0 && (
                  <div
                    style={{ width: `${pct60Plus}%` }}
                    className="bg-rose-600 transition-all duration-500"
                    title={`60+ Days: $${summary?.overdue_aging['60_plus_days'].toFixed(2)} (${pct60Plus}%)`}
                  />
                )}
              </div>
            ) : (
              <div className="h-4 w-full rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[10px] font-semibold text-emerald-700">
                All confirmed invoices are current and within payment terms
              </div>
            )}
          </div>

          {/* Aging Buckets Detail Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bucket 1: 1-30 Days */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">1 – 30 Days</span>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              </div>
              <div className="mt-2 font-mono text-lg font-bold text-slate-900 tabular-nums">
                ${summary ? summary.overdue_aging['1_to_30_days'].toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {pct1To30}% of at-risk balances
              </div>
            </div>

            {/* Bucket 2: 31-60 Days */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">31 – 60 Days</span>
                <span className="h-2 w-2 rounded-full bg-orange-500" />
              </div>
              <div className="mt-2 font-mono text-lg font-bold text-slate-900 tabular-nums">
                ${summary ? summary.overdue_aging['31_to_60_days'].toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {pct31To60}% of at-risk balances
              </div>
            </div>

            {/* Bucket 3: 60+ Days */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">60+ Days Critical</span>
                <span className="h-2 w-2 rounded-full bg-rose-600" />
              </div>
              <div className="mt-2 font-mono text-lg font-bold text-rose-600 tabular-nums">
                ${summary ? summary.overdue_aging['60_plus_days'].toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {pct60Plus}% of at-risk balances
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Receivables Health & Operations Shortcuts */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#3B49DF]" />
              <h3 className="text-sm font-bold text-slate-950">Receivables Ledger Summary</h3>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                Total Outstanding Receivables
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-slate-950 tabular-nums">
                ${summary ? summary.outstanding_receivables.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Includes confirmed invoices awaiting payment and overdue balances.
              </p>
            </div>

            {/* Operational Links */}
            <div className="mt-6 space-y-2">
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Quick Navigation
              </div>

              <NavLink
                to="/staff/invoices"
                className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 p-3 text-xs font-semibold text-slate-800 transition-colors"
              >
                <span>View Full Invoices Ledger</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </NavLink>

              <NavLink
                to="/staff/subscriptions"
                className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 p-3 text-xs font-semibold text-slate-800 transition-colors"
              >
                <span>Manage Customer Subscriptions</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </NavLink>

              <NavLink
                to="/portal"
                className="flex items-center justify-between rounded-xl bg-blue-50/70 hover:bg-blue-50 p-3 text-xs font-semibold text-[#3B49DF] transition-colors"
              >
                <span>Open Isolated Customer Portal</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </NavLink>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Engine: Odoo × CUSAT Make-a-ton</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
