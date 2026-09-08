# Changes

## 2026-09-09 — Communications responsive and recovery polish

- Bounded the fixed Home broadcast panel with its own scroll region so presets, progress, and review actions stay reachable on compact screens and with enlarged text.
- Added truthful loading/offline/error/empty states, full safe-area protection, tokenized modal scrims, resilient long-name wrapping, and root-tab Back-action behavior.
- Added a regression test for the bounded broadcast panel; visually verified idle, active-trip, Messages, review, 360×800, and 135% text states.

## 2026-09-08 — Rider–driver communications checkpoint

- Added the fixed two-action quick-broadcast panel, private messages, dated absence review and acknowledgment, full announcements, cached/offline drafts, app-shell socket ownership, and native push registration.
- Kept QR boarding independent and surfaced planned-absence discrepancies after valid scans.
- Added behavior tests and `docs/modules/COMMUNICATIONS.md`.
