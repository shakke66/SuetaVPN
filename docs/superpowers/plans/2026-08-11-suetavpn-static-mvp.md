# SuetaVPN Static MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать полностью интерактивный статический MVP лендинга и личного кабинета SuetaVPN, проверить его и опубликовать через GitHub Pages.

**Architecture:** Статическое приложение без сборщика состоит из доступного HTML shell, единого CSS design system, чистой локальной модели `mvp-core.js` и DOM-контроллера `app.js`. Все будущие backend-операции представлены чистыми функциями с единым результатом `{ ok, state, message, code }`, поэтому их можно заменить API-адаптером без переделки экранов.

**Tech Stack:** HTML5, CSS3, browser JavaScript, CommonJS-compatible core, Node.js built-in test runner, GitHub Actions Pages.

## Global Constraints

- Работать только в `C:\Users\shakke\Desktop\ЗАКАЗЫ\SuetaVPN\сайт` и в двух утверждённых документах `docs/superpowers/`.
- Не переносить production-бандлы референса, реальные данные аккаунта, токены, cookies, идентификаторы и секреты.
- Не выполнять запросы к production backend; все бизнес-действия помечаются как демонстрационные.
- Тёмная палитра использует `#121212`, `#292929`, `#EDEDED`, `#B0B0B0`, `#383838`.
- Светлая палитра использует `#F5F6F8`, `#FFFFFF`, `#FAFAFB`, `#191A1D`, `#6E7178`, `#E2E4E8`, `#383838`.
- Фон статичен: noise и неподвижные radial-gradient без Canvas, частиц, метеоров и бесконечных декоративных animations.
- Состояние хранится только под ключом `suetavpn_mvp_v1`.
- Диапазон пополнения: `100–50000 ₽`; промокод `SUETA10` один раз начисляет `100 ₽`.
- Все новые формы имеют labels, validation, keyboard flow и понятные error states.
- Перед публикацией обязательны unit tests, desktop/mobile browser QA, console check, responsive check и проверка публичного дерева на секреты.

---

### Task 1: Чистая модель данных с TDD

**Files:**
- Create: `сайт/tests/mvp-core.test.cjs`
- Create: `сайт/mvp-core.js`

**Interfaces:**
- Produces: `createInitialState()`, `hydrateState(raw)`, `topUp(state, amount, method, now)`, `applyPromo(state, code, now)`, `purchase(state, tariffId, months, now)`, `createTicket(state, fields, now)`, `replyTicket(state, ticketId, message, now)`, `linkEmail(state, email)`, `setNotification(state, key, value)`, `resetState()`.
- Every mutation returns `{ ok: boolean, state: object, message: string, code?: string }` and never mutates its input.

- [ ] **Step 1: Write failing tests for state hydration and immutability**

```js
test('hydrateState restores defaults from malformed JSON', () => {
  assert.deepEqual(core.hydrateState('{broken'), core.createInitialState());
});

test('topUp adds a transaction without mutating the input', () => {
  const before = core.createInitialState();
  const result = core.topUp(before, 500, 'СБП', '2026-08-11T10:00:00.000Z');
  assert.equal(result.state.balance, before.balance + 500);
  assert.equal(before.transactions.length, 2);
});
```

- [ ] **Step 2: Run RED state tests**

Run: `node --test tests/mvp-core.test.cjs`

Expected: FAIL because `../mvp-core.js` does not exist.

- [ ] **Step 3: Add failing tests for validation and domain actions**

Cover literal outcomes for `99`, `100`, `50000`, `50001`, first/repeated `SUETA10`, sufficient/insufficient purchase, empty/valid ticket, unknown ticket reply, invalid/valid email and unknown notification key.

- [ ] **Step 4: Implement the minimal CommonJS/browser-compatible core**

Use an IIFE that assigns `module.exports` under Node and `window.SuetaCore` in the browser. Clone changed arrays/objects and generate deterministic IDs from the supplied `now` argument.

