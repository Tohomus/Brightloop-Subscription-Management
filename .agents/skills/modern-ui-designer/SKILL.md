---
name: modern-ui-designer
description: >
  Modern CSS and TypeScript design system engineering without framework bloat.
  Use when architecting design systems, styling frameworks, CSS tokens, modern CSS layouts (subgrid, container queries, :has()),
  and type-safe UI component libraries with zero runtime overhead and maximum rendering performance.
---

# Modern UI Designer

Architect high-performance, type-safe design systems and component libraries using modern CSS specifications and TypeScript—eliminating bloated CSS-in-JS runtimes and heavy third-party framework overhead.

---

## 1. Modern CSS Architecture (Zero-Runtime Overhead)

Modern browser standards render runtime CSS-in-JS libraries (`styled-components`, `emotion`) obsolete. Leverage native browser capabilities:

### Modern Cascade Management with `@layer`
Structure stylesheets with `@layer` to declare priority without selector specificity wars:
```css
@layer reset, base, tokens, components, utilities;

@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}

@layer tokens {
  :root {
    --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, monospace;
    
    /* Modern Perceptually Uniform Color Space (OKLCH) */
    --color-bg-base: oklch(0.12 0.02 260);
    --color-bg-surface: oklch(0.16 0.03 260);
    --color-bg-subtle: oklch(0.20 0.03 260);
    
    --color-border-hairline: oklch(1 0 0 / 0.08);
    --color-border-strong: oklch(1 0 0 / 0.16);
    
    --color-accent-primary: oklch(0.68 0.18 155); /* Vibrant Emerald */
    --color-accent-subtle: color-mix(in oklch, var(--color-accent-primary) 12%, transparent);
    
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-pill: 9999px;
  }
}
```

### Relational Selectors & Modern Layout
- **`:has()` Relational Selector:** Style parents based on child state without JavaScript listeners:
  ```css
  /* Change card background when checkbox inside is checked */
  .selection-card:has(input[type="checkbox"]:checked) {
    border-color: var(--color-accent-primary);
    background-color: var(--color-accent-subtle);
  }

  /* Form group error highlighting */
  .form-group:has(:invalid:not(:placeholder-shown)) {
    --field-border: oklch(0.60 0.22 25); /* Rose danger */
  }
  ```
- **CSS Grid Subgrid:** Align nested item rows across independent cards without rigid wrapper structures:
  ```css
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    grid-template-rows: subgrid;
  }
  ```
- **Container Queries (`@container`):** Style components according to parent container width, making components truly self-contained and modular:
  ```css
  .kpi-container {
    container-type: inline-size;
  }

  @container (min-width: 480px) {
    .kpi-content {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }
  ```

---

## 2. Type-Safe TypeScript Token Contracts

Define design tokens in TypeScript as the single source of truth, guaranteeing compile-time type safety:

```typescript
export const tokens = {
  colors: {
    bgBase: 'var(--color-bg-base)',
    bgSurface: 'var(--color-bg-surface)',
    borderHairline: 'var(--color-border-hairline)',
    accentPrimary: 'var(--color-accent-primary)',
    accentSubtle: 'var(--color-accent-subtle)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  },
  radii: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
  },
  transitions: {
    fast: '100ms ease-out',
    snappy: '150ms cubic-bezier(0.2, 0, 0, 1)',
  }
} as const;

export type ThemeTokens = typeof tokens;
```

---

## 3. Polymorphic, Headless Component Patterns

Build lean, reusable primitives using the `as` or `asChild` composition pattern without framework bloat:

```tsx
import React, { forwardRef } from 'react';

type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProps<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

interface SurfaceProps {
  elevated?: boolean;
  interactive?: boolean;
}

export const Surface = forwardRef(
  <C extends React.ElementType = 'div'>(
    { as, elevated = false, interactive = false, className = '', children, ...props }: PolymorphicComponentProps<C, SurfaceProps>,
    ref?: React.ComponentPropsWithRef<C>['ref']
  ) => {
    const Component = as || 'div';

    const baseStyles = "rounded-[var(--radius-md)] border border-[var(--color-border-hairline)] bg-[var(--color-bg-surface)] p-5 text-slate-100";
    const interactiveStyles = interactive 
      ? "transition-all duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)] active:scale-[0.99] cursor-pointer" 
      : "";
    const elevationStyles = elevated 
      ? "shadow-lg shadow-black/40" 
      : "";

    return (
      <Component
        ref={ref}
        className={`${baseStyles} ${interactiveStyles} ${elevationStyles} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
```

---

## 4. Performance & Hardware Acceleration Guidelines

1. **Hardware-Accelerated Animation Only:**
   - ONLY animate `transform` (translate, scale, rotate) and `opacity`.
   - Never animate `width`, `height`, `margin`, `padding`, `top`, or `left` (these trigger layout recalculation on every frame).
2. **Selective `will-change`:**
   - Apply `will-change` strictly to the animated property (`will-change: transform`), never `will-change: all`.
   - Remove `will-change` when animation is complete if memory is constrained.
3. **Cumulative Layout Shift (CLS) Prevention:**
   - Always declare explicit `aspect-ratio` or `width`/`height` attributes on images, SVGs, and media wrappers.
   - Use skeleton place-holders matching the exact rendered bounding box of incoming async data.
4. **Rendering Optimization for High-Density Lists:**
   - Use `content-visibility: auto` on off-screen table rows or long subscription lists to bypass off-screen layout and paint overhead.
