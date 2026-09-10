# Changes

## 2026-09-10 — Shorter quick-action grid, delay wording names no cause

- The grid now renders the two presets the backend serves ("On my way", "Delay · 10 min") instead of six. No client change was needed for the list itself: it has always rendered whatever `GET /api/conversations/presets` returns.
- Reworded the open-ended delay preview under More updates to drop "Traffic is causing…", matching the backend's new canonical wording word for word. A driver seldom knows why they are behind.
- Added a test locking that preview sentence against the server's, and refreshed the preset fixture to mirror the real endpoint. Verified on an Android emulator: grid, review sheet wording, and cancel.

## 2026-09-09 — Communications responsive and recovery polish

- Bounded the fixed Home broadcast panel with its own scroll region so presets, progress, and review actions stay reachable on compact screens and with enlarged text.
- Added truthful loading/offline/error/empty states, full safe-area protection, tokenized modal scrims, resilient long-name wrapping, and root-tab Back-action behavior.
- Added a regression test for the bounded broadcast panel; visually verified idle, active-trip, Messages, review, 360×800, and 135% text states.

## 2026-09-08 — Rider–driver communications checkpoint

- Added the fixed two-action quick-broadcast panel, private messages, dated absence review and acknowledgment, full announcements, cached/offline drafts, app-shell socket ownership, and native push registration.
- Kept QR boarding independent and surfaced planned-absence discrepancies after valid scans.
- Added behavior tests and `docs/modules/COMMUNICATIONS.md`.
