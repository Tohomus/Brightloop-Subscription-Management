# Team Work Split, Git Workflow & Hackathon Timeline
> **Project:** Brightloop Subscription Management (Odoo × CUSAT Make-a-ton)  
> **Team Squad (4 Members):** Alan (Lead), Thomas, Abijith, Jeremy  
> **Screening Window:** 10:00 AM – 5:00 PM (Deadline: 5:00 PM Sharp)

---

## 1. High-Level Strategy & Architecture Isolation

To achieve rapid execution without Git merge conflicts:
1. **Strict File Ownership:** No two developers ever edit the same file simultaneously.
2. **Contract-First Development:** The database schema and API contracts are already locked in [`context/TEAM_DEVELOPMENT_GUIDELINES.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/context/TEAM_DEVELOPMENT_GUIDELINES.md).
3. **Decoupled Asynchronous Work:** Frontend developers use mock JSON / type interfaces while backend developers build the endpoints.
4. **Jeremy's Schedule Accommodation:** Jeremy is busy until 1:00 PM. **Jeremy is intentionally kept off the 11:00 AM – 1:00 PM critical path.** When he arrives at 1:00 PM, the foundation is already built, and he takes ownership of the high-impact visual layer (Executive Dashboard, Chrono-Simulator, and Judge Demo).

---

## 2. Individual Member Responsibilities & File Boundaries

### 👤 Member 1: Alan (Backend Architecture & Catalog Core)
- **Time Available:** 11:10 AM – 5:00 PM
- **Branch:** `feature/backend-core-alan`
- **Assigned Modules:**
  1. **FastAPI Foundation & Database Engine:** Initialize `backend/` scaffold, SQLite connection, and base tables in `app/models/`.
  2. **Auth & RBAC:**
     - User registration with strict password regex ($>8$ chars, uppercase, lowercase, special character).
     - User login returning role (`admin`, `staff`, `customer`).
     - Password reset endpoint.
  3. **Products & Plans Catalog:**
     - Product CRUD with attribute variant pricing (e.g. brand "Odoo" adds $+\$560$).
     - Plans CRUD (daily, weekly, monthly, yearly; min quantity; auto-close flags).
     - Quotation Templates.
- **Exclusive File Boundaries (Alan Only):**
  - `backend/app/core/*`
  - `backend/app/models/catalog.py`
  - `backend/app/models/auth.py`
  - `backend/app/api/auth.py`
  - `backend/app/api/products.py`
  - `backend/app/api/plans.py`
  - `backend/requirements.txt`
  - `backend/app/main.py`

---

### 👤 Member 2: Abijith (Backend Financial Engine & Invoicing)
- **Time Available:** 11:10 AM – 5:00 PM
- **Branch:** `feature/billing-engine-abijith`
- **Assigned Modules:**
  1. **Subscriptions State Machine:**
     - Transitions: `Draft` $\rightarrow$ `Quotation` $\rightarrow$ `Confirmed` $\rightarrow$ `Active` $\leftrightarrow$ `Paused` $\rightarrow$ `Closed`.
     - Unique subscription number generator (`SUB-2026-XXXX`).
  2. **Automated Billing Day Runner (`POST /api/billing/run`):**
     - Queries all active subscriptions due on or before target date.
     - Generates Draft invoices with calculated line items.
     - **Idempotency Engine:** Uses cycle key `${sub_id}_${billing_date}` so repeated runs never duplicate charges.
  3. **Tax & Discount Engine:**
     - Admin-configured tax rules calculated automatically on subtotal.
     - Discount rules (fixed/percent, line vs header, min spend/qty, usage counter decrement).
  4. **Payments & Invoicing API:**
     - Record payments (method, amount, date, notes).
     - Invoice status reconciliation (`Paid`, `Partially Paid`, `Overdue`).
- **Exclusive File Boundaries (Abijith Only):**
  - `backend/app/models/billing.py`
  - `backend/app/models/invoicing.py`
  - `backend/app/services/billing_runner.py`
  - `backend/app/services/tax_discount_calc.py`
  - `backend/app/api/subscriptions.py`
  - `backend/app/api/billing.py`
  - `backend/app/api/invoices.py`
  - `backend/app/api/payments.py`

---

### 👤 Member 3: Thomas (Frontend Layout, Routing & Operations UI)
- **Time Available:** 11:10 AM – 5:00 PM
- **Branch:** `feature/frontend-core-thomas`
- **Assigned Modules:**
  1. **Router & Navigation Shell:**
     - Install `react-router-dom` and `lucide-react`.
     - Configure routes: `/login`, `/admin/products`, `/staff/subscriptions`, `/staff/invoices`.
     - Modern dark navigation bar (Slate-950/900 palette with active route indicators).
  2. **Product & Plan Management View:**
     - Dynamic product creation modal with variant price adjustments.
     - Plans list with frequency badges.
  3. **Quotation & Subscription Management View:**
     - Table of subscriptions with status filter pills (`Active`, `Quotation`, `Paused`, `Closed`).
     - "New Quote" modal using templates $\rightarrow$ "Confirm to Subscription" one-click button.
  4. **Invoice Management View:**
     - Invoices ledger showing status (`Draft`, `Confirmed`, `Paid`, `Overdue`).
     - "Trigger Billing Day" button and "Record Payment" modal.
- **Exclusive File Boundaries (Thomas Only):**
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/Sidebar.tsx`
  - `frontend/src/pages/LoginPage.tsx`
  - `frontend/src/pages/CatalogPage.tsx`
  - `frontend/src/pages/SubscriptionsPage.tsx`
  - `frontend/src/pages/InvoicesPage.tsx`
  - `frontend/src/services/api.ts` (base client)

---

### 👤 Member 4: Jeremy (Dashboard, Time Machine Simulator & Customer Portal)
- **Time Available:** 1:00 PM – 5:00 PM *(Scheduled arrival at 1:00 PM)*
- **Branch:** `feature/dashboard-simulator-jeremy`
- **Assigned Modules:**
  1. **The Executive Finance Dashboard (< 2s SLA):**
     - Top KPI rollup cards: Active Subscriptions, MRR, ARR, Total Collected Revenue, Overdue Receivables.
     - Overdue Aging visual chart / buckets (1-30 days, 31-60 days, 60+ days).
  2. **The Hackathon Edge — Chrono-Simulator ("Billing Time Machine"):**
     - Prominent top-bar widget showing simulated system date.
     - Controls: `+1 Day`, `+7 Days`, `+30 Days`, `Run Billing Day`.
     - Visually updates the dashboard and triggers the billing runner live to show renewals and aging in real-time!
  3. **Isolated Customer Portal (`/portal`):**
     - Dedicated, clean customer view where logged-in customer sees **only** their own subscriptions and invoices.
     - "Download/Print Invoice" printable layout.
  4. **Pitch Preparation (3:30 PM - 5:00 PM):**
     - Lead the 2-minute live demo rehearsal using [`skills/hack-pitch/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/hack-pitch/SKILL.md).
- **Exclusive File Boundaries (Jeremy Only):**
  - `frontend/src/pages/ExecutiveDashboard.tsx`
  - `frontend/src/components/TimeMachine.tsx`
  - `frontend/src/pages/CustomerPortal.tsx`
  - `frontend/src/components/InvoicePrintModal.tsx`
  - `backend/app/api/dashboard.py` (Dashboard aggregation query)

---

## 3. Timeline & Phase Milestones

```
11:15 AM               1:00 PM               3:30 PM               4:30 PM      5:00 PM
   |----------------------|---------------------|---------------------|------------|
        PHASE 1                 PHASE 2               PHASE 3             PHASE 4
   Foundation Sprint      Full Squad Sprint     Integration & Seed    Lock & Demo
   (Alan, Thomas, Abijith)(Jeremy Joins)        (End-to-End Tests)    (Screening)
```

### Phase 1: Foundation Sprint (11:15 AM – 1:00 PM)
- **Alan:** Completes FastAPI scaffold + Auth endpoints + Products/Plans API.
- **Abijith:** Completes Subscription lifecycle + Billing runner service + Payment recording.
- **Thomas:** Completes React Router + Navbar + Catalog View + Subscriptions View.
- *Status at 1:00 PM:* Backend running at `http://localhost:8000/docs`, Frontend running at `http://localhost:5173`.

### Phase 2: Full Squad Sprint (1:00 PM – 3:30 PM)
- **1:00 PM:** Jeremy pulls `dev`, spins up frontend and backend in 2 minutes, and starts his assigned views.
- **Alan & Abijith:** Merge backend branches into `dev`, test end-to-end API flows with SQLite.
- **Thomas:** Connects Subscriptions and Invoices UI to live backend endpoints.
- **Jeremy:** Builds the Executive Dashboard + Time Machine Simulator + Customer Portal.

### Phase 3: Integration & Realistic Data Seeding (3:30 PM – 4:30 PM)
- Seed realistic sample data into SQLite:
  - 1 Admin, 2 Staff, 3 Customers.
  - 5 Products (including Odoo variant).
  - 15 Subscriptions (10 Active, 2 Quotations, 2 Paused, 1 Closed).
  - 10 Invoices (6 Paid, 2 Confirmed, 2 Overdue).
- Verify < 2s response SLA on dashboard.
- Jeremy and Alan run full live demo walk-throughs using the 2-Minute Script in [`skills/hack-pitch/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/hack-pitch/SKILL.md).

### Phase 4: Code Freeze & Final Polish (4:30 PM – 5:00 PM)
- Verify `npm run lint` and `npm run build` pass cleanly (zero errors).
- Verify FastAPI starts with zero console errors.
- Final commit & push to `main` via PR from `dev`.

---

## 4. Git Rules for Zero Merge Conflicts

1. **Target Branch:** Everyone branches from `dev` and opens PRs to `dev`. Never push directly to `main`.
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/<your-assigned-name>
   ```
2. **Commit Often with Conventional Messages:**
   - `feat(auth): add password regex validation`
   - `feat(billing): add idempotent billing runner service`
   - `feat(ui): add subscription management table`
3. **Stay in Your Lane:** If you need a helper from another developer's file, import it or ask them to expose it. Do not edit their files directly.
