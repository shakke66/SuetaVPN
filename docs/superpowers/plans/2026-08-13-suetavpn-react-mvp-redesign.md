# SuetaVPN React MVP Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current monolithic static MVP with a production-shaped React application that preserves the approved SuetaVPN UI while keeping all flows locally functional until backend adapters are connected.

**Architecture:** A Vite + React + TypeScript hash-routed SPA uses a persistent `AppShell`, pure domain operations, versioned storage migrations, and async adapter contracts. Pages depend on `AppProvider`, never on `localStorage`; CSS design tokens provide the approved light theme and deeper Gaz-like dark theme, while a route transition coordinator keeps navigation smooth.

**Tech Stack:** React 19, Vite 8, TypeScript 7, React Router 7, Vitest 4, React Testing Library 16, jsdom, semantic HTML, CSS custom properties, GitHub Actions/Pages.

**Spec:** `docs/superpowers/specs/2026-08-13-suetavpn-react-mvp-redesign-design.md`

## Global Constraints

- Work only inside `C:\Users\shakke\Desktop\ЗАКАЗЫ\SuetaVPN\сайт`, except copying the approved logo asset and updating `C:\Users\shakke\Desktop\ЗАКАЗЫ\SuetaVPN\мозги\bdopus.md` after verification.
- User-visible copy must not contain `DEMO`, «демо» or «демонстрационный» in either locale.
- The only plans are БАЗА and ЭЛИТА, with exact period prices from the spec; do not derive totals from the old percentage-discount model.
- Use a static background: no Canvas, particles, moving lines, infinite decorative keyframes or `requestAnimationFrame` loops.
- Keep light theme visually consistent with the approved current theme; make dark theme use `#101111` background and `#242525–#292A2A` surfaces.
- Keep `AppShell`, header, drawer and bottom navigation mounted while protected routes change.
- Main mobile navigation order is Dashboard → Subscriptions → Balance → Referral → Support, with a directional `260 ms` transition and a no-motion fallback.
- Persist RU/EN, theme and application state; support migration from `suetavpn_mvp_v1`.
- Do not access production APIs, databases, credentials or Telegram validation endpoints.
- Preserve unrelated user changes. Run fresh tests and Browser QA before claiming completion.

## Target File Map

- `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts` — toolchain and scripts.
- `index.html`, `src/main.tsx`, `src/app/App.tsx` — Vite entry and application composition.
- `src/domain/types.ts` — stable state and result contracts.
- `src/domain/tariffs.ts` — the two-plan production snapshot and price lookup.
- `src/domain/state.ts` — defaults and persistence keys.
- `src/domain/migrations.ts` — v1 repair/migration and v2 hydration.
- `src/domain/operations.ts` — atomic balance, purchase, promo, ticket and notification operations.
- `src/adapters/contracts.ts`, `src/adapters/local/createLocalAdapters.ts` — backend-replaceable async boundary.
- `src/app/AppProvider.tsx` — reducer, persistence and commands exposed to React.
- `src/i18n/messages.ts`, `src/i18n/I18nProvider.tsx` — complete typed RU/EN strings and formatting.
- `src/app/routes.tsx`, `src/app/ProtectedRoute.tsx`, `src/app/RouteTransition.tsx` — route registry, guard and persistent transitions.
- `src/layouts/PublicLayout.tsx`, `src/layouts/AppShell.tsx` — stable public/protected shells.
- `src/components/*` — brand, buttons, icons, accordion, popover, drawer, navigation, modal, toast and onboarding.
- `src/pages/*` — Landing, Auth, Dashboard, Subscriptions, Purchase, Balance, Referral, Support, Info and Profile.
- `src/styles/tokens.css`, `global.css`, `components.css`, `pages.css`, `responsive.css`, `motion.css` — design system and responsive implementation.
- `src/**/*.test.ts(x)` — pure-domain and component tests.
- `.github/workflows/pages.yml`, `README.md` — build/deploy and usage documentation.

---

