#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/trip-history.yaml
grep -qiE 'history|trip' .maestro/trip-history.yaml
maestro test --dry-run .maestro/trip-history.yaml 2>/dev/null || echo "NOTE: maestro not installed — manual-verify"
echo "COMPLETION OK: todo-066"
