# Frontend Design System & Google Stitch Workflow

---

## 1. Google Stitch Integration & File Placement

When using Google Stitch ([labs.google.com/stitch](https://labs.google.com/stitch)):
1. Export screens or design components as a `.zip` archive from Stitch.
2. Unzip or place the archive directly inside `context/stitch_exports/` or project root.
3. The `stitch-design-taste` and `taste-skill` skills will automatically parse the layout, tokens, and HTML/CSS.

---

## 2. Semantic Design Standards (`DESIGN.md` Baseline)

### Atmospheric Baseline
- **Density:** Cockpit Dense (Level 8) — Designed for operators, financial leads, and administrators managing high-volume data.
- **Variance:** Offset Asymmetric (Level 5) — Structured grids with intentional focal points (KPI metrics lead, operational tables follow).
- **Motion:** Restrained Transitions ($\le 150\text{ms}$) — Instant feedback on clicks, tabs, and status toggles.

### Color Architecture (Strict Anti-Slop Calibration)
- **Base Surfaces:**
  - Background Base: `Slate-950` (`#020617`)
  - Elevated Cards / Containers: `Slate-900` (`#0f172a`)
  - Sub-panels / Hover Surfaces: `Slate-800` (`#1e293b`)
  - Borders: `Slate-800/80` (`1px` width only; never `2px` thick border on rounded cards)
- **Text & Contrast:**
  - Primary Headers / Values: `White` (`#ffffff`)
  - Body Text: `Slate-300` (`#cbd5e1`)
  - Secondary Metadata / Labels: `Slate-400` (`#94a3b8`)
- **Status Chips & Semantics:**
  - Active / Paid: Emerald (`#10b981`, bg: `#10b981/10`)
  - Quotation / Draft: Slate (`#94a3b8`, bg: `#94a3b8/10`)
  - Confirmed / Pending: Blue (`#3b82f6`, bg: `#3b82f6/10`)
  - Overdue / Warning: Amber / Rose (`#f43f5e`, bg: `#f43f5e/10`)
  - Paused: Violet (`#8b5cf6`, bg: `#8b5cf6/10`)
- **Strictly Banned:**
  - No purple-to-blue neon gradients.
  - No decorative status dots without text labels.
  - No card inside a card with heavy identical borders (`border-2 rounded-xl` slop).

### Typography Rules
- **Headline Stack:** Display Sans (Geist, Inter, or System UI with `-0.02em` letter-spacing).
- **Tabular Data:** Monospace / Tabular figures (`font-mono` or `font-variant-numeric: tabular-nums`) for currency amounts, invoice numbers, dates, and metrics.
- **Hierarchy:** High contrast achieved via font-weight (`font-medium` vs `font-bold`) and color contrast rather than oversized font scaling.

---

## 3. UI Component Specs for Brightloop

### A. Executive KPI Cards
- Compact 4-column top grid:
  1. Active Subscriptions
  2. Monthly Recurring Revenue (MRR)
  3. Total Collected Revenue
  4. Outstanding / Overdue AR
- Single primary metric number with tabular font, subtle percentage change delta, and zero fake decorative SVG illustrations.

### B. High-Density Operational Tables
- Search input + status filter tabs (`All`, `Active`, `Quotation`, `Overdue`, `Closed`).
- Sticky table header with subtle 1px border separator.
- Action dropdown or quick action buttons per row (`View`, `Generate Invoice`, `Record Payment`).

### C. Fast-Forward "Time Machine" Bar
- Centered or right-aligned pill in top navigation.
- Shows Current System Date.
- Quick buttons: `+1 Day`, `+7 Days`, `+30 Days`, `Reset to Today`.
- Visually triggers simulated billing runs and updates aging status indicators instantly.