### Task 1: Scaffold the React/Vite application and test harness

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `vite.config.ts`
- Modify: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`
- Create: `src/assets/suetavpn-logo.jpg`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `App(): JSX.Element`, scripts `dev`, `build`, `preview`, `test`, `test:run`, `typecheck`.
- Consumes: the approved source image `C:\Users\shakke\Downloads\photo_2026-08-01_20-49-48.jpg`.

- [ ] **Step 1: Write the failing render test**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the SuetaVPN application root', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'SuetaVPN' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Add the Vite/TypeScript manifests and install exact dependencies**

Use React, React DOM and React Router as runtime dependencies; use Vite, TypeScript, Vitest, jsdom, React Testing Library, jest-dom and user-event as development dependencies. Configure `base: './'`, jsdom, `setupFiles: ['./src/test/setup.ts']`, and coverage exclusions for generated assets.

Run: `npm install`

- [ ] **Step 3: Run the new test and verify the red state**

Run: `npm run test:run -- src/app/App.test.tsx`

Expected: FAIL because `App` or its implementation does not exist.

- [ ] **Step 4: Add the minimal React entry and copy the approved binary logo**

```tsx
export function App() {
  return <main><h1>SuetaVPN</h1></main>;
}
```

Use `Copy-Item -LiteralPath` for the JPEG; do not encode or rewrite it through a text tool.

- [ ] **Step 5: Verify scaffold and commit**

Run: `npm run typecheck; npm run test:run; npm run build`

Expected: all commands exit `0`, and `dist/index.html` exists.

Commit: `chore: scaffold React Vite application`

---

### Task 2: Implement the typed tariff catalog and versioned state migration

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/tariffs.ts`
- Create: `src/domain/state.ts`
- Create: `src/domain/migrations.ts`
- Create: `src/domain/migrations.test.ts`
- Create: `src/domain/tariffs.test.ts`

**Interfaces:**
- Produces: `AppStateV2`, `Tariff`, `Ticket`, `TicketNotification`, `Result<T>`, `TARIFFS`, `getTariff(id)`, `getPrice(tariffId, months)`, `createInitialState()`, `hydrateState(rawV2, rawV1)`.
- Consumes: no React APIs.

- [ ] **Step 1: Write failing catalog tests for all exact prices**

```ts
expect(getPrice('base', 1)).toBe(250);
expect(getPrice('base', 3)).toBe(490);
expect(getPrice('base', 6)).toBe(940);
expect(getPrice('base', 12)).toBe(1390);
expect(getPrice('elite', 1)).toBe(310);
expect(getPrice('elite', 3)).toBe(690);
expect(getPrice('elite', 6)).toBe(1290);
expect(getPrice('elite', 12)).toBe(1990);
expect(TARIFFS.map(({ id }) => id)).toEqual(['base', 'elite']);
```

- [ ] **Step 2: Write failing migration tests**

Cover invalid JSON, missing fields, persisted light theme and EN locale, old `start`/`family` selection falling back to `base`, preserved balance/transactions/tickets, removal of `cabinetLink`, and idempotent v2 hydration.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `npm run test:run -- src/domain/tariffs.test.ts src/domain/migrations.test.ts`

Expected: FAIL with missing modules/exports.

- [ ] **Step 4: Implement the types, exact catalog, defaults and defensive migration**

```ts
export const TARIFFS = [
  { id: 'base', devices: 4, locations: 4, speedGbps: 1,
    prices: { 1: 250, 3: 490, 6: 940, 12: 1390 }, traffic: { kind: 'unlimited' } },
  { id: 'elite', devices: 6, locations: 6, speedGbps: 10,
    prices: { 1: 310, 3: 690, 6: 1290, 12: 1990 }, traffic: { kind: 'bypass', bypassGb: 40 } },
] as const satisfies readonly Tariff[];
```

Use `STORAGE_KEY = 'suetavpn_app_v2'` and `LEGACY_STORAGE_KEY = 'suetavpn_mvp_v1'`. The hydrator must validate every collection/member and return fresh defaults instead of throwing.

- [ ] **Step 5: Run tests, typecheck and commit**

