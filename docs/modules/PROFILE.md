# PROFILE — Driver App

Driver profile view/edit.

**Status:** `PLANNED (doc)` — the code is shipped; **this document is not yet written**.
Do not read its absence as "no such feature". Read the source below, then fill this file in from
[`../guides/_MODULE_TEMPLATE.md`](../guides/_MODULE_TEMPLATE.md) as part of your next change
here — that is the change protocol, not optional extra work.

## Source of truth until this doc exists

`src/screens/DriverProfileScreen.js`

## Recorded so far

- **App version footer (2026-10-18):** the screen ends with `Pingo Driver v<version> (build <n>)`
  (`testID="app-version"`), built by `src/helpers/appVersion.ts` from `expo-application`
  (`nativeApplicationVersion`, `nativeBuildVersion` = Android versionCode, the number the
  [update check](APP_UPDATES.md) compares). Falls back to `Version unavailable`.

## What this doc must cover

Template section order: Purpose · Key files (one job each) · Data flow · Contracts (API/socket/
storage) · **Not visible in the frontend** · Gotchas · Tests · Change protocol.

Pay particular attention to:
- the **backend contract** it depends on — verify real endpoint paths against `backend/src`
  rather than inferring them, and link the matching `backend/docs/modules/*.md`;
- which auth endpoints it shares with sign-in.
