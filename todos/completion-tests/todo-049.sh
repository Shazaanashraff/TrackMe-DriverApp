#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ls src/features/dashboard/__tests__/* >/dev/null 2>&1
ls src/features/earnings/__tests__/* >/dev/null 2>&1
npx jest src/features
echo "COMPLETION OK: todo-049"
