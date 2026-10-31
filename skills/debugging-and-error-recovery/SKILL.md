---
name: debugging-and-error-recovery
description: >
  Systematic root-cause debugging for unexpected breakages, build failures, and regressions.
  Use when encountering build errors, TypeScript compile failures, test crashes, runtime exceptions,
  failing network calls, or unexpected regressions across frontend and backend services.
---

# Systematic Debugging & Error Recovery

This skill governs the investigation, diagnosis, and recovery from unexpected breakages, build failures, runtime exceptions, and regressions.

## The Iron Law of Debugging

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Symptom patches, speculative code tweaks, and blind guessing are strictly prohibited. Every proposed fix must be preceded by concrete evidence establishing exactly what broke, why it broke, and where the error originates.

---

## The 4-Phase Debugging Process

You must complete each phase in order before moving to the next.

### Phase 1: Root Cause Investigation

1. **Inspect Full Diagnostic Output:**
   - Read the complete stack trace from top to bottom.
   - Note the exact error code, offending file path, and line number.
   - Do not skip compiler warnings—they often signal the underlying breakage.
2. **Reproduce Consistently:**
   - Identify the exact command or user action that triggers the error:
     ```bash
     npm run build          # Bundler / TypeScript failure
     npm run test           # Test suite regression
     uvicorn app.main:app   # Backend startup crash
     ```
   - If not reproducible, add diagnostic instrumentation before modifying any logic.
3. **Inspect the Regression Boundary:**
   - What changed most recently?
     ```bash
     git diff HEAD~1
     git status
     ```
   - Check whether recent dependency installs (`package.json`, `requirements.txt`), environment variables, or config files introduced the regression.
4. **Multi-Layer System Instrumentation:**
   - In full-stack architectures (e.g. React frontend $\rightarrow$ FastAPI endpoint $\rightarrow$ SQLite database):
     - Log data entering and leaving each boundary.
     - Pinpoint whether the failure occurs in serialization, network transport, business validation, or database persistence.

---

### Phase 2: Pattern & Root-Cause Tracing

1. **Trace Bad Values Backward:**
   - Where did the unexpected `null`, `undefined`, or invalid state originate?
   - Trace callers up the call stack until you find the exact point where valid state turned into invalid state.
   - Fix the issue at the **origin**, never at the consuming layer.
2. **Compare Against Known Working Implementations:**
   - Identify similar functioning routes, components, or services in the repository.
   - Diff the broken pattern against the working pattern line-by-line.

---

### Phase 3: Single Hypothesis & Minimal Test

1. **Form a Single Falsifiable Hypothesis:**
   - Clearly state: *"The build fails because `lucide-react` was updated and `Icons.svg` is missing named export `X`, causing Vite bundling to fail."*
2. **Test Minimally:**
   - Apply the smallest possible modification that tests the hypothesis.
   - Change only **one variable at a time**.
3. **Stop & Question Architecture (The 3-Fix Rule):**
   - If **3 consecutive fix attempts fail**, STOP IMMEDIATELY.
   - Repeated failures mean the underlying mental model or architecture is flawed.
   - Question foundational assumptions before making a 4th fix attempt.

---

### Phase 4: Durable Implementation & Recovery

1. **Write a Failing Reproduction / Test:**
   - Create an automated test or simple reproduction script proving the bug exists.
2. **Apply the Minimal Durable Fix:**
   - Eliminate the root cause with the smallest complete diff.
   - Preserve existing error boundaries and validation checks.
3. **Verify Zero Collateral Damage:**
   - Run the entire test suite, linter, and type checker:
     ```bash
     npm run lint && npm run build
     pytest
     ```
   - Confirm no other flows or components were broken by the change.

---

## Build Failure & Common Error Playbook

### 1. TypeScript & Bundler Regressions (Vite / React)
- **Error:** `Property 'X' does not exist on type 'Y'`
  - *Investigation:* Check the interface definition in `types/`. Did a backend schema update without updating frontend types?
  - *Fix:* Align the TypeScript interface with the actual API schema.
- **Error:** `Failed to resolve import "X" from "Y"`
  - *Investigation:* Verify file extensions (`.tsx` vs `.ts`), relative path depth (`../../`), and export type (default vs named).

### 2. FastAPI & Backend Regressions
- **Error:** `422 Unprocessable Entity`
  - *Investigation:* Inspect FastAPI's response body: `response.json()['detail']`. It reveals the exact field failing Pydantic validation.
  - *Fix:* Update the frontend payload or adjust the Pydantic schema field types (`Optional`, default values).
- **Error:** `IntegrityError: NOT NULL constraint failed`
  - *Investigation:* Trace database session commits. Did an inserted model omit a required column or foreign key?
  - *Fix:* Provide the required foreign key or update the migration schema.

### 3. State & React Hydration / Render Errors
- **Error:** `Maximum update depth exceeded`
  - *Investigation:* Locate `useEffect` or event handlers triggering state updates unconditionally on render.
  - *Fix:* Wrap in conditional guards or memoize callback handlers.

---

## Error Recovery Verification Checklist

- [ ] Root cause identified and explained in plain English with file:line citations.
- [ ] Minimal fix applied at the origin of the failure (not papering over symptoms).
- [ ] Linter passes with zero errors (`npm run lint` / `oxlint`).
- [ ] Type checker passes cleanly (`tsc --noEmit`).
- [ ] Application compiles and runs in dev and production build modes.
