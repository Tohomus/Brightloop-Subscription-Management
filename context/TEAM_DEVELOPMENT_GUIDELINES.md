# Brightloop Subscription Management — Master Engineering Guidelines
> **Single Source of Truth for Team Members and AI Coding Agents**  
> **Event:** Odoo × CUSAT Make-a-ton Screening (10:00 AM – 5:00 PM)

---

## 1. Locked System Architecture

```text
Brightloop-Subscription-Management/
├── backend/                       # Python FastAPI + SQLite
│   ├── app/
│   │   ├── api/                  # Endpoints (auth, products, subscriptions, billing, invoices, payments, dashboard, time_machine)
│   │   ├── core/                 # Config, security (JWT/password hashing), database engine
│   │   ├── models/               # SQLModel / SQLAlchemy database tables
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/             # Core business engines (billing_runner, tax_engine, discount_engine)
│   │   └── main.py               # FastAPI entrypoint (CORS, router registration)
│   ├── requirements.txt
│   └── database.db               # SQLite database file (git-ignored)
├── frontend/                      # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Reusable UI primitives (KPI Cards, Tables, Status Chips, Time Machine)
│   │   ├── pages/                # AdminDashboard, StaffPortal, CustomerPortal, Login, Quotations, Invoices
│   │   ├── services/             # API client services
│   │   ├── types/                # Shared TypeScript models
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── context/                       # Authoritative documentation synced via Git (DO NOT GIT-IGNORE)
│   ├── Subscription_Management_System.pdf
│   ├── 01_problem_statement_breakdown.md
│   ├── 02_architectural_options_and_edge.md
│   ├── 03_frontend_design_system_and_stitch.md
│   ├── 04_skills_directory_guide.md
│   └── TEAM_DEVELOPMENT_GUIDELINES.md
├── skills/                        # Team skills synced via Git
└── .agents/skills/                # Antigravity native skill discovery
```

---

## 2. Environment Setup & Run Commands

### Backend Setup (FastAPI + SQLite)
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install fastapi uvicorn sqlmodel pydantic python-multipart passlib[bcrypt] pyjwt
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: `http://localhost:8000/docs`
- Database: Automatic SQLite initialization at `backend/database.db`.

### Frontend Setup (React 19 + Vite)
```bash
cd frontend
npm install
npm install react-router-dom lucide-react
npm run dev
```
- Web Application: `http://localhost:5173`
- Pre-configured with Tailwind CSS, Oxlint, and TypeScript.

---

## 3. Team Feature Division (Parallel Development Tracks)

To prevent merge conflicts during the 7-hour hackathon, divide work across feature branches targeting `dev`:

| Track | Branch Name | Responsibilities | Key API Endpoints & Views |
|---|---|---|---|
| **Track 1: Auth, RBAC & Catalog** | `feature/auth-catalog` | • User registration with strict password regex ($>8$ chars, upper, lower, special).<br>• User login & role identification (`admin`, `staff`, `customer`).<br>• Products CRUD with attribute variant pricing (e.g. Odoo brand adds $+\$560$).<br>• Plans configuration (frequencies, min qty, auto-close). | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`GET/POST /api/products`<br>`GET/POST /api/plans` |
| **Track 2: Quotations & Subscriptions** | `feature/subscriptions` | • Quotation templates with preset lines and validity duration.<br>• Quotation creation and confirmation into Subscriptions.<br>• Full subscription lifecycle state machine: `Draft` $\rightarrow$ `Quotation` $\rightarrow$ `Confirmed` $\rightarrow$ `Active` $\leftrightarrow$ `Paused` $\rightarrow$ `Closed`.<br>• Unique subscription numbering (`SUB-2026-XXXX`). | `GET/POST /api/quotation-templates`<br>`GET/POST /api/subscriptions`<br>`POST /api/subscriptions/{id}/status` |
| **Track 3: Billing Engine, Taxes & Discounts** | `feature/billing-engine` | • Automated Billing Day runner (`POST /api/billing/run`).<br>• **Idempotency Engine:** Cycle key `${sub_id}_${date}` prevents duplicate billing.<br>• Tax engine applying admin rules automatically.<br>• Discount engine (fixed/percent, thresholds, start/end dates, max uses decrement). | `POST /api/billing/run`<br>`GET/POST /api/invoices`<br>`GET/POST /api/discounts`<br>`GET/POST /api/taxes` |
| **Track 4: Payments, Dashboard & Time Machine** | `feature/dashboard-payments` | • Payment recording against invoices (method, amount, date, notes).<br>• Automatic invoice status reconciliation (`Paid`, `Partially Paid`, `Overdue`).<br>• Executive Finance Dashboard: Active Subs, MRR, ARR, Total Revenue, Overdue AR ($< 2$s SLA).<br>• **Billing Time Machine Simulator:** Header control (`+1 Day`, `+7 Days`, `+30 Days`) triggering live billing cycles. | `POST /api/payments`<br>`GET /api/dashboard/summary`<br>`POST /api/simulation/time-travel` |

