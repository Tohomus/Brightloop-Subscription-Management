import React from 'react';
import { X, Printer, CheckCircle, AlertCircle, Clock, Building2 } from 'lucide-react';
import type { Invoice } from '../types';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            PAID IN FULL
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5" />
            OVERDUE
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <Clock className="h-3.5 w-3.5" />
            AWAITING PAYMENT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">Invoice Preview & Print</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700">
              {invoice.invoice_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3B49DF] hover:bg-[#313DE0] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors active:scale-[0.96] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors active:scale-[0.96] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 sm:p-10 text-slate-900 bg-white" id="printable-invoice">
          {/* Top Brand & Status Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-950 font-sans lowercase">
                  brightloop
                </span>
                <span className="h-2 w-2 rounded-full bg-[#3B49DF]"></span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-sans">
                Brightloop Cloud Technologies Inc.
              </p>
              <p className="text-xs text-slate-500">
                Odoo Certified Recurring Billing Partner
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Tax ID: US-8942-BRIGHT-2026
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="flex sm:justify-end mb-2">
                {getStatusBadge(invoice.status)}
              </div>
              <h1 className="text-xl font-bold font-mono text-slate-950">
                {invoice.invoice_number}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Ref: <span className="font-mono">{invoice.subscription_number || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Meta Grid: Bill To vs Invoice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
            <div>
              <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                Billed To
              </h3>
              <p className="font-bold text-sm text-slate-900">
                {invoice.customer_name || 'Acme Global Logistics'}
              </p>
              <p className="text-slate-600 mt-0.5">Customer ID: {invoice.customer_id}</p>
              <p className="text-slate-600 font-mono">finance@acmeglobal.com</p>
            </div>

            <div className="sm:text-right space-y-1">
              <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                Invoice Details
              </h3>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-slate-500">Issue Date:</span>
                <span className="font-mono font-medium text-slate-800">{invoice.issue_date}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-slate-500">Payment Due:</span>
                <span className="font-mono font-medium text-slate-800">{invoice.due_date}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-slate-500">Billing Cycle:</span>
                <span className="font-mono text-slate-600">
                  {invoice.period_start} → {invoice.period_end}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Tax (18%)</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lines && invoice.lines.length > 0 ? (
                  invoice.lines.map((line, idx) => (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-3 font-medium">
                        <div>{line.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Subscription Term Line</div>
                      </td>
                      <td className="py-3 text-center font-mono">{line.quantity}</td>
                      <td className="py-3 text-right font-mono">${line.unit_price.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono">${(line.tax_amount || 0).toFixed(2)}</td>
                      <td className="py-3 text-right font-mono font-semibold">${line.line_total.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-slate-800">
                    <td className="py-3 font-medium">Subscription Recurring Plan Services</td>
                    <td className="py-3 text-center font-mono">1</td>
                    <td className="py-3 text-right font-mono">${invoice.subtotal.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono">${invoice.tax_amount.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-semibold">${invoice.total_amount.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Rollup */}
          <div className="border-t border-slate-200 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Applied Discount:</span>
                  <span className="font-mono font-medium">-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Calculated Tax (GST/VAT):</span>
                <span className="font-mono font-medium">${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-950">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-[#3B49DF]">
                  ${invoice.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  ${(invoice.amount_paid || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-100 pt-1 text-xs">
                <span>Balance Due:</span>
                <span className="font-mono text-slate-900">
                  ${Math.max(0, invoice.total_amount - (invoice.amount_paid || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Remittance & Bank Info */}
          <div className="mt-8 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Building2 className="h-3.5 w-3.5 text-[#3B49DF]" />
              <span>Remittance & Wire Transfer Details</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Beneficiary: <strong className="text-slate-700">Brightloop Inc.</strong> · Bank: Silicon Valley Bank / Wire Routing: #021000021 · IBAN: US64SVBK123456789
            </p>
            <p className="text-[10px] text-slate-400">
              Please include invoice reference <strong className="font-mono text-slate-600">{invoice.invoice_number}</strong> on wire transmission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
