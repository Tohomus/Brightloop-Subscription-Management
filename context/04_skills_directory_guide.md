# Skills Directory Guide for Team & Antigravity

This directory contains the customized agent skills installed for the Brightloop Subscription Management project. All skills are synced in `skills/` (version-controlled in git) and loaded into `.agents/skills/` for local discovery by Antigravity.

---

## 1. Skill Index & Usage Matrix

| Skill Name | Purpose | When to Use |
|---|---|---|
| **`grill-me`** | Relentlessly stress-test any plan, design, or feature. | Before writing code, when picking an idea, or before locking architectural decisions. |
| **`odoo-idea-gates`** | Filter ideas through Odoo's 8 evaluation gates. | When evaluating modules, wedges, and differentiator ideas. |
| **`test-driven-development`** | Enforce "Write failing test first, then implement minimal code". | Implementing billing engines, tax formulas, discounts, and state transitions. |
| **`ponytail`** | Lazy senior developer mode (YAGNI, minimal complete diff). | Keeping scope small and eliminating unnecessary abstractions in a 7-hour hackathon. |
| **`interface-design`** | Craft-first SaaS dashboards, admin panels, tables, and settings. | Designing and building the core app views, navigation, and tables. |
| **`stitch-design-taste`** | Google Stitch semantic design integration. | Exporting and importing designs from Google Stitch without UI degradation. |
| **`better-ui`** | Precise optical alignment, surfaces, shadows, button press scales. | Fine-tuning components, cards, forms, and interaction states. |
| **`design-slop`** | Linter against generic AI design clichés and template leftovers. | Reviewing screens to remove `border-2 rounded-xl`, card soup, and bad palettes. |
| **`subscription-billing-engine`**| Domain business rules, state machines, and formulas. | Writing or reviewing subscription models, invoices, and billing runs. |
| **`hack-pitch`** | 2-minute live demo script and judge Q&A defense playbook. | Preparing presentation and handling tough judge questions. |
| **`systematic-debugging`** | 4-phase root-cause investigation. | When a bug appears during development or live testing. |
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
