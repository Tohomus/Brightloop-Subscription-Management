import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Receipt,
  Download,
  CheckCircle2,
  Pause,
  Play,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { Subscription, Invoice } from '../types';
import { api } from '../services/api';
import { InvoicePrintModal } from '../components/InvoicePrintModal';

export const CustomerPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices'>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const currentUser = api.getCurrentUser();
  const customerId = currentUser?.customer_id || 'cust-1';

  const loadCustomerData = async () => {
    setIsLoading(true);
    try {
      const allSubs = await api.getSubscriptions();
      const allInvoices = await api.getInvoices();

      // Isolate strictly to this customer
      const mySubs = allSubs.filter(
        (s) => s.customer_id === customerId || s.customer_email === currentUser?.email
      );
      const myInvoices = allInvoices.filter(
        (i) => i.customer_id === customerId
      );

      setSubscriptions(mySubs);
      setInvoices(myInvoices);
    } catch (err) {
      console.error('Failed to load customer portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const handleTogglePause = async (sub: Subscription) => {
    const nextStatus = sub.status === 'Active' ? 'Paused' : 'Active';
    try {
      await api.updateSubscriptionStatus(sub.id, nextStatus);
      setActionFeedback(`Subscription ${sub.subscription_number} is now ${nextStatus}`);
      await loadCustomerData();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch {
      setActionFeedback(`Could not update subscription ${sub.subscription_number}`);
    }
  };

  const handleViewInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  // Rollups for customer overview
  const totalPaid = invoices.reduce((acc, i) => acc + (i.amount_paid || 0), 0);
  const pendingDue = invoices
    .filter((i) => i.status === 'Confirmed' || i.status === 'Overdue')
    .reduce((acc, i) => acc + Math.max(0, i.total_amount - (i.amount_paid || 0)), 0);

  return (
    <div className="space-y-6">
      {/* 1. Customer Welcome Header Banner (Stitch Bento Header) */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 border border-gray-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-black border border-gray-200 font-bold shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 font-mono">
                  Tenant Self-Service Portal
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  Isolated Tenant View
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
                Acme Global Logistics
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Account ID: <span className="text-gray-900 font-semibold">{customerId}</span> · {currentUser?.email || 'finance@acmeglobal.com'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-3.5 text-right min-w-[120px]">
              <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Pending Due</div>
              <div className="font-mono text-base font-bold text-neutral-900 mt-0.5 tabular-nums">
                ${pendingDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-3.5 text-right min-w-[120px]">
              <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Total Settled</div>
              <div className="font-mono text-base font-bold text-emerald-600 mt-0.5 tabular-nums">
                ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls (Segmented Stitch Control) */}
        <div className="mt-8 flex items-center gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-black text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>My Subscriptions ({subscriptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-black text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Invoices & Statements ({invoices.length})</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 2. TAB 1: MY SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl bg-white p-12 text-center text-xs text-gray-400 border border-gray-200/80">
              Loading your subscription contracts...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center border border-gray-200/80">
              <FileSpreadsheet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-800">No active subscriptions</h3>
              <p className="text-xs text-gray-500 mt-1">
                You do not have any active subscriptions registered under your account.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {subscriptions.map((sub) => {
                const isActive = sub.status === 'Active';
                const isPaused = sub.status === 'Paused';

                return (
                  <div
                    key={sub.id}
                    className="rounded-2xl bg-white p-6 border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between floating-card"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-gray-900">
                            {sub.subscription_number}
                          </span>
                          <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
                            {sub.plan_name}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPaused
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-gray-400'
                            }`}
                          />
                          {sub.status}
                        </span>
                      </div>

                      {/* Items enrolled in this subscription */}
                      <div className="mt-5 space-y-2">
                        <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                          Enrolled Services &amp; Quantities
                        </div>
                        {sub.lines && sub.lines.length > 0 ? (
                          sub.lines.map((l, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                            >
                              <span className="font-medium text-gray-900">{l.product_name}</span>
                              <span className="font-mono text-gray-500 tabular-nums">
                                {l.quantity} × ${l.unit_price}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 italic bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                            Standard Enterprise Recurring SaaS
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Billing Frequency:</span>
                        <span className="font-semibold text-gray-900 capitalize">
                          {sub.frequency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
                        <span>Next Scheduled Renewal:</span>
                        <span className="font-mono font-medium text-gray-900 tabular-nums">
                          {sub.next_billing_date}
                        </span>
                      </div>
                    </div>

                    {/* Footer Amount & Action */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Recurring Total</div>
                        <div className="font-mono text-xl font-bold text-neutral-900 tabular-nums">
                          ${sub.recurring_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          <span className="text-xs font-normal text-gray-400">/{sub.frequency}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(isActive || isPaused) && (
                          <button
                            onClick={() => handleTogglePause(sub)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-800 transition-colors cursor-pointer active:scale-95"
                          >
                            {isActive ? (
                              <>
                                <Pause className="h-3 w-3" />
                                <span>Pause Contract</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                <span>Resume Contract</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: INVOICES & STATEMENTS */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Billing History &amp; Official Tax Invoices</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Download or inspect itemized tax statements (GST/VAT) with wire remittance details.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-800">No invoices generated yet</h3>
              <p className="text-xs text-gray-500 mt-1">
                Your first invoice will be generated when the billing runner fires on your next cycle date.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-400 uppercase text-[10px] font-semibold tracking-wider font-mono">
                    <th className="py-3 px-6">Invoice #</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {invoices.map((inv) => {
                    const isPaid = inv.status === 'Paid';
                    const isOverdue = inv.status === 'Overdue';

                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-gray-900">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px] tabular-nums">
                          {inv.period_start} → {inv.period_end}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600 tabular-nums">
                          {inv.due_date}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 tabular-nums">
                          ${inv.total_amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleViewInvoice(inv)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Download className="h-3 w-3 text-white" />
                            <span>View / Print PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Printable Invoice Modal */}
      <InvoicePrintModal
        invoice={selectedInvoice}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
