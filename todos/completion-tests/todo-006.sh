#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/smoke.yaml
test -f .maestro/README.md
grep -q '"test:e2e"' package.json
grep -q '"test:e2e:dry"' package.json
grep -q 'launchApp' .maestro/smoke.yaml
echo "COMPLETION OK: todo-006"
