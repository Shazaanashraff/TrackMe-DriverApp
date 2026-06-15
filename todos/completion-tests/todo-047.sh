#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/helpers/__tests__/locationUtils.test.ts
npx jest locationUtils location
echo "COMPLETION OK: todo-047"
