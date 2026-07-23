---
name: web-app-refactor
description: Refactors HTML, CSS, and JS/TS web application code to maximize maintainability, performance, accessibility, and readability while maintaining 100% functional parity.
---

# 🤖 Antigravity Skill: Web App Code Refactor Engine

## 🎯 Purpose & Scope
This skill guides the agent through systematically refactoring HTML, CSS, and JS/TS code for web applications. The goal is to maximize maintainability, performance, accessibility, and readability while maintaining 100% functional parity.

---

## 📜 Universal Refactoring Principles

1. **KISS (Keep It Simple, Stupid):** Prefer flat, readable, direct code over complex or over-engineered abstractions.
2. **YAGNI (You Aren't Gonna Need It):** Delete unused styles, dead functions, speculative logic, and unneeded feature flags.
3. **DRY (Don't Repeat Yourself):** Extract duplicated CSS declarations, repeated DOM selectors, and duplicate business logic into reusable helpers or variables.
4. **SRP (Single Responsibility Principle):** Ensure each CSS class, HTML component, and JS function handles exactly **one job**.
5. **Separation of Concerns:** Keep HTML strictly structural, CSS strictly visual, and JS strictly behavioral. Eliminate inline styles (`style="..."`) and inline event handlers (`onclick="..."`).
6. **Boy Scout Rule:** Leave every block of code cleaner and safer than it was found.

---

## 🛠️ Refactoring Execution Checklist

### 1. HTML (Structure & Accessibility)
- Replace generic `<div>`/`<span>` containers with semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`).
- Ensure WCAG accessibility: add `aria-*` attributes where appropriate, ensure form inputs have matching `<label>` elements, and set explicit `alt` attributes on images.
- Unnest unnecessary DOM wrapper trees to maintain a flat hierarchy.

### 2. CSS (Layout & Architecture)
- Replace legacy floats/positioning with modern **Flexbox** or **CSS Grid**.
- Extract hardcoded colors, spacing, fonts, and animation speeds into **CSS Custom Properties (`:root` variables)**.
- Convert fixed `px` values to responsive, scalable units (`rem`, `em`, `clamp()`).
- Audit and remove unused or conflicting selectors.

### 3. JavaScript / TypeScript (Logic & State)
- **Guard Clauses:** Replace deeply nested `if/else` blocks with early returns.
- **ES6+ Modernization:** Use destructuring, optional chaining (`?.`), nullish coalescing (`??`), and template literals.
- **Event Delegation:** Consolidate multiple event listeners into parent container listeners where possible.
- **Resource Safety:** Ensure proper cleanup of event listeners, intervals, and async subscriptions to prevent memory leaks.

---

## 📋 Required Output Format

When executing this skill, structure the response or artifact using this format:

### 1. Code Smell Audit
- List the specific anti-patterns identified in the original code (e.g., `<div>` soup, hardcoded hex colors, nested `if` statements).

### 2. Refactored Code
- Provide clean, modular code blocks for HTML, CSS, and JS/TS.

### 3. Key Refactoring Wins
- Itemize what was improved and link each change to the driving principle (e.g., *"Applied YAGNI: removed unused helper script"* or *"Applied SRP: split layout styles from component themes"*).

### 4. Behavioral Parity Statement
- Explicitly confirm that no functional behavior or visual output was changed.
