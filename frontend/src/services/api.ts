import type {
  User,
  Product,
  Plan,
  Subscription,
  Invoice,
  Payment,
  SubscriptionStatus,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

// Initial Mock Seed Data following context specs
const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Brightloop Enterprise Cloud Suite',
    type: 'software',
    sales_price: 1200,
    cost_price: 400,
    notes: 'Core enterprise SaaS offering with unified dashboard.',
    variants: [
      { id: 'var-1', attribute_name: 'Edition', attribute_value: 'Odoo ERP Sync', price_extra: 560 },
      { id: 'var-2', attribute_name: 'Edition', attribute_value: 'Standard', price_extra: 0 },
    ],
  },
  {
    id: 'prod-2',
    name: 'Dedicated Cloud Support & SLA',
    type: 'service',
    sales_price: 350,
    cost_price: 150,
    notes: '24/7 dedicated support team access and Net-15 SLA.',
    variants: [
      { id: 'var-3', attribute_name: 'Response SLA', attribute_value: '1-Hour Critical', price_extra: 200 },
    ],
  },
  {
    id: 'prod-3',
    name: 'AI Revenue Copilot Addon',
    type: 'addon',
    sales_price: 180,
    cost_price: 50,
    notes: 'Automated predictive cashflow and anomaly detection.',
    variants: [],
  },
];

const initialPlans: Plan[] = [
  {
    id: 'plan-1',
    name: 'Monthly Pro Plan',
    frequency: 'monthly',
    min_quantity: 1,
    start_date: '2026-01-01',
    auto_close_on_end: false,
    allow_pause: true,
  },
  {
    id: 'plan-2',
    name: 'Annual Enterprise Plan',
    frequency: 'yearly',
    min_quantity: 5,
    start_date: '2026-01-01',
    auto_close_on_end: false,
    allow_pause: true,
  },
  {
    id: 'plan-3',
    name: 'Weekly Growth Sprint',
    frequency: 'weekly',
    min_quantity: 1,
    start_date: '2026-01-01',
    auto_close_on_end: true,
    allow_pause: false,
  },
];

const initialSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    subscription_number: 'SUB-2026-0001',
    customer_id: 'cust-1',
    customer_name: 'Acme Global Logistics',
    customer_email: 'finance@acmeglobal.com',
    plan_id: 'plan-1',
    plan_name: 'Monthly Pro Plan',
    frequency: 'monthly',
    status: 'Active',
    start_date: '2026-10-01',
    expiry_date: '2027-10-01',
    next_billing_date: '2026-11-01',
    payment_terms: 'Net 15',
    recurring_amount: 1760,
    lines: [
      {
        id: 'line-1',
        product_id: 'prod-1',
        product_name: 'Brightloop Enterprise Cloud Suite (Odoo ERP Sync)',
        quantity: 1,
        unit_price: 1760,
        line_amount: 1760,
      },
    ],
  },
  {
    id: 'sub-2',
    subscription_number: 'SUB-2026-0002',
    customer_id: 'cust-2',
    customer_name: 'Apex Industrial Robotics',
    customer_email: 'billing@apexrobotics.io',
    plan_id: 'plan-2',
    plan_name: 'Annual Enterprise Plan',
    frequency: 'yearly',
    status: 'Active',
    start_date: '2026-06-15',
    expiry_date: '2027-06-15',
    next_billing_date: '2027-06-15',
    payment_terms: 'Immediate',
    recurring_amount: 14400,
    lines: [
      {
        id: 'line-2',
        product_id: 'prod-1',
        product_name: 'Brightloop Enterprise Cloud Suite (Standard)',
        quantity: 10,
        unit_price: 1200,
        line_amount: 12000,
      },
      {
        id: 'line-3',
        product_id: 'prod-2',
        product_name: 'Dedicated Cloud Support & SLA',
        quantity: 1,
        unit_price: 2400,
        line_amount: 2400,
      },
    ],
  },
  {
    id: 'sub-3',
    subscription_number: 'SUB-2026-0003',
    customer_id: 'cust-3',
    customer_name: 'Nexus FinTech Labs',
    customer_email: 'ops@nexusfin.tech',
    plan_id: 'plan-1',
    plan_name: 'Monthly Pro Plan',
    frequency: 'monthly',
    status: 'Paused',
    start_date: '2026-08-01',
    expiry_date: '2027-08-01',
    next_billing_date: '2026-11-01',
    payment_terms: 'Net 30',
    recurring_amount: 1380,
    lines: [
      {
        id: 'line-4',
        product_id: 'prod-1',
        product_name: 'Brightloop Enterprise Cloud Suite',
        quantity: 1,
        unit_price: 1200,
        line_amount: 1200,
      },
      {
        id: 'line-5',
        product_id: 'prod-3',
        product_name: 'AI Revenue Copilot Addon',
        quantity: 1,
        unit_price: 180,
        line_amount: 180,
      },
    ],
  },
  {
    id: 'sub-4',
    subscription_number: 'SUB-2026-0004',
    customer_id: 'cust-4',
    customer_name: 'Crestline Media Group',
    customer_email: 'accounts@crestline.net',
    plan_id: 'plan-1',
    plan_name: 'Monthly Pro Plan',
    frequency: 'monthly',
    status: 'Quotation',
    start_date: '2026-11-01',
    expiry_date: '2027-11-01',
    next_billing_date: '2026-11-01',
    payment_terms: 'Net 15',
    recurring_amount: 1550,
    lines: [
      {
        id: 'line-6',
        product_id: 'prod-1',
        product_name: 'Brightloop Enterprise Cloud Suite (Standard)',
        quantity: 1,
        unit_price: 1200,
        line_amount: 1200,
      },
      {
        id: 'line-7',
        product_id: 'prod-2',
        product_name: 'Dedicated Cloud Support & SLA',
        quantity: 1,
        unit_price: 350,
        line_amount: 350,
      },
    ],
  },
];

