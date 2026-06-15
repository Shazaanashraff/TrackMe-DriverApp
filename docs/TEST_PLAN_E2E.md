# Driver App E2E Plan (Maestro)

> **Tooling correction:** Expo RN app — the old plan named Playwright, which can't drive
> native location/socket. E2E uses **Maestro** against the real native build. Flows in
> `.maestro/`; add stable `testID`s as needed; `test:e2e` runs `maestro test .maestro/`,
> `--dry-run` is the CI parse gate. Point at a seeded test backend; document per flow.

## Auth
1. **Driver login → dashboard** (valid driver creds).
2. **Non-driver rejected**: passenger creds → role-gate error shown, stays on login.
3. **Logout** → back to login; cached data cleared.

## Bus registration
4. Register bus (plate, model, route) → assigned-bus details shown.
5. Duplicate plate / invalid route → error shown, no bus created.

## Tracking (core journey)
6. **Start → broadcast → stop**: start tracking → status shows "tracking" → (seeded backend
   confirms location received) → stop → status "idle".
7. **Permission denied**: deny location → permission state shown, tracking disabled + "Open
   Settings" action.
8. **Offline while tracking**: drop network → "buffering — N queued" shown; reconnect →
   buffer replays, status returns to tracking. (Document network-toggle approach; mark
   manual-verify if not automatable in CI.)

## Route management
9. Create route → appears in route list.

## Earnings
10. View earnings stats + history (pagination).
11. Request payout → pending state; already-pending → blocked with message.

## Trip history
12. Open trip history → list renders; empty → EmptyState.

## Resilience
13. Offline cold start → cached bus/earnings + OfflineBanner.

## Definition of done
- Flows 1–12 authored and passing on emulator/device (or `--dry-run` green in CI).
- Role-gate, the full tracking lifecycle, and permission-denied are covered.
- At least one failure path per major area.
