#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -rq 'getItemLayout' src/features src/screens
grep -rq 'keyExtractor' src/features src/screens
grep -rq 'React.memo\|memo(' src/features
npm run test:unit
echo "COMPLETION OK: todo-070"
