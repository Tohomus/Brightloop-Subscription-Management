---
name: frontend-ui-engineering
description: >
  Implements responsive layouts, WCAG accessibility, keyboard shortcuts (Cmd+K), and live SVG charts.
  Use when engineering interactive frontend components, command palettes, accessible modals, responsive
  tables, keyboard navigation handlers, and lightweight dependency-free SVG charts.
---

# Frontend UI Engineering

This skill provides production engineering standards and code recipes for building accessible, keyboard-operable, responsive user interfaces with live, dependency-free SVG visualizations.

---

## 1. Global Keyboard Command Palette (`Cmd+K` / `Ctrl+K`)

Command palettes elevate developer tools and SaaS apps to professional grade. Implement using an accessible dialog and keyboard listener:

```tsx
import React, { useState, useEffect, useRef } from 'react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  onSelect: () => void;
  shortcut?: string;
}

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [isOpen]);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleArrowNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].onSelect();
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center border-b border-slate-800 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleArrowNavigation}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">No matching commands found.</p>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  item.onSelect();
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="font-medium text-white">{item.title}</div>
                  {item.subtitle && <div className="text-xs text-slate-400">{item.subtitle}</div>}
                </div>
                {item.shortcut && (
                  <span className="text-[11px] font-mono text-slate-500">{item.shortcut}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 2. Dependency-Free Live SVG Visualizations

Never install heavy 500KB chart libraries (Chart.js, Recharts) for clean dashboards and sparklines. Handcraft responsive, accessible SVGs directly:

### A. Responsive Smooth Line Sparkline
```tsx
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  data,
  width = 160,
  height = 40,
  color = '#10b981'
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  // Calculate smooth cubic bezier path
  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cX = (prev.x + pt.x) / 2;
    return `${acc} C ${cX} ${prev.y}, ${cX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg
      role="img"
      aria-label={`Sparkline trend from ${data[0]} to ${data[data.length - 1]}`}
      width={width}
      height={height}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
```

### B. Pure SVG Donut Progress Meter
```tsx
export function DonutMeter({
  percentage,
  size = 56,
  strokeWidth = 6,
  color = '#10b981'
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-semibold text-white">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}
```

---

## 3. WCAG 2.1 AA Accessibility Standards

1. **4.5:1 Text Contrast Ratio:**
   - Normal text ($< 18\text{px}$) must meet a minimum $4.5:1$ contrast against the underlying background.
   - Text colors `slate-300` (`#cbd5e1`) and `white` on `slate-950` (`#020617`) achieve $> 10:1$ ratio (AAA compliant).
2. **Keyboard Navigation & Focus Indicators:**
   - Never suppress outline rings with `outline-none` unless replacing with visible `:focus-visible` styling:
     ```css
     :focus-visible {
       outline: 2px solid var(--accent);
       outline-offset: 2px;
     }
     ```
   - In Tailwind: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`.
3. **Screen Reader Live Regions:**
   - Use `aria-live="polite"` or `role="status"` for components whose state updates dynamically (e.g. simulated clock advance, notification toasts).

---

## 4. Responsive Layout Engineering

- **Mobile Table Adaptation:** Wrap operational tables in `overflow-x-auto` with sticky primary column:
  ```html
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>...</thead>
      <tbody>...</tbody>
    </table>
  </div>
  ```
- **Container Queries for Modular Cards:**
  ```css
  @container (min-width: 380px) {
    .kpi-card-content {
      flex-direction: row;
      justify-content: space-between;
    }
  }
  ```