Run: `npm run test:run -- src/domain; npm run typecheck`

Commit: `feat: add tariff catalog and state migration`

---

### Task 3: Implement atomic domain operations and local adapter contracts

**Files:**
- Create: `src/domain/operations.ts`
- Create: `src/domain/operations.test.ts`
- Create: `src/adapters/contracts.ts`
- Create: `src/adapters/local/createLocalAdapters.ts`
- Create: `src/adapters/local/createLocalAdapters.test.ts`

**Interfaces:**
- Produces: `topUp`, `applyPromo`, `purchaseSubscription`, `createTicket`, `replyToTicket`, `markNotificationRead`, `markAllNotificationsRead`, `createLocalAdapters(options)`.
- Each operation returns `Result<AppStateV2>` with stable `code` and `messageKey`; adapters return promises to preserve the future HTTP boundary.

- [ ] **Step 1: Write failing operation tests**

Test amount boundaries `100`/`50000`, rejection at `99`/`50001`, one-time `SUETA10`, all exact purchase totals, insufficient balance without mutation, atomic transaction/subscription updates, active same-plan extension, immediate plan change, ticket creation and ticket-only notifications.

```ts
const result = purchaseSubscription(stateWithBalance(1000), 'elite', 3, NOW);
expect(result.ok).toBe(true);
expect(result.state.wallet.balance).toBe(310);
expect(result.state.subscription?.tariffId).toBe('elite');
expect(result.state.wallet.transactions[0].amount).toBe(-690);
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm run test:run -- src/domain/operations.test.ts`

- [ ] **Step 3: Implement immutable operations with one-state-return atomicity**

No operation mutates its input. Purchase derives totals only from `getPrice`. Top-up accepts only `sbp | card` but never collects payment credentials. Creating a ticket prepends a `ticket-created` unread notification; replies authored by the local user do not impersonate support.

- [ ] **Step 4: Add async adapter contracts and deterministic test delays**

```ts
export interface BillingAdapter {
  topUp(state: AppStateV2, request: TopUpRequest): Promise<Result<AppStateV2>>;
}
export interface SubscriptionAdapter {
  purchase(state: AppStateV2, tariffId: TariffId, months: Period): Promise<Result<AppStateV2>>;
}
```

Default local delay is short enough for UI feedback; tests inject `delayMs: 0` and a clock/id source.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/domain src/adapters; npm run typecheck`

Commit: `feat: add local application adapters`

---

### Task 4: Add complete RU/EN localization and the application provider

**Files:**
- Create: `src/i18n/messages.ts`
- Create: `src/i18n/I18nProvider.tsx`
- Create: `src/i18n/messages.test.ts`
- Create: `src/app/AppProvider.tsx`
- Create: `src/app/AppProvider.test.tsx`

**Interfaces:**
- Produces: `useI18n(): { locale, t, formatMoney, formatDate, setLocale }`, `useApp(): AppContextValue`, command methods for auth/preferences/billing/subscriptions/tickets/notifications.
- Consumes: domain and adapter interfaces from Tasks 2–3.

- [ ] **Step 1: Write failing locale parity and formatting tests**

Flatten both message dictionaries and assert identical key sets, no empty values, no banned demo wording, `html.lang` updates, Russian/English currency/date formatting, and persistence after locale/theme commands.

- [ ] **Step 2: Write a provider persistence test**

Render a probe component, dispatch `setTheme('light')` and `setLocale('en')`, then assert `suetavpn_app_v2` contains both preferences and the document attributes changed without remounting the provider.

- [ ] **Step 3: Run tests and verify failure**

Run: `npm run test:run -- src/i18n src/app/AppProvider.test.tsx`

- [ ] **Step 4: Implement typed dictionaries and provider commands**

Use nested `as const` Russian messages as the structural source, a type-safe dot-path lookup, interpolation for `{amount}`/`{name}`, and an English dictionary with the same shape. Persist only after successful state transitions; expose pending command names so submit buttons can prevent duplicates.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/i18n src/app/AppProvider.test.tsx; npm run typecheck`

