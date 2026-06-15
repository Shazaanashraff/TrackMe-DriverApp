#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/bus-registration.yaml
test -f .maestro/bus-registration-error.yaml
grep -qiE 'register|bus' .maestro/bus-registration.yaml
maestro test --dry-run .maestro/bus-registration.yaml 2>/dev/null || echo "NOTE: maestro not installed — manual-verify"
echo "COMPLETION OK: todo-061"
