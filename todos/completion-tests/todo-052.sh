#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
F=src/__integration__/bus.int.test.tsx
test -f "$F"; grep -q '409' "$F"; grep -q '403' "$F"; grep -qi 'plate' "$F"
npx jest bus.int
echo "COMPLETION OK: todo-052"