Commit: `feat: add localized application state provider`

---

### Task 5: Build hash routing, local authorization and protected-route behavior

**Files:**
- Create: `src/app/routes.tsx`
- Create: `src/app/ProtectedRoute.tsx`
- Create: `src/layouts/PublicLayout.tsx`
- Create: `src/pages/AuthPage.tsx`
- Create: `src/pages/AuthPage.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/adapters/contracts.ts`
- Modify: `src/adapters/local/createLocalAdapters.ts`

**Interfaces:**
- Produces: route registry with `/`, `/auth`, protected cabinet routes; `AuthAdapter.startEmail`, `verifyEmail`, `loginTelegram`, `logout`, `detectTelegramUser`.
- Consumes: `AppProvider`, `I18nProvider`.

- [ ] **Step 1: Write failing route/auth tests**

Cover unauthenticated `#/balance → #/auth`, preservation/return to requested route, local Telegram pending/success, email login/register tabs, invalid email, wrong/expired six-digit code, successful verification, legacy `#/welcome → #/`, and Telegram Mini App auto-auth with no logout action.

- [ ] **Step 2: Run the focused suite and confirm failure**

Run: `npm run test:run -- src/pages/AuthPage.test.tsx`

- [ ] **Step 3: Implement the local auth adapter and honest challenge flow**

The screen displays a locally generated verification code in a clearly labelled local verification panel and never claims an email was sent. Telegram browser login creates a local session; Mini App detection reads only `initDataUnsafe.user` and documents that validation belongs to backend.

- [ ] **Step 4: Implement `HashRouter`, guards and placeholders for protected pages**

```tsx
<HashRouter>
  <Routes>
    <Route element={<PublicLayout />}><Route index element={<LandingPage />} /></Route>
    <Route path="auth" element={<AuthPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppShell />} /> </Route>
  </Routes>
</HashRouter>
```

Use actual child route declarations, a catch-all redirect, and a `location.state.from` equivalent that survives the auth flow in provider UI state.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/pages/AuthPage.test.tsx src/app; npm run typecheck`

Commit: `feat: add local auth and protected routes`

---

### Task 6: Implement the design system, persistent AppShell and route transitions

**Files:**
- Create: `src/styles/tokens.css`, `global.css`, `components.css`, `motion.css`, `responsive.css`
- Create: `src/components/Icon.tsx`, `Brand.tsx`, `Button.tsx`, `Drawer.tsx`, `NotificationPopover.tsx`, `BottomNavigation.tsx`
- Create: `src/layouts/AppShell.tsx`
- Create: `src/app/RouteTransition.tsx`
- Create: `src/layouts/AppShell.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: persistent desktop/mobile shell, `RouteTransition`, `NAV_ITEMS`, focus-managed drawer/popover, two-theme token system.
- Consumes: route registry, i18n and app context.

- [ ] **Step 1: Write failing shell tests**

Assert the header node identity survives navigation, bottom order is exact, notification panel contains only ticket events, unread badge/mark-all work, drawer returns focus on `Escape`, logout is absent in Mini App, and active navigation changes without remounting `AppShell`.

- [ ] **Step 2: Write the transition unit test**

Use fake timers: dashboard→balance yields `forward`, balance→subscriptions yields `backward`, outgoing and incoming layers coexist before `260 ms`, outgoing disappears afterward, and reduced-motion renders only the destination layer.

- [ ] **Step 3: Run focused tests and confirm failure**

Run: `npm run test:run -- src/layouts/AppShell.test.tsx src/app/RouteTransition.test.tsx`

- [ ] **Step 4: Implement tokens, shell, popovers and transition coordinator**