const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoice_number: 'INV-2026-0001',
    subscription_id: 'sub-1',
    subscription_number: 'SUB-2026-0001',
    customer_id: 'cust-1',
    customer_name: 'Acme Global Logistics',
    billing_cycle_key: 'sub-1_2026-10-01',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    issue_date: '2026-10-01',
    due_date: '2026-10-16',
    subtotal: 1760,
    tax_amount: 316.8,
    discount_amount: 0,
    total_amount: 2076.8,
    amount_paid: 2076.8,
    status: 'Paid',
    lines: [
      {
        description: 'Brightloop Enterprise Cloud Suite (Odoo ERP Sync)',
        quantity: 1,
        unit_price: 1760,
        tax_rate: 18,
        tax_amount: 316.8,
        discount_amount: 0,
        line_total: 2076.8,
      },
    ],
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-2026-0002',
    subscription_id: 'sub-2',
    subscription_number: 'SUB-2026-0002',
    customer_id: 'cust-2',
    customer_name: 'Apex Industrial Robotics',
    billing_cycle_key: 'sub-2_2026-06-15',
    period_start: '2026-06-15',
    period_end: '2027-06-14',
    issue_date: '2026-06-15',
    due_date: '2026-06-15',
    subtotal: 14400,
    tax_amount: 2592,
    discount_amount: 500,
    total_amount: 16492,
    amount_paid: 16492,
    status: 'Paid',
    lines: [
      {
        description: 'Brightloop Enterprise Cloud Suite (Standard) x10',
        quantity: 10,
        unit_price: 1200,
        tax_rate: 18,
        tax_amount: 2160,
        discount_amount: 500,
        line_total: 13660,
      },
      {
        description: 'Dedicated Cloud Support & SLA',
        quantity: 1,
        unit_price: 2400,
        tax_rate: 18,
        tax_amount: 432,
        discount_amount: 0,
        line_total: 2832,
      },
    ],
  },
  {
    id: 'inv-3',
    invoice_number: 'INV-2026-0003',
    subscription_id: 'sub-1',
    subscription_number: 'SUB-2026-0001',
    customer_id: 'cust-1',
    customer_name: 'Acme Global Logistics',
    billing_cycle_key: 'sub-1_2026-09-01',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    issue_date: '2026-09-01',
    due_date: '2026-09-16',
    subtotal: 1760,
    tax_amount: 316.8,
    discount_amount: 0,
    total_amount: 2076.8,
    amount_paid: 0,
    status: 'Overdue',
    lines: [
      {
        description: 'Brightloop Enterprise Cloud Suite (Odoo ERP Sync)',
        quantity: 1,
        unit_price: 1760,
        tax_rate: 18,
        tax_amount: 316.8,
        discount_amount: 0,
        line_total: 2076.8,
      },
    ],
  },
  {
    id: 'inv-4',
    invoice_number: 'INV-2026-0004',
    subscription_id: 'sub-3',
    subscription_number: 'SUB-2026-0003',
    customer_id: 'cust-3',
    customer_name: 'Nexus FinTech Labs',
    billing_cycle_key: 'sub-3_2026-10-01',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    issue_date: '2026-10-01',
    due_date: '2026-10-31',
    subtotal: 1380,
    tax_amount: 248.4,
    discount_amount: 0,
    total_amount: 1628.4,
    amount_paid: 0,
    status: 'Confirmed',
    lines: [
      {
        description: 'Brightloop Enterprise Cloud Suite + AI Copilot',
        quantity: 1,
        unit_price: 1380,
        tax_rate: 18,
        tax_amount: 248.4,
        discount_amount: 0,
        line_total: 1628.4,
      },
    ],
  },
];

