# Brightloop Subscription Management

Deterministic Recurring Billing, State-Machine Contract Lifecycle, and Financial Telemetry Engine.  
Built for the Odoo × CUSAT Make-a-ton 2.0 Hackathon.

[![Backend](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?style=flat)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208.3-61DAFB?style=flat)](https://react.dev/)
[![Language](https://img.shields.io/badge/Language-TypeScript%20%2B%20Python%203.13-3178C6?style=flat)](https://www.typescriptlang.org/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC?style=flat)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-003B57?style=flat)](https://www.sqlite.org/)
[![Tests](https://img.shields.io/badge/Tests-Pytest%20Passing-00C853?style=flat)](https://docs.pytest.org/)

---

## Executive Summary

Brightloop replaces disconnected spreadsheets, manual bank slip reconciliation, and fragile billing scripts with a single source of truth for subscription operations. 

Subscription companies lose between 5% and 15% of annual recurring revenue through untracked mid-cycle pauses, missed renewals, manual invoice drafting, and silent double-billing errors. Brightloop automates the entire contract lifecycle—from multi-variant quotation drafting to idempotent billing execution, automated tax and discount calculation, and accounts receivable reconciliation—with zero external daemon dependencies.

---

## The 2-Minute Judging Pitch & Live Demo Script

Judges evaluate multiple projects in rapid succession. This script delivers a working, verified end-to-end flow without slides.

### Minute 0:00 - 0:30 | The Ground Truth & Executive Overview
- **Opening Statement:**  
  *"Subscription companies constantly leak revenue through manual spreadsheets, forgotten renewals, and double-billing errors. Brightloop is an automated, idempotent subscription lifecycle engine that guarantees exact billing day execution with zero human touch."*
- **Action:** Open the **Executive Dashboard** (`/`).
- **Showcase:**  
  - Real-time aggregation of Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), Total Cash Collected, and Outstanding Receivables.
  - Aging receivables buckets (1–30 days, 31–60 days, 60+ critical days) computed directly from SQLite tables with sub-second response times.

### Minute 0:30 - 1:15 | The Hero Workflow (Quotation to Cash)
1. **Catalog & Dynamic Variant Pricing (`/catalog`):**
   - Demonstrate a software product (base price \$1,200.00) configured with dynamic attribute variants (e.g. `Edition: Odoo Sync` adding +\$560.00). The engine calculates the line price dynamically:  
     $$\text{Unit Price} = P_{\text{base}} + \Delta P_{\text{variant}} = \$1{,}200.00 + \$560.00 = \$1{,}760.00$$
2. **Quotation Generation & Activation (`/subscriptions`):**
   - Draft a multi-line offer for a corporate client.
   - Confirm the quotation into an active contract. Show the state machine transition:  
     $$\text{Quotation} \longrightarrow \text{Active}$$
3. **The Chrono-Simulator ("Billing Time Machine"):**
   - Advance the system simulation clock by +30 days.
   - The backend billing runner evaluates active subscriptions, detects due billing dates, and generates confirmed draft invoices with applied tax and discount rules.
   - Re-triggering the billing run demonstrates strict **idempotency**: duplicate runs skip already-billed cycles with zero duplicate charges.
4. **Payment Registration & Ledger Reconciliation (`/invoices`):**
   - Record an electronic payment against an open invoice.
   - Watch the invoice status flip to `Paid` in real-time, instantly reducing Outstanding Receivables and increasing Cash Collected on the Executive Dashboard.

### Minute 1:15 - 1:45 | Technical Architecture & Defensibility
- **Composite Key Idempotency:** Billing runs enforce unique constraint keys `${subscription_id}_${period_start}`. Network timeouts or parallel runs never double-bill.
- **Contract State Engine:** Subscriptions adhere to a strict state machine (`Draft -> Quotation -> Confirmed -> Active <-> Paused -> Closed`). Resuming paused accounts advances the billing anchor forward to avoid retroactively charging for paused periods.
- **Strict Role Boundaries:** Multi-tenant customer portal (`/portal`) enforces database-level tenant isolation. Customers view and download only their own contracts and letterhead invoices.
- **Zero-Daemon Architecture:** Fully functional with local Python and SQLite WAL mode. No Redis, Celery, PostgreSQL, or enterprise ERP daemons required.

### Minute 1:45 - 2:00 | Conclusion
- **Closing Statement:**  
  *"Brightloop delivers enterprise-grade billing logic in a lightweight, self-contained architecture. It is resilient, audit-proof, and production-ready."*

---

## Technical Highlights & Mathematical Models

### 1. Subscription Lifecycle State Machine

The contract engine enforces valid transitions at the database model and API levels:

```text
               +-------------------------------------------+
               |                                           |
               v                                           |
[ Draft ] ---> [ Quotation ] ---> [ Confirmed ] ---> [ Active ] <---> [ Paused ]
     |              |                  |                |                  |
     +--------------+------------------+----------------+------------------+
                                       |
                                       v
                                   [ Closed ]  (Terminal)
```

- **Quotation Direct Close:** Sales reps can close rejected or lost quotations directly without requiring artificial confirmation.
- **Safe Pause & Resume:** When unpausing a subscription (`Paused -> Active`), the backend automatically updates `next_billing_date` to the current date if the pause period lapsed, preventing retroactive billing for paused months.
- **Safe Contract Termination:** Closing an active or paused contract voids open, unconfirmed draft invoices and releases reserved promotional coupon usage.

### 2. Tax & Discount Engine

The billing runner calculates line-item and header adjustments with cent-level decimal precision:

- **Price-Exclusive Tax:**
  $$\text{Tax Amount} = (\text{Line Subtotal} - \text{Discount}) \times \frac{\text{Rate}}{100}$$
  $$\text{Line Total} = (\text{Line Subtotal} - \text{Discount}) + \text{Tax Amount}$$

- **Price-Included Tax:**
  $$\text{Tax Amount} = (\text{Line Subtotal} - \text{Discount}) \times \frac{\text{Rate}}{100 + \text{Rate}}$$
  $$\text{Line Total} = \text{Line Subtotal} - \text{Discount}$$

- **Discount Coupon Reservation:**
  - Product-scope discounts apply directly to designated line items.
  - Subscription-scope discounts apply to the net subtotal before tax.
  - Coupon usage (`rule.uses`) increments upon draft invoice generation and decrements immediately if the invoice is cancelled, preventing quota lockouts.

### 3. Chrono-Simulator ("Billing Time Machine")

To enable live evaluations without waiting weeks for calendar triggers, Brightloop includes a persistent simulation clock:
- System time can be advanced via API (`POST /api/simulation/time-travel`) or UI controls (`+1 Day`, `+7 Days`, `+30 Days`).
- The clock state persists in SQLite table `system_clock` across server restarts.
- Auto-aging reconciles invoices against the simulated date: past-due invoices automatically transition to `Overdue` status.

---

## System Architecture

```text
Brightloop-Subscription-Management/
├── backend/
│   ├── app/
│   │   ├── api/                    # REST API Route Controllers
│   │   │   ├── auth.py             # User registration, login, JWT issuance
│   │   │   ├── billing.py          # Manual billing runner triggers, taxes, discounts
│   │   │   ├── dashboard.py        # Executive revenue metrics (< 2s SLA), clock
│   │   │   ├── invoices.py         # Invoice serialization, confirmation, cancellation
│   │   │   ├── payments.py         # Payment recording & AR reconciliation
│   │   │   ├── plans.py            # Plan frequencies, minimum order quantities
│   │   │   ├── products.py         # Product CRUD & variant pricing modifiers
│   │   │   └── subscriptions.py    # State engine, quotations, contract lifecycle
│   │   ├── core/
│   │   │   ├── database.py         # SQLite connection with WAL mode & foreign keys
│   │   │   └── security.py         # Bcrypt password hashing & JWT token validation
│   │   ├── models/                 # SQLModel database tables
│   │   ├── schemas/                # Pydantic v2 validation contracts
│   │   ├── services/
│   │   │   ├── billing_runner.py   # Idempotent recurring invoice generator
│   │   │   └── tax_discount_calc.py# Cent-level decimal tax and discount math
│   │   └── main.py                 # FastAPI application mount, CORS middleware
│   ├── tests/                      # Pytest automated test suite
│   ├── seed.py                     # Realistic database seeder
│   └── requirements.txt            # Locked Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI primitives
│   │   │   ├── Navbar.tsx          # Navigation header & persona selector
│   │   │   ├── Sidebar.tsx         # Operational navigation rail
│   │   │   ├── TimeMachine.tsx     # Chrono-Simulator controls (+1 / +7 / +30 days)
│   │   │   └── InvoicePrintModal.tsx # Letterhead invoice printable modal
│   │   ├── pages/                  # Page-level route views
│   │   │   ├── ExecutiveDashboard.tsx # Revenue telemetry, MRR/ARR, overdue aging
│   │   │   ├── CatalogPage.tsx     # Products, variants, plans, and templates
│   │   │   ├── SubscriptionsPage.tsx # Multi-line quote builder & contract inspector
│   │   │   ├── InvoicesPage.tsx    # AR ledger, payment recording, PDF view
│   │   │   ├── CustomerPortal.tsx  # Isolated customer tenant portal
│   │   │   └── LoginPage.tsx       # Authentication & role switcher
│   │   ├── services/
│   │   │   └── api.ts              # Typed API client with offline resilience
│   │   ├── types/                  # TypeScript data interfaces
│   │   ├── App.tsx                 # Route declarations & shell layout
│   │   └── main.tsx                # Application bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── context/                        # Technical specifications & team guidelines
└── README.md
```

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm 9+

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows PowerShell:
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS:
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database with realistic demo accounts, products, and contracts
python seed.py

# Start the FastAPI backend server
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### 2. Frontend Setup
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Application Web Interface: `http://localhost:5173`

### 3. Running Automated Tests
```bash
# From the repository root with backend venv activated:
$env:PYTHONPATH="backend"; backend\venv\Scripts\pytest backend\tests -v

# Linux / macOS:
# PYTHONPATH=backend pytest backend/tests -v
```

---

## Pre-Seeded Test Credentials

The database seeder (`backend/seed.py`) provisions four pre-configured accounts representing distinct user personas:

| Persona | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Administrator** | `admin@brightloop.io` | `Brightloop@2026!` | Full system access: configure products, plans, tax/discount rules, run billing, inspect all contracts. |
| **Operations Staff** | `operations@brightloop.io` | `Brightloop@2026!` | Operational access: create quotation templates, draft quotes, confirm contracts, record customer payments. |
| **Customer (Acme Global)** | `finance@acmeglobal.com` | `Brightloop@2026!` | Self-service portal (`/portal`): view active contracts, pause subscriptions, review invoices, print PDFs. |
| **Customer (Apex Robotics)** | `billing@apexrobotics.com` | `Brightloop@2026!` | Secondary tenant account for validating strict tenant isolation and row-level data access rules. |

---

## REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new account with password regex validation ($\ge 8$ chars, upper, lower, special). |
| `POST` | `/api/auth/login` | Authenticate user credentials and return signed JWT token with role claims. |
| `POST` | `/api/auth/reset-password` | Request password reset token preview for registered email. |
| `GET` | `/api/auth/me` | Retrieve profile of the currently authenticated user. |

### Catalog: Products & Variants (`/api/products`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all products with their associated dynamic attribute variants. |
| `POST` | `/api/products` | Create a new product with base sales and cost prices. |
| `GET` | `/api/products/{id}` | Retrieve product details by ID. |
| `PATCH` | `/api/products/{id}` | Update product pricing or metadata. |
| `DELETE` | `/api/products/{id}` | Soft-deactivate a product. |
| `POST` | `/api/products/{id}/variants` | Add a dynamic pricing variant (e.g. `price_extra: +560.0`). |
| `DELETE` | `/api/products/{id}/variants/{v_id}` | Remove a variant (blocked with 409 if active contracts reference it). |

### Plans & Quotation Templates (`/api/plans`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/plans` | List active plans filtered by frequency (`daily`, `weekly`, `monthly`, `yearly`). |
| `POST` | `/api/plans` | Create a billing plan with minimum order quantity and auto-close flags. |
| `GET` | `/api/plans/{id}` | Retrieve plan by ID. |
| `DELETE` | `/api/plans/{id}` | Soft-deactivate a plan. |
| `GET` | `/api/plans/templates/all` | List all reusable sales quotation templates. |
| `POST` | `/api/plans/templates` | Create a quotation template with preset validity duration. |

### Subscriptions & Quotations (`/api/subscriptions`, `/api/quotations`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/subscriptions` | List subscriptions filtered by status or customer ID. |
| `GET` | `/api/subscriptions/{id}` | Retrieve full contract details with line items. |
| `PATCH` | `/api/subscriptions/{id}/status` | Execute state machine transition (`Active`, `Paused`, `Closed`). |
| `DELETE` | `/api/subscriptions/{id}` | Delete unbilled contracts (blocked with 409 if invoices exist). |
| `POST` | `/api/quotations` | Draft a new quotation with multi-line items. |
| `POST` | `/api/quotations/{id}/confirm` | Confirm quotation into an active subscription. |

### Invoices & Payments (`/api/invoices`, `/api/payments`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/invoices` | List invoices with auto-aging calculation against simulated date. |
| `GET` | `/api/invoices/{id}` | Retrieve single invoice with line-item tax and discount breakdown. |
| `POST` | `/api/invoices/{id}/confirm` | Confirm draft invoice (auto-marks \$0 total invoices as `Paid`). |
| `POST` | `/api/invoices/{id}/cancel` | Cancel draft, confirmed, or unpaid overdue invoice; releases coupon reservations. |
| `POST` | `/api/payments` | Record payment against invoice; prevents overpayment beyond remaining balance. |

### Billing Engine & Simulation (`/api/billing`, `/api/dashboard`, `/api/simulation`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/billing/run` | Execute idempotent recurring billing run for specified date. |
| `GET` | `/api/dashboard/summary` | Retrieve executive financial metrics (MRR, ARR, cash collected, aging). |
| `POST` | `/api/simulation/time-travel` | Advance simulated system clock and trigger automatic billing cycle evaluation. |

---

## Anticipated Judge Questions & Technical Defenses

### Q1: How do you handle month-end billing when months have 28, 30, or 31 days?
**Defense:** Billing cycles preserve the original anchor day (`subscription.start_date.day`). If a subscription starts on January 31, the February billing date clamps to February 28 (`min(31, 28)`), but the subsequent March billing date returns to March 31 rather than permanently drifting backwards.

### Q2: What happens if the billing runner crashes halfway through a run?
**Defense:** Billing executions are transactional and idempotent. Every invoice carries a composite key `${subscription_id}_${period_start}`. Re-triggering the billing runner evaluates only unbilled cycles and skips already-created invoices, preventing duplicate charges or orphan line items.

### Q3: How do you prevent customers from accessing other accounts' contracts?
**Defense:** All routes are protected by server-side role middleware. The `/portal` endpoints force parameterized scoping where queries are strictly bounded by `customer_id == current_user.id`. Customers cannot inspect global tables or modify administrative parameters.

### Q4: Why not simply use Stripe Billing or an off-the-shelf CRM?
**Defense:** Stripe Billing handles payment gateway transactions, but does not manage internal enterprise operations such as cost-of-goods tracking (`cost_price`), gross margin calculation, custom staff quotation templates, or price-included municipal tax rules. Brightloop acts as the core subscription ERP, which can plug into any payment gateway.

---

## Team Work Split & Track Ownership

Development was executed across parallel tracks with verified boundaries:

- **Track 1: Authentication, RBAC & Catalog Engine**  
  *Owner:* Alan  
  FastAPI core setup, SQLite WAL engine, JWT authentication, password complexity rules, products CRUD with dynamic variant pricing, plans CRUD, database seeder.
- **Track 2: Subscriptions State Engine & Billing Runner**  
  *Owner:* Abijith  
  Contract state machine (`Draft -> Quotation -> Confirmed -> Active <-> Paused -> Closed`), automated billing runner (`/api/billing/run`), decimal tax and discount engines, payment ledger reconciliation.
- **Track 3: Operations Shell & Upflow Interface System**  
  *Owner:* Thomas  
  Application layout, navigation shell, Catalog views with margin calculations, multi-line Quotation Builder, Invoices ledger, payment registration modals.
- **Track 4: Telemetry Analytics, Time Machine & Customer Portal**  
  *Owner:* Jeremy  
  Executive Finance Dashboard (< 2s SLA), Overdue Aging charts, persistent Chrono-Simulator ("Billing Time Machine"), multi-tenant Customer Portal (`/portal`), printable letterhead invoice layout.
