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

## Overview

Brightloop is an automated subscription management and recurring billing platform designed for recurring B2B/B2C service contracts. It centralizes quotation drafting, contract state transitions, automated invoice generation, multi-tier tax and discount calculations, and accounts receivable tracking into a unified, zero-daemon architecture.

---

## Core System Capabilities

### 1. Deterministic Idempotent Billing Engine
- Evaluates active subscriptions against billing schedule triggers (`daily`, `weekly`, `monthly`, `yearly`).
- Enforces strict idempotency keys formatted as `${subscription_id}_${period_start}`.
- Re-running the billing process on the same date safely skips already-generated invoices with zero duplicate charges or orphan line items.

### 2. State-Machine Contract Lifecycle
- Enforces valid contract states at the API and database levels:
  `Draft -> Quotation -> Confirmed -> Active <-> Paused -> Closed`.
- **Direct Quotation Termination:** Permits closing rejected or lost quotations directly without requiring active conversion.
- **Safe Resumption Date Handling:** When unpausing a subscription (`Paused -> Active`), the engine advances `next_billing_date` to the current date if the pause period lapsed, preventing retroactive billing for paused periods.
- **Contract Voiding & Cleanup:** Terminating a contract automatically cancels unconfirmed draft invoices and releases reserved promotional coupon usage.

### 3. Dynamic Variant Pricing & Margin Tracking
- Products support dynamic attribute modifiers (e.g., base product at \$1,200.00 with variant `Edition: Odoo Sync` adding +\$560.00).
- Calculates unit sales pricing and gross margin on the fly:
  $$\text{Unit Price} = P_{\text{base}} + \sum \Delta P_{\text{variant}}$$

### 4. Precision Tax & Discount Engines
- **Price-Exclusive Taxes:** Automatically calculated per line item and added to invoice subtotal.
  $$\text{Tax Amount} = (\text{Subtotal} - \text{Discount}) \times \frac{\text{Rate}}{100}$$
- **Price-Included Taxes:** Extracted from gross line total without double-counting tax on the invoice ledger.
  $$\text{Tax Amount} = (\text{Subtotal} - \text{Discount}) \times \frac{\text{Rate}}{100 + \text{Rate}}$$
- **Discount Allocation:** Supports line-item product discounts and whole-subscription header promotions with threshold constraints (`min_purchase_amount`, `min_quantity`) and usage counters.
- **Usage Reservation:** Coupon usage increments on draft generation and decrements immediately if the draft is cancelled, preventing quota lockouts.

### 5. Financial Telemetry & Overdue Aging
- Computes real-time Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), Total Cash Collected, and Outstanding Accounts Receivable directly from SQLite tables with sub-second response times.
- Automated aging categorization tracks delinquent invoices across standard operational buckets: 1–30 days, 31–60 days, and 60+ critical days overdue.

### 6. Isolated Customer Self-Service Portal (`/portal`)
- Authenticated client interface enforcing strict tenant isolation.
- Customers view only their active subscriptions, view billing history, toggle contract pauses, and download printable letterhead PDF invoices.

### 7. Chrono-Simulator ("Billing Time Machine")
- Persistent simulated system clock stored in the database.
- Allows teams to advance simulated dates (`+1 Day`, `+7 Days`, `+30 Days`) to test recurring invoice generation, contract expiration, and overdue aging triggers deterministically.

---

## Architectural Models & Specifications

### Subscription Lifecycle State Machine

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

### Engineering Invariants & Design Decisions

- **Anchor-Day Preservation:** Monthly billing preserves the initial contract start day (`subscription.start_date.day`). A contract starting on January 31 clamps to February 28, then returns to March 31 rather than permanently drifting backward.
- **Zero-Dollar Invoice Handling:** Invoices discounted to \$0.00 (e.g., 100% promotional credits) automatically transition to `Paid` upon confirmation, preventing them from becoming unpayable and overdue.
- **Payment Overfill Prevention:** Payment recording validates `amount <= remaining_balance`, preventing accidental overpayments and negative accounts receivable.
- **Database-Level Tenant Isolation:** Customer queries are strictly parameterized by `customer_id == current_user.id`. Customers cannot inspect global tables or modify administrative parameters.
- **Zero-Daemon Deployment:** The platform requires no external daemon processes (no Redis, Celery, or external database servers). Everything runs on standard Python and SQLite with Write-Ahead Logging (WAL) and foreign keys enabled.

---

## System Structure

```text
Brightloop-Subscription-Management/
├── backend/
│   ├── app/
│   │   ├── api/                    # REST API Controllers
│   │   │   ├── auth.py             # User registration, login, JWT issuance
│   │   │   ├── billing.py          # Manual billing runner triggers, taxes, discounts
│   │   │   ├── dashboard.py        # Executive revenue metrics, simulation clock
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
│   ├── seed.py                     # Database seeder
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI primitives
│   │   │   ├── Navbar.tsx          # Navigation header & persona selector
│   │   │   ├── Sidebar.tsx         # Operational navigation rail
│   │   │   ├── TimeMachine.tsx     # Chrono-Simulator controls
│   │   │   └── InvoicePrintModal.tsx # Printable letterhead invoice layout
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
# From repository root with backend virtual environment activated:
$env:PYTHONPATH="backend"; backend\venv\Scripts\pytest backend\tests -v

# Linux / macOS:
# PYTHONPATH=backend pytest backend/tests -v
```

---

## Pre-Seeded Test Credentials

The database seeder (`backend/seed.py`) provisions accounts for distinct user personas:

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

## Team & Track Ownership

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
