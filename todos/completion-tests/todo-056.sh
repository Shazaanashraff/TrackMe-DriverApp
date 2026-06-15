#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
F=src/__integration__/cross-cutting.int.test.tsx
test -f "$F"
grep -qi 'refresh' "$F"; grep -qi 'offline' "$F"; grep -qi 'timeout' "$F"; grep -q 'ErrorState' "$F"
npx jest cross-cutting.int
echo "COMPLETION OK: todo-056"
