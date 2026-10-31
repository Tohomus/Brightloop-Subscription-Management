# ⚡ Brightloop Subscription Management

> **Odoo × CUSAT Make-a-ton 2.0 Hackathon Project**  
> A unified recurring billing, contract state-machine, and financial telemetry platform built around client relationships.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20%2B%20Python-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Oxlint](https://img.shields.io/badge/Lint-Oxlint%20(0%20warnings)-00C853?style=flat)](https://oxc.rs/)

---

## 📌 Executive Summary

**Brightloop Subscription Management** replaces fragmented spreadsheets and manual billing with a centralized recurring revenue engine. Designed with an **Upflow.io-inspired aesthetic** (floating midnight pill navigation, electric cobalt gradient hero, `#FAFBFD` workspace surfaces, and tabular monetary metrics), the platform powers the entire customer lifecycle:

$$\text{Product Catalog} \longrightarrow \text{Quotations} \longrightarrow \text{Active Contracts} \longrightarrow \text{Idempotent Billing Run} \longrightarrow \text{Invoices \& Cash}$$

### 🏆 Hackathon Edge Features

1. **The Chrono-Simulator ("Billing Time Machine"):**
   - An interactive time-travel control (`+1 Day`, `+7 Days`, `+30 Days`) directly embedded in the UI.
   - Allows judges to advance system time and watch the automated billing runner evaluate contracts, generate draft invoices, and age overdue accounts in real-time.
2. **Zero-Daemon Idempotent Billing Engine:**
   - Uses composite cycle keys (`${subscription_id}_${target_date}`) to guarantee that repeated billing runner executions **never duplicate charges or line items**.
3. **Executive Revenue Telemetry (< 2.0s SLA):**
   - Live KPI rollup of Monthly Recurring Revenue (MRR), Annual Run-Rate (ARR), Total Cash Collected, and Outstanding Accounts Receivable (AR).
   - Overdue Aging Buckets (1–30 days, 31–60 days, 60+ critical days) and predictive 30/60/90-day cashflow forecaster.
4. **Multi-Tenant Customer Self-Service Portal (`/portal`):**
   - Dedicated, customer-isolated view where authenticated tenants view only their active subscriptions, view billing history, toggle contract pauses, and print/download letterhead PDF invoices.
5. **Dynamic Variant Pricing:**
   - Products support granular attribute adjustments (e.g., adding **Brand: Odoo ERP Sync** adds $+\$560.00$ to the base rate).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript ~7.0, Vite 8.3, React Router v7, Tailwind CSS 3.4, Lucide React, Oxlint |
| **Backend** | Python 3.13, FastAPI 0.115, Uvicorn, SQLModel 0.0.22, Pydantic v2, PyJWT, Passlib (bcrypt) |
| **Database** | SQLite with WAL (Write-Ahead Logging) mode and foreign key constraints enabled |
| **Architecture** | Contract-first REST API (`/api/*`), JWT Bearer Authentication, Dual-mode frontend (Live API with offline mock resilience) |

---

## 👥 Team Work Split & Member Responsibilities

This project was built with strict file boundaries and zero merge conflicts during the Make-a-ton screening window:

| Team Member | Assigned Track & Core Modules | Primary Files Owned |
| :--- | :--- | :--- |
| **Alan**<br>*(Backend Lead)* | FastAPI foundation, Database engine, Auth & RBAC (JWT, password regex), Product catalog with variant pricing, Plans CRUD, Database Seeder (`seed.py`). | `backend/app/core/*`<br>`backend/app/api/auth.py`<br>`backend/app/api/products.py`<br>`backend/app/api/plans.py`<br>`backend/seed.py` |
| **Abijith**<br>*(Financial Engine Lead)* | Subscriptions State Machine (`Draft` $\rightarrow$ `Quotation` $\rightarrow$ `Confirmed` $\rightarrow$ `Active` $\leftrightarrow$ `Paused` $\rightarrow$ `Closed`), Automated Billing Day Runner (`/api/billing/run`), Taxes & Discounts calculation, Payments reconciliation. | `backend/app/api/subscriptions.py`<br>`backend/app/api/billing.py`<br>`backend/app/api/invoices.py`<br>`backend/app/api/payments.py`<br>`backend/app/services/*` |
| **Thomas**<br>*(Frontend Operations Lead)* | Router & navigation shell, Upflow UI design system, Products & Plans Catalog view, Quotations & Subscriptions view, Invoicing ledger & payment modal, Frontend-Backend API integration & Quality gatekeeper. | `frontend/src/components/Navbar.tsx`<br>`frontend/src/components/Sidebar.tsx`<br>`frontend/src/pages/LoginPage.tsx`<br>`frontend/src/pages/CatalogPage.tsx`<br>`frontend/src/pages/SubscriptionsPage.tsx`<br>`frontend/src/pages/InvoicesPage.tsx`<br>`frontend/src/services/api.ts` |
| **Jeremy**<br>*(Telemetry & Simulator Lead)* | Executive Finance Dashboard (< 2s SLA), Overdue Aging chart, Chrono-Simulator ("Billing Time Machine"), Isolated Customer Portal (`/portal`), Printable PDF Invoice Modal. | `frontend/src/pages/ExecutiveDashboard.tsx`<br>`frontend/src/components/TimeMachine.tsx`<br>`frontend/src/pages/CustomerPortal.tsx`<br>`frontend/src/components/InvoicePrintModal.tsx`<br>`backend/app/api/dashboard.py` |

---

## 📂 Project Structure

```text
Brightloop-Subscription-Management/
├── backend/
│   ├── app/
│   │   ├── api/                    # REST API Routers
│   │   │   ├── auth.py             # User register, login, password reset
│   │   │   ├── billing.py          # POST /api/billing/run, taxes, discounts
│   │   │   ├── dashboard.py        # Executive finance aggregation (< 2s SLA)
│   │   │   ├── invoices.py         # Invoices query, confirm, cancel
│   │   │   ├── payments.py         # Payment recording & AR reconciliation
│   │   │   ├── plans.py            # Subscription plans & quotation templates
│   │   │   ├── products.py         # Product CRUD & variant pricing
│   │   │   └── subscriptions.py    # State machine, quotations, contracts
│   │   ├── core/                   # Database connection, security, JWT
│   │   ├── models/                 # SQLModel database tables
│   │   ├── schemas/                # Pydantic validation schemas
│   │   ├── services/               # Billing runner & tax calculations
│   │   └── main.py                 # FastAPI application entry & CORS
│   ├── tests/                      # Integration and unit test suite
│   ├── seed.py                     # Database seeder (Realistic demo data)
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Navbar.tsx          # Midnight floating pill header & persona switcher
│   │   │   ├── Sidebar.tsx         # Operations rail with live active status
│   │   │   ├── TimeMachine.tsx     # Chrono-Simulator widget (+1/+7/+30 days)
│   │   │   └── InvoicePrintModal.tsx # Printable letterhead invoice layout
│   │   ├── pages/                  # Full-page views
│   │   │   ├── ExecutiveDashboard.tsx # Real-time telemetry, MRR/ARR, aging
│   │   │   ├── CatalogPage.tsx     # Products, variants, margin analysis
│   │   │   ├── SubscriptionsPage.tsx # Multi-line quote builder & contract inspector
│   │   │   ├── InvoicesPage.tsx    # AR ledger, payments modal, PDF print
│   │   │   ├── CustomerPortal.tsx  # Isolated tenant self-service portal
│   │   │   └── LoginPage.tsx       # RBAC persona switcher & authentication
│   │   ├── services/
│   │   │   ├── api.ts              # Typed REST client with offline fallback
│   │   │   └── dashboardService.ts # Telemetry caching & event emitter
│   │   ├── types/                  # Shared TypeScript interfaces
│   │   ├── App.tsx                 # Capsule step router & live health watcher
│   │   └── main.tsx                # Vite React mount
│   ├── package.json
│   └── tsconfig.json
│
├── context/                        # Hackathon guidelines & architecture contracts
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **Python** v3.11+ and **pip**
- **Git**

---

### 2. Backend Setup & Database Seeding

Open a terminal and run:

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed realistic demo database (Users, Products, Plans, Subscriptions, Invoices)
python seed.py

# Start FastAPI server on port 8000
uvicorn app.main:app --reload --port 8000
```

- Swagger API documentation is available at: `http://localhost:8000/docs`
- Health verification endpoint: `http://localhost:8000/health`

---

### 3. Frontend Setup

Open a second terminal and run:

```bash
cd frontend

# Install dependencies
npm install

# Run Oxlint verification
npm run lint

# Start Vite development server
npm run dev
```

- Access the application in your browser at: `http://localhost:5173`
- The bottom-right floating badge will display a pulsing green dot: **`FastAPI Live :8000 • SQLite`**.

---

## 🔑 Pre-Seeded Demo Credentials

All test accounts use the password: `Brightloop@2026!`

| Persona | Email | Assigned Role | Access Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@brightloop.io` | `admin` | Full system access: Catalog, Telemetry, Subscriptions, Invoices, Billing Runner |
| **Operations Staff** | `operations@brightloop.io` | `staff` | Quotation drafting, Contract lifecycle, Invoicing ledger, Payment recording |
| **Customer Tenant** | `finance@acmeglobal.com` | `customer` | Isolated Customer Portal (`/portal`): own contracts, invoice PDF print |
| **Secondary Customer**| `billing@apexrobotics.io` | `customer` | Alternate isolated tenant for multi-tenant verification |

*(You can instantly switch personas using the dropdown in the top navbar or via the Quick Switcher on `/login`).*

---

## 🎬 2-Minute Judge Screening Walkthrough

Follow these 5 steps to verify the entire system during demo evaluation:

```
[1. Executive Telemetry] ➔ [2. Odoo Variant Catalog] ➔ [3. Quote to Active] ➔ [4. Time Machine Run] ➔ [5. Tenant Portal]
```

1. **Executive Telemetry (`/admin/dashboard`):**
   - Review live MRR, ARR, and cashflow projections.
   - Inspect the Overdue Aging buckets (1–30d, 31–60d, 60+ critical). Response completes in under 2 seconds.
2. **Catalog & Dynamic Variant Pricing (`/admin/products`):**
   - Click *Edit* on **Brightloop Enterprise Cloud Suite**.
   - Note the variant: **Edition: Odoo ERP Sync** adding $+\$560.00$ to the $\$1,200.00$ base sales price.
3. **Quotation $\rightarrow$ Subscription State Machine (`/staff/subscriptions`):**
   - Click **Draft New Quotation** $\rightarrow$ select Acme Global Logistics, select Odoo variant, submit quote.
   - Click **Confirm** $\rightarrow$ contract transitions from `Quotation` to `Active` via the backend state machine.
4. **Chrono-Simulator Idempotent Billing (`TimeMachine` Top Widget):**
   - Click **Advance +1 Day** (or **+30 Days**).
   - The backend billing runner (`POST /api/billing/run`) evaluates contracts and generates new draft invoices.
   - Click it again for the same date $\rightarrow$ observe `Skipped (idempotent)` counter increment, proving zero duplicate charges!
5. **Customer Portal & Printable PDF (`/portal`):**
   - Switch persona to **Customer Tenant (`finance@acmeglobal.com`)**.
   - Notice strict data isolation: only Acme Global's contracts appear.
   - Click **Print / Download PDF** on any invoice to display the printable letterhead invoice layout.

---

## 🌿 Git Branching & Quality Strategy

To maintain high velocity without merge conflicts:
- **Branch Target:** All feature development branched from `dev` and merged via Pull Requests.
- **`main` Protection:** Stable, verified release branch.
- **Strict Quality Gate:** Every commit requires:
  - `npm run lint` $\rightarrow$ **0 warnings, 0 errors**
  - `npm run build` $\rightarrow$ **0 TypeScript errors**
  - All financial figures use tabular `font-mono` formatting.

---

## 📄 License & Team Credits

Copyright © 2026. Built with pride for **Make-a-ton 2.0 (Odoo × CUSAT)** by:
- **Alan John Thomas**
- **Abijith P**
- **Jeremy Chehrehmi**
- **Thomas Raju**
