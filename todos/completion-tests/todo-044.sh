#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ls src/hooks/bus/__tests__/* >/dev/null 2>&1
ls src/hooks/routes/__tests__/* >/dev/null 2>&1
npx jest src/hooks/bus src/hooks/routes
echo "COMPLETION OK: todo-044"
