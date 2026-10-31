export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  customer_id?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  customer_id?: string;
  email: string;
  name: string;
}

export interface ProductVariant {
  id?: string;
  attribute_name: string;
  attribute_value: string;
  price_extra: number;
}

export type ProductType = 'software' | 'service' | 'addon';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  sales_price: number;
  cost_price: number;
  notes?: string;
  variants: ProductVariant[];
}

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  frequency: BillingFrequency;
  min_quantity: number;
  start_date: string;
  end_date?: string;
  auto_close_on_end: boolean;
  allow_pause: boolean;
  allow_early_close?: boolean;
}

export type SubscriptionStatus =
  | 'Draft'
  | 'Quotation'
  | 'Confirmed'
  | 'Active'
  | 'Paused'
  | 'Closed';

export interface SubscriptionLine {
  id?: string;
  product_id: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
}

export interface Subscription {
  id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  plan_id: string;
  plan_name: string;
  frequency: BillingFrequency;
  status: SubscriptionStatus;
  start_date: string;
  expiry_date: string;
  next_billing_date: string;
  payment_terms: string;
  lines: SubscriptionLine[];
  recurring_amount: number;
}

export type InvoiceStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Paid'
  | 'Partially Paid'
  | 'Overdue'
  | 'Cancelled';

export interface InvoiceLine {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  subscription_id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  billing_cycle_key: string;
  period_start: string;
  period_end: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  status: InvoiceStatus;
  lines: InvoiceLine[];
}

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'upi' | 'cash';

export interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes?: string;
}

export interface DashboardSummary {
  active_subscriptions_count: number;
  mrr: number;
  arr: number;
  total_revenue_collected: number;
  outstanding_receivables: number;
  overdue_invoices_count: number;
  overdue_aging: {
    '1_to_30_days': number;
    '31_to_60_days': number;
    '60_plus_days': number;
  };
}

