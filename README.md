# ⚡ Brightloop Subscription Management

> **Enterprise-Grade Recurring Billing, Contract State Machine & Financial Telemetry Platform**  
> *Developed for the Odoo × CUSAT Make-a-ton 2.0 Hackathon Challenge*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20%7C%20Python-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Design%20System-Tailwind%20CSS%203.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(WAL%20Engine)-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Oxlint](https://img.shields.io/badge/Code%20Quality-Oxlint%20(0%20Warnings)-00C853?style=for-the-badge)](https://oxc.rs/)

---

## 📌 Table of Contents

1. [Why Brightloop? (The Value Proposition)](#-why-brightloop-the-value-proposition)
2. [Facilities & Core Resources Provided](#-facilities--core-resources-provided)
3. [Architecture & Technology Stack](#-architecture--technology-stack)
4. [Project & File Structure](#-project--file-structure)
5. [Local Development & Uvicorn Setup](#-local-development--uvicorn-setup)
6. [Pre-Seeded Demo Accounts & Credentials](#-pre-seeded-demo-accounts--credentials)
7. [Git Branching Strategy & Contribution Rules](#-git-branching-strategy--contribution-rules)
8. [2-Minute Judge Screening Walkthrough Script](#-2-minute-judge-screening-walkthrough-script)
9. [Team Credits & Copyright](#-team-credits--copyright)

---

## 💡 Why Brightloop? (The Value Proposition)

Traditional subscription management software (e.g., Stripe Billing, Chargebee, Recurly) is heavily **transaction-centric**: they treat subscriptions as raw billing schedules without contextual understanding of customer relationships, custom quote workflows, or multi-line product variants. 

**Brightloop** is built around **relationship-first subscription commerce**:

### 🌟 What Makes Brightloop Essential for Every Growing Business?

* **Zero-Duplicate Idempotent Billing Engine:** Traditional cron-based recurring billing often duplicates invoices during network timeouts or retry loops. Brightloop enforces a strict composite idempotency key (`${subscription_id}_${target_date}`). Even if a billing run is triggered ten times on the same date, only **one single invoice** will ever be generated.
* **The Chrono-Simulator ("Billing Time Machine"):** Testing recurring billing usually requires mocking server clocks or waiting weeks. Brightloop features an integrated **Time Machine widget** (`+1 Day`, `+7 Days`, `+30 Days`) that allows finance teams and developers to fast-forward system time and evaluate invoice generation, payment due dates, and aging delinquency in real-time.
* **Sub-2-Second Executive Telemetry SLA:** Live analytical rollups calculate Monthly Recurring Revenue (MRR), Annual Run-Rate (ARR), settled revenue, and overdue receivables in $< 2.0\text{s}$ response times without slowing down transactional OLTP queries.
* **Granular Product Variant Pricing:** Add complex software tiers and add-ons effortlessly. Products support attribute surcharges (e.g., base SaaS price of $\$1,200.00$ automatically adds $+\$560.00$ when the **Odoo ERP Sync** variant is toggled).
* **Upflow.io-Inspired Minimalist Aesthetic:** Say goodbye to cluttered, dated enterprise software. Brightloop features a floating midnight pill navbar (`#0B0F19`), electric cobalt gradient accents (`#242DB8 → #3B49DF`), clean `#FAFBFD` workspace surfaces, and tabular `font-mono` numbers for error-free accounting readability.
* **Dual-Mode Client Resilience:** The frontend seamlessly communicates with the live FastAPI backend, but includes an intelligent offline in-memory fallback layer. Even if the backend server is temporarily restarted, the UI remains 100% interactive.

---

## 🏢 Facilities & Core Resources Provided

Brightloop provides an end-to-end operational suite spanning the entire recurring revenue lifecycle:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Product Catalog │ ───► │  Quotes Builder │ ───► │ Contract State  │ ───► │ Idempotent Run  │
│  & Variant S/C  │      │ & PDF Inspector │      │     Machine     │      │  & Ledger Sync  │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
                                                                                    │
                                                                                    ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Customer Portal │ ◄─── │ Payment Receipt │ ◄─── │ Overdue Aging   │ ◄─── │ Executive Tele- │
│ & Self-Service  │      │ & Reconciler    │      │ 30/60/90d Risk  │      │ metry (< 2s SLA)│
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 1. Catalog & Variant Engine (`/admin/products`)
* **Product Classification:** Define `Software`, `Service`, and `Addon` line items.
* **Variant Attribute Matrix:** Configure attribute pricing (e.g., Edition, SLA speed, Seat tier) with dynamic margin analysis.
* **Plan Governance:** Define Daily, Weekly, Monthly, and Yearly intervals with minimum order quantities, trial windows, and auto-close flags.

### 2. Quotation Builder & Contract State Machine (`/staff/subscriptions`)
* **Multi-Line Quotations:** Sales reps can draft proposals with multiple products, custom discounts, and payment terms (Immediate, Net 15, Net 30).
* **Strict State Machine:** Governs subscription lifecycle transitions:
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longleftrightarrow \text{Paused} \longrightarrow \text{Closed}$$
* **Audit Inspector:** Detailed slide-over drawer showing cycle dates, contract duration, customer contact, and line items.

### 3. Automated Billing Day Runner (`/api/billing/run`)
* **Automated Cycle Evaluation:** Evaluates all active subscriptions due on or before target date.
* **Automated Taxes & Discounts:** Computes percentage/fixed taxes (e.g., GST 18%, Digital Services 5%) and discounts (volume thresholds, product promos) directly onto invoice draft lines.
* **Idempotency Guarantee:** Skips already-billed subscriptions with zero side-effects.

### 4. Invoicing Ledger & Payment Reconciliation (`/staff/invoices`)
* **Status Tracking:** Tracks invoices through `Draft`, `Confirmed`, `Partially Paid`, `Paid`, `Overdue`, and `Cancelled`.
* **Instant Payment Modal:** Record payments via Bank Transfer, Credit Card, UPI, or Cash with automatic balance recalculation.
* **Printable Invoice PDF:** Built-in letterhead invoice preview ready for printing or saving as PDF with zero third-party dependencies.

### 5. Executive Telemetry Dashboard (`/admin/dashboard`)
* **Real-time KPI Cards:** MRR, ARR, Total Settled Cash, and Outstanding Accounts Receivable.
* **Overdue Aging Analysis:** Visual delinquency buckets ($1\text{--}30$ days, $31\text{--}60$ days, $60+$ days critical).
* **30/60/90-Day Predictive Cashflow Forecaster:** Analyzes recurring commitment frequencies to project quarterly runway.

### 6. Customer Self-Service Portal (`/portal`)
* **Multi-Tenant Isolation:** Authenticated customer accounts view strictly their own subscriptions and invoices.
* **Self-Service Controls:** Customers can pause or reactivate subscriptions and download official tax receipts.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `19.3` | Reactive, component-based user interface |
| **Build Tool** | **Vite** | `8.3` | Instant HMR and sub-second production builds |
| **Language (Web)** | **TypeScript** | `7.0` | Strict type-safety across models and contracts |
| **Routing** | **React Router** | `7.18` | Declarative client-side routing & route guards |
| **Styling** | **Tailwind CSS** | `3.4` | Upflow-inspired design system & utility classes |
| **Icons** | **Lucide React** | `1.65` | Consistent, accessible feather iconography |
| **Linter** | **Oxlint** | `1.89` | High-speed Rust-based linter (0 warnings, 0 errors) |
| **Backend Framework** | **FastAPI** | `0.115` | High-performance async REST API framework |
| **ASGI Server** | **Uvicorn** | `0.32` | Production-ready ASGI server |
| **ORM / Data Layer** | **SQLModel** | `0.0.22` | Unified SQLAlchemy + Pydantic v2 data models |
| **Authentication** | **PyJWT + Passlib** | `2.9` / `1.7` | Salted bcrypt password hashing & JWT token issuance |
| **Database** | **SQLite** | `3.x` | Embedded zero-configuration SQL database with WAL mode |

---

## 📂 Project & File Structure

```text
Brightloop-Subscription-Management/
├── backend/
│   ├── app/
│   │   ├── api/                   # REST API Routers
│   │   │   ├── auth.py            # Registration, login, password reset endpoints
│   │   │   ├── billing.py         # POST /api/billing/run, tax & discount management
│   │   │   ├── dashboard.py       # Aggregated executive telemetry (< 2s SLA)
│   │   │   ├── invoices.py        # Invoices query, confirmation, cancel endpoints
│   │   │   ├── payments.py        # Payment recording & AR reconciliation
│   │   │   ├── plans.py           # Subscription plans & quotation templates
│   │   │   ├── products.py        # Product CRUD & variant price adjustments
│   │   │   └── subscriptions.py   # State machine, quotation drafting & conversions
│   │   ├── core/                  # Core infrastructure
│   │   │   ├── database.py        # SQLite engine, connection pragmas (WAL mode)
│   │   │   └── security.py        # Bcrypt password hashing, JWT encoder/decoder
│   │   ├── models/                # SQLModel database tables
│   │   │   ├── auth.py            # User and UserRole models
│   │   │   ├── billing.py         # Subscription, SubscriptionLine, Tax, Discount
│   │   │   ├── catalog.py         # Product, ProductVariant, Plan, QuoteTemplate
│   │   │   └── invoicing.py       # Invoice, InvoiceLine, Payment
│   │   ├── schemas/               # Pydantic validation request/response schemas
│   │   ├── services/              # Core business engines
│   │   │   ├── billing_runner.py  # Idempotent recurring billing engine
│   │   │   └── tax_discount_calc.py # Compound tax and discount calculators
│   │   └── main.py                # FastAPI app initialization, CORS, health check
│   ├── tests/                     # Automated test suites
│   ├── seed.py                    # Complete realistic database seeder
│   └── requirements.txt           # Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Navbar.tsx         # Floating midnight pill navigation & persona switcher
│   │   │   ├── Sidebar.tsx        # Vertical operations rail with live badge status
│   │   │   ├── TimeMachine.tsx    # Chrono-Simulator (+1, +7, +30 days widget)
│   │   │   └── InvoicePrintModal.tsx # Printable letterhead invoice layout
│   │   ├── pages/                 # Full-page views
│   │   │   ├── ExecutiveDashboard.tsx # Executive revenue telemetry & aging buckets
│   │   │   ├── CatalogPage.tsx    # Products, variants, and plans catalog view
│   │   │   ├── SubscriptionsPage.tsx # Quotations builder, contract state machine
│   │   │   ├── InvoicesPage.tsx   # AR ledger, payment recorder, printable PDF
│   │   │   ├── CustomerPortal.tsx # Isolated tenant self-service portal
│   │   │   └── LoginPage.tsx      # Authentication, password reset & persona switcher
│   │   ├── services/              # Client API communication
│   │   │   ├── api.ts             # Typed REST client with offline mock fallback
│   │   │   └── dashboardService.ts# Telemetry caching & real-time event subscriber
│   │   ├── types/                 # Unified TypeScript data interfaces
│   │   ├── App.tsx                # Application router, step stepper, health monitor
│   │   ├── index.css              # Tailwind CSS styles & typography directives
│   │   └── main.tsx               # Application mount entrypoint
│   ├── package.json               # Frontend dependencies & npm scripts
│   ├── tsconfig.json              # TypeScript compilation rules
│   └── vite.config.ts             # Vite bundler configuration
│
├── context/                       # Master guidelines and architectural contracts
└── README.md                      # Comprehensive project documentation
```

---

## 💻 Local Development & Uvicorn Setup

Follow these exact steps to run the complete stack locally:

### 1. Prerequisites
* **Python 3.11+** installed (`python --version`)
* **Node.js 18+** and **npm** installed (`node --version`)
* **Git** installed

---

### 2. Backend Setup & Database Seeding

Open a terminal in the root repository directory:

```bash
cd backend

# 1. Create and activate a Python virtual environment
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
# source venv/bin/activate

# 2. Install all required Python backend dependencies
pip install -r requirements.txt

# 3. Seed the SQLite database with realistic demo data
python seed.py

# 4. Start the FastAPI ASGI server with Uvicorn
uvicorn app.main:app --reload --port 8000
```

#### Expected Backend Output:
```text
============================================================
Brightloop Subscription Management - Database Seeder
============================================================
[1/6] Seeding Users...
  + Added 4 Users (Admin, Staff, 2 Customers)
[2/6] Seeding Products & Variants...
  + Added 3 Products with 3 attribute variants (Odoo ERP Sync +$560)
[3/6] Seeding Subscription Plans & Templates...
  + Added 3 Subscription Plans (Monthly, Yearly, Weekly) + Quotation Template
[4/6] Seeding Tax & Discount Rules...
  + Added 2 Tax Rules & 2 Discount Rules
[5/6] Seeding Subscriptions & Lifecycle States...
  + Added 4 Subscriptions (Active, Paused, Quotation)
[6/6] Seeding Invoices & Payments...
  + Added 4 Invoices & reconciled payments
============================================================
[SUCCESS] Database successfully seeded at: database.db
============================================================

INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

* **Interactive Swagger UI:** Visit [`http://localhost:8000/docs`](http://localhost:8000/docs)
* **API Health Check:** Visit [`http://localhost:8000/health`](http://localhost:8000/health)

---

### 3. Frontend Setup

Open a second terminal window:

```bash
cd frontend

# 1. Install frontend dependencies
npm install

# 2. Run Oxlint code quality verification (Enforces 0 warnings)
npm run lint

# 3. Start the Vite development server
npm run dev
```

* **Web Application:** Visit [`http://localhost:5173`](http://localhost:5173) in your browser.
* In the bottom-right corner of the UI, notice the live health widget showing **`FastAPI Live :8000 • SQLite`** with a pulsing green indicator.

---

## 👥 Pre-Seeded Demo Accounts & Credentials

The system includes pre-configured personas to quickly evaluate Role-Based Access Control (RBAC):

> **Universal Password for All Accounts:** `Brightloop@2026!`

| Persona | Email | Role Claim | Accessible Features & Boundary |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@brightloop.io` | `admin` | Full system access: Catalog creation, Executive Telemetry, Subscriptions, Invoices, Billing Runner |
| **Operations Staff**| `operations@brightloop.io` | `staff` | Quotation drafting, Contract lifecycle state machine, Invoicing ledger, Payment recording |
| **Customer Tenant** | `finance@acmeglobal.com`| `customer` | Isolated Tenant Portal (`/portal`): views only Acme Global Logistics contracts & printable invoices |
| **Secondary Customer**| `billing@apexrobotics.com`| `customer` | Alternate isolated tenant for verifying cross-customer data isolation |

*(You can switch personas with a single click using the **Persona Capsule Dropdown** in the navbar or via the Quick Switcher on `/login`).*

---

## 🌿 Git Branching Strategy & Contribution Rules

To enable high-velocity team collaboration without merge conflicts, the repository enforces a structured git workflow:

```text
main (Stable Production Release)
  ▲
  │ (Pull Request after verification)
  │
dev (Shared Integration Branch)
  ▲
  ├── feature/backend-core-alan        (FastAPI foundation & Catalog)
  ├── feature/billing-engine-abijith   (State machine & Idempotent billing runner)
  ├── feature/frontend-core-thomas     (Operations UI, Navigation & API integration)
  └── feature/dashboard-simulator-jeremy (Telemetry, Chrono-Simulator, Customer Portal)
```

### Contribution Rules
1. **Never push directly to `main`:** All code integrates into `dev` and is promoted to `main` only after full end-to-end verification.
2. **Strict File Boundaries:** Team members maintain isolated modules to prevent conflicting concurrent file edits.
3. **Quality Gatekeeper Standard:**
   - Every commit must pass `npm run lint` with **0 warnings and 0 errors**.
   - Every commit must pass `npm run build` (`tsc -b && vite build`) cleanly.
4. **Conventional Commit Standard:** Format commit messages with clear semantic scopes:
   - `feat(catalog): add odoo erp variant price adjustment`
   - `feat(billing): add idempotent cycle key to billing runner`
   - `fix(frontend): resolve react effect dependency warning`

---

## 🎬 2-Minute Judge Screening Walkthrough Script

Follow this 5-step presentation script to demonstrate the platform to judges during screening:

```
[1. Executive Telemetry] ➔ [2. Odoo Variant Pricing] ➔ [3. Quote State Machine] ➔ [4. Chrono-Simulator Run] ➔ [5. Tenant Portal]
```

### Step 1: Executive Finance Telemetry (`/admin/dashboard`)
* Log in as **Administrator** (`admin@brightloop.io`).
* Highlight the top KPI rollup cards: MRR, ARR, and Cash Collected. Point out the **$< 2.0\text{s}$ SLA badge**.
* Show the **Overdue Accounts Aging** chart: delinquent receivables automatically segmented into $1\text{--}30$d, $31\text{--}60$d, and $60+$ days critical buckets.
* Highlight the **30/60/90-Day Cashflow Forecaster** projecting committed subscription renewals.

### Step 2: Catalog & Dynamic Variant Pricing (`/admin/products`)
* Navigate to **Products & Plans Catalog**.
* Click *Edit* on **Brightloop Enterprise Cloud Suite**.
* Demonstrate the dynamic variant row: **Edition: Odoo ERP Sync** adding $+\$560.00$ on top of the base sales price. Show how gross margin automatically updates.

### Step 3: Quotation Builder & State Machine (`/staff/subscriptions`)
* Navigate to **Subscriptions**.
* Click **Draft New Quotation** $\rightarrow$ select Acme Global Logistics, select Odoo ERP variant, set start date, and submit.
* In the table, observe the new contract created in **`Quotation`** status.
* Click **Confirm** $\rightarrow$ the contract immediately transitions to **`Active`** status via the backend state machine.

### Step 4: The Chrono-Simulator ("Billing Time Machine")
* In the top hero banner or dashboard, locate the **Chrono-Simulator widget**.
* Click **Advance +1 Day** (or **+30 Days**).
* Watch the automated billing engine (`POST /api/billing/run`) evaluate active contracts and generate new draft invoices live in SQLite.
* Click **Advance +1 Day** a second time for the same date $\rightarrow$ show that the `Skipped (idempotent)` counter increments, proving **zero duplicate charges**.

### Step 5: Multi-Tenant Customer Portal (`/portal`)
* Using the top navbar persona capsule, switch to **Customer Tenant (`finance@acmeglobal.com`)**.
* Navigate to **My Portal** (`/portal`).
* Point out strict tenant isolation: only Acme Global's contracts and invoices are visible.
* Click **Print / Download PDF** on any invoice to display the clean, printable letterhead invoice preview.

---

## 📄 Team Credits & Copyright

Built with engineering pride for **Make-a-ton 2.0 (Odoo × CUSAT)** by:

* **Alan John Thomas** — Backend Architecture, Auth & Catalog Core Lead
* **Abijith P** — Financial State Machine, Billing Runner & Reconciliation Lead
* **Jeremy Chehrehmi** — Executive Telemetry, Chrono-Simulator & Customer Portal Lead
* **Thomas Raju** — Frontend Operations, UI Design System & Integration Lead

*Copyright © 2026 Brightloop Subscription Management. All rights reserved.*
