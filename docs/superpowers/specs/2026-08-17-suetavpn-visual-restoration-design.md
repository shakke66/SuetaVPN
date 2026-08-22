# SuetaVPN visual restoration design

**Date:** 17 August 2026  
**Status:** approved in chat

## Goal

Restore the visual language of the pre-React SuetaVPN MVP while keeping the current React/Vite/TypeScript architecture, local state/adapters, routes and production content rules. The dark theme becomes deeper and calmer like Gaz Network; the light theme keeps its current neutral treatment.

## What is restored

- strong display typography and generous old-MVP spacing;
- static landing hero with the cabinet preview composition;
- dense pill-like cabinet header and clear section hierarchy;
- large welcome/subscription surface followed by compact balance and referral surfaces;
- high-contrast white primary actions, charcoal raised cards and quiet borders;
- old-MVP card radii, borders and hover language without reintroducing demo copy.

## What is deliberately not restored

- `app.js`/`mvp-core.js` full-document rendering or manual route listeners;
- `СТАРТ` and `СЕМЬЯ` tariffs;
- `DEMO`/«демо» labels, fake cabinet links in referrals, last-invited list or removed legal pages;
- animated particles, meteors or any moving decorative background;
- direct production API, payment or Telegram validation.

## Motion contract

`AppShell` remains mounted. Desktop route entry uses a calm vertical fade/translate with staggered direct page blocks; mobile route entry preserves the tapped bottom-navigation direction with a stronger horizontal translate. The active bottom-navigation pill travels to the new item. The route viewport gets a stable minimum height and the new route scrolls to its top without a full reload. `prefers-reduced-motion` still disables movement.

## Visual tokens

Dark surfaces use a static `#0d0e0e` background, `#171818` cards, `#202121` raised controls and `#303131` borders. Text is near-white, secondary text remains readable, and the official SuetaVPN logo stays the brand accent. Light-theme tokens remain compatible with the current approved white theme.

## Verification

The change must pass the existing Vitest suite, typecheck, production build and diff check. Browser QA must cover landing, auth, dashboard, bottom navigation, dark/light themes at desktop and 360px mobile, with no horizontal overflow or console errors.
