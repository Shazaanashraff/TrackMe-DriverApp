# TODO 067 — E2E: offline buffering + reconnect (tracking)

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 019, 020
**Cite:** docs/TEST_PLAN_E2E.md (Tracking 8 / Resilience), docs/LOCATION_TRACKING.md

## Step-by-step
1. `.maestro/tracking-offline.yaml`: while tracking, drop network → assert "buffering — N
   queued" indicator; restore network → assert status returns to tracking (buffer replayed).
2. `.maestro/offline-coldstart.yaml`: offline launch → cached bus/earnings + OfflineBanner.
3. Document the network-toggle approach; mark manual-verify if not automatable in CI.
4. `--dry-run` parses.

## Completion test
`todos/completion-tests/todo-067.sh` — flow file(s) exist referencing offline/buffer/banner;
`--dry-run` parses (or documented manual-verify).

## Blocked