---

## 4. API Endpoints Specification

### Authentication
- `POST /api/auth/register`
  - Body: `{ email, password, role }`
  - Validation: Password length $> 8$, contains uppercase, lowercase, special character.
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ access_token, token_type: "bearer", role, customer_id }`
- `POST /api/auth/reset-password`
  - Body: `{ email }`
  - Response: `{ message: "Password reset link sent to registered email" }`

### Products & Plans
- `GET /api/products` / `POST /api/products`
  - Body: `{ name, type, sales_price, cost_price, notes, variants: [{ attribute_name, attribute_value, price_extra }] }`
- `GET /api/plans` / `POST /api/plans`
  - Body: `{ name, frequency: "daily"|"weekly"|"monthly"|"yearly", min_quantity, start_date, end_date, auto_close_on_end, allow_pause }`

### Subscriptions & Quotations
- `POST /api/quotations`
  - Body: `{ customer_id, plan_id, lines: [{ product_id, variant_id, quantity, unit_price }] }`
- `POST /api/quotations/{id}/confirm`
  - Converts quotation into an `Active` Subscription.
- `GET /api/subscriptions`
  - Query params: `status`, `customer_id`.
  - Customers MUST only see their own subscriptions (`customer_id == session.customer_id`).
- `PATCH /api/subscriptions/{id}/status`
  - Body: `{ status: "Active"|"Paused"|"Closed" }`

### Billing Engine & Invoices
- `POST /api/billing/run`
  - Query/Body: `{ simulated_date: "YYYY-MM-DD" }`
  - Logic: Finds subscriptions where `status == 'Active'` and `next_billing_date <= simulated_date`.
  - Invariant: Creates `Draft` invoice with idempotency key `${subscription_id}_${period_start}`. Re-runs on the same date return `{ evaluated: N, generated: 0, skipped: N }`.
- `GET /api/invoices`
  - Filter by `customer_id`, `status`.
- `POST /api/invoices/{id}/confirm` / `POST /api/invoices/{id}/cancel`

### Payments
- `POST /api/payments`
  - Body: `{ invoice_id, amount, payment_method: "bank_transfer"|"credit_card"|"upi"|"cash", payment_date, notes }`
  - Logic: Reconciles total payments against invoice total. If total paid $\ge$ invoice total $\rightarrow$ mark `Paid`.

### Executive Dashboard
- `GET /api/dashboard/summary`
  - Response:
    ```json
    {
      "active_subscriptions_count": 1420,
      "mrr": 48250.00,
      "arr": 579000.00,
      "total_revenue_collected": 128450.00,
      "outstanding_receivables": 14200.00,
      "overdue_invoices_count": 8,
      "overdue_aging": {
        "1_to_30_days": 8200.00,
        "31_to_60_days": 4000.00,
        "60_plus_days": 2000.00
      }
    }
    ```

### Simulation / Hackathon Edge (Chrono-Simulator)
- `POST /api/simulation/time-travel`
  - Body: `{ advance_days: 1|7|30 }`
  - Logic: Advances system simulated clock, triggers the billing engine, updates invoice overdue statuses, and returns the new state.

---

## 5. Antigravity & AI Agent Prompting Playbook

When teammates start building, instruct your AI coding agent with these exact directives:

1. **For Billing Engine & Financial Calculations:**
   > *"Read `context/TEAM_DEVELOPMENT_GUIDELINES.md`. Activate skill `test-driven-development` and `subscription-billing-engine`. Write failing tests first for the billing run idempotency and tax calculations, then write the minimal FastAPI service to pass."*
2. **For Building UI Components & Pages:**
   > *"Read `context/03_frontend_design_system_and_stitch.md`. Activate skill `interface-design` and `better-ui`. Build the Subscriptions table using high-density Slate-950 surfaces, 1px subtle borders, and tabular figures for amounts. No generic AI cards or purple gradients."*
3. **To Prevent Over-Engineering:**
   > *"Activate skill `ponytail`. Keep the implementation lean and direct. Do not add external libraries or unrequested abstractions. Write the smallest diff that solves the task."*
4. **Before Merging or Submitting:**
   > *"Activate skill `verification-before-completion`. Run tests, verify linting, and inspect the rendered view before claiming done."*

---

## 6. Git Branching Rules

1. **`main`:** Production-stable branch. Do not push directly.
2. **`dev`:** Shared integration branch.
3. **Feature Branches:** Create your branch from `dev` (`git checkout -b feature/<name> origin/dev`).
4. **Pull Requests:** Open PR targeting `dev`. Verify `npm run lint` and `npm run build` pass before requesting merge.