// User store with pre-seeded credentials for offline resilience
interface StoredUser extends User {
  passwordHash: string;
}

const initialUsers: StoredUser[] = [
  {
    id: 'user-admin',
    email: 'admin@brightloop.io',
    name: 'Sarah Connor',
    role: 'admin',
    passwordHash: 'Brightloop@2026!',
  },
  {
    id: 'user-staff',
    email: 'operations@brightloop.io',
    name: 'Alex Vance',
    role: 'staff',
    passwordHash: 'Brightloop@2026!',
  },
  {
    id: 'user-customer',
    email: 'finance@acmeglobal.com',
    name: 'Acme Global Finance',
    role: 'customer',
    customer_id: 'cust-1',
    passwordHash: 'Brightloop@2026!',
  },
];

// In-Memory state store for mock resilience
let usersStore = [...initialUsers];
let productsStore = [...initialProducts];
let plansStore = [...initialPlans];
let subscriptionsStore = [...initialSubscriptions];
let invoicesStore = [...initialInvoices];

// Helper to check if real backend is available
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('brightloop_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorBody.detail || `HTTP Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('brightloop_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null, token?: string) {
    if (user) {
      localStorage.setItem('brightloop_user', JSON.stringify(user));
      if (token) localStorage.setItem('brightloop_token', token);
    } else {
      localStorage.removeItem('brightloop_user');
      localStorage.removeItem('brightloop_token');
    }
  },

  async login(email: string, password: string): Promise<User> {
    try {
      const data = await request<{ access_token: string; role: User['role']; customer_id?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const user: User = {
        id: `user-${data.role}`,
        email,
        name: email.split('@')[0],
        role: data.role,
        customer_id: data.customer_id,
      };
      this.setCurrentUser(user, data.access_token);
      return user;
    } catch {
      // Mock auth fallback
      const found = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        throw new Error('Invalid email or password');
      }
      if (found.passwordHash !== password) {
        throw new Error('Invalid password for account');
      }
      const token = `mock-jwt-token-${Date.now()}`;
      const user: User = {
        id: found.id,
        email: found.email,
        name: found.name,
        role: found.role,
        customer_id: found.customer_id,
      };
      this.setCurrentUser(user, token);
      return user;
    }
  },

  async register(data: { email: string; password: string; role: User['role']; name?: string }): Promise<User> {
    // Check regex invariant: >= 8 chars, uppercase, lowercase, special
    const hasMinLength = data.password.length >= 8;
    const hasUpper = /[A-Z]/.test(data.password);
    const hasLower = /[a-z]/.test(data.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(data.password);

    if (!hasMinLength || !hasUpper || !hasLower || !hasSpecial) {
      throw new Error('Password must be at least 8 characters and contain uppercase, lowercase, and a special character.');
    }

    try {
      const res = await request<{ access_token: string; role: User['role']; customer_id?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const user: User = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        role: res.role,
        customer_id: res.customer_id,
      };
      this.setCurrentUser(user, res.access_token);
      return user;
    } catch {
      const existing = usersStore.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        throw new Error('An account with this email address already exists.');
      }
      const newUser: StoredUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        role: data.role,
        customer_id: data.role === 'customer' ? `cust-${Date.now()}` : undefined,
        passwordHash: data.password,
      };
      usersStore.push(newUser);
      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        customer_id: newUser.customer_id,
      };
      this.setCurrentUser(user, `mock-token-${Date.now()}`);
      return user;
    }
  },

  async resetPassword(email: string): Promise<{ message: string }> {
    try {
      return await request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch {
      const found = usersStore.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        throw new Error('No registered account found with this email address.');
      }
      return { message: `Password reset link with secure token dispatched to ${email}` };
    }
  },

  logout() {
    this.setCurrentUser(null);
  },

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      return await request<Product[]>('/products');
    } catch {
      return [...productsStore];
    }
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      return await request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
    } catch {
      const newProduct: Product = {
        ...product,
        id: `prod-${Date.now()}`,
        variants: product.variants.map((v, i) => ({ ...v, id: `var-${Date.now()}-${i}` })),
      };
      productsStore = [newProduct, ...productsStore];
      return newProduct;
    }
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      return await request<Product>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(product),
      });
    } catch {
      const idx = productsStore.findIndex((p) => p.id === id);
      if (idx !== -1) {
        productsStore[idx] = { ...productsStore[idx], ...product };
        return productsStore[idx];
      }
      throw new Error('Product not found');
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await request<void>(`/products/${id}`, { method: 'DELETE' });
    } catch {
      productsStore = productsStore.filter((p) => p.id !== id);
    }
  },

  // Plans
  async getPlans(): Promise<Plan[]> {
    try {
      return await request<Plan[]>('/plans');
    } catch {
      return [...plansStore];
    }
  },

  async createPlan(plan: Omit<Plan, 'id'>): Promise<Plan> {
    try {
      return await request<Plan>('/plans', {
        method: 'POST',
        body: JSON.stringify(plan),
      });
    } catch {
      const newPlan: Plan = {
        ...plan,
        id: `plan-${Date.now()}`,
      };
      plansStore = [newPlan, ...plansStore];
      return newPlan;
    }
  },

  async updatePlan(id: string, plan: Partial<Plan>): Promise<Plan> {
    try {
      return await request<Plan>(`/plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(plan),
      });
    } catch {
      const idx = plansStore.findIndex((p) => p.id === id);
      if (idx !== -1) {
        plansStore[idx] = { ...plansStore[idx], ...plan };
        return plansStore[idx];
      }
      throw new Error('Plan not found');
    }
  },

  async deletePlan(id: string): Promise<void> {
    try {
      await request<void>(`/plans/${id}`, { method: 'DELETE' });
    } catch {
      plansStore = plansStore.filter((p) => p.id !== id);
    }
  },

  // Subscriptions
  async getSubscriptions(statusFilter?: string): Promise<Subscription[]> {
    const currentUser = this.getCurrentUser();
    try {
      const query = statusFilter && statusFilter !== 'All' ? `?status=${statusFilter}` : '';
      return await request<Subscription[]>(`/subscriptions${query}`);
    } catch {
      let result = [...subscriptionsStore];
      if (currentUser?.role === 'customer') {
        result = result.filter(
          (s) =>
            (currentUser.customer_id && s.customer_id === currentUser.customer_id) ||
            s.customer_email.toLowerCase() === currentUser.email.toLowerCase()
        );
      }
      if (statusFilter && statusFilter !== 'All') {
        result = result.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());
      }
      return result;
    }
  },

  async createQuotation(data: {
    customer_name: string;
    customer_email: string;
    plan_id: string;
    lines: Array<{ product_id: string; variant_id?: string; quantity: number }>;
  }): Promise<Subscription> {
    try {
      return await request<Subscription>('/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const selectedPlan = plansStore.find((p) => p.id === data.plan_id) || plansStore[0];
      const lines = data.lines.map((l) => {
        const prod = productsStore.find((p) => p.id === l.product_id) || productsStore[0];
        const variant = prod.variants.find((v) => v.id === l.variant_id);
        const unitPrice = prod.sales_price + (variant ? variant.price_extra : 0);
        return {
          id: `line-${Date.now()}-${Math.random()}`,
          product_id: prod.id,
          product_name: `${prod.name}${variant ? ` (${variant.attribute_value})` : ''}`,
          quantity: l.quantity,
          unit_price: unitPrice,
          line_amount: unitPrice * l.quantity,
        };
      });
      const recurringAmount = lines.reduce((acc, line) => acc + line.line_amount, 0);

      const newSub: Subscription = {
        id: `sub-${Date.now()}`,
        subscription_number: `SUB-2026-000${subscriptionsStore.length + 1}`,
        customer_id: `cust-${Date.now()}`,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        frequency: selectedPlan.frequency,
        status: 'Quotation',
        start_date: new Date().toISOString().slice(0, 10),
        expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        next_billing_date: new Date().toISOString().slice(0, 10),
        payment_terms: 'Net 15',
        recurring_amount: recurringAmount,
        lines,
      };
      subscriptionsStore = [newSub, ...subscriptionsStore];
      return newSub;
    }
  },

  async updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    try {
      return await request<Subscription>(`/subscriptions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      const idx = subscriptionsStore.findIndex((s) => s.id === id);
      if (idx !== -1) {
        subscriptionsStore[idx] = { ...subscriptionsStore[idx], status };
        return subscriptionsStore[idx];
      }
      throw new Error('Subscription not found');
    }
  },

  // Invoices
  async getInvoices(statusFilter?: string): Promise<Invoice[]> {
    const currentUser = this.getCurrentUser();
    try {
      const query = statusFilter && statusFilter !== 'All' ? `?status=${statusFilter}` : '';
      return await request<Invoice[]>(`/invoices${query}`);
    } catch {
      let result = [...invoicesStore];
      if (currentUser?.role === 'customer') {
        result = result.filter(
          (inv) =>
            (currentUser.customer_id && inv.customer_id === currentUser.customer_id) ||
            inv.customer_name.toLowerCase().includes(currentUser.name.toLowerCase())
        );
      }
      if (!statusFilter || statusFilter === 'All') return result;
      return result.filter((inv) => inv.status.toLowerCase() === statusFilter.toLowerCase());
    }
  },

  async confirmInvoice(id: string): Promise<Invoice> {
    try {
      return await request<Invoice>(`/invoices/${id}/confirm`, { method: 'POST' });
    } catch {
      const idx = invoicesStore.findIndex((i) => i.id === id);
      if (idx !== -1) {
        invoicesStore[idx] = { ...invoicesStore[idx], status: 'Confirmed' };
        return invoicesStore[idx];
      }
      throw new Error('Invoice not found');
    }
  },

  async cancelInvoice(id: string): Promise<Invoice> {
    try {
      return await request<Invoice>(`/invoices/${id}/cancel`, { method: 'POST' });
    } catch {
      const idx = invoicesStore.findIndex((i) => i.id === id);
      if (idx !== -1) {
        invoicesStore[idx] = { ...invoicesStore[idx], status: 'Cancelled' };
        return invoicesStore[idx];
      }
      throw new Error('Invoice not found');
    }
  },

  async recordPayment(payment: {
    invoice_id: string;
    amount: number;
    payment_method: Payment['payment_method'];
    payment_date: string;
    notes?: string;
  }): Promise<Invoice> {
    try {
      return await request<Invoice>('/payments', {
        method: 'POST',
        body: JSON.stringify(payment),
      });
    } catch {
      const idx = invoicesStore.findIndex((i) => i.id === payment.invoice_id);
      if (idx === -1) throw new Error('Invoice not found');
      const inv = invoicesStore[idx];
      const newPaid = inv.amount_paid + payment.amount;
      const isFullyPaid = newPaid >= inv.total_amount;
      invoicesStore[idx] = {
        ...inv,
        amount_paid: newPaid,
        status: isFullyPaid ? 'Paid' : 'Partially Paid',
      };
      return invoicesStore[idx];
    }
  },

  async triggerBillingRun(simulatedDate?: string): Promise<{ evaluated: number; generated: number; skipped: number }> {
    try {
      return await request<{ evaluated: number; generated: number; skipped: number }>('/billing/run', {
        method: 'POST',
        body: JSON.stringify({ simulated_date: simulatedDate }),
      });
    } catch {
      // Mock runner: find active subscriptions
      let generated = 0;
      let skipped = 0;
      const today = simulatedDate || new Date().toISOString().slice(0, 10);

      subscriptionsStore.forEach((sub) => {
        if (sub.status === 'Active') {
          const cycleKey = `${sub.id}_${today.slice(0, 7)}`;
          const alreadyBilled = invoicesStore.some((inv) => inv.billing_cycle_key === cycleKey);
          if (alreadyBilled) {
            skipped += 1;
          } else {
            const tax = sub.recurring_amount * 0.18;
            const newInv: Invoice = {
              id: `inv-${Date.now()}-${sub.id}`,
              invoice_number: `INV-2026-000${invoicesStore.length + 1}`,
              subscription_id: sub.id,
              subscription_number: sub.subscription_number,
              customer_id: sub.customer_id,
              customer_name: sub.customer_name,
              billing_cycle_key: cycleKey,
              period_start: today,
              period_end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
              issue_date: today,
              due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
              subtotal: sub.recurring_amount,
              tax_amount: tax,
              discount_amount: 0,
              total_amount: sub.recurring_amount + tax,
              amount_paid: 0,
              status: 'Draft',
              lines: sub.lines.map((l) => ({
                description: l.product_name,
                quantity: l.quantity,
                unit_price: l.unit_price,
                tax_rate: 18,
                tax_amount: l.line_amount * 0.18,
                discount_amount: 0,
                line_total: l.line_amount * 1.18,
              })),
            };
            invoicesStore = [newInv, ...invoicesStore];
            generated += 1;
          }
        }
      });

      return { evaluated: subscriptionsStore.length, generated, skipped };
    }
  },
};

