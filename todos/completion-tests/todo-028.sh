#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/lib/logger.ts
grep -q '__DEV__' src/lib/logger.ts
! grep -rEn 'console\.log.*[Tt]oken' src --include=*.js --include=*.ts --include=*.tsx
npm run typecheck
npm run lint
npm run test:unit
echo "COMPLETION OK: todo-028"
