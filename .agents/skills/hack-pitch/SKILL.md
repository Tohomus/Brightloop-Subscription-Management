---
name: hack-pitch
description: Live demo script generation, architectural defense, and judge Q&A preparation for hackathon screenings.
---

# Hackathon Live Demo & Pitch Playbook

## 2-Minute Judging Structure
Judges evaluate dozens of teams in rapid succession. Avoid slides; show a working product solving real pain immediately.

### Minute 0:00 - 0:30 | The Hook & Ground Truth
- State the problem in 2 sentences:
  *"Today, subscription businesses juggle spreadsheets, manually reconcile bank slips, and leak up to 15% of recurring revenue through missed renewals and billing errors. Brightloop is an end-to-end subscription operating system built to automate the full lifecycle with zero human touch on billing day."*
- Show the **Executive Dashboard** (Active Subscriptions, MRR, Overdue Aging).

### Minute 0:30 - 1:15 | The Core Workflow (The Hero Flow)
1. **Product & Plan Matrix**: Demonstrate dynamic pricing variant (e.g. Odoo brand +$560) and billing frequency rule.
2. **Quotation -> Activation**: Convert a quote into an active subscription in one click.
3. **Billing Day Simulation**: Trigger the automated billing engine. Show multiple due subscriptions processed idempotently into confirmed invoices with exact tax and discount rules applied. Show that re-triggering does NOT double-bill.
4. **Instant Payment & Ledger Reconciliation**: Record a payment and watch the invoice flip from Outstanding to Paid, reflecting in real-time on the revenue dashboard.

### Minute 1:15 - 1:45 | The Technical Moat / Unexpected Angle
- **Idempotent Billing Ledger**: How the engine prevents duplicate charges under network blips or parallel execution.
- **Strict Multi-tenant Role Boundaries**: Admin vs Internal Staff vs Customer Portal (zero data leakage).
- **Sub-2-second Response Guarantee**: Indexed database schemas and pre-computed aggregation rollups ensuring the finance dashboard responds in milliseconds with 50,000+ subscription records.

### Minute 1:45 - 2:00 | Call to Action & Conclusion
- Close on robustness and enterprise readiness:
  *"Brightloop replaces 5 disconnected tools with a single source of financial truth. It is fast, audit-proof, and production ready."*

---

## Anticipated Judge Questions & Defenses (Odoo Screening Focus)

| Question | Strong Technical Defense |
|---|---|
| **"How do you handle month-end billing when months have 28, 30, or 31 days?"** | Use anchor-day preservation. If a subscription starts Jan 31, Feb bills Feb 28, but March bills March 31 (not March 28). |
| **"What happens if the billing cron job crashes halfway through?"** | Billing runs are transactional and idempotent. Invoices are keyed with `(subscription_id, cycle_period)`. Re-running skips already-generated cycles without data corruption. |
| **"How do you enforce security between admin, staff, and customers?"** | Server-side role middleware and row-level filtering. The customer portal never queries the global invoice table; all queries are parameterized by `session.user.customer_id`. |
| **"Why not just use an existing CRM or Stripe Billing?"** | Stripe handles payment rails, not internal ERP operations (cost tracking, margin calculation, internal staff quotations, and custom tax rules). Brightloop bridges billing rails directly with internal inventory and operations. |
