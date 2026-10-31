import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, PauseCircle, PlayCircle, X } from 'lucide-react';
import type { Subscription, SubscriptionStatus, Product, Plan } from '../types';
import { api } from '../services/api';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    plan_id: '',
    product_id: '',
    variant_id: '',
    quantity: 1,
  });

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
          setForm((prev) => ({ ...prev, plan_id: prev.plan_id || pls[0].id }));
        }
        if (prods.length > 0) {
          setForm((prev) => ({
            ...prev,
            product_id: prev.product_id || prods[0].id,
            variant_id: prev.variant_id || prods[0].variants[0]?.id || '',
          }));
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
    const updatedSubs = await api.getSubscriptions(filter);
    setSubscriptions(updatedSubs);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createQuotation({
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      plan_id: form.plan_id,
      lines: [
        {
          product_id: form.product_id,
          variant_id: form.variant_id || undefined,
          quantity: form.quantity,
        },
      ],
    });
    setShowModal(false);
    setForm({
      customer_name: '',
      customer_email: '',
      plan_id: plans[0]?.id || '',
      product_id: products[0]?.id || '',
      variant_id: products[0]?.variants[0]?.id || '',
      quantity: 1,
    });
    const updatedSubs = await api.getSubscriptions(filter);
    setSubscriptions(updatedSubs);
  };

  const selectedProduct = products.find((p) => p.id === form.product_id);

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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

  const filterOptions = ['All', 'Active', 'Quotation', 'Paused', 'Closed'];

  return (
    <div className="space-y-6">
      {/* Header & Upflow CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19]">
              Quotations & Subscriptions
            </h1>
            <span className="rounded-full bg-blue-50 text-[#3B49DF] px-2.5 py-0.5 text-xs font-semibold">
              State Machine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle: Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &harr; Paused &rarr; Closed.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Quotation</span>
        </button>
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

      {/* Subscriptions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono">
              <tr>
                <th className="px-5 py-3.5">Subscription #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Plan & Frequency</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Next Billing</th>
                <th className="px-5 py-3.5">Recurring Amount</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No subscriptions match this filter.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#0B0F19]">
                      {sub.subscription_number}
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
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {sub.next_billing_date}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE QUOTATION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0B0F19]">Draft New Quotation</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                  <input
                    required
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder="e.g. Zenith Global"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Email</label>
                  <input
                    required
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                    placeholder="billing@zenith.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Billing Plan</label>
                <select
                  value={form.plan_id}
                  onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.frequency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <span className="font-semibold text-slate-800 text-xs">Product Line Item</span>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">Product</label>
                    <select
                      value={form.product_id}
                      onChange={(e) => {
                        const p = products.find((prod) => prod.id === e.target.value);
                        setForm({
                          ...form,
                          product_id: e.target.value,
                          variant_id: p?.variants[0]?.id || '',
                        });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.sales_price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Quantity</label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {selectedProduct && selectedProduct.variants.length > 0 && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Variant Modifier</label>
                    <select
                      value={form.variant_id}
                      onChange={(e) => setForm({ ...form, variant_id: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="">None (Standard Base)</option>
                      {selectedProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.attribute_name}: {v.attribute_value} (+${v.price_extra})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