- [ ] **Step 5: Run GREEN core tests**

Run: `node --test tests/mvp-core.test.cjs`

Expected: all tests pass with zero warnings.

- [ ] **Step 6: Commit Task 1**

```powershell
git add mvp-core.js tests/mvp-core.test.cjs
git commit -m "feat: add tested MVP state model"
```

### Task 2: HTML shell, design system and public landing

**Files:**
- Modify: `сайт/index.html`
- Create: `сайт/styles.css`
- Create: `сайт/app.js`

**Interfaces:**
- Consumes: `window.SuetaCore`.
- Produces: `window.SuetaMvp` controller with `navigate(route)`, `openModal(content, options)`, `closeModal()`, `showToast(message, type)`, `resetDemo()` for browser QA.

- [ ] **Step 1: Replace the monolithic document with an accessible shell**

Add skip link, `#app`, shared SVG symbol sprite, `#modal-root`, `#toast-root`, live region and deferred scripts in the order `mvp-core.js`, `app.js`.

- [ ] **Step 2: Implement CSS tokens and static background**

Define dark/light custom properties, static `body::before` noise, fixed non-animated radial gradients, focus-visible styles, component primitives, reduced-motion overrides and responsive breakpoints at `640px`, `768px`, `1024px`.

- [ ] **Step 3: Render the landing route**

Render header, hero, trust metrics, four tariffs, benefits, three connection steps, three reviews, FAQ and footer. Header links scroll to sections; tariff CTA stores the chosen plan, starts the demo session and opens `#/purchase`.

- [ ] **Step 4: Implement theme and demo entry**

Theme buttons update `data-theme`, `meta[name=theme-color]` and persisted state. «Личный кабинет» and «Попробовать демо» set `sessionActive=true` and navigate to `#/dashboard`.

- [ ] **Step 5: Commit Task 2**

```powershell
git add index.html styles.css app.js
git commit -m "feat: build responsive SuetaVPN landing"
```

### Task 3: Cabinet routes and working interactions

**Files:**
- Modify: `сайт/app.js`
- Modify: `сайт/styles.css`

**Interfaces:**
- Consumes all Task 1 mutations.
- Routes: `#/dashboard`, `#/subscriptions`, `#/purchase`, `#/balance`, `#/referral`, `#/support`, `#/info`, `#/profile`.

- [ ] **Step 1: Build shared cabinet shell**

Implement desktop header, mobile header/drawer, five-item bottom navigation, active state, safe-area padding and logout to landing. Profile and Information remain reachable through the mobile drawer.

- [ ] **Step 2: Build Dashboard and connection modal**

Render subscription, traffic, devices, balance, referrals and quick actions. Connection modal provides platform tabs, demo URL copy and a Blob download named `suetavpn-demo-config.txt` whose first line states that it is not a real VPN configuration.

- [ ] **Step 3: Build Subscriptions and Purchase**

Render active state, plan cards, period selector and computed total. Purchase calls `SuetaCore.purchase`; success navigates to subscriptions and insufficient funds opens a choice to visit Balance.

- [ ] **Step 4: Build Balance**

Wire promocode, amount input/range, payment method, top-up and collapsible transaction history to the core. All outcomes update the same rendered state and announce toasts.

- [ ] **Step 5: Build Referral and Support**

Copy/share referral links with fallbacks. Create and select tickets, validate form fields, show selected attachment name and add local replies.

- [ ] **Step 6: Build Information and Profile**

Add tabs, FAQ accordions, email linking, notification switches, theme controls, onboarding replay and demo reset confirmation.

- [ ] **Step 7: Commit Task 3**

```powershell
git add app.js styles.css
git commit -m "feat: add interactive MVP cabinet"
```

### Task 4: Onboarding, modal accessibility and documentation

