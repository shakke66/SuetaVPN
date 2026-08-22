# SuetaVPN visual restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old SuetaVPN visual language over the current React MVP and deepen the dark theme to the Gaz Network palette without changing domain behavior.

**Architecture:** Keep `AppShell`, React Router, `AppStateV2`, local adapters and existing page markup as the functional boundary. Rebuild the shared visual tokens and page CSS first, then add only the missing landing preview markup and route-motion coordination needed to express the old design. The old static commit is a visual reference only; it is not copied as a runtime.

**Tech Stack:** React 19, Vite 8, TypeScript 7, React Router 7, Vitest 4, CSS custom properties and ordinary CSS; no new UI or animation dependency.

**Spec:** `docs/superpowers/specs/2026-08-17-suetavpn-visual-restoration-design.md`

## Global Constraints

- Keep only `БАЗА` and `ЭЛИТА` tariffs and all current production copy rules.
- Preserve `AppStateV2`, adapter contracts, routes, auth, wallet, ticket and notification behavior.
- Keep the background static; do not add particles, canvas, meteors or infinite decorative keyframes.
- Do not add an animation dependency; use CSS and the existing transition coordinator.
- Keep the current light theme readable and do not expose demo terminology.

### Task 1: Lock the shared visual system

**Files:**
- Modify: `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/components.css`, `src/styles/responsive.css`
- Test: `src/app/AppShell.test.tsx`, `src/app/RouteTransition.test.tsx`

- [ ] **Step 1: Add failing structure assertions** for the restored shell surfaces and route viewport stability.
- [ ] **Step 2: Run the focused shell tests and record the intentional RED result.**
- [ ] **Step 3: Replace dark tokens, header/nav/card/button surfaces and responsive spacing with the approved old-MVP/Gaz values; keep light tokens intact.**
- [ ] **Step 4: Run focused tests and verify GREEN.**
- [ ] **Step 5: Commit `style: restore shared SuetaVPN visual system`.**

### Task 2: Restore landing and cabinet composition

**Files:**
- Modify: `src/pages/LandingPage.tsx`, `src/styles/landing.css`, `src/pages/DashboardPage.tsx`, `src/styles/subscriptions.css`, `src/styles/wallet.css`, `src/styles/support.css`, `src/styles/info.css`, `src/styles/auth.css`
- Test: `src/pages/LandingPage.test.tsx`, `src/pages/BalancePage.test.tsx`, `src/pages/ReferralPage.test.tsx`, `src/pages/InfoPage.test.tsx`

- [ ] **Step 1: Add a failing landing test for the static cabinet preview and restored hero hierarchy.**
- [ ] **Step 2: Run the landing test and confirm RED.**
- [ ] **Step 3: Add the accessible preview markup and restyle page roots/cards/forms to the old composition; do not reintroduce removed tariffs or demo labels.**
- [ ] **Step 4: Run landing, wallet, referral and information tests and verify GREEN.**
- [ ] **Step 5: Commit `style: restore landing and cabinet composition`.**

### Task 3: Make motion readable and stable

**Files:**
- Modify: `src/app/RouteTransition.tsx`, `src/styles/motion.css`, `src/styles/components.css`, `src/styles/responsive.css`
- Test: `src/app/RouteTransition.test.tsx`, `src/layouts/AppShell.test.tsx`

- [ ] **Step 1: Add a failing regression test for scroll reset and the longer incoming/outgoing lifecycle.**
- [ ] **Step 2: Run the focused tests and record RED.**
- [ ] **Step 3: Implement stable route minimum height, `window.scrollTo({ top: 0, behavior: 'auto' })` after protected route changes, desktop stagger classes and stronger mobile directional motion; retain reduced-motion behavior.**
- [ ] **Step 4: Run focused tests and verify GREEN.**
- [ ] **Step 5: Commit `fix: make route motion visible and stable`.**

### Task 4: Full verification and browser handoff

**Files:**
- Modify: `.superpowers/sdd/2026-08-13-suetavpn-react-mvp-redesign/progress.md`, `C:/Users/shakke/Desktop/ЗАКАЗЫ/SuetaVPN/мозги/bdopus.md`

- [ ] **Step 1: Run `npm run test:run`, `npm run typecheck`, `npm run build` and `git diff --check`.**
- [ ] **Step 2: Run Browser QA at 1440px and 360px in dark/light themes, checking landing, auth, dashboard and bottom-nav transitions, screenshots, horizontal overflow and console logs.**
- [ ] **Step 3: Record evidence and remaining limitations in the progress ledger and `bdopus.md`.**
- [ ] **Step 4: Request a focused review of the visual diff before pushing.**
