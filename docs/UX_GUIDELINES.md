# Driver App — UX Guidelines (ride-hailing informed)

> A driver app is used **while working** — often glanced at on a mounted phone, sometimes
> mid-drive. Clarity, big targets, and unambiguous status beat density. Informed by Uber
> Driver / PickMe Driver. Phase 7 implements the high-impact ones.

## Principles
1. **Tracking status is sacred.** The driver must always know, at a glance, whether the
   backend is receiving their location: big, colour + label + icon (idle / tracking /
   reconnecting / error). Never rely on colour alone.
2. **One giant primary action.** Start/Stop tracking is a large, thumb-friendly, high-contrast
   button — reachable one-handed, hard to mis-tap. (Uber Driver "Go online" pattern.)
3. **Minimise interaction while moving.** Keep the dashboard glanceable; avoid multi-step flows
   on the tracking screen; large fonts.
4. **Always show state** (loading/empty/error/offline) — never a blank or silent failure.
5. **Money is clear.** Earnings legible at a glance; payout state obvious.

## High-impact patterns

### Dashboard (tracking home)
- Dominant **Start/Stop** control with the live status card above/below it.
- Status card: assigned bus + route, session duration, last-fix time ("updated 2s ago"),
  and offline buffering indicator when applicable.
- `expo-keep-awake` while tracking so the screen doesn't sleep mid-shift.
- Confirm before stopping an active session (prevent accidental stop).

### Permissions
- First-run: explain *why* location is needed before the OS prompt.
- Denied: a clear screen with "Open Settings"; tracking controls disabled until granted.

### Bus registration / route management
- Stepped, well-labelled forms; inline validation; sticky submit; success confirmation.
- Route picker with search; clear selected state.

### Earnings
- Summary cards (today / week / total) up top; history list below; daily breakdown.
- Payout: clear available balance, obvious request CTA, pending/blocked states with reason.

### Forms & auth
- Inline validation as the user types; show/hide password; disable submit while pending;
  driver role-gate message is friendly and specific.

## Micro-interactions
- Haptics on start/stop tracking, payout request, errors (`expo-haptics`).
- Smooth transitions; reserve space for async content; pull-to-refresh on lists.
- Respect safe areas + the loaded UberMove font scale; support dynamic font sizing.

## Accessibility (production)
- `accessibilityLabel`/`accessibilityRole` on all interactive elements (esp. the Start/Stop
  control). Min 44×44 targets. WCAG AA contrast. Don't encode status with colour alone.

## Verification
Phase 7 UX TODOs assert presence (big tracking control with a11y label, status component,
keep-awake, haptics) via tests/grep + a manual UX checklist in the PR.