**Files:**
- Modify: `сайт/app.js`
- Modify: `сайт/styles.css`
- Create: `сайт/README.md`

**Interfaces:**
- Onboarding targets: `welcome`, `subscription`, `connect-devices`, `balance`, `quick-actions`.

- [ ] **Step 1: Implement five-step onboarding**

Use `data-onboarding`, `getBoundingClientRect`, viewport-constrained tooltip, resize/scroll recalculation and Back/Next/Finish/Skip. Completion updates `onboardingCompleted` in persisted state.

- [ ] **Step 2: Complete modal and keyboard behavior**

Open modal with `role=dialog`, focus the first control, trap Tab, close on Escape/backdrop, restore opener focus and lock document scroll.

- [ ] **Step 3: Write run and demo documentation**

Document `python -m http.server 4173`, routes, demo promocode, local-only nature, reset control and backend integration boundary. Do not include secrets or production endpoints.

- [ ] **Step 4: Commit Task 4**

```powershell
git add app.js styles.css README.md
git commit -m "feat: add onboarding and accessible dialogs"
```

### Task 5: Verification and defect fixes

**Files:**
- Modify only files implicated by verified defects.

- [ ] **Step 1: Run unit and syntax verification**

```powershell
node --test tests/mvp-core.test.cjs
node --check mvp-core.js
node --check app.js
```

- [ ] **Step 2: Serve locally and verify desktop**

Run `python -m http.server 4173 --bind 127.0.0.1`. In Browser verify landing, all routes, dark/light themes, purchase, top-up, promo, copy, ticket, profile, reset, onboarding and zero console errors at `1440x900`.

- [ ] **Step 3: Verify mobile and accessibility**

At `390x844`, verify no horizontal overflow, bottom navigation, drawer access to Profile/Information, visible focus, Escape, Tab trap, accordions and reduced motion.

- [ ] **Step 4: Run independent review and fix proven defects with regression tests when core behavior changes**

Review against the design spec, inspect changed files and re-run Steps 1–3 after fixes.

- [ ] **Step 5: Commit verification fixes**

```powershell
git add -A
git commit -m "fix: address MVP verification findings"
```

Skip this commit only if `git status --short` is empty.

### Task 6: Private repository, Pages, Telegram delivery and project log

**Files:**
- Create: `сайт/.github/workflows/pages.yml`
- Modify: `мозги/bdopus.md`

**Interfaces:**
- Repository: `shakke66/suetavpn-site-mvp`, visibility `PRIVATE`.
- Published artifact contains only tracked files from `сайт/`.

- [ ] **Step 1: Add Pages workflow**

Use official `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`, triggered on pushes to `main`, with `pages: write` and `id-token: write` permissions.

- [ ] **Step 2: Audit tracked tree before publication**

Run `git status --short`, `git ls-files`, secret-pattern scan and inspect repository visibility. Confirm that no parent-directory file is tracked.

- [ ] **Step 3: Create/push private GitHub repository and enable Pages**

Use `gh` only. If account plan rejects private Pages, preserve the private repository and report the exact platform limitation rather than making the repository public.

- [ ] **Step 4: Verify the deployed URL**

Wait for the Pages workflow, fetch the final URL, load it in Browser at desktop/mobile sizes and repeat the smoke flow with zero console errors.

- [ ] **Step 5: Send the verified URL through the explicitly supplied Telegram bot**

Send one message only to the explicitly supplied chat ID. Keep the token ephemeral, never print it, never store it, never commit it and report only Telegram API success/failure without response secrets.

- [ ] **Step 6: Update `bdopus.md`**

Append a dated entry with the local directory, private repository name, Pages URL, implemented scope, verification commands, known backend boundary and rollback note. Do not add the bot token or chat ID.

- [ ] **Step 7: Final verification**

Re-run unit/syntax tests, confirm `git status --short` is clean, confirm Pages returns HTTP 200 and confirm `bdopus.md` contains the new dated entry.
