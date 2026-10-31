# Odoo × CUSAT Make-a-ton 2.0: Subscription Management System
## Detailed Engineering Specification & System Requirements

---

### 1. Context & Business Domain
**Company:** Brightloop Software  
**Business Model:** Hybrid B2B/B2C Recurring Billing & Subscription SaaS.  
**Current Bottleneck:** Subscriptions tracked manually in spreadsheets, forgotten renewals, manual invoice drafting, bank statement manual reconciliation, and lack of real-time MRR/ARR visibility.

---

### 2. User Roles & Permission Matrix (RBAC)

| Capability / Action | Admin | Internal Staff | Customer (Portal) |
|---|:---:|:---:|:---:|
| **Create / Manage Staff Accounts** | Yes | No | No |
| **Configure Products, Variants, Base Prices** | Yes | No | No |
| **Configure Plans & Billing Frequencies** | Yes | No | No |
| **Configure Tax Rules & Discount Policies** | Yes | No | No |
| **Create Quotation Templates & Quotes** | Yes | Yes | No |
| **Confirm & Activate Subscriptions** | Yes | Yes | No |
| **Pause / Resume / Close Subscriptions** | Yes | Yes | No (or request) |
| **Trigger Billing Engine / Generate Invoices** | Yes | Yes | No |
| **Record Payments against Invoices** | Yes | Yes | No |
| **View Global Revenue Analytics & Overdue Aging** | Yes | Limited | No |
| **View Personal Subscriptions & Invoices** | Yes | Yes | Yes (Own only) |
| **Download / Print Personal Invoices** | Yes | Yes | Yes (Own only) |

#### Authentication Security Requirements
- **Email:** Strict uniqueness constraint.
- **Password Strength:** $\ge 8$ characters, at least 1 uppercase letter, 1 lowercase letter, 1 special character (`[!@#$%^&*(),.?":{}|<>]`).
- **Password Recovery:** Email reset flow with secure expiring token.
- **Tenant Isolation:** Customers must NEVER query or access data belonging to other accounts.

---

### 3. Core Data Models & Attribute Specifications

#### A. Products & Variants
- `id`: UUID / Auto-increment integer.
- `name`: String (e.g., "Enterprise Cloud Suite").
- `type`: Enum (`software`, `service`, `addon`).
- `sales_price`: Decimal ($P_{\text{base}}$).
- `cost_price`: Decimal.
- `notes`: Text.
- `variants`: Key-value attribute pairs with price modifiers:
  $$\text{Unit Price} = P_{\text{base}} + \sum \Delta P_{\text{variant}}$$
  *Example:* Base price \$100, variant `brand: Odoo` adds +\$560 $\implies$ Unit Price = \$660.

#### B. Plans
- `id`: UUID.
- `name`: String (e.g., "Annual Pro").
- `frequency`: Enum (`daily`, `weekly`, `monthly`, `yearly`).
- `min_quantity`: Integer ($\ge 1$).
- `start_date`: Date.
- `end_date`: Optional Date.
- `auto_close_on_end`: Boolean.
- `allow_early_close`: Boolean.
- `allow_pause`: Boolean.
- `allow_manual_renewal`: Boolean.

#### C. Quotation Templates & Quotations
- `template_id`: Pre-configured plan and product lines with predefined validity duration (e.g., 14 days).
- Quotation states: `Draft` $\rightarrow$ `Quotation Sent` $\rightarrow$ `Confirmed`.
- Converting a quotation creates an active Subscription record.

#### D. Subscriptions
- `subscription_number`: Unique alphanumeric format (e.g., `SUB-2026-0001`).
- `customer_id`: Reference to user/account.
- `plan_id`: Reference to plan.
- `start_date`: Date.
- `expiry_date`: Date.
- `payment_terms`: String (e.g., "Net 15", "Immediate").
- `status`: State machine:
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longleftrightarrow \text{Paused} \longrightarrow \text{Closed}$$
- `next_billing_date`: Date tracked for recurring execution.
- `lines`: Line items array:
  - `product_id`, `variant_id`, `quantity`, `unit_price`, `tax_id`, `discount_id`, `line_amount`.

---

### 4. Billing Engine & Automated Invoicing

#### Billing Day Workflow
1. The billing runner queries all subscriptions where:
   $$\text{status} = \text{'Active'} \quad \text{AND} \quad \text{next\_billing\_date} \le \text{current\_date}$$
2. For each eligible subscription:
   - Generate an Invoice in `Draft` state.
   - Populate customer header, product lines, quantities, unit prices.
   - Calculate line taxes and discounts automatically.
   - Advance `next_billing_date` according to plan frequency.
3. **Idempotency Rule:**
   - No subscription can be billed twice for the same billing period.
   - Invoices must carry a unique billing cycle key: `${subscription_id}_${period_start}`.

#### Invoice State Machine
$$\text{Draft} \longrightarrow \text{Confirmed} \longrightarrow \text{Paid}$$
$$\text{Draft} \lor \text{Confirmed} \longrightarrow \text{Cancelled}$$

- Invoices support viewing, confirming, cancelling, sending (email simulation), and printing/PDF generation.

---

### 5. Tax & Discount Engines

#### Tax Engine
- Configurable rules defined by Admin (e.g., 18% GST, 5% VAT, or zero-rated).
- Calculated per line item:
  $$\text{Tax Amount} = (\text{Line Subtotal} - \text{Line Discount}) \times \frac{\text{Tax Rate}}{100}$$

#### Discount Engine
- Admin-only configuration.
- Types: Percentage ($D\%$) or Fixed Amount ($\$F$).
- Scopes:
  - **Product-specific:** Applied directly to matching line items.
  - **Whole-subscription:** Applied to total invoice before tax.
- Constraints & Validity:
  - Minimum purchase amount or minimum quantity threshold.
  - Active date range (`start_date` to `end_date`).
  - Max redemption limit (`max_uses`).
  - Automatically expires once usage limit or end date is reached.

---

### 6. Payments & Accounts Receivable

- Recorded Payment Fields: `id`, `invoice_id`, `payment_method` (`bank_transfer`, `credit_card`, `upi`, `cash`), `amount`, `payment_date`, `notes`.
- Status Resolution:
  - Fully Paid: $\sum \text{Payments} \ge \text{Invoice Total}$.
  - Partially Paid: $0 < \sum \text{Payments} < \text{Invoice Total}$.
  - Outstanding: Unpaid within payment terms.
  - Overdue: Unpaid and $\text{current\_date} > \text{due\_date}$.

---

### 7. Executive Revenue Dashboard & Performance SLA

#### Key Financial Metrics
1. **Active Subscriptions:** Count of active recurring subscriptions.
2. **Monthly Recurring Revenue (MRR):** Normalized monthly value:
   $$\text{MRR} = \sum_{\text{Daily}} \text{Val} \times 30 + \sum_{\text{Weekly}} \text{Val} \times 4.33 + \sum_{\text{Monthly}} \text{Val} + \sum_{\text{Yearly}} \frac{\text{Val}}{12}$$
3. **Annual Recurring Revenue (ARR):** $\text{MRR} \times 12$.
4. **Total Revenue Collected:** Sum of all recorded payments.
5. **Outstanding Accounts Receivable (AR):** Total unpaid invoice balance.
6. **Overdue Aging:** Categorized overdue buckets (1-30 days, 31-60 days, 60+ days).

#### Performance SLA
- Filtered queries and summary metrics must execute in **under 2.0 seconds** under heavy load ($10,000+$ records).
- Requires proper database indexes on foreign keys, dates, and status fields.
