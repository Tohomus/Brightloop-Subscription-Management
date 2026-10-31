---
name: ponytail-debt
description: >
  Tracks deferred tasks and shortcut comments as an actionable debt ledger.
  Use when compiling, reviewing, updating, or resolving technical debt, shortcut comments
  (`shortcut:`, `TODO:`, `FIXME:`, `HACK:`, `ponytail:`), and deferred architecture items into a prioritized ledger.
---

# Ponytail Debt

Track deferred tasks and deliberate shortcuts as an actionable, prioritized debt ledger.

In senior engineering, shortcuts are healthy business decisions when shipping fast, provided they are explicitly documented with their known limit and trigger condition to upgrade. Unrecorded shortcuts become emergency outages.

---

## 1. The Standard Shortcut Syntax

All deliberate shortcuts taken in this repository must use this standardized format:

```text
shortcut: <known limit or assumption>, <when to upgrade>
```

### Examples
- **FastAPI / Backend:**
  ```python
  # shortcut: sequential billing runner in request cycle, upgrade to Celery / background worker when active subs > 1000
  ```
- **SQLite / Database:**
  ```python
  # shortcut: single SQLite file on disk, upgrade to PostgreSQL when multi-region or >50 concurrent writers
  ```
- **Frontend / React:**
  ```tsx
  // shortcut: in-memory mock seed data, upgrade to useDashboardSummary API hook once backend PR merges
  ```

Older forms (`ponytail: <limit>`) are also recognized and parsed by this skill.

---

## 2. Compiling the Debt Ledger

When asked to audit debt or run `/ponytail-debt`:

1. **Grep the Entire Codebase:**
   Search across all files (excluding `.git`, `node_modules`, `venv`, `dist`, build artifacts):
   - `shortcut:`
   - `ponytail:`
   - `TODO:`
   - `FIXME:`
   - `HACK:`
   - `XXX:`
2. **Evaluate Current Context & Load:**
   - What is the current scale of the system (e.g. prototype, hackathon demo, 1,000 users, production)?
   - Has any shortcut's upgrade trigger been reached?
3. **Classify Debt into Actionable Tiers:**
   - **Tier 1 (Critical / Breached):** Shortcuts whose limits are exceeded right now, or that pose immediate data-loss / security hazards.
   - **Tier 2 (Operational / Approaching):** Items that will block the next milestone (e.g., automated billing idempotency, missing test cases).
   - **Tier 3 (Deferred / Dormant):** Intentional shortcuts whose scale threshold has not yet been crossed (e.g., "upgrade to distributed lock when running multiple instances").

---

## 3. Output Format: The Debt Ledger Report

Present the findings as a clean, ranked ledger:

```markdown
# Technical Debt Ledger

**Repository Status:** 4 documented shortcuts · 2 TODOs · 0 breached thresholds

### Tier 1: Actionable Before Launch (Must Resolve)
| ID | Location | Item | Trigger to Upgrade | Remediation Path |
|---|---|---|---|---|
| D-01 | `app/api/billing.py:L48` | In-memory cycle locking | Concurrent billing requests | Wrap in SQLite transaction with unique constraint |

### Tier 2: Operational & Architecture Debt
| ID | Location | Item | Trigger to Upgrade | Remediation Path |
|---|---|---|---|---|
| D-02 | `frontend/src/App.tsx:L12` | Unrouted modal view state | Multi-page deep links needed | Migrate to `react-router-dom` route params |

### Tier 3: Dormant Managed Shortcuts (Healthy)
| ID | Location | Item | Trigger to Upgrade | Status |
|---|---|---|---|---|
| D-03 | `app/core/db.py:L14` | SQLite single file engine | >50 concurrent writers | Healthy (Load: 1 writer) |
```

---

## 4. Resolving Debt Items

When resolving a debt item:
1. Apply the **Ponytail Principle**: Write the smallest complete diff that satisfies the upgrade requirement.
2. Delete the `shortcut:` / `TODO:` comment.
3. Add a test verifying that the upgraded limit holds.
4. Verify the build and test suite pass cleanly before closing the item.
