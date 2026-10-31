# AGENTS.md — Global AI Agent Directives

> **This file is automatically loaded by OpenCode, Cursor, Cline, Claude Code, and Antigravity.**
> **Project:** Brightloop Subscription Management (Odoo × CUSAT Make-a-ton)

---

## 1. Single Source of Truth

Before making any modifications or answering architecture questions:
- **You MUST read and adhere to:** [`context/TEAM_DEVELOPMENT_GUIDELINES.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/context/TEAM_DEVELOPMENT_GUIDELINES.md).
- Detailed problem statement breakdown: [`context/01_problem_statement_breakdown.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/context/01_problem_statement_breakdown.md).
- Frontend design and Stitch tokens: [`context/03_frontend_design_system_and_stitch.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/context/03_frontend_design_system_and_stitch.md).

---

## 2. Locked Technology Stack

- **Backend:** Python 3.10+ with **FastAPI** + **SQLite** (`database.db`). ORM/Validation: **SQLModel** / **SQLAlchemy** + **Pydantic v2**.
- **Frontend:** **React 19** + **TypeScript** + **Vite** + **Tailwind CSS v3** (located in [`frontend/`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/frontend)).
- **DO NOT** introduce external database servers (PostgreSQL, MySQL, Redis) or enterprise ERP runtimes (Odoo daemon, Frappe bench). Everything must run locally with zero daemon setup.

---

## 3. Available Skills & Where to Find Them

Skills are installed in `.opencode/skills/`, `.agents/skills/`, and `skills/`.
When working on specific tasks, consult the corresponding skill file:

- **Billing Engine Math & Idempotency:** Consult [`skills/subscription-billing-engine/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/subscription-billing-engine/SKILL.md) and [`skills/test-driven-development/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/test-driven-development/SKILL.md).
- **SaaS UI, Tables & Dashboards:** Consult [`skills/interface-design/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/interface-design/SKILL.md) and [`skills/better-ui/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/better-ui/SKILL.md).
- **Anti-Slop Linter:** Consult [`skills/design-slop/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/design-slop/SKILL.md) (strict ban on purple gradients, card soups, and `border-2 rounded-xl`).
- **Lean Implementation:** Consult [`skills/ponytail/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/ponytail/SKILL.md) (write the smallest diff that solves the task; no unneeded abstractions).
- **Stress-Testing Design Ideas:** Consult [`skills/grill-me/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/grill-me/SKILL.md).
- **Live Demo Pitch & Q&A:** Consult [`skills/hack-pitch/SKILL.md`](file:///c:/coding/projects/other/makeaton%202.0/Brightloop-Subscription-Management/skills/hack-pitch/SKILL.md).

---

## 4. Execution Directives for DeepSeek / OpenCode Agents

To avoid rate limits and context truncations:
1. **Work Modularity:** Do not attempt to generate massive multi-file changes in a single turn. Break work into small, self-contained steps:
   - Step 1: Database models.
   - Step 2: Service functions / business logic.
   - Step 3: API route handlers.
   - Step 4: Frontend view component.
2. **Strict Verification:** Always verify that code compiles cleanly. In `frontend/`, run `npm run lint` and `npm run build` before claiming completion.
3. **Preserve Types:** Use exact TypeScript interfaces and Pydantic models matching the schema in `context/TEAM_DEVELOPMENT_GUIDELINES.md`.
