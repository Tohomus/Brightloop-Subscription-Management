# Architectural Options, Technical Trade-Offs & Unexpected Hackathon Edges

---

## 1. Adversarial Evaluation of Candidate Architectures

### Option A: Pure Python/Odoo Addon Module (`addons/brightloop_subscriptions`)
- **Pros:**
  - Perfect alignment with Odoo sponsor/judges.
  - Built-in ORM, security groups, QWeb reports, and accounting models (`account.move`, `account.payment`).
- **Brutal Reality / Failure Modes:**
  - Extreme setup friction for teammates: requires local PostgreSQL, Python 3.10+, and Odoo 17/18 environment setup.
  - Frontend customization in OWL (Odoo Web Library) is slow to iterate on during a 7-hour screening.
  - High probability of demo failure if local Odoo services crash during live presentation.

### Option B: Standalone Fullstack Application (FastAPI/Node + PostgreSQL + React 19 Frontend)
- **Pros:**
  - Rapid UI velocity using Vite + Tailwind (already scaffolded in `frontend/`).
  - Total control over presentation, real-time interactivity, and UX polish.
  - Zero dependencies on heavyweight enterprise ERP runtimes.
- **Brutal Reality / Failure Modes:**
  - High risk of building "just another generic CRUD app" that ignores Odoo's architectural strengths.
  - If backend billing rules or financial formulas are sloppy, Odoo judges will immediately spot accounting inconsistencies.

### Option C (Recommended Wedge): Decoupled Modern Core with Odoo Schema Conformance & Live Fast-Forward Simulator
- **Architecture:**
  - **Frontend:** React 19 + TypeScript + Tailwind (Linear-grade density, high-speed UX).
  - **Backend/Engine:** Lightweight service (Python FastAPI or Node/Express) enforcing Odoo's exact data model semantics (`sale_order` $\rightarrow$ `sale_subscription` $\rightarrow$ `account_move` $\rightarrow$ `account_payment`).
  - **Database:** SQLite/PostgreSQL with strict transactions.
- **Why this wins:** Teammates can spin it up in 10 seconds, develop with instant hot-reload, and deliver flawless accounting fidelity without the Odoo runtime overhead.

---

## 2. Unexpected Angles ("The Edge") to Beat Conventional Entries

In hackathon judging, every team builds basic forms for products, plans, and invoices. An obvious CRUD app will score in the bottom 50%. The following unexpected features will elevate the entry:

### Edge 1: The "Billing Time Machine" (Interactive Chrono-Simulator)
- **The Problem:** In real life, recurring billing happens over months. During a 2-minute live demo, judges cannot see recurring cycles, renewal triggers, or overdue transitions without manually hacking database timestamps.
- **The Unexpected Solution:** A prominent top-bar "Time Machine" controller that lets the user fast-forward the system time (`+1 Day`, `+1 Week`, `+1 Month`, `Jump to Next Billing Day`).
- **Judge Impact:** Live proof that:
  - Recurring invoices generate automatically when their date arrives.
  - Invoices transition to `Overdue` when payment terms expire.
  - Discounts expire after their end dates or redemption limits.
  - Zero double-billing occurs even when scrubbing time back and forth.

### Edge 2: Idempotent Ledger with Run Visualizer
- **The Problem:** Billing runs in production often crash midway or get re-triggered by impatient admins, double-billing thousands of dollars.
- **The Solution:** An auditable "Billing Run Engine" visualizer showing:
  - Total subscriptions evaluated vs billed vs skipped.
  - Hash-based idempotency keys `${subscription_id}_${cycle_date}` preventing any duplicate charges.
  - A real-time execution log that demonstrates enterprise-grade fault tolerance.

### Edge 3: Churn & Cashflow Forecaster
- **The Problem:** Most revenue dashboards only show past payments.
- **The Solution:** A predictive cashflow timeline combining committed recurring contracts with active payment terms to forecast incoming cashflow for the next 30, 60, and 90 days, flagging high-risk overdue accounts.

---

## 3. High-Risk Edge Cases & Invariants (Grill-Me Checklist)

Before writing code or locking design, grill the team on these edge cases:

1. **Calendar Edge Cases:**
   - How does a monthly plan handle January 31? Does February bill on Feb 28? Does March bill on March 28 or March 31? (Must preserve the original billing anchor day).
2. **Discount Expiration Race Conditions:**
   - If a discount rule has `max_uses = 1`, and a billing run processes 5 subscriptions simultaneously, does it apply to all 5 or only the first? (Requires row-level locking or atomic decrement).
3. **Mid-Cycle Plan Changes & Cancellations:**
   - What happens when an active subscription is paused or closed mid-cycle? Is the current generated draft invoice cancelled, prorated, or kept?
4. **Tenant Isolation / Security Leakage:**
   - Can a customer manually guess an invoice ID in API parameters and view another customer's invoice PDF? (Must enforce server-side ownership checks).
5. **Floating Point Rounding in Financials:**
   - Never use JavaScript `Number` or floating point math for currency. Always calculate in integer cents / paise or use decimal precision types to avoid `$19.9999999999` bugs.
