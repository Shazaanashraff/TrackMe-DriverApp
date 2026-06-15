#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
F=src/__integration__/tracking.int.test.tsx
test -f "$F"
grep -q 'driver:location' "$F"
grep -q 'start-tracking' "$F"
grep -qiE 'reconnect|replay' "$F"
npx jest tracking.int
echo "COMPLETION OK: todo-055"
