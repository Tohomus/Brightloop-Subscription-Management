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
    variants: [{ attribute_name: 'Edition', attribute_value: 'Enterprise Sync', price_extra: 560 }] as ProductVariant[],
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
      variants: [{ attribute_name: 'Edition', attribute_value: 'Enterprise Sync', price_extra: 560 }],
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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'service':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'addon':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E4E4E7]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
              Products & Plans Catalog
            </h1>
            <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-medium text-blue-700 bg-blue-50 border border-blue-200">
              CATALOG ENGINE v2.4
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Configure dynamic variant price modifiers, cost tracking, and recurring plan frequencies.
          </p>
        </div>

        {/* Tab & New Item Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg bg-zinc-100 p-1 border border-[#E4E4E7]">
            <button
              onClick={() => setActiveTab('products')}
              className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Plans ({plans.length})
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'products' ? handleOpenProductCreate() : handleOpenPlanCreate())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{activeTab === 'products' ? 'New Product' : 'New Plan'}</span>
          </button>
        </div>
      </div>

      {/* 2. CATALOG KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Catalog SKUs</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">{totalItems}</div>
          <span className="text-[11px] text-zinc-400 font-mono">{softwareItems} Software • {totalItems - softwareItems} Addons</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Billing Plans</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Tag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">{plans.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Daily to Yearly cadences</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Avg Base Price</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            ${Math.round(avgBasePrice).toLocaleString()}/mo
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">Before variant modifiers</span>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">Top Margin SKU</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 border border-purple-200 text-purple-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold text-zinc-900 truncate">
            {highestMarginProduct ? highestMarginProduct.name : 'N/A'}
          </div>
          <span className="text-[11px] text-purple-700 font-mono font-medium">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E4E7] shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or descriptions..."
                className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {['all', 'software', 'service', 'addon'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-mono font-medium capitalize transition-colors cursor-pointer ${
                    selectedType === t
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full rounded-xl border border-[#E4E4E7] bg-white p-10 text-center text-zinc-400 font-mono text-xs">
                No products found matching your search.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const dollarMargin = p.sales_price - p.cost_price;
                const marginPercent = p.sales_price > 0 ? Math.round((dollarMargin / p.sales_price) * 100) : 0;
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-sm hover:border-zinc-300 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Type & Price */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-medium uppercase border ${getTypeBadgeClass(
                            p.type
                          )}`}
                        >
                          {p.type}
                        </span>
                        <div className="text-right">
                          <span className="text-base font-bold text-zinc-900 font-mono tabular-nums">
                            ${p.sales_price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono block">base / mo</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-900 mt-2.5 leading-snug">{p.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.notes || 'No description notes provided.'}
                      </p>

                      {/* Formula Invariant Box */}
                      <div className="mt-3.5 rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] p-2.5 text-[11px] text-zinc-600 font-mono">
                        <span className="text-[10px] text-zinc-400 block uppercase font-sans font-medium mb-0.5">
                          Pricing Formula Invariant
                        </span>
                        Unit Price = ${p.sales_price} + &Sigma;(&Delta;P)
                      </div>

                      {/* Configured Variants */}
                      <div className="mt-3 pt-3 border-t border-[#E4E4E7] space-y-1.5">
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                          Attribute Variants ({p.variants.length})
                        </span>
                        {p.variants.length === 0 ? (
                          <div className="text-[11px] text-zinc-400 font-mono italic">No variants configured</div>
                        ) : (
                          p.variants.map((v, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-md bg-zinc-50 border border-[#E4E4E7] px-2.5 py-1 text-xs"
                            >
                              <span className="text-zinc-700 font-medium text-[11px]">
                                {v.attribute_name}: <strong className="text-zinc-900">{v.attribute_value}</strong>
                              </span>
                              <span className="font-mono text-[11px] font-semibold text-blue-600 tabular-nums">
                                +${v.price_extra}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Cost & Margins and Actions */}
                    <div className="mt-4 pt-3 border-t border-[#E4E4E7]">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-2.5">
                        <span>Cost: ${p.cost_price}</span>
                        <span className="text-emerald-600 font-medium tabular-nums">
                          Margin: ${dollarMargin.toLocaleString()} ({marginPercent}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#E4E4E7]">
                        <button
                          onClick={() => handleOpenProductEdit(p)}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((pl) => (
            <div
              key={pl.id}
              className="rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-sm hover:border-zinc-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-medium px-2 py-0.5 uppercase border border-blue-200">
                    {pl.frequency}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">Min Qty: {pl.min_quantity}</span>
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mt-2.5">{pl.name}</h3>

                {/* Plan Rules Matrix */}
                <div className="mt-3.5 space-y-2 text-xs bg-[#FAFAFA] rounded-lg p-3 border border-[#E4E4E7] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 font-sans">Allows Pause:</span>
                    <strong className={pl.allow_pause ? 'text-emerald-600' : 'text-zinc-400'}>
                      {pl.allow_pause ? 'Enabled' : 'Disabled'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 font-sans">Auto-close on End:</span>
                    <strong className={pl.auto_close_on_end ? 'text-amber-600' : 'text-zinc-400'}>
                      {pl.auto_close_on_end ? 'Yes (Auto-term)' : 'No (Continuous)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 font-sans">Early Termination:</span>
                    <strong className={pl.allow_early_close ? 'text-blue-600' : 'text-zinc-400'}>
                      {pl.allow_early_close ? 'Permitted' : 'Locked'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E4E4E7]">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-2">
                  <span>Start: {pl.start_date}</span>
                  <span>{pl.end_date ? `End: ${pl.end_date}` : 'Open-ended'}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#E4E4E7]">
                  <button
                    onClick={() => handleOpenPlanEdit(pl)}
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(pl.id)}
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-xl bg-white p-6 max-w-xl w-full shadow-xl border border-[#E4E4E7] my-8">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3.5">
              <h2 className="text-base font-bold text-zinc-900">
                {editingProductId ? 'Edit Product Offering' : 'Create New Product Offering'}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Brightloop Enterprise Cloud Suite"
                  className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Type</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value as ProductType })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                  >
                    <option value="software">Software (Core)</option>
                    <option value="service">Service (Support/SLA)</option>
                    <option value="addon">Addon (Modules)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Base Sales Price ($)</label>
                  <input
                    required
                    type="number"
                    value={productForm.sales_price}
                    onChange={(e) => setProductForm({ ...productForm, sales_price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Cost Price ($)</label>
                  <input
                    required
                    type="number"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Description / Offering Notes</label>
                <textarea
                  value={productForm.notes}
                  onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                  placeholder="Describe offering details, deliverable limits, and terms..."
                  className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                  rows={2}
                />
              </div>

              {/* Dynamic Variants Section */}
              <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-800 text-xs">Variant Pricing Modifiers</span>
                    <p className="text-[10px] text-zinc-400 font-mono">Unit Price = Base Price + Variant Extra</p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="rounded-md bg-white hover:bg-zinc-100 border border-[#E4E4E7] px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition-colors cursor-pointer"
                  >
                    + Add Variant
                  </button>
                </div>

                {productForm.variants.length === 0 ? (
                  <div className="text-[11px] text-zinc-400 font-mono italic text-center py-2">
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
                          className="flex-1 rounded border border-[#E4E4E7] bg-white px-2 py-1 text-xs text-zinc-900"
                        />
                        <input
                          type="text"
                          value={v.attribute_value}
                          onChange={(e) => updateVariantRow(i, 'attribute_value', e.target.value)}
                          placeholder="Value (e.g. Enterprise Sync)"
                          className="flex-1 rounded border border-[#E4E4E7] bg-white px-2 py-1 text-xs text-zinc-900"
                        />
                        <div className="w-24 relative">
                          <input
                            type="number"
                            value={v.price_extra}
                            onChange={(e) => updateVariantRow(i, 'price_extra', Number(e.target.value))}
                            placeholder="+$"
                            className="w-full rounded border border-[#E4E4E7] bg-white px-2 py-1 text-xs font-mono text-zinc-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantRow(i)}
                          className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-lg px-3.5 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-1.5 font-medium text-white shadow-sm transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="rounded-xl bg-white p-6 max-w-md w-full shadow-xl border border-[#E4E4E7] my-8">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3.5">
              <h2 className="text-base font-bold text-zinc-900">
                {editingPlanId ? 'Edit Billing Plan' : 'Create Billing Plan'}
              </h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Plan Name</label>
                <input
                  required
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Annual Enterprise Plan"
                  className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Billing Frequency</label>
                  <select
                    value={planForm.frequency}
                    onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value as BillingFrequency })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Min Quantity</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={planForm.min_quantity}
                    onChange={(e) => setPlanForm({ ...planForm, min_quantity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={planForm.start_date}
                    onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={planForm.end_date}
                    onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E4E7] bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.allow_pause}
                    onChange={(e) => setPlanForm({ ...planForm, allow_pause: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-medium text-zinc-700">Allow Pause / Resume</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.auto_close_on_end}
                    onChange={(e) => setPlanForm({ ...planForm, auto_close_on_end: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-medium text-zinc-700">Auto-close on End Date</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.allow_early_close}
                    onChange={(e) => setPlanForm({ ...planForm, allow_early_close: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-medium text-zinc-700">Allow Early Termination</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="rounded-lg px-3.5 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-1.5 font-medium text-white shadow-sm transition-colors cursor-pointer"
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

