import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  X,
  Search,
  FileSpreadsheet,
  TrendingUp,
  AlertOctagon,
  Clock,
  Eye,
  Trash2,
} from 'lucide-react';
import type { Subscription, SubscriptionStatus, Product, Plan } from '../types';
import { api } from '../services/api';

const DEFAULT_START_DATE = '2026-10-31';

interface QuoteLineItem {
  product_id: string;
  variant_id: string;
  quantity: number;
}

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const currentUser = api.getCurrentUser();

  // Create Quotation Modal State
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { product_id: '', variant_id: '', quantity: 1 },
  ]);

  // Inspection Drawer/Modal State
  const [inspectSub, setInspectSub] = useState<Subscription | null>(null);

  const refreshSubscriptions = async () => {
    const subs = await api.getSubscriptions(filter);
    setSubscriptions(subs);
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      const [subs, prods, pls] = await Promise.all([
        api.getSubscriptions(filter),
        api.getProducts(),
        api.getPlans(),
      ]);
      if (active) {
        setSubscriptions(subs);
        setProducts(prods);
        setPlans(pls);
        if (pls.length > 0) {
          setPlanId((prev) => prev || pls[0].id);
        }
        if (prods.length > 0) {
          setLineItems((prev) =>
            prev.length > 0 && prev[0].product_id === ''
              ? [{ product_id: prods[0].id, variant_id: prods[0].variants[0]?.id || '', quantity: 1 }]
              : prev
          );
        }
      }
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [filter]);

  const handleStatusChange = async (id: string, newStatus: SubscriptionStatus) => {
    await api.updateSubscriptionStatus(id, newStatus);
    await refreshSubscriptions();
    if (inspectSub && inspectSub.id === id) {
      setInspectSub((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (confirm('Delete this subscription record?')) {
      await api.deleteSubscription(id);
      await refreshSubscriptions();
      if (inspectSub?.id === id) setInspectSub(null);
    }
  };

  // Dynamic Quote Lines Management
  const addLineItem = () => {
    if (products.length === 0) return;
    setLineItems([
      ...lineItems,
      {
        product_id: products[0].id,
        variant_id: products[0].variants[0]?.id || '',
        quantity: 1,
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'product_id') {
      const newProd = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        product_id: String(value),
        variant_id: newProd?.variants[0]?.id || '',
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateQuoteEstimate = () => {
    return lineItems.reduce((acc, line) => {
      const prod = products.find((p) => p.id === line.product_id);
      if (!prod) return acc;
      const variant = prod.variants.find((v) => v.id === line.variant_id);
      const unit = prod.sales_price + (variant ? variant.price_extra : 0);
      return acc + unit * line.quantity;
    }, 0);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createQuotation({
      customer_name: customerName,
      customer_email: customerEmail,
      plan_id: planId || plans[0]?.id || '',
      payment_terms: paymentTerms,
      start_date: startDate,
      lines: lineItems.map((l) => ({
        product_id: l.product_id,
        variant_id: l.variant_id || undefined,
        quantity: l.quantity,
      })),
    });
    setShowModal(false);
    setCustomerName('');
    setCustomerEmail('');
    setLineItems([
      {
        product_id: products[0]?.id || '',
        variant_id: products[0]?.variants[0]?.id || '',
        quantity: 1,
      },
    ]);
    await refreshSubscriptions();
  };

  // Filter & Search Logic
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.subscription_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Metrics Rollup
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');
  const activeMRR = activeSubs.reduce((acc, s) => {
    if (s.frequency === 'monthly') return acc + s.recurring_amount;
    if (s.frequency === 'yearly') return acc + s.recurring_amount / 12;
    if (s.frequency === 'weekly') return acc + s.recurring_amount * 4.33;
    if (s.frequency === 'daily') return acc + s.recurring_amount * 30;
    return acc + s.recurring_amount;
  }, 0);
  const quotesCount = subscriptions.filter((s) => s.status === 'Quotation').length;
  const quotesValue = subscriptions
    .filter((s) => s.status === 'Quotation')
    .reduce((acc, s) => acc + s.recurring_amount, 0);
  const pausedCount = subscriptions.filter((s) => s.status === 'Paused').length;

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Confirmed':
        return 'bg-indigo-50 text-[#3B49DF] border-indigo-200';
      case 'Quotation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Paused':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const filterOptions = ['All', 'Active', 'Quotation', 'Confirmed', 'Paused', 'Closed'];

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19]">
              {currentUser?.role === 'customer' ? 'My Subscriptions' : 'Subscriptions & Quotations'}
            </h1>
            <span className="rounded-full bg-blue-50 text-[#3B49DF] px-2.5 py-0.5 text-xs font-semibold">
              State Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle: Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &harr; Paused &rarr; Closed.
          </p>
        </div>

        {currentUser?.role !== 'customer' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Quotation</span>
          </button>
        )}
      </div>

      {/* 2. UPFLOW KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Subs</span>
            <FileSpreadsheet className="h-4 w-4 text-[#3B49DF]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#0B0F19] font-mono">{activeSubs.length}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Live recurring contracts</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Committed MRR</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono">
            ${Math.round(activeMRR).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">ARR: ${(Math.round(activeMRR) * 12).toLocaleString()}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Quotes</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600 font-mono">{quotesCount}</div>
          <span className="text-[10px] text-slate-400 font-mono">${quotesValue.toLocaleString()} in pipeline</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Paused / Inactive</span>
            <AlertOctagon className="h-4 w-4 text-violet-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-violet-600 font-mono">{pausedCount}</div>
          <span className="text-[10px] text-slate-400">Churn prevention review</span>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER PILLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SUB#, customer, or plan..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer ${
                filter === opt
                  ? 'bg-[#0B0F19] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 4. SUBSCRIPTIONS TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono">
              <tr>
                <th className="px-5 py-3.5">Subscription #</th>
                <th className="px-5 py-3.5">Customer & Account</th>
                <th className="px-5 py-3.5">Plan Cadence</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Terms & Next Bill</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No subscriptions match this view.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition group">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#0B0F19]">
                      <button
                        onClick={() => setInspectSub(sub)}
                        className="hover:text-[#3B49DF] hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{sub.subscription_number}</span>
                        <Eye className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{sub.customer_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.customer_email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">{sub.plan_name}</span>
                      <span className="ml-1.5 rounded-full bg-slate-100 text-slate-600 px-2 py-0.2 text-[10px] font-mono uppercase">
                        {sub.frequency}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getStatusBadge(
                          sub.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      <div className="text-slate-800 font-medium">{sub.next_billing_date}</div>
                      <div className="text-slate-400 text-[10px]">{sub.payment_terms}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-[#0B0F19]">
                      ${sub.recurring_amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {sub.status === 'Quotation' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Active')}
                          className="inline-flex items-center gap-1 rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Confirm</span>
                        </button>
                      )}
                      {sub.status === 'Confirmed' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Active')}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 text-[11px] font-semibold transition active:scale-95 cursor-pointer"
                        >
                          <PlayCircle className="h-3 w-3" />
                          <span>Activate</span>
                        </button>
                      )}
                      {sub.status === 'Active' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Paused')}
                          className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 px-3 py-1 text-[11px] font-semibold transition active:scale-95 cursor-pointer"
                        >
                          <PauseCircle className="h-3 w-3" />
                          <span>Pause</span>
                        </button>
                      )}
                      {sub.status === 'Paused' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Active')}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 text-[11px] font-semibold transition active:scale-95 cursor-pointer"
                        >
                          <PlayCircle className="h-3 w-3" />
                          <span>Resume</span>
                        </button>
                      )}
                      <button
                        onClick={() => setInspectSub(sub)}
                        className="rounded-full bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: CREATE MULTI-LINE QUOTATION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0B0F19]">Draft New Quotation</h2>
                <p className="text-xs text-slate-500">Configure customer header and dynamic line items.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Account Name</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Zenith Global Ltd"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Email</label>
                  <input
                    required
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="billing@zenith.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan Cadence</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.frequency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  />
                </div>
              </div>

              {/* Dynamic Multiple Lines Manager */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Quotation Line Items</span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="rounded-full bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-[#3B49DF] transition cursor-pointer"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((line, idx) => {
                    const currentProd = products.find((p) => p.id === line.product_id);
                    return (
                      <div key={idx} className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span>Line #{idx + 1}</span>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] text-slate-400 mb-0.5">Product</label>
                            <select
                              value={line.product_id}
                              onChange={(e) => updateLineItem(idx, 'product_id', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${p.sales_price})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Quantity</label>
                            <input
                              required
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-900"
                            />
                          </div>
                        </div>

                        {currentProd && currentProd.variants.length > 0 && (
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Variant Extra Modifier</label>
                            <select
                              value={line.variant_id}
                              onChange={(e) => updateLineItem(idx, 'variant_id', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
                            >
                              <option value="">Standard Base (No extra)</option>
                              {currentProd.variants.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.attribute_name}: {v.attribute_value} (+${v.price_extra})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Live Estimate Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-mono text-xs">
                  <span className="font-sans font-semibold text-slate-700">Estimated Total Amount:</span>
                  <span className="text-base font-bold text-[#3B49DF]">
                    ${calculateQuoteEstimate().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm cursor-pointer"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: SUBSCRIPTION DETAILS & AUDIT INSPECTOR */}
      {inspectSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Subscription Inspection Drawer
                </span>
                <h2 className="text-xl font-bold font-mono text-[#0B0F19] mt-0.5">
                  {inspectSub.subscription_number}
                </h2>
              </div>
              <button
                onClick={() => setInspectSub(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Customer & Status Header */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer Account:</span>
                  <span className="font-bold text-[#0B0F19]">{inspectSub.customer_name}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500 font-sans">Corporate Email:</span>
                  <span className="text-slate-700">{inspectSub.customer_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getStatusBadge(
                      inspectSub.status
                    )}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                    {inspectSub.status}
                  </span>
                </div>
              </div>

              {/* Schedule & Billing Dates */}
              <div className="grid grid-cols-2 gap-3 text-slate-600 font-mono text-[11px]">
                <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold">Plan Cadence</span>
                  <div className="font-bold text-slate-900">{inspectSub.plan_name}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{inspectSub.frequency}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold">Payment Terms</span>
                  <div className="font-bold text-slate-900">{inspectSub.payment_terms}</div>
                  <div className="text-[10px] text-slate-400">Next: {inspectSub.next_billing_date}</div>
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-xs">Contract Line Items</span>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-mono font-bold">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectSub.lines.map((l, i) => (
                        <tr key={i} className="font-mono text-[11px]">
                          <td className="px-3 py-2 font-sans font-medium text-slate-800">{l.product_name}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{l.quantity}</td>
                          <td className="px-3 py-2 text-right text-slate-600">${l.unit_price}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">${l.line_amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-mono font-bold text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-sans">Recurring Amount:</td>
                        <td className="px-3 py-2 text-right text-[#3B49DF]">${inspectSub.recurring_amount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* State Machine Transition Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600">Quick Lifecycle Transition</span>
                <div className="flex items-center gap-2">
                  {inspectSub.status === 'Quotation' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Active')}
                      className="flex-1 rounded-full bg-[#3B49DF] hover:bg-[#313DE0] py-2 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      Confirm to Active
                    </button>
                  )}
                  {inspectSub.status === 'Active' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Paused')}
                      className="flex-1 rounded-full bg-violet-600 hover:bg-violet-700 py-2 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      Pause Subscription
                    </button>
                  )}
                  {inspectSub.status === 'Paused' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Active')}
                      className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      Resume to Active
                    </button>
                  )}
                  {inspectSub.status !== 'Closed' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Closed')}
                      className="rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition cursor-pointer"
                    >
                      Close Contract
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSub(inspectSub.id)}
                    className="rounded-full p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
