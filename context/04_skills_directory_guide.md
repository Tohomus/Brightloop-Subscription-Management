# Skills Directory Guide for Team & Antigravity

This directory contains the customized agent skills installed for the Brightloop Subscription Management project. All skills are synced in `skills/` (version-controlled in git) and loaded into `.agents/skills/` for local discovery by Antigravity.

---

## 1. Skill Index & Usage Matrix

| Skill Name | Purpose | When to Use |
|---|---|---|
| **`anti-slop`** | Prevents AI slop, fake statistics, synthetic mock data, and boilerplate; enforces real SQLite/API metrics. | Building views, dashboards, and APIs to guarantee data integrity and eliminate AI cliches. |
| **`artifacts-builder`** | Generates multi-component HTML/React/Tailwind/shadcn artifacts with state management and routing. | Creating standalone interactive artifacts, complete multi-screen prototypes, and embeddable apps. |
| **`better-ui`** | Polishes interface details (animations, stagger effects, hover states, optical alignment, shadows, and borders). | Fine-tuning components, cards, forms, and interaction states. |
| **`debugging-and-error-recovery`** | Systematic root-cause debugging for unexpected breakages, build failures, and regressions. | When encountering build errors, TypeScript compile failures, test crashes, or regressions. |
| **`frontend-design`** | Crafts distinctive, production-grade visual design and typography to avoid generic AI aesthetics. | Designing new views, dashboards, or marketing layouts with high-craft typography and palettes. |
| **`frontend-ui-engineering`** | Implements responsive layouts, WCAG accessibility, keyboard shortcuts (Cmd+K), and live SVG charts. | Building command palettes, accessible modals, responsive tables, and dependency-free SVG charts. |
| **`grill-me`** | Relentlessly stress-test any plan, design, or feature. | Before writing code, when picking an idea, or before locking architectural decisions. |
| **`hack-pitch`** | 2-minute live demo script and judge Q&A defense playbook. | Preparing presentation and handling tough judge questions. |
| **`hallmark`** | High-craft design skill for designing new pages that look intentionally designed rather than generated. | Building or designing new pages that look designed rather than generated. |
| **`interface-design`** | Craft-first SaaS dashboards, admin panels, tables, and settings. | Designing and building the core app views, navigation, and tables. |
| **`modern-ui-designer`** | Modern CSS and TypeScript design system engineering without framework bloat. | Architecting CSS tokens, container queries, `:has()`, subgrid, and typed design systems. |
| **`odoo-idea-gates`** | Filter ideas through Odoo's 8 evaluation gates. | When evaluating modules, wedges, and differentiator ideas. |
| **`ponytail`** | Minimalist senior developer mode delivering the smallest change that fully solves the problem. | Keeping scope small and eliminating unnecessary abstractions in a 7-hour hackathon. |
| **`ponytail-audit`** | Whole-repo quality audit covering bugs, security holes, high-load risks, dead code, and bloat. | One-shot whole-repo quality audit covering bugs, security, scale, tests, and bloat. |
| **`ponytail-debt`** | Tracks deferred tasks and shortcut comments as an actionable debt ledger. | Auditing, tracking, and prioritizing shortcut comments (`shortcut:`, `TODO:`) into a ledger. |
| **`ponytail-review`** | Context-aware review verifying logic, safety, performance, and necessity. | Quality review of a PR or commit checking logic, safety, scale, tests, and lean code. |
| **`stitch-design-taste`** | Google Stitch semantic design integration. | Exporting and importing designs from Google Stitch without UI degradation. |
| **`subscription-billing-engine`**| Domain business rules, state machines, and formulas. | Writing or reviewing subscription models, invoices, and billing runs. |
| **`systematic-debugging`** | 4-phase root-cause investigation. | When a bug appears during development or live testing. |
| **`test-driven-development`** | Enforce "Write failing test first, then implement minimal code". | Implementing billing engines, tax formulas, discounts, and state transitions. |
| **`verification-before-completion`**| Pre-commit verification checklist. | Before opening a PR or merging into `dev`/`main`. |

---

## 2. How to Invoke Skills in Antigravity

- **Automatic Activation:** Antigravity automatically detects skills based on context, file changes, or your prompt content.
- **Explicit Invocations:**
  - *"Grill me on the subscription billing state machine."* $\rightarrow$ triggers `grill-me`.
  - *"Apply ponytail full mode to this controller."* $\rightarrow$ triggers `ponytail`.
  - *"Review this dashboard table for design slop."* $\rightarrow$ triggers `design-slop`.
  - *"Use TDD to implement the discount expiration rule."* $\rightarrow$ triggers `test-driven-development`.
  - *"Prepare our hackathon demo pitch and anticipate Odoo judge questions."* $\rightarrow$ triggers `hack-pitch`.
