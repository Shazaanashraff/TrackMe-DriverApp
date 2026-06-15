#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
F=src/__integration__/earnings.int.test.tsx
test -f "$F"; grep -qi 'payout' "$F"; grep -q '409' "$F"; grep -qi 'pagination\|page' "$F"
npx jest earnings.int
echo "COMPLETION OK: todo-054"
