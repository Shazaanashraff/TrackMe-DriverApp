#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
F=src/__integration__/routes.int.test.tsx
test -f "$F"; grep -qi 'management' "$F"; grep -q '404' "$F"
npx jest routes.int
echo "COMPLETION OK: todo-053"
