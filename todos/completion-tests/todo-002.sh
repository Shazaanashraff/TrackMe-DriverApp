#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -q '"test:unit"' package.json
grep -q 'coverageThreshold' package.json
ls src/**/__tests__/*.ts >/dev/null 2>&1 || ls src/**/*.test.ts >/dev/null 2>&1
npm run test:unit
echo "COMPLETION OK: todo-002"