The route viewport uses two overlapping grid layers during transitions. Outgoing layers are `aria-hidden` and non-interactive. Header, drawer and bottom navigation sit outside that viewport. Theme controls use action-oriented labels; notification popover closes on outside click/Escape and restores focus.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/layouts src/app; npm run typecheck`

Commit: `feat: build persistent responsive app shell`

---

### Task 7: Rebuild the public landing page and reusable accordions

**Files:**
- Create: `src/components/Accordion.tsx`
- Create: `src/components/Accordion.test.tsx`
- Create: `src/pages/LandingPage.tsx`
- Create: `src/pages/LandingPage.test.tsx`
- Create: `src/styles/landing.css`
- Modify: `src/styles/components.css`

**Interfaces:**
- Produces: accessible multi-open `Accordion`, complete public landing with tariff CTA→auth draft flow.
- Consumes: `TARIFFS`, `useI18n`, `Brand`, public theme/locale controls.

- [ ] **Step 1: Write failing accordion and landing tests**

Verify equal header structure, multiple items can remain open, the first landing answer starts open, keyboard activation updates `aria-expanded`, and tariff CTA stores the selected tariff then routes to auth. Assert only БАЗА/ЭЛИТА render and banned copy is absent.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:run -- src/components/Accordion.test.tsx src/pages/LandingPage.test.tsx`

- [ ] **Step 3: Implement the full landing composition**

Include sticky header, hero, trust/features, two tariff cards with exact catalog facts, connection steps, support/value section, reviews, FAQ and footer. Preserve a static backdrop. CTA targets are real routes or in-page anchors; there are no dead buttons.

- [ ] **Step 4: Implement smooth real-height accordion behavior**

Use a CSS grid inner wrapper (`grid-template-rows: 0fr/1fr`) plus opacity and chevron rotation. Do not toggle the content with immediate `hidden` while closing.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/components/Accordion.test.tsx src/pages/LandingPage.test.tsx; npm run typecheck`

Commit: `feat: rebuild localized public landing`

---

### Task 8: Implement dashboard, subscriptions and the exact-price purchase flow

**Files:**
- Create: `src/pages/DashboardPage.tsx`
- Create: `src/pages/SubscriptionsPage.tsx`
- Create: `src/pages/PurchasePage.tsx`
- Create: `src/pages/PurchasePage.test.tsx`
- Create: `src/components/TariffCard.tsx`, `SubscriptionCard.tsx`, `ConnectDeviceDialog.tsx`
- Create: `src/styles/subscriptions.css`

**Interfaces:**
- Produces: working dashboard and purchase route using provider commands.
- Consumes: exact catalog, app shell, modal primitives, route navigation.

- [ ] **Step 1: Write failing page tests**

Assert dashboard balance/referral cards are horizontal components, Base shows unlimited traffic, Elite shows 40 GB bypass, subscriptions omits «Доступные тарифы», purchase renders exactly two plans and four periods, exact totals update, success debits balance, insufficient funds routes to top-up while retaining draft, and active same-plan purchase extends expiration.

- [ ] **Step 2: Run test and verify failure**

Run: `npm run test:run -- src/pages/PurchasePage.test.tsx`

- [ ] **Step 3: Implement the three screens and connection dialog**

Purchase desktop markup uses a two-column grid where the summary has `align-self: stretch` and flex-column content, so its outer edges equal the complete left stack. On `<768 px`, plans stack; on `768–1023 px`, summary moves below the two-column plan grid.

- [ ] **Step 4: Add loading/error/success and focus behavior**

Disable the CTA while pending; place insufficient-funds error near the summary CTA; focus the error heading; preserve the selected plan/month after navigation to balance.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/pages/PurchasePage.test.tsx src/domain/operations.test.ts; npm run typecheck`

Commit: `feat: add subscription purchase experience`

---

### Task 9: Implement the vertical balance flow and simplified referrals

**Files:**
- Create: `src/pages/BalancePage.tsx`
- Create: `src/pages/BalancePage.test.tsx`
- Create: `src/pages/ReferralPage.tsx`
- Create: `src/pages/ReferralPage.test.tsx`
- Create: `src/components/TransactionHistory.tsx`
- Create: `src/styles/wallet.css`

**Interfaces:**
- Produces: top-up/promo/history UI and Telegram-only referrals.
- Consumes: billing adapter commands and accordion motion primitive.

- [ ] **Step 1: Write failing balance tests**

