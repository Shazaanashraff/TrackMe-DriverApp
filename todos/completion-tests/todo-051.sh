#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
F=src/__integration__/auth.int.test.tsx
test -f "$F"; grep -q '401' "$F"; grep -qiE 'driver|role' "$F"; grep -qi 'refresh' "$F"
npx jest auth.int
echo "COMPLETION OK: todo-051"
