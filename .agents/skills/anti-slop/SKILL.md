---
name: anti-slop
description: >
  Prevents AI slop, fake statistics, synthetic mock data, and boilerplate; enforces real SQLite/API metrics.
  Use when designing, building, or reviewing web applications, dashboards, tables, and backend APIs to ensure
  authentic data integrity, production-grade visual restraint, and zero generic AI placeholders.
---

# Anti-Slop Specification & Enforcement

This skill actively prevents the generation and acceptance of "AI Slop"—generic, unedited, decorative, superficial, or synthetic design and code patterns that models default to when left unchecked.

Every UI element, data metric, and code structure must earn its place. If an element cannot be backed by real code, real database tables (SQLite/PostgreSQL), or real business logic, it does NOT belong on screen.

---

## The Non-Negotiable Anti-Slop Rules

### 1. Zero Synthetic Data & Fake Proof
- **Banned Claims:** "10,000+ Happy Customers", "99.99% Uptime SLA", "Trusted by Fortune 500", "500% ROI".
- **Banned Logo Walls:** Displaying generic corporate logos (Google, Meta, Stripe) unless authorized and relevant.
- **Banned Testimonials:** Quotes attributed to fictional personas ("John Doe, VP of Cloud, TechCorp").
- **Enforcement:**
  - If real metrics exist: query the database (`SELECT COUNT(*) FROM subscriptions WHERE status = 'active'`) or API endpoint (`/api/dashboard/summary`) and render the exact number with tabular monospace figures (`font-variant-numeric: tabular-nums`).
  - If data is empty: render an honest, high-craft empty state with a clear call-to-action (e.g., *"No active subscriptions yet. Create your first quotation to start tracking revenue."*), never fake placeholder figures.

### 2. Zero Hardcoded Sparklines & Fake Visualizations
- **Banned SVG Mockups:** Hardcoded arbitrary SVG paths (`d="M0 25 Q 30 5, 60 20 T 120 0"`) pretending to be real-time telemetry or MRR curves.
- **Enforcement:**
  - Every chart path or bar height must be dynamically calculated from an actual array of numeric datapoints fetched from the backend or seeded in SQLite.
  - If there are fewer than 2 datapoints to plot a trend, display a static scalar value or an empty data indicator rather than fabricating a trend curve.

### 3. Zero "Card Soup" & Thick Rounded Borders
- **Banned Container Patterns:**
  - `border-2 rounded-xl` or `border-2 rounded-2xl` wrapping every single component.
  - Nested cards where a card has a border, inside a panel with a border, inside a container with a border.
  - Floating glow blobs (`blur-3xl bg-indigo-500/20`) placed randomly in backgrounds to compensate for lack of layout hierarchy.
  - Generic purple-to-blue gradients (`from-indigo-600 via-purple-600 to-pink-500`).
- **Enforcement:**
  - Establish hierarchy through **whitespace, typography, and background well contrast** before adding borders.
  - Use subtle 1px hairline borders (`border border-slate-800` or `oklch(1 0 0 / 0.08)`).
  - Apply the **Concentric Radius Rule**: Outer Radius = Inner Radius + Padding + Border Width.
  - Reserve elevated surfaces and shadows exclusively for elements that genuinely float (dialogs, dropdowns, popovers).

### 4. Zero Decorative Noise & Disconnected Meta Elements
- **Banned Visual Clichés:**
  - Floating status pills with no semantic label (e.g., a green dot next to static text that never changes).
  - Middle-dot-joined metadata chains (`Dashboard · v1.0.0 · Active · 2 mins ago · Beta`).
  - Emoji icons in place of scalable SVGs (`🚀 Launch`, `💡 Idea`, `🔥 Hot`).
  - Arrows glued to button text without optical spacing (`Explore Now ->`).
- **Enforcement:**
  - Use consistent SVG icon sets (e.g., Lucide) rendered with `currentColor` and matching the stroke weight of adjacent typography.
  - Status indicators must pair a perceptible color with an explicit textual label for accessibility.

### 5. Zero Code Boilerplate & Monolithic Dumps
- **Banned Code Patterns:**
  - Dummy button handlers: `onClick={() => console.log('clicked')}` or `onClick={() => alert('TODO')}`.
  - Swallowed errors: `try { ... } catch (e) {}` with no logging or user-facing feedback.
  - Massive monolithic single-file components mixing database queries, styling overrides, and layout logic.
  - Unused speculative props and over-engineered wrapper layers.
- **Enforcement:**
  - Every action must either trigger a genuine API mutation or open a working interactive modal/drawer.
  - Error states must surface intelligible inline alerts or toast messages.
  - Components must be modular, single-responsibility, and typed with TypeScript.

---

## Real SQLite & API Metrics Integration Protocol

When building dashboards, KPI strips, or report views:

1. **Schema First:** Inspect the actual database tables or Pydantic/SQLModel models.
   ```sql
   -- Real query for Subscription Management Dashboard
   SELECT 
     COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_subs,
     COALESCE(SUM(CASE WHEN status = 'Active' THEN total_amount ELSE 0 END), 0) AS mrr,
     COUNT(CASE WHEN status = 'Overdue' THEN 1 END) AS overdue_count
   FROM subscriptions;
   ```
2. **API Verification:** Connect the frontend to the real endpoint:
   ```typescript
   // Good: Typed API fetch with genuine state handling
   const { data, isLoading, error } = useDashboardMetrics();
   if (isLoading) return <MetricsSkeleton />;
   if (error) return <MetricsErrorBanner error={error} onRetry={refetch} />;
   ```
3. **Tabular Numerics:** Render currency and numeric counts using tabular figures:
   ```html
   <span class="font-mono text-2xl font-bold tracking-tight text-white">
     ${data.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}
   </span>
   ```

---

## Anti-Slop Audit Checklist

Run this audit on any screen, PR, or component:

| Category | Check | Pass Criteria |
|---|---|---|
| **Data** | Are any statistics, logos, or quotes fabricated? | All numbers trace to database or seeded schema. |
| **Charts** | Are chart paths generated from real array values? | No static hardcoded SVG bezier coordinates. |
| **Borders** | Are there thick `2px+` borders on rounded cards? | Only 1px hairlines or whitespace separation used. |
| **Gradients** | Is there generic AI purple/blue neon lighting? | Disciplined palette: 60% base, 30% contrast, 10% accent. |
| **Hierarchy** | Does the screen rely on card-inside-card nesting? | Depth achieved via background wells and spacing. |
| **Icons** | Are emojis used as icons? | Clean SVG icons matching text stroke weight. |
| **Actions** | Do buttons have real handlers or working dialogs? | No console.log or inert placeholder handlers. |
