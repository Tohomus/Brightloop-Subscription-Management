import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type { Product, Plan, BillingFrequency } from '../types';
import { api } from '../services/api';

const DEFAULT_START_DATE = '2026-10-31';

export const CatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'plans'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // New Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'software' as Product['type'],
    sales_price: 1000,
    cost_price: 300,
    notes: '',
    variants: [{ attribute_name: 'Edition', attribute_value: 'Odoo ERP Sync', price_extra: 560 }],
  });

  // New Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    frequency: 'monthly' as BillingFrequency,
    min_quantity: 1,
    start_date: DEFAULT_START_DATE,
    auto_close_on_end: false,
    allow_pause: true,
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      const [p, pl] = await Promise.all([api.getProducts(), api.getPlans()]);
      if (active) {
        setProducts(p);
        setPlans(pl);
      }
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createProduct(productForm);
    setShowProductModal(false);
    setProductForm({
      name: '',
      type: 'software',
      sales_price: 1000,
      cost_price: 300,
      notes: '',
      variants: [{ attribute_name: 'Edition', attribute_value: 'Odoo ERP Sync', price_extra: 560 }],
    });
    const prods = await api.getProducts();
    setProducts(prods);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createPlan(planForm);
    setShowPlanModal(false);
    setPlanForm({
      name: '',
      frequency: 'monthly',
      min_quantity: 1,
      start_date: DEFAULT_START_DATE,
      auto_close_on_end: false,
      allow_pause: true,
    });
    const pls = await api.getPlans();
    setPlans(pls);
  };

  return (
    <div className="space-y-6">
      {/* Header & Upflow Tab Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19]">Product & Plan Catalog</h1>
            <span className="rounded-full bg-blue-50 text-[#3B49DF] px-2.5 py-0.5 text-xs font-semibold">
              Odoo Schema Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage software offerings, dynamic variant price modifiers, and recurring billing frequencies.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeTab === 'products' ? 'bg-[#0B0F19] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeTab === 'plans' ? 'bg-[#0B0F19] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plans ({plans.length})
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'products' ? setShowProductModal(true) : setShowPlanModal(true))}
            className="flex items-center gap-1.5 rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{activeTab === 'products' ? 'New Product' : 'New Plan'}</span>
          </button>
        </div>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2.5 py-0.5 uppercase">
                    {p.type}
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    ${p.sales_price.toLocaleString()}/mo
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0B0F19] mt-3">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{p.notes || 'No description provided.'}</p>

                {/* Variants List */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Variants & Modifiers
                  </span>
                  {p.variants.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">No variants configured</div>
                  ) : (
                    p.variants.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1 text-xs"
                      >
                        <span className="text-slate-700 font-medium">
                          {v.attribute_name}: <strong className="text-[#0B0F19]">{v.attribute_value}</strong>
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#3B49DF]">
                          +${v.price_extra}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Cost: ${p.cost_price}</span>
                <span className="text-emerald-600 font-semibold">Margin: ${(p.sales_price - p.cost_price).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PLANS TAB */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((pl) => (
            <div
              key={pl.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-50 text-[#3B49DF] font-mono text-[10px] font-bold px-2.5 py-0.5 uppercase">
                    {pl.frequency}
                  </span>
                  <span className="text-xs font-mono text-slate-500">Min Qty: {pl.min_quantity}</span>
                </div>
                <h3 className="text-base font-bold text-[#0B0F19] mt-3">{pl.name}</h3>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Allows Pause:</span>
                    <strong className={pl.allow_pause ? 'text-emerald-600' : 'text-slate-400'}>
                      {pl.allow_pause ? 'Enabled' : 'Disabled'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-close on End:</span>
                    <strong className={pl.auto_close_on_end ? 'text-amber-600' : 'text-slate-400'}>
                      {pl.auto_close_on_end ? 'Yes' : 'No'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                Start: {pl.start_date}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0B0F19]">Create New Product</h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Brightloop Enterprise Cloud Suite"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value as Product['type'] })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  >
                    <option value="software">Software</option>
                    <option value="service">Service</option>
                    <option value="addon">Addon</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Price ($)</label>
                  <input
                    required
                    type="number"
                    value={productForm.sales_price}
                    onChange={(e) => setProductForm({ ...productForm, sales_price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    required
                    type="number"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  value={productForm.notes}
                  onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                  placeholder="Describe offering details and deliverables..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  rows={2}
                />
              </div>

              {/* Variant Section */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                <span className="font-semibold text-slate-800 text-xs">Odoo Variant Pricing Modifier</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={productForm.variants[0]?.attribute_name || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        variants: [{ ...productForm.variants[0], attribute_name: e.target.value }],
                      })
                    }
                    placeholder="Attribute (e.g. Edition)"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={productForm.variants[0]?.attribute_value || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        variants: [{ ...productForm.variants[0], attribute_value: e.target.value }],
                      })
                    }
                    placeholder="Value (e.g. Odoo ERP Sync)"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                  />
                  <input
                    type="number"
                    value={productForm.variants[0]?.price_extra || 0}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        variants: [{ ...productForm.variants[0], price_extra: Number(e.target.value) }],
                      })
                    }
                    placeholder="Price Extra (e.g. 560)"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0B0F19]">Create Billing Plan</h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  required
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Annual Enterprise Plan"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Frequency</label>
                  <select
                    value={planForm.frequency}
                    onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value as BillingFrequency })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Quantity</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={planForm.min_quantity}
                    onChange={(e) => setPlanForm({ ...planForm, min_quantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.allow_pause}
                    onChange={(e) => setPlanForm({ ...planForm, allow_pause: e.target.checked })}
                    className="rounded text-[#3B49DF]"
                  />
                  <span className="font-medium text-slate-700">Allow Pause / Resume</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
