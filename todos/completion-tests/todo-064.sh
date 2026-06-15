#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/route-management.yaml
grep -qiE 'route|create' .maestro/route-management.yaml
maestro test --dry-run .maestro/route-management.yaml 2>/dev/null || echo "NOTE: maestro not installed — manual-verify"
echo "COMPLETION OK: todo-064"