Verify visual DOM order balance→promo→top-up→history, history initially collapsed, `100–50000` validation, synchronized range/number inputs, two payment methods without card-number fields, submit locking, balance/history atomic update, promo success/error, and persisted state after reload.

- [ ] **Step 2: Write failing referral tests**

Assert four stats and Telegram link are visible, cabinet link and recent invitees are absent, Clipboard API is used with fallback, and Web Share fallback copies the Telegram URL.

- [ ] **Step 3: Run focused tests and confirm failure**

Run: `npm run test:run -- src/pages/BalancePage.test.tsx src/pages/ReferralPage.test.tsx`

- [ ] **Step 4: Implement pages and spacious responsive styles**

Use one full-width vertical content column, `clamp()` spacing and no fixed empty-height containers. Transaction history reuses the smooth disclosure primitive and displays a compact empty state.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/pages/BalancePage.test.tsx src/pages/ReferralPage.test.tsx; npm run typecheck`

Commit: `feat: add wallet and referral flows`

---

### Task 10: Implement tickets, information, profile and flicker-free onboarding

**Files:**
- Create: `src/pages/SupportPage.tsx`, `SupportPage.test.tsx`
- Create: `src/pages/InfoPage.tsx`, `InfoPage.test.tsx`
- Create: `src/pages/ProfilePage.tsx`, `ProfilePage.test.tsx`
- Create: `src/components/Onboarding.tsx`, `Onboarding.test.tsx`
- Create: `src/components/Modal.tsx`, `ToastRegion.tsx`
- Create: `src/styles/support.css`, `info.css`, `onboarding.css`

**Interfaces:**
- Produces: ticket flows that feed the notification popover, three information tabs, minimal profile, stable onboarding overlay.
- Consumes: app commands, `Accordion`, modal/focus primitives and i18n.

- [ ] **Step 1: Write failing support and notification integration tests**

Create a ticket, assert inline validation, saved message/status/attachment name, unread bell event, notification click selecting the exact ticket, read state persistence, user reply behavior and empty-list state.

- [ ] **Step 2: Write failing info/profile tests**

Assert exactly FAQ/Agreement/Privacy tabs, no Rules/Offer/Statuses, equal FAQ header classes and multi-open behavior, document placeholders, profile fields, and absence of theme/reset/session/onboarding blocks.

- [ ] **Step 3: Write the onboarding no-flash test**

Mock target rectangles and `ResizeObserver`; assert the overlay remains visually hidden until coordinates are calculated, is never rendered at `left: 0; top: 0`, retains the same overlay node between Next steps, and completes/persists correctly.

- [ ] **Step 4: Implement pages, modal/toast and onboarding**

Onboarding mounts one portal overlay, measures in `useLayoutEffect`, sets a `ready` flag only after both target and tooltip geometry are valid, and updates positions on `ResizeObserver`, scroll and resize. It must not remount the portal per step.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run -- src/pages/SupportPage.test.tsx src/pages/InfoPage.test.tsx src/pages/ProfilePage.test.tsx src/components/Onboarding.test.tsx; npm run typecheck`

Commit: `feat: complete support and account screens`

---

### Task 11: Complete responsive, accessibility and regression coverage

**Files:**
- Modify: all `src/styles/*.css` where Browser QA identifies defects
- Create: `src/app/application.e2e-smoke.test.tsx`
- Modify: existing component tests for keyboard and reduced motion gaps
- Remove: `app.js`, `mvp-core.js`, `styles.css`, `tests/mvp-core.test.cjs` only after replacement coverage is green

**Interfaces:**
- Produces: fully migrated React source without legacy runtime ambiguity.
- Consumes: all prior tasks.

- [ ] **Step 1: Add an end-to-end component smoke test**

Exercise landing→auth→dashboard→top-up→purchase→ticket→notification→logout using user-event. Assert the shell node persists across protected navigation and state rehydrates after unmount/remount.

- [ ] **Step 2: Run the complete suite before deleting legacy files**

Run: `npm run typecheck; npm run test:run; npm run build`

Expected: PASS. If any behavior only exists in the legacy files, add replacement coverage before removal.

