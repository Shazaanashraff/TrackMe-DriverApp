#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -rq 'ScreenHeader' src/components/ui/__tests__
grep -rq 'InfoRow' src/components/ui/__tests__
grep -rq 'SectionCard' src/components/ui/__tests__
grep -rq 'ShiftBusIcon' src/components/**/__tests__ src/components/__tests__ 2>/dev/null
npx jest components
echo "COMPLETION OK: todo-048"
