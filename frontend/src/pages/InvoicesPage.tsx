import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Invoice, InvoiceStatus, PaymentMethod } from '../types';
import { api } from '../services/api';

const DEFAULT_PAYMENT_DATE = '2026-10-31';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>('All');

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'bank_transfer' as PaymentMethod,
    payment_date: DEFAULT_PAYMENT_DATE,
    notes: 'Invoice settled via electronic transfer',
  });

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
      notes: 'Customer payment recorded',
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
    const data = await api.getInvoices(filter);
    setInvoices(data);
  };

  const handleConfirm = async (id: string) => {
    await api.confirmInvoice(id);
    const data = await api.getInvoices(filter);
    setInvoices(data);
  };

  const handleCancel = async (id: string) => {
    await api.cancelInvoice(id);
    const data = await api.getInvoices(filter);
    setInvoices(data);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Confirmed':
        return 'bg-indigo-50 text-[#3B49DF] border-indigo-200';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Metrics rollup
  const totalBilled = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.amount_paid, 0);
  const outstanding = totalBilled - totalCollected;
  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

  const filterOptions = ['All', 'Draft', 'Confirmed', 'Paid', 'Partially Paid', 'Overdue'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19]">
              Invoices & Billing Ledger
            </h1>
            <span className="rounded-full bg-blue-50 text-[#3B49DF] px-2.5 py-0.5 text-xs font-semibold">
              Idempotent Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated recurring cycle generation, tax calculations, and payment status reconciliation.
          </p>
        </div>
      </div>

      {/* Upflow Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Invoiced
          </span>
          <div className="mt-1 text-2xl font-bold text-[#0B0F19] font-mono">
            ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">All generated billing runs</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Revenue Collected
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono">
            ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Reconciled in bank</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Outstanding AR
          </span>
          <div className="mt-1 text-2xl font-bold text-[#3B49DF] font-mono">
            ${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">Due within terms</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Overdue Invoices
          </span>
          <div className="mt-1 text-2xl font-bold text-rose-600 font-mono">
            {overdueCount}
          </div>
          <span className="text-[10px] text-rose-600 font-medium">Action required</span>
        </div>
      </div>

      {/* Upflow Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              filter === opt
                ? 'bg-[#0B0F19] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Invoices Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Billing Period</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Total & Tax</th>
                <th className="px-5 py-3.5">Paid Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No invoices match this filter.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#0B0F19]">
                      {inv.invoice_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {inv.customer_name}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                      {inv.period_start} &rarr; {inv.period_end}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {inv.due_date}
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <div className="font-bold text-[#0B0F19]">${inv.total_amount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Tax: ${inv.tax_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className={inv.amount_paid >= inv.total_amount ? 'text-emerald-600 font-bold' : 'text-slate-700'}>
                        ${inv.amount_paid.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {inv.status === 'Draft' && (
                        <button
                          onClick={() => handleConfirm(inv.id)}
                          className="rounded-full bg-indigo-50 text-[#3B49DF] hover:bg-indigo-100 px-3 py-1 font-semibold text-[11px] border border-indigo-200 transition cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {(inv.status === 'Confirmed' || inv.status === 'Partially Paid' || inv.status === 'Overdue') && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] text-white px-3 py-1 font-semibold text-[11px] shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          Record Payment
                        </button>
                      )}
                      {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 text-[11px] transition cursor-pointer"
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

      {/* MODAL: RECORD PAYMENT */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0B0F19]">Record Payment</h2>
                <p className="text-xs text-slate-500 font-mono">Invoice: {selectedInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-1 font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Total Due:</span>
                  <span>${selectedInvoice.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Previously Paid:</span>
                  <span>${selectedInvoice.amount_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0B0F19] pt-1 border-t border-slate-200">
                  <span>Remaining:</span>
                  <span>${(selectedInvoice.total_amount - selectedInvoice.amount_paid).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as PaymentMethod })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="upi">UPI / Instant Pay</option>
                    <option value="cash">Cash / Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                  <input
                    required
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. Bank Ref #TXN984920"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
