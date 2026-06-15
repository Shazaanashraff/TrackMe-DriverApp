#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/components/ui/InlineError.tsx
test -f src/components/ui/ErrorState.tsx
test -f src/components/ui/OfflineBanner.tsx
test -f src/components/ErrorBoundary.tsx
test -f src/components/ui/TrackingStatusBadge.tsx
test -f src/components/PermissionDeniedState.tsx
grep -q 'userMessage' src/components/ui/ErrorState.tsx
grep -q 'subscribeBackendStatus' src/components/ui/OfflineBanner.tsx
npx jest src/components
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-020"
