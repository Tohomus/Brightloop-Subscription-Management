import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
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
    let active = true;
    const fetchSummary = async () => {
      try {
        const data = await dashboardService.getDashboardSummary();
        if (!active) return;
        setSummary(data);
        setSimulatedDate(dashboardService.getSimulatedDate());
        setLastRefreshed(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to load executive dashboard summary:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void fetchSummary();

    // Listen to real-time events triggered by the Chrono-Simulator TimeMachine
    const unsubscribe = dashboardService.subscribe((updatedSummary, newDate) => {
      if (!active) return;
      setSummary(updatedSummary);
      setSimulatedDate(newDate);
      setLastRefreshed(new Date().toLocaleTimeString());
    });

    return () => {
      active = false;
      unsubscribe();
    };
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E4E4E7]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
              Executive Financial Telemetry
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              LIVE SLA &lt; 2S
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time recurring revenue, automated billing cycles, and accounts receivable aging.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-zinc-400">
              Synced: {lastRefreshed}
            </span>
          )}
          <button
            onClick={loadData}
            title="Refresh Metrics"
            className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-[#E4E4E7] px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Chrono-Simulator Time Machine Precision Strip */}
      <TimeMachine onSimulate={loadData} />

      {/* 3. Top KPI Rollup Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Subscriptions */}
        <div className="rounded-xl bg-white p-5 border border-[#E4E4E7] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Active Subscriptions
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <FileCheck2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              {summary ? summary.active_subscriptions_count.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] font-mono font-medium text-emerald-600">Active</span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            Enrolled recurring customer contracts
          </div>
        </div>

        {/* KPI 2: MRR */}
        <div className="rounded-xl bg-white p-5 border border-[#E4E4E7] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Monthly Recurring (MRR)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              ${summary ? summary.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-xs font-mono text-zinc-400">/mo</span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            Normalized across recurring plan intervals
          </div>
        </div>

        {/* KPI 3: ARR */}
        <div className="rounded-xl bg-white p-5 border border-[#E4E4E7] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Annual Run Rate (ARR)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              ${summary ? summary.arr.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-xs font-mono text-zinc-400">/yr</span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            Contracted annualized run-rate (MRR × 12)
          </div>
        </div>

        {/* KPI 4: Total Revenue Collected */}
        <div className="rounded-xl bg-white p-5 border border-[#E4E4E7] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Settled Collections
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <CreditCard className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              ${summary ? summary.total_revenue_collected.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            Reconciled payments received in bank
          </div>
        </div>
      </div>

      {/* 4. Secondary Row: Accounts Receivable & Overdue Aging Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Aging Visualizer Card (Takes 2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 border border-[#E4E4E7] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#E4E4E7]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Accounts Receivable & Overdue Aging
                </h2>
                {summary && summary.overdue_invoices_count > 0 && (
                  <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-medium text-rose-700 bg-rose-50 border border-rose-200">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.overdue_invoices_count} Overdue
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Aging classification based on current simulated date ({simulatedDate}).
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase font-mono font-medium text-zinc-400">
                Total Overdue At-Risk
              </div>
              <div className="font-mono text-lg font-bold text-rose-600 tabular-nums">
                ${totalAgingOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Real Computed Distribution Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-zinc-600 mb-2">
              <span className="font-medium">Aging Exposure Distribution</span>
              <span className="font-mono text-zinc-400 text-[11px]">
                {totalAgingOverdue > 0 ? '100% evaluated' : 'Zero overdue arrears'}
              </span>
            </div>

            {totalAgingOverdue > 0 ? (
              <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden flex">
                {pct1To30 > 0 && (
                  <div
                    style={{ width: `${pct1To30}%` }}
                    className="bg-amber-400 transition-all duration-300"
                    title={`1-30 Days: $${summary?.overdue_aging['1_to_30_days'].toFixed(2)} (${pct1To30}%)`}
                  />
                )}
                {pct31To60 > 0 && (
                  <div
                    style={{ width: `${pct31To60}%` }}
                    className="bg-orange-500 transition-all duration-300"
                    title={`31-60 Days: $${summary?.overdue_aging['31_to_60_days'].toFixed(2)} (${pct31To60}%)`}
                  />
                )}
                {pct60Plus > 0 && (
                  <div
                    style={{ width: `${pct60Plus}%` }}
                    className="bg-rose-600 transition-all duration-300"
                    title={`60+ Days: $${summary?.overdue_aging['60_plus_days'].toFixed(2)} (${pct60Plus}%)`}
                  />
                )}
              </div>
            ) : (
              <div className="h-6 w-full rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[11px] font-mono font-medium text-emerald-700">
                All confirmed invoices are current and within payment terms
              </div>
            )}
          </div>

          {/* Aging Buckets Detail Cards */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bucket 1: 1-30 Days */}
            <div className="rounded-lg bg-[#F4F4F5] p-3.5 border border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-700">1 – 30 Days</span>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              </div>
              <div className="mt-2 font-mono text-base font-bold text-zinc-900 tabular-nums">
                ${summary ? summary.overdue_aging['1_to_30_days'].toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="mt-1 text-[11px] font-mono text-zinc-500">
                {pct1To30}% of at-risk balances
              </div>
            </div>

            {/* Bucket 2: 31-60 Days */}
            <div className="rounded-lg bg-[#F4F4F5] p-3.5 border border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-700">31 – 60 Days</span>
                <span className="h-2 w-2 rounded-full bg-orange-500" />
              </div>
              <div className="mt-2 font-mono text-base font-bold text-zinc-900 tabular-nums">
                ${summary ? summary.overdue_aging['31_to_60_days'].toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="mt-1 text-[11px] font-mono text-zinc-500">
                {pct31To60}% of at-risk balances
              </div>
            </div>

            {/* Bucket 3: 60+ Days */}
            <div className="rounded-lg bg-[#F4F4F5] p-3.5 border border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-700">60+ Days Critical</span>
                <span className="h-2 w-2 rounded-full bg-rose-600" />
              </div>
              <div className="mt-2 font-mono text-base font-bold text-rose-600 tabular-nums">
                ${summary ? summary.overdue_aging['60_plus_days'].toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="mt-1 text-[11px] font-mono text-zinc-500">
                {pct60Plus}% of at-risk balances
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Receivables Health & Operations Shortcuts */}
        <div className="rounded-xl bg-white p-6 border border-[#E4E4E7] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-700" />
              <h3 className="text-sm font-semibold text-zinc-900">Receivables Ledger Summary</h3>
            </div>

            <div className="mt-4 rounded-lg bg-[#F4F4F5] p-4 border border-[#E4E4E7]">
              <div className="text-[10px] uppercase font-mono font-medium text-zinc-500">
                Total Outstanding Receivables
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-zinc-900 tabular-nums">
                ${summary ? summary.outstanding_receivables.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Includes confirmed invoices awaiting payment and overdue balances.
              </p>
            </div>

            {/* Operational Links */}
            <div className="mt-5 space-y-2">
              <div className="text-[10px] uppercase font-mono font-medium text-zinc-400 tracking-wider">
                Direct Navigation
              </div>

              <NavLink
                to="/staff/invoices"
                className="flex items-center justify-between rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-[#E4E4E7] p-2.5 text-xs font-medium text-zinc-800 transition-colors"
              >
                <span>View Full Invoices Ledger</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </NavLink>

              <NavLink
                to="/staff/subscriptions"
                className="flex items-center justify-between rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-[#E4E4E7] p-2.5 text-xs font-medium text-zinc-800 transition-colors"
              >
                <span>Manage Subscriptions</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </NavLink>

              <NavLink
                to="/portal"
                className="flex items-center justify-between rounded-lg bg-blue-50/50 hover:bg-blue-50 border border-blue-200 p-2.5 text-xs font-medium text-blue-700 transition-colors"
              >
                <span>Open Customer Portal</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
              </NavLink>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E4E4E7] text-[11px] text-zinc-400 flex items-center justify-between">
            <span className="font-mono">Brightloop Engine</span>
            <span className="font-mono">v2.4-prod</span>
          </div>
        </div>
      </div>
    </div>
  );
};

