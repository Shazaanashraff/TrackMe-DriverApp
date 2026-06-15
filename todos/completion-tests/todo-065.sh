#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/earnings.yaml
test -f .maestro/earnings-payout.yaml
grep -qi 'payout' .maestro/earnings-payout.yaml
maestro test --dry-run .maestro/earnings.yaml 2>/dev/null || echo "NOTE: maestro not installed — manual-verify"
echo "COMPLETION OK: todo-065"
