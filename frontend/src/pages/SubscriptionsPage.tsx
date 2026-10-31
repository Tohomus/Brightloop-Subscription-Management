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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Quotation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Paused':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Closed':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const filterOptions = ['All', 'Active', 'Quotation', 'Confirmed', 'Paused', 'Closed'];

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E4E4E7]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
              {currentUser?.role === 'customer' ? 'My Subscriptions' : 'Subscriptions & Quotations'}
            </h1>
            <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-medium text-blue-700 bg-blue-50 border border-blue-200">
              STATE ENGINE
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Full lifecycle: Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &harr; Paused &rarr; Closed.
          </p>
        </div>

        {currentUser?.role !== 'customer' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Quotation</span>
          </button>
        )}
      </div>

      {/* 2. UPFLOW KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Active Subs</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">{activeSubs.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Live recurring contracts</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Committed MRR</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            ${Math.round(activeMRR).toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">ARR: ${(Math.round(activeMRR) * 12).toLocaleString()}</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Pending Quotes</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 border border-amber-200 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">{quotesCount}</div>
          <span className="text-[11px] text-zinc-400 font-mono">${quotesValue.toLocaleString()} in pipeline</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Paused / At-Risk</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 border border-purple-200 text-purple-700">
              <AlertOctagon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">{pausedCount}</div>
          <span className="text-[11px] text-zinc-400">Churn prevention review</span>
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
            placeholder="Search SUB#, customer, or plan..."
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

      {/* 4. SUBSCRIPTIONS TABLE */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-zinc-500 uppercase tracking-wider text-[10px] font-mono font-medium">
              <tr>
                <th className="px-4 py-3">Subscription #</th>
                <th className="px-4 py-3">Customer & Account</th>
                <th className="px-4 py-3">Plan Cadence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terms & Next Bill</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 font-mono">
                    No subscriptions match this view.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-900">
                      <button
                        onClick={() => setInspectSub(sub)}
                        className="hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{sub.subscription_number}</span>
                        <Eye className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{sub.customer_name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{sub.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-800">{sub.plan_name}</span>
                      <span className="ml-1.5 rounded bg-zinc-100 border border-[#E4E4E7] text-zinc-600 px-1.5 py-0.5 text-[10px] font-mono uppercase">
                        {sub.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-mono font-medium border ${getStatusBadge(
                          sub.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="text-zinc-800 font-medium tabular-nums">{sub.next_billing_date}</div>
                      <div className="text-zinc-400 text-[10px]">{sub.payment_terms}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-900 tabular-nums">
                      ${sub.recurring_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {sub.status === 'Quotation' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Active')}
                          className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-2.5 py-1 text-[11px] font-medium text-white transition-colors cursor-pointer"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Confirm</span>
                        </button>
                      )}
                      {sub.status === 'Confirmed' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Active')}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <PlayCircle className="h-3 w-3" />
                          <span>Activate</span>
                        </button>
                      )}
                      {sub.status === 'Active' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Paused')}
                          className="inline-flex items-center gap-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <PauseCircle className="h-3 w-3" />
                          <span>Pause</span>
                        </button>
                      )}
                      {sub.status === 'Paused' && (
                        <button
                          onClick={() => handleStatusChange(sub.id, 'Active')}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <PlayCircle className="h-3 w-3" />
                          <span>Resume</span>
                        </button>
                      )}
                      <button
                        onClick={() => setInspectSub(sub)}
                        className="rounded-md bg-zinc-100 hover:bg-zinc-200 border border-[#E4E4E7] px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-xl bg-white p-6 sm:p-7 max-w-xl w-full shadow-xl border border-[#E4E4E7] my-8">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3.5">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Draft New Quotation</h2>
                <p className="text-xs text-zinc-500">Configure customer header and dynamic line items.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Customer Account Name</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Zenith Global Ltd"
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Billing Email</label>
                  <input
                    required
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="billing@zenith.com"
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Plan Cadence</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.frequency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Multiple Lines Manager */}
              <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800 text-xs">Quotation Line Items</span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="rounded-md bg-white hover:bg-zinc-100 border border-[#E4E4E7] px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition-colors cursor-pointer"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lineItems.map((line, idx) => {
                    const currentProd = products.find((p) => p.id === line.product_id);
                    return (
                      <div key={idx} className="rounded-lg bg-white border border-[#E4E4E7] p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                          <span>Line #{idx + 1}</span>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="text-zinc-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] text-zinc-400 mb-0.5">Product</label>
                            <select
                              value={line.product_id}
                              onChange={(e) => updateLineItem(idx, 'product_id', e.target.value)}
                              className="w-full rounded border border-[#E4E4E7] bg-zinc-50 px-2 py-1 text-xs text-zinc-900"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${p.sales_price})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-0.5">Quantity</label>
                            <input
                              required
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full rounded border border-[#E4E4E7] bg-zinc-50 px-2 py-1 text-xs font-mono text-zinc-900"
                            />
                          </div>
                        </div>

                        {currentProd && currentProd.variants.length > 0 && (
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-0.5">Variant Extra Modifier</label>
                            <select
                              value={line.variant_id}
                              onChange={(e) => updateLineItem(idx, 'variant_id', e.target.value)}
                              className="w-full rounded border border-[#E4E4E7] bg-zinc-50 px-2 py-1 text-xs text-zinc-900"
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
                <div className="flex items-center justify-between pt-2 border-t border-[#E4E4E7] font-mono text-xs">
                  <span className="font-sans font-medium text-zinc-700">Estimated Total Amount:</span>
                  <span className="text-sm font-bold text-zinc-900 tabular-nums">
                    ${calculateQuoteEstimate().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-3.5 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-1.5 font-medium text-white shadow-sm transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-xl bg-white p-6 max-w-lg w-full shadow-xl border border-[#E4E4E7] my-8">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Subscription Inspection
                </span>
                <h2 className="text-lg font-bold font-mono text-zinc-900 mt-0.5">
                  {inspectSub.subscription_number}
                </h2>
              </div>
              <button
                onClick={() => setInspectSub(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Customer & Status Header */}
              <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Customer Account:</span>
                  <span className="font-semibold text-zinc-900">{inspectSub.customer_name}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-500 font-sans">Corporate Email:</span>
                  <span className="text-zinc-700">{inspectSub.customer_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Current Status:</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-mono font-medium border ${getStatusBadge(
                      inspectSub.status
                    )}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                    {inspectSub.status}
                  </span>
                </div>
              </div>

              {/* Schedule & Billing Dates */}
              <div className="grid grid-cols-2 gap-3 text-zinc-600 font-mono text-[11px]">
                <div className="rounded-lg border border-[#E4E4E7] bg-white p-3 space-y-1">
                  <span className="text-[10px] font-sans text-zinc-400 uppercase font-medium">Plan Cadence</span>
                  <div className="font-semibold text-zinc-900">{inspectSub.plan_name}</div>
                  <div className="text-[10px] text-zinc-400 uppercase">{inspectSub.frequency}</div>
                </div>
                <div className="rounded-lg border border-[#E4E4E7] bg-white p-3 space-y-1">
                  <span className="text-[10px] font-sans text-zinc-400 uppercase font-medium">Payment Terms</span>
                  <div className="font-semibold text-zinc-900">{inspectSub.payment_terms}</div>
                  <div className="text-[10px] text-zinc-400">Next: {inspectSub.next_billing_date}</div>
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-2">
                <span className="font-semibold text-zinc-800 text-xs">Contract Line Items</span>
                <div className="rounded-lg border border-[#E4E4E7] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] text-zinc-500 text-[10px] uppercase font-mono font-medium border-b border-[#E4E4E7]">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E4E7]">
                      {inspectSub.lines.map((l, i) => (
                        <tr key={i} className="font-mono text-[11px]">
                          <td className="px-3 py-2 font-sans font-medium text-zinc-800">{l.product_name}</td>
                          <td className="px-3 py-2 text-right text-zinc-600 tabular-nums">{l.quantity}</td>
                          <td className="px-3 py-2 text-right text-zinc-600 tabular-nums">${l.unit_price}</td>
                          <td className="px-3 py-2 text-right font-semibold text-zinc-900 tabular-nums">${l.line_amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#FAFAFA] font-mono font-semibold text-zinc-900 border-t border-[#E4E4E7]">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-sans">Recurring Amount:</td>
                        <td className="px-3 py-2 text-right text-zinc-900 tabular-nums">${inspectSub.recurring_amount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* State Machine Transition Bar */}
              <div className="pt-3 border-t border-[#E4E4E7] space-y-2">
                <span className="text-[11px] font-medium text-zinc-600">Quick Lifecycle Transition</span>
                <div className="flex items-center gap-2">
                  {inspectSub.status === 'Quotation' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Active')}
                      className="flex-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      Confirm to Active
                    </button>
                  )}
                  {inspectSub.status === 'Active' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Paused')}
                      className="flex-1 rounded-lg bg-purple-600 hover:bg-purple-700 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      Pause Subscription
                    </button>
                  )}
                  {inspectSub.status === 'Paused' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Active')}
                      className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      Resume to Active
                    </button>
                  )}
                  {inspectSub.status !== 'Closed' && (
                    <button
                      onClick={() => handleStatusChange(inspectSub.id, 'Closed')}
                      className="rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-[#E4E4E7] px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors cursor-pointer"
                    >
                      Close Contract
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSub(inspectSub.id)}
                    className="rounded-lg p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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

