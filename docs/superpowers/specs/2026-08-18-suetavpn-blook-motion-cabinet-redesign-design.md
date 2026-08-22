# SuetaVPN cabinet and Blook-inspired motion design

**Date:** 18 August 2026  
**Status:** implemented

## Goal

Finish the current React MVP as a coherent product: a static, readable landing hero and a predictable personal cabinet on desktop and mobile. The visual reference is the calm composition of Blook: one strong product surface and short, restrained entrance reveals.

## Motion contract

- The hero is static and readable from the first render; the old looping dots, path, cabinet preview and delayed menu are removed from the visible composition.
- Lower landing sections reveal once as they enter the viewport. There are no page-wide particles, falling shapes, rotating layers or infinite content loops.
- Route changes keep the mounted shell and switch content synchronously. No full-document reload, route animation or height collapse is used.
- All motion has a `prefers-reduced-motion` fallback.

## Layout contract

- Dashboard heading, subscription, horizontal balance/referral cards and quick actions form one vertical rhythm.
- Every protected page uses the same max width and horizontal gutters.
- Mobile keeps 16px safe gutters, reserves space for the bottom navigation and hides desktop-only connect/logout controls where appropriate.
- Support shows a useful empty state instead of an empty rectangle.
- FAQ accordions start closed and open on user action.
- Legal information remains available publicly through the FAQ/agreement/privacy page.

## Content contract

Keep only BASE/ELITE plans, Telegram referral flow and ticket notifications. Do not expose demo wording, trial promises or removed legal sections in user-facing copy.
