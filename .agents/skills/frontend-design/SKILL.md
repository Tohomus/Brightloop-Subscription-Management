---
name: frontend-design
description: >
  Crafts distinctive, production-grade visual design and typography to avoid generic AI aesthetics.
  Use when designing new views, dashboards, marketing pages, or components to ensure high-craft typography,
  intentional color palettes, asymmetric layouts, restrained surfaces, and an authentic editorial or product feel.
---

# Frontend Design

Transform interfaces from generic, AI-generated bootstrap templates into high-craft, distinctive, production-grade digital products.

Great design is not decorative; it is an intentional visual hierarchy that guides attention, clarifies complex workflows, and conveys institutional trust.

---

## 1. The Anti-Default Design Rules

Default model outputs converge on identical tropes: purple-cyan neon glows, identical 3-card columns, thick rounded borders, and generic font stacks. Overrule these defaults deliberately:

- **Ban Generic Gradients:** No `from-purple-500 to-indigo-600` or arbitrary rainbow buttons.
- **Ban Uniform Card Soup:** Do not wrap every paragraph or section in a card. Use whitespace, horizontal dividers, and contrasting background wells instead.
- **Ban Thick Borders on Rounded Corners:** Never combine a border $\ge 2\text{px}$ with rounded corners (`border-2 rounded-xl`). Use 1px hairlines (`border border-slate-800` or `oklch(1 0 0 / 0.08)`).
- **Ban Centered Everything:** Left-align data tables, form inputs, and reading content. Center only standalone confirmation modals or hero titles.

---

## 2. Typography Architecture

Typography is the most powerful brand and usability lever. Treat type with extreme craft:

### The 3-Face Rule
1. **Display Headings:** Clean geometric or grotesque sans (Geist, Inter, Plus Jakarta Sans, SF Pro).
   - Display headings $\ge 24\text{px}$ must use tight letter-spacing: `tracking-tight` (`-0.02em` to `-0.03em`).
   - Line height must stay compact: `leading-tight` or `leading-none`.
2. **Body & UI Text:** High-legibility neutral sans at `14px`–`16px` with normal tracking (`tracking-normal`) and comfortable line height (`leading-relaxed` / `1.5` to `1.6`).
3. **Tabular Numerics (The Financial Standard):**
   - ALL prices, currency values, dates, percentages, invoice IDs, and counts MUST use tabular numbers:
     ```css
     font-variant-numeric: tabular-nums;
     ```
   - In Tailwind: `font-mono` or `tabular-nums`. This prevents visual jitter when numbers change or align in columns.

### Type Scale & Hierarchy
- Distinguish levels by **weight and color contrast** rather than extreme font size jumps:
  - Header: `text-xl font-semibold text-white`
  - Body: `text-sm font-normal text-slate-300`
  - Secondary metadata: `text-xs font-medium text-slate-400`
  - Sub-label: `text-[11px] font-semibold tracking-wider uppercase text-slate-500`

---

## 3. Disciplined Color Architecture (The 60-30-10 Rule)

Avoid rainbow palettes. Build around a strictly controlled 3-tier hierarchy:

1. **60% Dominant Base Canvas:**
   - Deep Cockpit Dark: `Slate-950` (`#020617`), `Zinc-950` (`#09090b`), or rich obsidian.
   - Light Editorial: Warm ivory (`#fafaf9`), crisp stone (`#f8fafc`).
2. **30% Structural Surfaces & Wells:**
   - Elevated cards: `Slate-900` (`#0f172a`).
   - Hover states & recessed wells: `Slate-800/60` (`#1e293b`).
   - Structural borders: `Slate-800/80` or `oklch(1 0 0 / 0.08)`.
3. **10% Intentional Semantic Accent:**
   - Single brand signal: e.g. Emerald (`#10b981`) for revenue/subscription health, or Cobalt (`#3b82f6`) for actions.
   - Status chips: Low-opacity background tint ($10\%$) with high-contrast text ($100\%$):
     ```html
     <!-- Active Paid Status -->
     <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
       Active
     </span>
     ```

---

## 4. Layout Variance & Asymmetric Pacing

Monotonous repetition degrades usability. Introduce rhythm across sections:

- **Top KPI Executive Strip:** Offset grid (e.g. 4 columns: 3 compact metric cards + 1 wide trend summary card).
- **Split Hero Layout (60/40):** Left side carries headline, one concise value statement, and primary action; right side embeds live interactive widget or operational preview.
- **Operational Data Tables:** Full-width, high-density layout. Sticky header, 1px row borders, subtle hover highlights, right-aligned monetary values.
- **Concentric Radius Formula:**
  ```text
  Outer Radius = Inner Radius + Padding + Border Width
  ```
  *Example:* An outer container with `p-3` (12px padding) and an inner item of `rounded-lg` (8px radius) must have an outer radius of `20px` (`rounded-2xl`).

---

## 5. Micro-Interactions & States

Every interactive element must provide instant visual feedback across all 5 states:

| State | Visual Treatment | Duration |
|---|---|---|
| **Default** | Restrained surface, clear label, proper icon stroke weight | — |
| **Hover** | Subtle background lift (`hover:bg-slate-800/80`), no layout shifts | $\le 150\text{ms}$ |
| **Active / Pressed** | Scale to `0.96` (`enabled:active:scale-[0.96]`) | $100\text{ms}$ ease-out |
| **Focus-Visible** | Visible 2px outline ring with 2px offset (`ring-2 ring-primary ring-offset-2`) | Instant |
| **Disabled** | `opacity-40 pointer-events-none cursor-not-allowed` | — |

---

## Frontend Design Review Checklist

Before approving any UI work:
1. Does the page look custom-tailored to its domain (not like a generic AI template)?
2. Are all numbers and currency figures rendered with tabular fonts?
3. Are all borders $\le 1\text{px}$ hairline dividers?
4. Is there an obvious primary action on every view?
5. Does the color scheme adhere to the 60-30-10 rule without unnecessary decorative colors?
6. Are transitions snappy ($\le 150\text{ms}$) and gated behind `prefers-reduced-motion`?
