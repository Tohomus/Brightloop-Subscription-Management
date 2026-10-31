import React, { useState, useEffect } from 'react';
import {
  Search,
  Receipt,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Printer,
  Sparkles,
  Eye,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type { Invoice, InvoiceStatus, PaymentMethod } from '../types';
import { api } from '../services/api';

const DEFAULT_PAYMENT_DATE = '2026-10-31';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [runLog, setRunLog] = useState<{ evaluated: number; generated: number; skipped: number } | null>(null);
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const currentUser = api.getCurrentUser();

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'bank_transfer' as PaymentMethod,
    payment_date: DEFAULT_PAYMENT_DATE,
    notes: 'Invoice settled via electronic transfer',
  });

  // Printable Invoice Inspector State
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const refreshInvoices = async () => {
    const data = await api.getInvoices(filter);
    setInvoices(data);
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      const data = await api.getInvoices(filter);
      if (active) setInvoices(data);
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [filter]);

  const handleOpenPayment = (inv: Invoice) => {
    const remaining = inv.total_amount - inv.amount_paid;
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: remaining > 0 ? remaining : inv.total_amount,
      payment_method: 'bank_transfer',
      payment_date: DEFAULT_PAYMENT_DATE,
      notes: 'Customer payment recorded via bank transfer',
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    await api.recordPayment({
      invoice_id: selectedInvoice.id,
      amount: Number(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      payment_date: paymentForm.payment_date,
      notes: paymentForm.notes,
    });
    setSelectedInvoice(null);
    await refreshInvoices();
  };

  const handleConfirm = async (id: string) => {
    await api.confirmInvoice(id);
    await refreshInvoices();
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this invoice?')) {
      await api.cancelInvoice(id);
      await refreshInvoices();
    }
  };

  const handleTriggerBilling = async () => {
    setIsBillingRunning(true);
    const result = await api.triggerBillingRun();
    setRunLog(result);
    await refreshInvoices();
    setIsBillingRunning(false);
    setTimeout(() => setRunLog(null), 5000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter & Search Logic
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.subscription_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Draft':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      case 'Cancelled':
        return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  // Metrics Rollup
  const totalBilled = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.amount_paid, 0);
  const outstanding = totalBilled - totalCollected;
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const overdueAmount = overdueInvoices.reduce((acc, i) => acc + (i.total_amount - i.amount_paid), 0);

  const filterOptions = ['All', 'Draft', 'Confirmed', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'];

  return (
    <div className="space-y-6">
      {/* 1. HEADER & BILLING RUN BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E4E4E7]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
              {currentUser?.role === 'customer' ? 'My Invoices & Receipts' : 'Invoices & Billing Ledger'}
            </h1>
            <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
              IDEMPOTENT ENGINE
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Automated recurring cycle generation, tax calculations, and payment status reconciliation.
          </p>
        </div>

        {currentUser?.role !== 'customer' && (
          <button
            onClick={handleTriggerBilling}
            disabled={isBillingRunning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60 self-start sm:self-auto"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isBillingRunning ? 'Running Billing...' : 'Trigger Billing Run'}</span>
          </button>
        )}
      </div>

      {/* Idempotency Execution Log Alert */}
      {runLog && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-mono text-emerald-900 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Billing Engine Executed:</strong> Evaluated {runLog.evaluated} active subscriptions &rarr; Generated{' '}
              <strong>{runLog.generated} new invoices</strong>, Skipped {runLog.skipped} (idempotent cycle key match).
            </span>
          </div>
          <button onClick={() => setRunLog(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. UPFLOW TOP 4 KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Total Invoiced</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            ${Math.round(totalBilled).toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">{invoices.length} billing cycles</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Revenue Collected</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            ${Math.round(totalCollected).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Reconciled in bank</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Outstanding AR</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            ${Math.round(outstanding).toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-400">Due within terms</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Overdue Accounts</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 border border-rose-200 text-rose-700">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono tabular-nums">
            ${Math.round(overdueAmount).toLocaleString()}
          </div>
          <span className="text-[11px] text-rose-600 font-medium">{overdueInvoices.length} invoices overdue</span>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER PILLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E4E7] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice#, customer, or SUB#..."
            className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`rounded-lg px-3 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                filter === opt
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 4. INVOICES LEDGER TABLE */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-zinc-500 uppercase tracking-wider text-[10px] font-mono font-medium">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer & Ref</th>
                <th className="px-4 py-3">Billing Period</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Total & Tax</th>
                <th className="px-4 py-3">Paid Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-400 font-mono">
                    No invoices match this view.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-900">
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{inv.invoice_number}</span>
                        <Eye className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{inv.customer_name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{inv.subscription_number}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">
                      {inv.period_start} &rarr; {inv.period_end}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600 tabular-nums">
                      {inv.due_date}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="font-semibold text-zinc-900 tabular-nums">${inv.total_amount.toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-400">Tax: ${inv.tax_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      <span
                        className={
                          inv.amount_paid >= inv.total_amount
                            ? 'text-emerald-600 font-semibold'
                            : inv.amount_paid > 0
                            ? 'text-blue-600 font-semibold'
                            : 'text-zinc-700'
                        }
                      >
                        ${inv.amount_paid.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-mono font-medium border ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {inv.status === 'Draft' && currentUser?.role !== 'customer' && (
                        <button
                          onClick={() => handleConfirm(inv.id)}
                          className="rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 font-medium text-[11px] border border-blue-200 transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {(inv.status === 'Confirmed' || inv.status === 'Partially Paid' || inv.status === 'Overdue') &&
                        currentUser?.role !== 'customer' && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-2.5 py-1 font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="rounded-md bg-zinc-100 hover:bg-zinc-200 border border-[#E4E4E7] px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors cursor-pointer"
                      >
                        Inspect & Print
                      </button>
                      {inv.status !== 'Paid' && inv.status !== 'Cancelled' && currentUser?.role !== 'customer' && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          className="rounded-md bg-zinc-100 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 border border-[#E4E4E7] px-2 py-1 text-[11px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: RECORD PAYMENT */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-xl bg-white p-6 max-w-md w-full shadow-xl border border-[#E4E4E7] my-8">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 border border-[#E4E4E7] text-zinc-700 flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Record Payment</h2>
                  <p className="text-[11px] text-zinc-500 font-mono">Invoice: {selectedInvoice.invoice_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3 space-y-1 font-mono">
                <div className="flex justify-between text-zinc-500">
                  <span className="font-sans">Invoice Total:</span>
                  <span className="tabular-nums">${selectedInvoice.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span className="font-sans">Already Paid:</span>
                  <span className="tabular-nums">${selectedInvoice.amount_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-zinc-900 pt-1 border-t border-[#E4E4E7]">
                  <span className="font-sans">Remaining Balance:</span>
                  <span className="text-blue-600 tabular-nums">
                    ${(selectedInvoice.total_amount - selectedInvoice.amount_paid).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Payment Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as PaymentMethod })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="credit_card">Credit Card (Stripe/Vault)</option>
                    <option value="upi">UPI / Instant Pay</option>
                    <option value="cash">Cash / Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Payment Date</label>
                  <input
                    required
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Transaction Reference / Memo</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. Bank Ref #TXN984920"
                  className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg px-3.5 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-1.5 font-medium text-white shadow-sm transition-colors cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: PRINTABLE B2B INVOICE INSPECTOR */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-xl bg-white max-w-2xl w-full shadow-xl border border-[#E4E4E7] overflow-hidden my-8 print:m-0 print:shadow-none print:border-none">
            {/* Top Bar with Print Button */}
            <div className="flex items-center justify-between bg-zinc-900 text-white px-5 py-3.5 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-xs">Tax Invoice Inspector & PDF Renderer</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="rounded-md p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Formatted Invoice Sheet */}
            <div className="p-7 space-y-5 text-xs text-zinc-800 bg-white">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E4E4E7] pb-5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold tracking-tight text-zinc-900 lowercase">brightloop</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                    Brightloop Software Ltd.<br />
                    Corporate Engine Hub<br />
                    billing@brightloop.io
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono font-medium text-zinc-400 tracking-wider">TAX INVOICE</span>
                  <div className="text-lg font-bold font-mono text-zinc-900 mt-0.5">{previewInvoice.invoice_number}</div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase mt-1 border ${getStatusBadge(
                      previewInvoice.status
                    )}`}
                  >
                    {previewInvoice.status}
                  </span>
                </div>
              </div>

              {/* Bill To & Billing Dates */}
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-400">Billed To</span>
                  <div className="font-semibold text-zinc-900 text-xs">{previewInvoice.customer_name}</div>
                  <div className="text-zinc-500 font-mono">Account ID: {previewInvoice.customer_id}</div>
                  <div className="text-zinc-500 font-mono">Contract Ref: {previewInvoice.subscription_number}</div>
                </div>
                <div className="space-y-1 font-mono text-right">
                  <div>
                    <span className="text-zinc-400 font-sans">Issue Date: </span>
                    <strong className="text-zinc-900 tabular-nums">{previewInvoice.issue_date}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-sans">Due Date: </span>
                    <strong className="text-zinc-900 tabular-nums">{previewInvoice.due_date}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-sans">Cycle Key: </span>
                    <span className="text-zinc-500 text-[10px]">{previewInvoice.billing_cycle_key}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-lg border border-[#E4E4E7] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAFA] text-zinc-500 uppercase font-mono font-medium text-[10px] border-b border-[#E4E4E7]">
                    <tr>
                      <th className="px-3.5 py-2">Item Description</th>
                      <th className="px-3.5 py-2 text-right">Qty</th>
                      <th className="px-3.5 py-2 text-right">Unit Price</th>
                      <th className="px-3.5 py-2 text-right">Tax (18%)</th>
                      <th className="px-3.5 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7] font-mono text-[11px]">
                    {previewInvoice.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="px-3.5 py-2 font-sans font-medium text-zinc-800">{l.description}</td>
                        <td className="px-3.5 py-2 text-right text-zinc-600 tabular-nums">{l.quantity}</td>
                        <td className="px-3.5 py-2 text-right text-zinc-600 tabular-nums">${l.unit_price}</td>
                        <td className="px-3.5 py-2 text-right text-zinc-600 tabular-nums">${l.tax_amount.toFixed(2)}</td>
                        <td className="px-3.5 py-2 text-right font-semibold text-zinc-900 tabular-nums">${l.line_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Calculations */}
              <div className="flex justify-end pt-1">
                <div className="w-60 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span className="font-sans">Subtotal:</span>
                    <span className="tabular-nums">${previewInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span className="font-sans">Tax (GST 18%):</span>
                    <span className="tabular-nums">+${previewInvoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span className="font-sans">Discount:</span>
                    <span className="tabular-nums">-${previewInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm text-zinc-900 pt-1.5 border-t border-[#E4E4E7]">
                    <span className="font-sans">Total Invoiced:</span>
                    <span className="tabular-nums">${previewInvoice.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium pt-0.5">
                    <span className="font-sans">Amount Paid:</span>
                    <span className="tabular-nums">${previewInvoice.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-zinc-900 pt-1 border-t border-[#E4E4E7]">
                    <span className="font-sans">Balance Due:</span>
                    <span className="tabular-nums">${(previewInvoice.total_amount - previewInvoice.amount_paid).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-[#E4E4E7] text-[10px] text-zinc-400 text-center font-sans">
                Payment is required within specified terms. Generated by Brightloop Automated Recurring Engine.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

