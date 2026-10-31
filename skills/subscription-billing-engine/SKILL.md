---
name: subscription-billing-engine
description: Domain reference and verification rules for subscription management, recurring billing, idempotent invoicing, tax calculation, and payment tracking.
---

# Subscription Billing Engine

## Domain Model & State Machines

### 1. Product & Variants
- Base product: `name`, `type`, `sales_price`, `cost_price`, `notes`.
- Variant attributes: Dynamic price modifiers (e.g. `brand = Odoo` adds +$560 to base price).
- Price equation:
  $$\text{Effective Unit Price} = \text{Base Price} + \sum \text{Variant Price Extras}$$

### 2. Plans
- Recurrence frequency: `daily`, `weekly`, `monthly`, `yearly`.
- Min quantity constraint: $\text{Quantity} \ge \text{min\_qty}$.
- Date window: `start_date` to `end_date`.
- Lifecycle rules:
  - Auto-close on `end_date` vs renewable.
  - Allow early close, pause, or manual renewal.

### 3. Quotation & Subscription Lifecycle
```
[Draft] -> [Quotation] -> [Confirmed] -> [Active] <-> [Paused] -> [Closed]
```
- **Quotation Template**: Pre-populated lines and valid duration (days).
- **Subscription Header**: `subscription_number` (unique, e.g. `SUB-2026-0001`), `customer_id`, `plan_id`, `start_date`, `expiry_date`, `payment_terms`, `status`.
- **Subscription Lines**: `product_id`, `variant_id`, `quantity`, `unit_price`, `tax_id`, `discount_id`, `line_subtotal`.

### 4. Billing Engine & Invariant Rules
- **Idempotent Billing Runs**:
  - Run trigger: Scheduled cron or manual "Billing Day" execution.
  - Eligibility query: `status = 'Active'` AND `next_billing_date <= current_date`.
  - Invariant: A subscription cycle must NEVER be billed more than once or skipped.
  - Lock mechanism: Set `last_billed_cycle` or record an idempotent key (`${sub_id}_${cycle_date}`).
- **Invoice Generation**:
  - State machine: `Draft` -> `Confirmed` -> `Paid` (or `Cancelled`).
  - Lines automatically copied from active subscription lines.
  - Auto-advance `next_billing_date` according to recurrence frequency:
    - Daily: $+1 \text{ day}$
    - Weekly: $+7 \text{ days}$
    - Monthly: $+1 \text{ month}$ (handles 28/29/30/31 day months safely)
    - Yearly: $+1 \text{ year}$

### 5. Tax & Discount Calculations
- **Tax Calculation**:
  - Configurable rates (percentage or fixed).
  - Can be inclusive or exclusive of base price.
- **Discount Rules**:
  - Scope: Line-level (specific product) or Header-level (entire invoice).
  - Type: Percentage ($D\%$) or Fixed Amount ($\$F$).
  - Eligibility guards: Minimum order total / minimum quantity, valid date range, remaining usage counter ($usage\_limit > 0$).
  - Decrement usage counter upon invoice confirmation.

### 6. Payment Tracking & Reconciliation
- Attributes: `payment_id`, `invoice_id`, `amount`, `payment_method` (Bank Transfer, Card, UPI, Cash), `payment_date`, `notes`.
- Status reconciliation:
  - If $\sum \text{Payments} \ge \text{Invoice Total} \implies \text{Status} = \text{Paid}$.
  - If $0 < \sum \text{Payments} < \text{Invoice Total} \implies \text{Status} = \text{Partially Paid}$.
  - If $\sum \text{Payments} = 0 \text{ and } \text{due\_date} < \text{today} \implies \text{Status} = \text{Overdue}$.

### 7. Performance & Latency SLA
- All dashboard aggregations (MRR, ARR, Active Subscriptions, Overdue AR) must execute in $< 2\text{ seconds}$ on datasets of $10,000+$ records using database indexing on `(customer_id, status, next_billing_date, due_date)`.
