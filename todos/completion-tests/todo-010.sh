#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -q '@tanstack/react-query' package.json
grep -q 'query-async-storage-persister' package.json
test -f src/app/queryClient.ts
grep -q 'offlineFirst' src/app/queryClient.ts
grep -Eq 'PersistQueryClientProvider|QueryClientProvider' $(ls App.js App.tsx src/app/App.tsx 2>/dev/null)
npm run typecheck
npm run test:unit
echo "COMPLETION OK: todo-010"
