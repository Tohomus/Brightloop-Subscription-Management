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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 font-mono uppercase tracking-wider">
            <CheckCircle className="h-3.5 w-3.5" />
            PAID IN FULL
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 font-mono uppercase tracking-wider">
            <AlertCircle className="h-3.5 w-3.5" />
            OVERDUE
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200 font-mono uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            AWAITING PAYMENT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 border border-gray-200 font-mono uppercase tracking-wider">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-sm">Official Tax Invoice</span>
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-mono text-gray-800">
              {invoice.invoice_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full bg-black hover:bg-neutral-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 sm:p-10 text-neutral-900 bg-white" id="printable-invoice">
          {/* Top Brand & Status Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-black rounded flex items-center justify-center text-white font-bold text-xs">
                  B
                </div>
                <span className="text-2xl font-bold tracking-tight text-neutral-950 font-sans lowercase">
                  brightloop
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 font-sans">
                Brightloop Cloud Technologies Inc.
              </p>
              <p className="text-xs text-gray-500">
                Enterprise Recurring Subscription Billing Engine
              </p>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Tax ID: US-8942-BRIGHT-2026
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="flex sm:justify-end mb-2">
                {getStatusBadge(invoice.status)}
              </div>
              <h1 className="text-xl font-bold font-mono text-neutral-950 tabular-nums">
                {invoice.invoice_number}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Contract Ref: <span className="font-mono">{invoice.subscription_number || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Meta Grid: Bill To vs Invoice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-gray-200 text-xs">
            <div>
              <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-2 font-mono">
                Billed To
              </h3>
              <p className="font-bold text-sm text-neutral-900">
                {invoice.customer_name || 'Acme Global Logistics'}
              </p>
              <p className="text-gray-600 mt-0.5">Customer ID: {invoice.customer_id}</p>
              <p className="text-gray-600 font-mono">finance@acmeglobal.com</p>
            </div>

            <div className="sm:text-right space-y-1">
              <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-2 font-mono">
                Invoice Details
              </h3>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-gray-500">Issue Date:</span>
                <span className="font-mono font-medium text-gray-900 tabular-nums">{invoice.issue_date}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-gray-500">Payment Due:</span>
                <span className="font-mono font-medium text-gray-900 tabular-nums">{invoice.due_date}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-gray-500">Billing Window:</span>
                <span className="font-mono text-gray-600 tabular-nums">
                  {invoice.period_start} → {invoice.period_end}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] font-semibold tracking-wider font-mono">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Tax (18%)</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.lines && invoice.lines.length > 0 ? (
                  invoice.lines.map((line, idx) => (
                    <tr key={idx} className="text-gray-800">
                      <td className="py-3 font-medium">
                        <div>{line.description}</div>
                        <div className="text-[10px] text-gray-400 font-mono">Subscription Term Line</div>
                      </td>
                      <td className="py-3 text-center font-mono tabular-nums">{line.quantity}</td>
                      <td className="py-3 text-right font-mono tabular-nums">${line.unit_price.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono tabular-nums">${(line.tax_amount || 0).toFixed(2)}</td>
                      <td className="py-3 text-right font-mono font-semibold tabular-nums">${line.line_total.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-gray-800">
                    <td className="py-3 font-medium">Subscription Recurring Plan Services</td>
                    <td className="py-3 text-center font-mono tabular-nums">1</td>
                    <td className="py-3 text-right font-mono tabular-nums">${invoice.subtotal.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono tabular-nums">${invoice.tax_amount.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-semibold tabular-nums">${invoice.total_amount.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Rollup */}
          <div className="border-t border-gray-200 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium tabular-nums">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Applied Discount:</span>
                  <span className="font-mono font-medium tabular-nums">-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Calculated Tax (GST/VAT 18%):</span>
                <span className="font-mono font-medium tabular-nums">${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-neutral-950">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-neutral-950 tabular-nums">
                  ${invoice.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 pt-1 text-[11px]">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-600 font-semibold tabular-nums">
                  ${(invoice.amount_paid || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-700 font-semibold border-t border-gray-100 pt-1 text-xs">
                <span>Balance Due:</span>
                <span className="font-mono text-neutral-900 tabular-nums">
                  ${Math.max(0, invoice.total_amount - (invoice.amount_paid || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Remittance & Bank Info */}
          <div className="mt-8 rounded-xl bg-gray-50 p-4 border border-gray-200 text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
              <Building2 className="h-3.5 w-3.5 text-black" />
              <span>Remittance &amp; Wire Transfer Details</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Beneficiary: <strong className="text-gray-800">Brightloop Inc.</strong> · Bank: Silicon Valley Bank / Wire Routing: #021000021 · IBAN: US64SVBK123456789
            </p>
            <p className="text-[10px] text-gray-400">
              Please include invoice reference <strong className="font-mono text-gray-600">{invoice.invoice_number}</strong> on wire transmission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