- [ ] **Step 3: Remove legacy runtime files and run secret/path/copy scans**

Run searches for `DEMO|демо|демонстрац`, legacy absolute user-profile paths, old tariff ids/names, Canvas/particle/background animation, and obvious secret patterns. User-facing source must have zero banned-copy matches; test fixtures/migration code may mention legacy ids only where required.

- [ ] **Step 4: Perform local Browser QA at the required widths**

Run the Vite server and inspect `360`, `390`, `768`, `1024`, `1440 px` in both themes and both locales. Exercise auth, all routes, direction transitions, top-up, purchase, ticket notification, drawer, popover, onboarding, keyboard focus, `Escape`, reduced motion and reload persistence. Record concrete results in the implementation log or README.

- [ ] **Step 5: Fix every observed issue and rerun fresh verification**

Run: `npm run typecheck; npm run test:run; npm run build; git diff --check`

Commit: `refactor: complete React MVP migration`

---

### Task 12: Update documentation, deployment and project handoff notes

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/pages.yml`
- Modify: `C:\Users\shakke\Desktop\ЗАКАЗЫ\SuetaVPN\мозги\bdopus.md`
- Delete: `.nojekyll` from the source root; the workflow publishes only Vite's `dist` artifact

**Interfaces:**
- Produces: reproducible local/CI build and an updated project log.
- Consumes: verified application from Task 11.

- [ ] **Step 1: Update README with actual commands and boundaries**

Document `npm ci`, `npm run dev`, `npm run typecheck`, `npm run test:run`, `npm run build`, the route list, local-only adapter boundary, state migration and future backend replacement points. Avoid banned demo wording in user-facing examples.

- [ ] **Step 2: Update Pages workflow**

Use Node 24, `npm ci`, typecheck, tests and build; upload only `dist`. Keep least-privilege Pages permissions and concurrency cancellation.

- [ ] **Step 3: Update `bdopus.md` through `apply_patch`**

Append a dated factual entry with architecture, completed screens, exact tariffs, tests/QA commands, commit IDs, publication status and any external blocker. Do not add secrets or bot credentials.

- [ ] **Step 4: Verify docs/CI and commit**

Run: `npm ci; npm run typecheck; npm run test:run; npm run build; git diff --check; git status --short`

Commit: `docs: document React MVP and deployment`

---

### Task 13: Independent review, GitHub publication and Telegram delivery

**Files:**
- Modify only files required by concrete review findings.
- No credential files may be created.

**Interfaces:**
- Produces: reviewed live Pages URL and one authorized Telegram delivery.
- Consumes: clean verified `main` branch.

- [ ] **Step 1: Request independent code/spec review**

Review domain correctness, migration, auth truthfulness, accessibility, persistent shell, exact pricing, responsive styles and secret exposure. Reproduce each Important/Critical finding before changing code.

- [ ] **Step 2: Apply confirmed findings with regression tests**

For each defect: add a failing test, verify red, implement the minimal correction, verify green, then rerun the complete suite and Browser smoke QA.

- [ ] **Step 3: Verify GitHub authorization and publish privately**

Run `gh auth status`, confirm account `shakke66`, inspect the indexed tree, create or use the explicitly scoped private repository, configure HTTPS through `gh`, push `main`, enable/trigger Pages and wait for the workflow. Never switch to public visibility automatically.

- [ ] **Step 4: Verify the live URL**

Open the deployed site, check asset loading, landing, auth, one protected route, mobile layout and console. Treat a workflow success without a working URL as incomplete.

- [ ] **Step 5: Send the verified link through the authorized bot and report completion**

Perform exactly one Telegram Bot API message to the previously supplied chat ID, containing only a short description and the verified URL. Do not echo, log, persist or commit the token. Recommend rotating the already exposed token afterward.

- [ ] **Step 6: Final repository verification**

Run: `git status --short; git log --oneline -10; npm run typecheck; npm run test:run; npm run build`

Expected: clean tree, all checks pass, and publication/delivery evidence is recorded without secrets.
