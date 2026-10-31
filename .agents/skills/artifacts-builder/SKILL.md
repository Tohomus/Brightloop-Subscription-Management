---
name: artifacts-builder
description: >
  Generates multi-component HTML/React/Tailwind/shadcn artifacts with state management and routing.
  Use when creating standalone, interactive applications, complex multi-screen prototypes, dashboards,
  and embeddable UI artifacts that require self-contained routing, modals, tabs, forms, and reactive local storage.
---

# Artifacts Builder

Generate complete, production-grade, multi-component interactive artifacts using React, Tailwind CSS, Lucide icons, and shadcn-inspired primitives.

Artifacts built under this skill are self-contained, immediately runnable, fully responsive, and feature state management, route switching, and interactive feedback without missing dependencies or broken external imports.

---

## Core Architecture Principles

1. **Self-Contained & Immediately Executable:**
   - When delivered as an HTML artifact: bundle React (via UMD or ESM importmap), Tailwind CSS CDN, Babel/browser compiler, and Lucide icons.
   - When delivered into a Vite/Next.js/React repository: export cleanly organized components adhering to the project's folder conventions.
2. **Never Truncate Code (Full Output Enforcement):**
   - NEVER emit placeholder comments such as `// ... rest of the components ...`, `// TODO: add other routes`, or `/* remaining code unchanged */`.
   - Deliver every component, state hook, validation rule, and mock dataset in full.
3. **Reactive State & Route Management:**
   - Support seamless view switching using either URL hash routes (`window.location.hash`) or an explicit view state machine (`const [activeView, setActiveView] = useState<'dashboard' | 'quotations' | 'invoices'>('dashboard')`).
   - Store mutable items in a reactive state store with optional `localStorage` persistence so user interactions (e.g. creating a record, toggling status) persist across page reloads.

---

## Standard Artifact Component Primitives (Shadcn-Inspired)

Every multi-component artifact should include clean, accessible implementations of these primitives:

### 1. Button Primitive
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none enabled:active:scale-[0.98]";
  
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    outline: "border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
    destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-6 text-base gap-2.5"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
```

### 2. Modal / Dialog Primitive (With Keyboard Trap & Backdrop)
```tsx
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, description, children }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      {/* Surface */}
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};
```

### 3. High-Density Operational Table
- Clean 1px border dividers (`divide-y divide-slate-800`).
- Sticky table header with subtle uppercase tracking.
- Interactive hover state on rows (`hover:bg-slate-800/40`).
- Status chips with subtle background tints.

---

## Artifact State Management & Routing Pattern

```tsx
// Complete Single-State Multi-View Pattern
type View = 'dashboard' | 'quotations' | 'subscriptions' | 'invoices' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [items, setItems] = useState<Subscription[]>(initialSeedData);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === 'dashboard' && <DashboardView items={items} onNavigate={setCurrentView} />}
        {currentView === 'quotations' && <QuotationsView items={items} onUpdate={setItems} />}
        {currentView === 'subscriptions' && <SubscriptionsView items={items} onUpdate={setItems} />}
        {currentView === 'invoices' && <InvoicesView items={items} onUpdate={setItems} />}
        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Toast Feedback */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
```

---

## Verification Checklist for Generated Artifacts

Before returning an artifact:
1. **Interactive Verification:** Are all buttons, tabs, dropdowns, and form submits fully implemented with real state transitions?
2. **No Inert Elements:** No dead links (`href="#"`) or unhandled clicks.
3. **Visual Restraint:** Strict 60-30-10 palette, subtle 1px hairline borders, tabular fonts for numbers.
4. **Complete Syntax:** No unclosed tags, valid TypeScript/JSX, zero syntax errors.
