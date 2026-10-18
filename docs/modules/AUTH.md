# AUTH — Driver App

Driver sign-in, session/token refresh, and the driver-only role gate.

**Status:** `PLANNED (doc)` — the code is shipped; **this document is not yet written**.
Do not read its absence as "no such feature". Read the source below, then fill this file in from
[`../guides/_MODULE_TEMPLATE.md`](../guides/_MODULE_TEMPLATE.md) as part of your next change
here — that is the change protocol, not optional extra work.

## Source of truth until this doc exists

`src/screens/LoginScreen.tsx`, `src/context/AuthContext.js`, `src/hooks/auth/index.ts`

> **Password recovery (2026-10-06).** Drivers sign in with the Driver ID their manager issues;
> most have no email, so the emailed-code reset flow (ForgotPasswordOtp / ResetPassword screens and
> their hooks) is gone. "Forgot password?" opens an info screen: the transport manager resets it in
> WebAdmin (Manager › Drivers › Reset password). Email sign-in still works for older accounts.

## What this doc must cover

Template section order: Purpose · Key files (one job each) · Data flow · Contracts (API/socket/
storage) · **Not visible in the frontend** · Gotchas · Tests · Change protocol.

Pay particular attention to:
- the **backend contract** it depends on — verify real endpoint paths against `backend/src`
  rather than inferring them, and link the matching `backend/docs/modules/*.md`;
- the **role gate**: only `driver` accounts may sign in (enforced in `LoginScreen`).
