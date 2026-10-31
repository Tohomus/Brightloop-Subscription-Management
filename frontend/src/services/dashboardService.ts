import type { DashboardSummary, Subscription, Invoice } from '../types';
import { api } from './api';

const API_BASE = 'http://localhost:8000/api';

type TimeTravelResult = {
  success: boolean;
  simulated_date: string;
  advance_days: number;
  billing_result?: {
    evaluated: number;
    generated: number;
    skipped: number;
  };
  summary: DashboardSummary;
};

// Event bus for real-time dashboard and time-machine synchronization
type Listener = (summary: DashboardSummary, simulatedDate: string) => void;
const listeners = new Set<Listener>();

let cachedSimulatedDate: string = '2026-10-31';

export const dashboardService = {
  getSimulatedDate(): string {
    return cachedSimulatedDate;
  },

  setSimulatedDate(newDate: string) {
    cachedSimulatedDate = newDate;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify(summary: DashboardSummary, dateStr: string) {
    cachedSimulatedDate = dateStr;
    listeners.forEach((fn) => fn(summary, dateStr));
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (res.ok) {
        const data = await res.json();
        if (data.simulated_date) {
          cachedSimulatedDate = data.simulated_date;
        }
        return data as DashboardSummary;
      }
    } catch {
      // Backend not reached, fall back to local reactive computation from api stores
    }

    // High-fidelity fallback calculation using current subscriptions and invoices stores
    const subs: Subscription[] = await api.getSubscriptions();
    const invoices: Invoice[] = await api.getInvoices();

    const activeSubs = subs.filter((s) => s.status === 'Active');
    let mrr = 0;
    activeSubs.forEach((sub) => {
      if (sub.frequency === 'daily') mrr += sub.recurring_amount * 30;
      else if (sub.frequency === 'weekly') mrr += (sub.recurring_amount * 52) / 12;
      else if (sub.frequency === 'yearly') mrr += sub.recurring_amount / 12;
      else mrr += sub.recurring_amount;
    });

    let totalCollected = 0;
    let outstandingReceivables = 0;
    let overdueCount = 0;
    let aging1To30 = 0;
    let aging31To60 = 0;
    let aging60Plus = 0;

    const simDate = new Date(cachedSimulatedDate);

    invoices.forEach((inv) => {
      totalCollected += inv.amount_paid || 0;
      const balance = Math.max(0, inv.total_amount - (inv.amount_paid || 0));

      if (inv.status === 'Paid') {
        // already counted in totalCollected
      } else if (inv.status === 'Cancelled' || inv.status === 'Draft') {
        // drafts not yet recognized as receivable
      } else {
        outstandingReceivables += balance;

        const dueDate = new Date(inv.due_date);
        const daysPastDue = Math.floor((simDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        if (daysPastDue > 0 || inv.status === 'Overdue') {
          overdueCount += 1;
          if (daysPastDue <= 30) aging1To30 += balance;
          else if (daysPastDue <= 60) aging31To60 += balance;
          else aging60Plus += balance;
        }
      }
    });

    return {
      active_subscriptions_count: activeSubs.length,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      total_revenue_collected: Math.round(totalCollected * 100) / 100,
      outstanding_receivables: Math.round(outstandingReceivables * 100) / 100,
      overdue_invoices_count: overdueCount,
      overdue_aging: {
        '1_to_30_days': Math.round(aging1To30 * 100) / 100,
        '31_to_60_days': Math.round(aging31To60 * 100) / 100,
        '60_plus_days': Math.round(aging60Plus * 100) / 100,
      },
    };
  },

  async timeTravel(advanceDays: number, explicitDate?: string): Promise<TimeTravelResult> {
    try {
      const res = await fetch(`${API_BASE}/simulation/time-travel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advance_days: advanceDays, simulated_date: explicitDate }),
      });
      if (res.ok) {
        const data = (await res.json()) as TimeTravelResult;
        this.notify(data.summary, data.simulated_date);
        return data;
      }
    } catch {
      // Backend unavailable; execute local time travel fallback
    }

    const current = new Date(cachedSimulatedDate);
    current.setDate(current.getDate() + advanceDays);
    const nextDate = explicitDate || current.toISOString().slice(0, 10);
    cachedSimulatedDate = nextDate;

    // Trigger local billing run
    const runResult = await api.triggerBillingRun(nextDate);
    const summary = await this.getDashboardSummary();
    this.notify(summary, nextDate);

    return {
      success: true,
      simulated_date: nextDate,
      advance_days: advanceDays,
      billing_result: runResult,
      summary,
    };
  },
};
