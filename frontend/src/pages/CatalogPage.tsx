import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Trash2,
  Edit3,
  Search,
  Layers,
  TrendingUp,
  Tag,
  DollarSign,
} from 'lucide-react';
import type { Product, Plan, BillingFrequency, ProductType, ProductVariant } from '../types';
import { api } from '../services/api';

const DEFAULT_START_DATE = '2026-10-31';

export const CatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'plans'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Product Modal State (Supports Create & Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'software' as ProductType,
    sales_price: 1000,
    cost_price: 300,
    notes: '',
    variants: [{ attribute_name: 'Edition', attribute_value: 'Odoo ERP Sync', price_extra: 560 }] as ProductVariant[],
  });

  // Plan Modal State (Supports Create & Edit)
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    frequency: 'monthly' as BillingFrequency,
    min_quantity: 1,
    start_date: DEFAULT_START_DATE,
    end_date: '',
    auto_close_on_end: false,
    allow_pause: true,
    allow_early_close: true,
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

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || p.type === selectedType;
    return matchesQuery && matchesType;
  });

  // Modal open for Product Create/Edit
  const handleOpenProductCreate = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      type: 'software',
      sales_price: 1000,
      cost_price: 300,
      notes: '',
      variants: [{ attribute_name: 'Edition', attribute_value: 'Odoo ERP Sync', price_extra: 560 }],
    });
    setShowProductModal(true);
  };

  const handleOpenProductEdit = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      type: prod.type,
      sales_price: prod.sales_price,
      cost_price: prod.cost_price,
      notes: prod.notes || '',
      variants: prod.variants.length > 0 ? [...prod.variants] : [],
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductId) {
      await api.updateProduct(editingProductId, productForm);
    } else {
      await api.createProduct(productForm);
    }
    setShowProductModal(false);
    const updated = await api.getProducts();
    setProducts(updated);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product offering from the catalog?')) {
      await api.deleteProduct(id);
      const updated = await api.getProducts();
      setProducts(updated);
    }
  };

  // Dynamic Variant Adder/Remover in Modal
  const addVariantRow = () => {
    setProductForm({
      ...productForm,
      variants: [
        ...productForm.variants,
        { attribute_name: 'Addon', attribute_value: 'Custom Option', price_extra: 100 },
      ],
    });
  };

  const updateVariantRow = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...productForm.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProductForm({ ...productForm, variants: newVariants });
  };

  const removeVariantRow = (index: number) => {
    setProductForm({
      ...productForm,
      variants: productForm.variants.filter((_, i) => i !== index),
    });
  };

  // Plan Handlers
  const handleOpenPlanCreate = () => {
    setEditingPlanId(null);
    setPlanForm({
      name: '',
      frequency: 'monthly',
      min_quantity: 1,
      start_date: DEFAULT_START_DATE,
      end_date: '',
      auto_close_on_end: false,
      allow_pause: true,
      allow_early_close: true,
    });
    setShowPlanModal(true);
  };

  const handleOpenPlanEdit = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      frequency: plan.frequency,
      min_quantity: plan.min_quantity,
      start_date: plan.start_date,
      end_date: plan.end_date || '',
      auto_close_on_end: plan.auto_close_on_end,
      allow_pause: plan.allow_pause,
      allow_early_close: plan.allow_early_close ?? true,
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlanId) {
      await api.updatePlan(editingPlanId, planForm);
    } else {
      await api.createPlan(planForm);
    }
    setShowPlanModal(false);
    const updated = await api.getPlans();
    setPlans(updated);
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Delete this billing plan?')) {
      await api.deletePlan(id);
      const updated = await api.getPlans();
      setPlans(updated);
    }
  };

  // Analytics Metrics
  const totalItems = products.length;
  const softwareItems = products.filter((p) => p.type === 'software').length;
  const avgBasePrice =
    products.length > 0 ? products.reduce((acc, p) => acc + p.sales_price, 0) / products.length : 0;
  const highestMarginProduct = [...products].sort(
    (a, b) => b.sales_price - b.cost_price - (a.sales_price - a.cost_price)
  )[0];

  const getTypeBadgeClass = (type: ProductType) => {
    switch (type) {
      case 'software':
        return 'bg-blue-50 text-[#3B49DF] border-blue-200';
      case 'service':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'addon':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19]">
              Products & Plans Catalog
            </h1>
            <span className="rounded-full bg-blue-50 text-[#3B49DF] px-2.5 py-0.5 text-xs font-semibold">
              Odoo Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic variant price modifiers, cost tracking, and recurring plan frequencies.
          </p>
        </div>

        {/* Tab & New Item Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#0B0F19] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-[#0B0F19] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plans ({plans.length})
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'products' ? handleOpenProductCreate() : handleOpenPlanCreate())}
            className="flex items-center gap-1.5 rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{activeTab === 'products' ? 'New Product' : 'New Plan'}</span>
          </button>
        </div>
      </div>

      {/* 2. CATALOG KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Catalog SKUs</span>
            <Layers className="h-4 w-4 text-[#3B49DF]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#0B0F19] font-mono">{totalItems}</div>
          <span className="text-[10px] text-slate-400 font-mono">{softwareItems} Software • {totalItems - softwareItems} Addons</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Billing Plans</span>
            <Tag className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono">{plans.length}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Daily to Yearly cadences</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Base Price</span>
            <DollarSign className="h-4 w-4 text-[#3B49DF]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#3B49DF] font-mono">
            ${Math.round(avgBasePrice).toLocaleString()}/mo
          </div>
          <span className="text-[10px] text-slate-400">Before variant modifiers</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Top Margin Product</span>
            <TrendingUp className="h-4 w-4 text-violet-600" />
          </div>
          <div className="mt-1 text-sm font-bold text-[#0B0F19] truncate">
            {highestMarginProduct ? highestMarginProduct.name : 'N/A'}
          </div>
          <span className="text-[10px] text-violet-600 font-mono font-semibold">
            {highestMarginProduct
              ? `+$${(highestMarginProduct.sales_price - highestMarginProduct.cost_price).toLocaleString()} spread`
              : ''}
          </span>
        </div>
      </div>

      {/* 3. PRODUCTS TAB VIEW */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Type Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or descriptions..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#3B49DF] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {['all', 'software', 'service', 'addon'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
                    selectedType === t
                      ? 'bg-[#0B0F19] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs">
                No products found matching your search.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const dollarMargin = p.sales_price - p.cost_price;
                const marginPercent = p.sales_price > 0 ? Math.round((dollarMargin / p.sales_price) * 100) : 0;
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Type & Price */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${getTypeBadgeClass(
                            p.type
                          )}`}
                        >
                          {p.type}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[#0B0F19] font-mono">
                            ${p.sales_price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">base / mo</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-[#0B0F19] mt-3 leading-snug">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.notes || 'No description notes provided.'}
                      </p>

                      {/* Formula Invariant Box */}
                      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-600 font-mono">
                        <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold mb-0.5">
                          Pricing Formula Invariant
                        </span>
                        Unit Price = ${p.sales_price} + &Sigma;(&Delta;P)
                      </div>

                      {/* Configured Variants */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Attribute Variants ({p.variants.length})
                        </span>
                        {p.variants.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">No variants configured</div>
                        ) : (
                          p.variants.map((v, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-blue-50/50 border border-blue-100/60 px-2.5 py-1 text-xs"
                            >
                              <span className="text-slate-700 font-medium">
                                {v.attribute_name}: <strong className="text-[#0B0F19]">{v.attribute_value}</strong>
                              </span>
                              <span className="font-mono text-[11px] font-bold text-[#3B49DF]">
                                +${v.price_extra}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Cost & Margins and Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-3">
                        <span>Cost: ${p.cost_price}</span>
                        <span className="text-emerald-600 font-semibold">
                          Margin: ${dollarMargin.toLocaleString()} ({marginPercent}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                        <button
                          onClick={() => handleOpenProductEdit(p)}
                          className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. PLANS TAB VIEW */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((pl) => (
            <div
              key={pl.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-50 text-[#3B49DF] font-mono text-[10px] font-bold px-2.5 py-0.5 uppercase border border-indigo-200">
                    {pl.frequency}
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-semibold">Min Qty: {pl.min_quantity}</span>
                </div>
                <h3 className="text-base font-bold text-[#0B0F19] mt-3">{pl.name}</h3>

                {/* Plan Rules Matrix */}
                <div className="mt-4 space-y-2 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Allows Pause:</span>
                    <strong className={pl.allow_pause ? 'text-emerald-600' : 'text-slate-400'}>
                      {pl.allow_pause ? 'Enabled' : 'Disabled'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Auto-close on End:</span>
                    <strong className={pl.auto_close_on_end ? 'text-amber-600' : 'text-slate-400'}>
                      {pl.auto_close_on_end ? 'Yes (Auto-term)' : 'No (Continuous)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Early Termination:</span>
                    <strong className={pl.allow_early_close ? 'text-blue-600' : 'text-slate-400'}>
                      {pl.allow_early_close ? 'Permitted' : 'Locked'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2">
                  <span>Start: {pl.start_date}</span>
                  <span>{pl.end_date ? `End: ${pl.end_date}` : 'Open-ended'}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenPlanEdit(pl)}
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(pl.id)}
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0B0F19]">
                {editingProductId ? 'Edit Product Offering' : 'Create New Product Offering'}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
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
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value as ProductType })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  >
                    <option value="software">Software (Core)</option>
                    <option value="service">Service (Support/SLA)</option>
                    <option value="addon">Addon (Modules)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Sales Price ($)</label>
                  <input
                    required
                    type="number"
                    value={productForm.sales_price}
                    onChange={(e) => setProductForm({ ...productForm, sales_price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    required
                    type="number"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Offering Notes</label>
                <textarea
                  value={productForm.notes}
                  onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                  placeholder="Describe offering details, deliverable limits, and terms..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  rows={2}
                />
              </div>

              {/* Dynamic Variants Section */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Odoo Variant Pricing Modifiers</span>
                    <p className="text-[10px] text-slate-400">Unit Price = Base Price + Variant Extra</p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="rounded-full bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-[#3B49DF] transition cursor-pointer"
                  >
                    + Add Variant
                  </button>
                </div>

                {productForm.variants.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic text-center py-2">
                    No variants added. This product will use its base price exclusively.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productForm.variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={v.attribute_name}
                          onChange={(e) => updateVariantRow(i, 'attribute_name', e.target.value)}
                          placeholder="Attribute (e.g. Edition)"
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                        <input
                          type="text"
                          value={v.attribute_value}
                          onChange={(e) => updateVariantRow(i, 'attribute_value', e.target.value)}
                          placeholder="Value (e.g. Odoo Sync)"
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        />
                        <div className="w-24 relative">
                          <input
                            type="number"
                            value={v.price_extra}
                            onChange={(e) => updateVariantRow(i, 'price_extra', Number(e.target.value))}
                            placeholder="+$"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantRow(i)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm cursor-pointer"
                >
                  {editingProductId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-3xl bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0B0F19]">
                {editingPlanId ? 'Edit Billing Plan' : 'Create Billing Plan'}
              </h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-4 text-xs">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={planForm.start_date}
                    onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={planForm.end_date}
                    onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3B49DF]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.allow_pause}
                    onChange={(e) => setPlanForm({ ...planForm, allow_pause: e.target.checked })}
                    className="rounded text-[#3B49DF]"
                  />
                  <span className="font-medium text-slate-700">Allow Pause / Resume</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.auto_close_on_end}
                    onChange={(e) => setPlanForm({ ...planForm, auto_close_on_end: e.target.checked })}
                    className="rounded text-[#3B49DF]"
                  />
                  <span className="font-medium text-slate-700">Auto-close on End Date</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.allow_early_close}
                    onChange={(e) => setPlanForm({ ...planForm, allow_early_close: e.target.checked })}
                    className="rounded text-[#3B49DF]"
                  />
                  <span className="font-medium text-slate-700">Allow Early Termination</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#3B49DF] hover:bg-[#313DE0] px-5 py-2 font-semibold text-white shadow-sm cursor-pointer"
                >
                  {editingPlanId ? 'Update Plan' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
